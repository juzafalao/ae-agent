# Roteiro de demo (15 min): Lia para o Camillo

Princípio: mostrar só o que o código comprovadamente faz. Este código é um **agente conversacional de qualificação de leads no WhatsApp**, não a plataforma que o Camillo descreveu. A demo deve deixar isso claro e posicionar a Fase 1.

## Antes da reunião (checklist, 30 min antes)
- [ ] Confirmar que o modelo `claude-sonnet-4-20250514` (`src/agent.js:96`) ainda responde e que a conta tem crédito. **Não verificado nesta análise.**
- [ ] Usar instância Z-API e celular de teste. **Não** usar a produção.
- [ ] **Não** provocar o envio de materiais. As URLs são placeholder (`src/agent.js:14,19,24`) e o lead receberia "Materiais enviados!" sem os arquivos (`src/agent.js:66`).
- [ ] Mandar uma mensagem por vez e esperar a resposta (não há fila por telefone, `src/server.js:78`).
- [ ] Ter a conversa de demo gravada (vídeo ou prints) como plano B, caso a IA ou a Z-API falhem ao vivo.

## Roteiro

| Min | O que mostrar | Evidência |
|---|---|---|
| 0–2 | Contexto: agente de WhatsApp que conversa, qualifica e passa o lead para um humano | `src/prompt.js:150-263` |
| 2–6 | Ao vivo: "Oi" → saudação → nome → diagnóstico | `src/prompt.js:155-176`, `src/agent.js:85-117` |
| 6–8 | Mostrar memória da conversa: o agente usa o nome dito antes | `src/memory.js:9-24` (até 20 mensagens) |
| 8–10 | Objeção "é muito dinheiro" → resposta conduzida pelo prompt | `src/prompt.js:219-222` |
| 10–12 | Handoff: "quero falar com o especialista" → celular do especialista de teste recebe o resumo | `src/agent.js:70-80,128-135` |
| 12–15 | Arquitetura em 1 slide, com lacunas e Fase 1 (tabela abaixo) | matriz-requisitos.md |

## Frase por requisito

| Req. | Status | Frase para usar |
|---|---|---|
| R1 Linguagem natural | Parcial | "O agente conversa em linguagem natural. Transformar o pedido em critérios estruturados para consulta é o que a Fase 1 resolve." |
| R2 Fontes externas | Não atende | "Hoje os dados estão no roteiro do agente. Conectar suas fontes por API é o que a Fase 1 resolve." |
| R3 Regras no servidor | Não atende | "Hoje quem decide os passos é o modelo, guiado por instruções. Levar as regras para código no servidor é o que a Fase 1 resolve." |
| R4 Opções ao usuário | Parcial | "O agente sempre conduz com uma próxima pergunta. Opções calculadas a partir de dados reais é o que a Fase 1 resolve." |
| R5 Falha de fonte | Parcial | "Se a IA falhar, o usuário recebe um aviso e o erro é registrado. Timeouts, alertas e mensagens por tipo de falha é o que a Fase 1 resolve." |
| R6 Isolamento | Não atende | "Isso é o que a Fase 1 resolve: banco com isolamento por cliente e testes automatizados." |
| R7 Piloto real/simulado | Não atende | "Isso é o que a Fase 1 resolve." |
| R8 IA trocável | Não atende | "Hoje usa Anthropic. Uma camada que alterna entre OpenAI e Anthropic é o que a Fase 1 resolve." |
| R9 Tela de teste | Não atende | "Hoje o teste é pelo WhatsApp. Uma tela para digitar o pedido e ver o fluxo é o que a Fase 1 resolve." |
| R10 Entrega | Parcial | "Entregamos código e documentação. Eles serão revisados e alinhados, e o pacote de acessos é definido em contrato." |
| R11 Segredos | Atende | "Nenhuma chave fica no código. Tudo vem de variáveis de ambiente." (`src/agent.js:8`, `src/zapi.js:7-9`, `.gitignore:2`) |
| R12 Logs/auditoria | Parcial | "Há registro de erros. Auditoria estruturada e logs sem dados pessoais é o que a Fase 1 resolve." |

## Não dizer
- "Consulta dados em tempo real", "regras de negócio no servidor", "multi-tenant", "testado", "sem dados pessoais em log". Nada disso tem evidência no código.
- Não citar como fato os números de cases e as estatísticas do prompt (`src/prompt.js:61-62,235`). São texto para o modelo, sem fonte.
