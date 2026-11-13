# RESUMO: validação da Lia para o Camillo (commit ec0f5e1)
**Pronto:** chat de WhatsApp via Z-API → Claude com memória em RAM de 20 mensagens (`src/agent.js:85-117`, `src/memory.js:7`), handoff ao especialista por tag (`src/agent.js:70-80`), segredos via variáveis de ambiente (`src/agent.js:8`, `.gitignore:2`).
**Parcial:** R1 linguagem natural (só texto livre), R4 opções (pergunta gerada pelo modelo), R5 falha (mensagem genérica, sem timeout), R10 docs divergentes, R12 só `console.log`.
**Não atende:** R2 fonte externa de dados, R3 regras em código (o modelo decide via tags, `src/agent.js:34-40`), R6 isolamento e testes, R7 mock, R8 OpenAI, R9 tela de teste. Estimativa para cobrir: cerca de 164 a 258 h.
**Risco 1:** webhook sem autenticação (`src/server.js:15-35`). Qualquer um gasta crédito e faz o bot mandar WhatsApp a qualquer número.
**Risco 2:** a falha da Z-API dentro do `catch` (`src/agent.js:140`, `src/server.js:78`) pode derrubar o processo e apagar todo o histórico. Sem crédito na IA, todo lead recebe "problema técnico" e `/health` segue "running".
**Risco 3:** o agente inventa. O prompt pede "histórias verossímeis" e números de cases (`src/prompt.js:60-62`). Os materiais são placeholder, mas o lead recebe "Materiais enviados!" (`src/agent.js:14,66`).
**Perguntas em aberto:**
1. O modelo `claude-sonnet-4-20250514` ainda responde? Não verificável offline.
2. Qual o nome oficial: Lia (código) ou Sofia (`CLAUDE.md:7`)?
3. Quais fontes e APIs do Camillo serão o piloto?
4. Hospedagem: Railway ou VPS (`CLAUDE.md:64`)?
5. O que contém `.env.example` (leitura negada nesta análise)?
6. Há telefone real em `docs/runbook.html:543`?
