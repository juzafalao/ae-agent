# AE Alugue Estética — Agente IA de Vendas (Sofia)

Agente de vendas via WhatsApp para qualificação e conversão de leads interessados em franquia.

## Estrutura do Projeto

```
ae-agent/
├── src/
│   ├── server.js     # Servidor Express + webhook
│   ├── agent.js      # Lógica principal + integração Claude
│   ├── evolution.js  # Integração Evolution API
│   ├── memory.js     # Histórico de conversas em memória
│   └── prompt.js     # Prompt e contexto da marca
├── .env              # Credenciais (nunca comitar!)
├── .env.example      # Modelo de credenciais
├── package.json
└── README.md
```

## Setup Local (VSCode)

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```
Abre o `.env` e preenche:
- `ANTHROPIC_API_KEY` — chave da Anthropic (console.anthropic.com)
- `EVOLUTION_API_URL` — URL da tua instância Evolution Cloud
- `EVOLUTION_API_KEY` — API Key do painel Evolution
- `EVOLUTION_INSTANCE` — nome da instância criada no painel
- `SPECIALIST_PHONE` — número do vendedor (com código do país, sem +)

### 3. Rodar em desenvolvimento
```bash
npm run dev
```

### 4. Testar o health check
```
GET http://localhost:3000/health
```

---

## Setup no VPS (Produção)

### 1. Clonar e instalar
```bash
git clone SEU_REPO ae-agent
cd ae-agent
npm install
cp .env.example .env
nano .env  # preenche as variáveis
```

### 2. Rodar com PM2 (recomendado)
```bash
npm install -g pm2
pm2 start src/server.js --name ae-agent
pm2 save
pm2 startup
```

### 3. Configurar Nginx (se necessário)
```nginx
server {
    listen 80;
    server_name teu_dominio_ou_ip;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Configurar Webhook na Evolution API

No painel Evolution Cloud:
1. Vai em **Instâncias** → tua instância
2. Abre **Configurações de Webhook**
3. URL: `http://SEU_IP:3000/webhook` (ou domínio se tiveres)
4. Eventos: marca apenas `messages.upsert`
5. Salva

---

## Conectar o WhatsApp

Na Evolution API, vai em **Instâncias** → **QR Code** → escaneia com o número de teste.

Para trocar de número depois (número do cliente):
1. Desconecta a instância atual
2. Gera novo QR Code
3. Escaneia com o número do cliente

---

## Hospedar os Documentos PDF

Os PDFs da COF, apresentação e plano de negócios precisam de URL pública.
Opções gratuitas:
- Google Drive (partilha pública → link direto)
- Dropbox (link público)
- GitHub Releases

Depois de ter as URLs, atualiza o objeto `DOCUMENTS` em `src/agent.js`.

---

## Fluxo da Conversa

```
Lead manda mensagem
        ↓
Evolution API recebe
        ↓
Webhook dispara → server.js
        ↓
agent.js monta histórico + chama Claude
        ↓
Claude gera resposta com o contexto da AE
        ↓
Se [ENVIAR_APRESENTACAO] → envia PDFs
Se [TRANSFERIR_LEAD] → notifica especialista
        ↓
Resposta enviada para o lead via WhatsApp
```

---

## Para Adicionar Nova Marca

1. Copia a pasta `ae-agent` para `nova-marca-agent`
2. Edita `src/prompt.js` com o contexto da nova marca
3. Atualiza `.env` com as credenciais e número da nova marca
4. Sobe na porta diferente (ex: 3001)
5. Cria nova instância na Evolution para o número da nova marca
6. Configura novo webhook apontando para a nova porta
