# Riscos para a demo: chamadas externas

Não existe banco de dados (`src/memory.js:2-4`, sem driver em `package.json:10-15`). As chamadas externas são a Anthropic e a Z-API.

## Inventário de chamadas

| Chamada | Onde | Timeout | Retry | Fallback | Log na falha | Mensagem ao usuário na falha |
|---|---|---|---|---|---|---|
| Anthropic `messages.create` | `src/agent.js:95-100` | Não configurado. O padrão do SDK é **10 min** (`node_modules/@anthropic-ai/sdk/core.js:124`) | Padrão do SDK, **2** (idem) | Nenhum. Não há modelo nem provedor alternativo | `src/agent.js:139` (só `error.message`) | "Desculpe, tive um problema técnico agora. Pode repetir sua mensagem?" (`src/agent.js:140-142`) |
| Z-API `send-text` (resposta) | `src/zapi.js:21`, chamada em `src/agent.js:113` | Não configurado. O padrão do axios é `0`, sem limite (`node_modules/axios/lib/defaults/index.js:148`) | Não | Não | `src/zapi.js:32` e depois `src/agent.js:139` | Tenta mandar a mensagem de erro **pelo mesmo canal que falhou** (`src/agent.js:140`) |
| Z-API `send-text` dentro do `catch` | `src/agent.js:140` | Sem limite | Não | Não | `src/zapi.js:32` | Nenhuma. A rejeição sobe para `setImmediate` sem `.catch` (`src/server.js:78`), uma **unhandled rejection**. Em Node ≥15 o padrão é encerrar o processo (versão do Node em produção não verificável). O Railway reinicia no máximo 3 vezes (`railway.json:8-9`), e cada reinício apaga todo o histórico em RAM (`src/memory.js:4`) |
| Z-API `send-document` (3 PDFs) | `src/zapi.js:40`, chamada em `src/agent.js:59` | Sem limite | Não | Não | `src/agent.js:61` | **Mente.** O erro é engolido (`src/agent.js:60-62`) e o lead recebe "✅ Materiais enviados!" (`src/agent.js:66`). Com as URLs atuais (`SEU_STORAGE`, `src/agent.js:14,19,24`) o envio **sempre** falha |
| Z-API `send-text` ao especialista | `src/agent.js:80` | Sem limite | Não | Não | `src/zapi.js:32` e `src/agent.js:139` | Se `SPECIALIST_PHONE` estiver vazio ou errado (`src/agent.js:71`), o lead recebe "problema técnico" mesmo depois de já ter recebido a resposta da IA. O especialista não é avisado |
| Z-API `send-text` de mídia | `src/server.js:71` | Sem limite | Não | Não | `src/zapi.js:32` e `src/server.js:81` | Nenhuma |
| Z-API `status` | `src/zapi.js:113`, via `GET /health` (`src/server.js:89`) | Sem limite | Não | Retorna `null` (`src/zapi.js:120`) | `src/zapi.js:119` | `/health` pode ficar pendurado sem limite de tempo |
| Z-API `send-image`, `send-audio`, `send-video` | `src/zapi.js:59-108` | Sem limite | Não | Não | Sim | Código morto: importado em `src/agent.js:6`, nunca chamado |

## Onde o agente pode inventar resposta
1. **O prompt pede invenção.** "Crie histórias verossímeis de franqueados" com valor de faturamento (`src/prompt.js:60-62`). Escassez de território sem dado real (`src/prompt.js:54-57`). Estatística sem fonte (`src/prompt.js:235`). "Vi que você abriu o material" sem rastreamento (`src/prompt.js:82`).
2. **Não há dados reais.** Disponibilidade de território, condições e prazos não vêm de nenhuma fonte, então qualquer resposta sobre eles é gerada pelo modelo.
3. **Promessas que nada no código cumpre.** "Vou confirmar com a equipe e já te respondo" (`src/prompt.js:293`) e a reabertura de lead frio (`src/prompt.js:76`) não têm job, agendador nem fila.
4. **Nenhuma validação da saída.** O texto do modelo vai direto ao lead (`src/agent.js:109-117`). Não há filtro de valores, de promessa de retorno nem de termos proibidos.

## Onde o agente pode travar
- A Anthropic lenta ou fora pode prender cada mensagem por até cerca de 30 min (10 min × 3 tentativas, `core.js:124`) antes da mensagem de erro.
- A Z-API pendurada trava `processMessage` sem limite de tempo (axios `timeout: 0`).
- A Z-API fora durante o tratamento de erro pode derrubar o processo (`src/agent.js:140` com `src/server.js:78`), e a queda apaga o histórico de todos os leads.
- Duas mensagens rápidas do mesmo lead disparam duas chamadas paralelas (`src/server.js:78`), sem fila por telefone. As respostas podem chegar duplicadas ou fora de ordem.

## Provedor de IA sem crédito
Estudo estático, sem chamada real. Se a conta Anthropic estiver sem saldo ou a chave for inválida, `client.messages.create` lança erro (`src/agent.js:95`). O `catch` loga só `error.message` (`src/agent.js:139`), sem status nem tipo, e envia ao lead a frase genérica de "problema técnico" (`src/agent.js:140-142`).

Consequências:
- **Toda** mensagem de **todo** lead recebe a mesma desculpa, para sempre, até o crédito voltar.
- Ninguém é alertado: não há notificação ao operador nem ao especialista.
- A mensagem do lead fica no histórico sem resposta (`src/agent.js:89`, não removida no `catch`), e as próximas se acumulam como turnos `user` seguidos.
- `/health` continua respondendo `running` (`src/server.js:90-96`), porque não testa a IA. **O monitoramento não detecta o problema.**

## Outros riscos de segurança relevantes para a demo
- **Webhook sem autenticação** (`src/server.js:15-35`). Qualquer pessoa com a URL pode fazer POST com `phone` arbitrário. Com isso dá para: gastar crédito Anthropic; fazer o bot enviar WhatsApp para qualquer número; disparar `[TRANSFERIR_LEAD]` por prompt injection e notificar o especialista com conteúdo forjado (`src/agent.js:70-80`). A URL de produção aparece em `docs/runbook.html:392` e `docs/tech-doc.html:866`.
- **Sem rate limit** em nenhum ponto (`src/server.js:8-15`).
- **Dados pessoais em log.** Telefone e texto vão para stdout (`src/server.js:23,75`, `src/agent.js:86`), o que contradiz `docs/tech-doc.html:794`.
