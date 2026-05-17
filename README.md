# Agente IA de Vendas — WhatsApp

Agente de qualificação de leads via WhatsApp, movido por Claude (Anthropic).  
Conduz o funil completo: acolhimento → diagnóstico → apresentação → materiais → objeções → handoff para especialista.

## Estrutura

```
├── src/
│   ├── server.js   # Servidor Express + webhook handler
│   ├── agent.js    # Orquestração: Claude API, action tags, envio
│   ├── memory.js   # Histórico de conversas em RAM (Map)
│   ├── prompt.js   # Persona + dados da marca + fluxo de venda
│   └── zapi.js     # Integração Z-API (text, document, image, audio, video)
├── docs/
│   ├── runbook.html     # Guia operacional para equipe não-técnica
│   └── tech-doc.html    # Documentação técnica da arquitetura
├── .env.example    # Modelo de variáveis de ambiente
├── railway.json    # Configuração de deploy (Railway + Nixpacks)
└── package.json
```

## Setup local

```bash
npm install
cp .env.example .env   # preenche as variáveis
npm run dev            # inicia com nodemon (auto-reload)
```

Health check: `GET http://localhost:3000/health`

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sim | Chave da API Anthropic |
| `ZAPI_INSTANCE_ID` | Sim | ID da instância Z-API |
| `ZAPI_TOKEN` | Sim | Token da instância Z-API |
| `ZAPI_CLIENT_TOKEN` | Não | Token de segurança da conta Z-API |
| `AGENT_NAME` | Sim | Nome da agente (ex: Lia) |
| `BRAND_NAME` | Sim | Nome da marca |
| `SPECIALIST_PHONE` | Sim | Número do especialista (DDI + DDD + número) |
| `SPECIALIST_NAME` | Não | Nome do especialista |
| `BLOCKED_PHONES` | Não | Números já em atendimento humano, separados por vírgula |

## Deploy (Railway)

1. Conecte o repositório ao Railway
2. Adicione todas as variáveis de ambiente no painel Railway → Variables
3. **Não** adicione `PORT` — o Railway injeta automaticamente
4. Configure o webhook na Z-API: `https://SEU_APP.up.railway.app/webhook`

## Tags de ação (dentro da resposta do Claude)

- `[ENVIAR_APRESENTACAO]` — dispara envio dos 3 PDFs ao lead
- `[TRANSFERIR_LEAD]` — notifica o especialista via WhatsApp com resumo da conversa

## Personalização por marca

Cada marca é uma cópia deste repositório com seu próprio `.env` e `src/prompt.js`.  
Edite o `prompt.js` para adaptar: nome da agente, dados da franquia, preços, fluxo de venda e documentos.

Os URLs dos PDFs estão no objeto `DOCUMENTS` em `src/agent.js` — substitua pelas URLs públicas reais (Google Drive, Dropbox, etc.).
