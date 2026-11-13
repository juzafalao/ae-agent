# RESUMO: validação da Lia para o Camillo (commit ec0f5e1)
**Pronto:** chat de WhatsApp via Z-API → Claude com memória em RAM de 20 mensagens (`src/agent.js:85-117`, `src/memory.js:7`), handoff ao especialista por tag (`src/agent.js:70-80`), segredos via variáveis de ambiente (`src/agent.js:8`, `.gitignore:2`).
**Parcial:** R1 linguagem natural (só texto livre), R4 opções (pergunta gerada pelo modelo), R5 falha (mensagem genérica, sem timeout), R10 docs divergentes, R12 só `console.log`.
**Não atende:** R2 fonte externa de dados, R3 regras em código (o modelo decide via tags, `src/agent.js:34-40`), R6 isolamento e testes, R7 mock, R8 OpenAI, R9 tela de teste. Estimativa para cobrir: cerca de 164 a 258 h.
**Risco 1 (bloqueia a demo):** o modelo `claude-sonnet-4-20250514` (`src/agent.js:96`) foi aposentado em 15/06/2026, segundo a referência da Anthropic. Toda resposta vira "problema técnico" (`src/agent.js:140`) e `/health` segue "running". É preciso trocar o modelo e testar antes das 14h.
**Risco 2:** webhook sem autenticação (`src/server.js:15-35`). Qualquer um gasta crédito e faz o bot mandar WhatsApp a qualquer número. Uma falha da Z-API no `catch` pode derrubar o processo (`src/server.js:78`).
**Risco 3:** o agente inventa. O prompt pede "histórias verossímeis" e números de cases (`src/prompt.js:60-62`). Os materiais são placeholder, mas o lead recebe "Materiais enviados!" (`src/agent.js:14,66`).
**Perguntas em aberto:**
1. Autoriza trocar o modelo em `src/agent.js:96` (fora do escopo somente leitura)?
2. Qual o nome oficial: Lia (código) ou Sofia (`CLAUDE.md:7`)?
3. Quais fontes e APIs do Camillo serão o piloto?
4. Hospedagem: Railway ou VPS (`CLAUDE.md:64`)?
5. O que contém `.env.example` (leitura negada nesta análise)?
6. Há telefone real em `docs/runbook.html:543`?
