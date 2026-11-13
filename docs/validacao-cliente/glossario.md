# Glossário — termos do cliente x código real

Base: commit `ec0f5e1` (branch `main`), análise estática somente leitura de `src/`. Sem execução.

| Termo do cliente | O que existe no código | Correspondência |
|---|---|---|
| **Linguagem natural** (interpretar pedido) | O texto do WhatsApp vai cru para o Claude (`src/agent.js:95-100`), junto com um system prompt de vendas (`src/prompt.js:7-311`). Nenhuma extração de intenção, entidade ou campo estruturado acontece no servidor. O modelo só devolve texto livre e 2 tags (`src/agent.js:34-40`). | **Parcial / ambíguo.** O agente conversa em linguagem natural, mas não transforma o pedido em consulta ou parâmetros. Para o Camillo, "interpretar pedido" significa extrair critérios e consultar dados, e isso não existe. |
| **Fonte externa** (consulta por API) | Chamadas de saída: Z-API, que é o canal de mensagens (`src/zapi.js:21,40,113`), e a Anthropic (`src/agent.js:95`). Os PDFs são URLs fixas e ainda placeholders `SEU_STORAGE` (`src/agent.js:14,19,24`). | **Não corresponde.** Nenhuma fonte de dados de negócio (catálogo, CRM, estoque, preços) é consultada. Todos os dados da franquia estão em texto fixo no prompt (`src/prompt.js:103-146`). Z-API é canal, não fonte. |
| **Regras no servidor** | O único código que age sobre o fluxo é a detecção de tag por `includes` (`src/agent.js:34,38`) e a lista de bloqueio `BLOCKED_PHONES` (`src/server.js:38-42`). Qualificação, handoff, preços e limites ("não negocie", "não invente números") estão só no prompt (`src/prompt.js:246-298`). | **Não corresponde.** O modelo decide sozinho quando enviar materiais e quando transferir. O servidor executa a ação sem checar nenhuma pré-condição (`src/agent.js:121-135`). |
| **Opções ao usuário** | O prompt manda a IA terminar sempre com uma pergunta (`src/prompt.js:288`). Não há lista, botão nem menu (o código não usa botões ou listas da Z-API). | **Ambíguo.** Existe "pergunta aberta" gerada pelo modelo, não "opções relevantes" calculadas a partir de dados. |
| **Isolamento** (entre clientes) | Histórico num `Map` em RAM, com o telefone como chave (`src/memory.js:4,9-14`). Isolamento por marca só por deploy separado, uma cópia do repo por marca (`README.md:63`). Não há conceito de tenant no código. | **Não corresponde.** Existe separação por telefone, não por cliente (tenant), e não há testes. |
| **Piloto** (integração trocável real x simulada) | Não existe modo mock, flag ou adaptador. `src/zapi.js:11` monta a URL real direto; `src/agent.js:8` instancia o SDK real. | **Não corresponde.** |
| **Camada de IA** (trocável) | Dependência direta de `@anthropic-ai/sdk` (`package.json:11`), modelo fixo `claude-sonnet-4-20250514` (`src/agent.js:96`). Não há interface de provedor nem OpenAI. | **Não corresponde.** |
| **Tela de teste** | Só existem `POST /webhook` (`src/server.js:15`) e `GET /health` (`src/server.js:88`). Não há HTML, rota estática nem página. | **Não corresponde.** O único jeito de testar é pelo WhatsApp real. |
| **Logs / auditoria** | `console.log`/`console.error` em stdout (ex.: `src/server.js:23,75`, `src/agent.js:86,139`, `src/zapi.js:29,32`). Não há persistência nem trilha de auditoria. | **Parcial.** É log de depuração, não auditoria. |

## Divergências de nomenclatura no próprio repositório
- **Nome do agente:** `CLAUDE.md:7` e `CLAUDE.md:54` dizem "Sofia". O código usa `AGENT_NAME || 'Lia'` (`src/prompt.js:4`), mas tem "Lia" fixo em `src/prompt.js:18,156,267`, `src/agent.js:78` e `src/memory.js:34`. Se `AGENT_NAME` for trocado, a persona fica inconsistente.
- **`src/evolution.js`:** citado em `CLAUDE.md:34`, mas não existe (não aparece em `git ls-files`).
- **Hospedagem:** `CLAUDE.md:64` fala em PM2 + Nginx em VPS, mas o README e `railway.json:1-11` indicam Railway.
- **Número de etapas:** `CLAUDE.md:31` diz 6 etapas, mas o prompt tem 7 (`src/prompt.js:152,168,185,207,217,246,256`).
