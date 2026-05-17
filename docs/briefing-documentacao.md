# Briefing para Geração de Documentação — Agente LIA

> Cole este briefing numa sessão Claude Code e peça para gerar os documentos listados no final.

---

## CONTEXTO DO PROJETO

**Cliente:** AE Alugue Estética  
**Prestadora:** ZafalaoTech Consultoria (Juliana Zafalao)  
**Entrega:** Maio de 2026  
**Produto:** LIA — Agente de IA para qualificação de leads de franquia via WhatsApp

---

## SOBRE A AE ALUGUE ESTÉTICA

Primeira franquia de **locação de equipamentos médicos e estéticos** do Brasil.  
Fundada por Roberto Pereira Frey, com mais de 16 anos de experiência no setor.  
Sediada em Lajeado/RS, em expansão nacional desde 2024.

**Modelo de negócio da franquia:**
- O franqueado compra equipamentos de estética de alto valor e os aluga para clínicas e profissionais
- A clínica paga por dia de uso — o franqueado recebe renda recorrente
- Sem ponto comercial, sem funcionários, opera de casa
- Exclusividade territorial garantida

**Investimento (Módulo Start):**
- Taxa de Franquia: R$ 40.000
- Equipamentos (Crio_Hakon): R$ 93.600
- Abertura de empresa: R$ 1.000
- Uniforme e cartão: R$ 1.000
- Implantação do Sistema: R$ 3.000
- Frete: R$ 5.000
- **Total: R$ 143.600**

**Projeção de faturamento (1º ano):**
- Meses 1–2: R$ 7.360/mês
- Meses 3–5: R$ 14.720/mês
- Meses 6–8: R$ 29.440/mês
- Meses 9–11: R$ 36.800/mês
- Mês 12: R$ 44.160/mês
- Total ano 1: R$ 301.760
- Potencial anual maduro: até R$ 1.000.000

**Contrato:** 5 anos, exclusividade territorial, treinamento completo incluído

**Mercado:**
- Mercado global de estética: US$ 112 bilhões (2022)
- Crescimento projetado: 14,7% ao ano até 2030
- Procedimentos não invasivos: 54,6% do mercado

---

## O QUE É A LIA

LIA é uma consultora de expansão de franquias movida por Inteligência Artificial (Claude Sonnet 4, da Anthropic).

Atende leads no WhatsApp 24 horas por dia, 7 dias por semana.  
Conduz o funil completo de qualificação em 7 etapas:

1. **Acolhimento** — primeiro contato caloroso, coleta o nome
2. **Diagnóstico** — entende a situação atual, sonhos e medos do lead
3. **Apresentação do sonho** — pinta a vida que o negócio proporciona
4. **Envio de materiais** — envia 3 PDFs (apresentação, plano de negócios, COF)
5. **Tratamento de objeções** — responde dúvidas com empatia e dados
6. **Qualificação natural** — coleta dados do lead ao longo da conversa
7. **Handoff** — passa o lead quente para o especialista humano

**Limites intencionais da LIA:**
- Não fecha vendas — papel exclusivo do especialista humano
- Não negocia descontos ou condições de pagamento
- Não discute cláusulas de contrato em detalhe
- Não agenda reuniões por conta própria

---

## ARQUITETURA TÉCNICA

### Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20+ (CommonJS) |
| Framework | Express.js 4.x |
| IA | Claude Sonnet 4 — `claude-sonnet-4-20250514` (Anthropic) |
| WhatsApp Gateway | Z-API (SaaS) |
| Hospedagem | Railway (PaaS) |
| CI/CD | GitHub → Railway (auto-deploy no push para main) |
| Build | Nixpacks (configurado via railway.json) |

### Dependências npm

- `@anthropic-ai/sdk` — SDK oficial Anthropic
- `express` — servidor HTTP
- `axios` — chamadas REST para Z-API
- `dotenv` — variáveis de ambiente

### Arquivos do projeto

```
src/
├── server.js   # Express, webhook POST /webhook, health GET /health
├── agent.js    # processMessage(), chamada Claude, parse de action tags
├── memory.js   # Histórico em RAM (Map — phone → array msgs, max 20)
├── prompt.js   # System prompt: persona LIA + dados franquia + fluxo
└── zapi.js     # sendText, sendDocument, sendImage, sendAudio, sendVideo

docs/
├── runbook.html    # Guia operacional para equipe não-técnica
└── tech-doc.html   # Documentação técnica da arquitetura

railway.json        # Builder: Nixpacks, restart on failure, max 3 retries
.env.example        # Template de variáveis de ambiente
```

### Fluxo de dados (passo a passo)

```
Lead → WhatsApp Business
     → Z-API (gateway SaaS)
     → POST /webhook (Express — responde 200 imediatamente)
     → Filtros: fromMe / isGroup / BLOCKED_PHONES / tipo de mensagem
     → setImmediate() → processMessage(phone, text)
     → addMessage(phone, 'user', text) → memory.js
     → getHistory(phone) → últimas 20 msgs
     → client.messages.create({ model, system: SYSTEM_PROMPT, messages: history })
     → Claude Sonnet 4 retorna texto + action tags opcionais
     → parse: remove [ENVIAR_APRESENTACAO] e [TRANSFERIR_LEAD] do texto
     → splitMessage() → blocos de max 1000 chars
     → sendText() via Z-API → Lead recebe resposta
     → Se [ENVIAR_APRESENTACAO]: sendDocument() × 3 PDFs
     → Se [TRANSFERIR_LEAD]: sendText(SPECIALIST_PHONE, resumo do lead)
```

### Action tags

O Claude embute tags no texto quando decide executar ações:

- `[ENVIAR_APRESENTACAO]` — dispara envio dos 3 PDFs (Apresentação, Plano de Negócios, COF)
- `[TRANSFERIR_LEAD]` — notifica especialista via WhatsApp com resumo da conversa gerado automaticamente

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sim | Chave API Anthropic |
| `ZAPI_INSTANCE_ID` | Sim | ID instância Z-API |
| `ZAPI_TOKEN` | Sim | Token instância Z-API |
| `ZAPI_CLIENT_TOKEN` | Não | Token de segurança conta Z-API |
| `AGENT_NAME` | Sim | Nome da agente (Lia) |
| `BRAND_NAME` | Sim | Nome da marca |
| `SPECIALIST_PHONE` | Sim | Número do especialista (DDI+DDD+número) |
| `SPECIALIST_NAME` | Não | Nome do especialista |
| `BLOCKED_PHONES` | Não | Números em atendimento humano, separados por vírgula |

### URLs de produção (conta pessoal — migrar para conta cliente)

- Health check: `https://ae-agent-production-355d.up.railway.app/health`
- Webhook Z-API: `https://ae-agent-production-355d.up.railway.app/webhook`
- Repositório GitHub: `github.com/juzafalao/ae-agent` (migrar para conta cliente)

---

## INFRAESTRUTURA E CUSTOS TERCEIROS

Todos pagos diretamente pelo cliente:

| Serviço | Plano | Custo estimado |
|---|---|---|
| Railway | Hobby ou Pro | US$ 5–20/mês |
| Anthropic API | Pay-per-use (Claude Sonnet 4) | US$ 10–30/mês (volume médio) |
| Z-API | Basic | ~R$ 69/mês por instância |
| GitHub | Free (repos privados gratuitos) | R$ 0 |

---

## LIMITAÇÕES ATUAIS (oportunidades de evolução)

1. **Memória em RAM** — histórico perdido ao reiniciar. Solução: Redis (Railway add-on, ~R$ 5–15/mês)
2. **Sem dashboard** — não há visibilidade dos leads em tempo real
3. **Sem CRM** — handoff é via WhatsApp; não cria deal automático no Pipedrive/RD Station
4. **Sem follow-up automático** — leads frios não recebem reativação programada
5. **Só WhatsApp** — sem Instagram DM ou e-mail

---

## MODELO DE EXPANSÃO (multi-marca)

Cada nova marca é um repositório independente com:
- Próprio `src/prompt.js` (persona + dados da franquia)
- Próprio `.env` (credenciais, número WhatsApp)
- Próprio serviço no Railway
- Própria instância Z-API

Não há código compartilhado — cada agente é totalmente isolado.

---

## SOBRE A ZAFALAOTECH

ZafalaoTech é uma consultoria de tecnologia e IA fundada por Juliana Zafalao.  
Especializada em implementação de agentes de IA para automação comercial e qualificação de leads.  
Contato: juzafalao@gmail.com

---

## PALETA DE CORES (padrão visual dos documentos)

Os documentos seguem a identidade visual inspirada no projeto:
- Navy: `#0A2540`
- Cyan: `#00C9B1`
- Cyan claro: `#00E5CC`
- Purple: `#6C63FF`
- Background: `#F4F7FB`
- Texto: `#1A2D45`

---

## DOCUMENTOS A GERAR

Com base em todo o contexto acima, gere os seguintes documentos em HTML profissional, seguindo a paleta de cores definida (navy + cyan + purple), com layout moderno, responsivo, tipografia limpa (Segoe UI / system-ui), cartões, tabelas e diagramas onde aplicável:

---

### DOCUMENTO 1 — Documento Técnico (`tech-doc.html`)

Destinatário: equipe técnica que vai manter ou evoluir o sistema.

Deve conter:
- Visão geral do sistema e objetivo
- Diagrama de arquitetura (representado visualmente em HTML com boxes e setas)
- Fluxo de processamento detalhado (passo a passo numerado)
- Descrição de cada arquivo/componente com responsabilidade e destaques técnicos
- Detalhamento do modelo de IA (Claude Sonnet 4): configuração, tokens, contexto
- Integrações externas (Z-API, Anthropic, GitHub, Railway) com detalhes técnicos
- Infraestrutura de hospedagem (Railway, Nixpacks, CI/CD)
- Tabela completa de variáveis de ambiente
- Segurança: o que está implementado e recomendações adicionais
- Stack tecnológica completa
- Escalabilidade e padrão multi-marca

---

### DOCUMENTO 2 — Documento Funcional (`funcional.html`)

Destinatário: time de negócios, gestores da AE Alugue Estética, franqueadores.  
Linguagem: sem jargão técnico. Foco em o que o sistema faz, não como.

Deve conter:
- O que é a LIA e qual problema ela resolve
- Como funciona para o lead (experiência do usuário, jornada da conversa)
- As 7 etapas do funil explicadas em linguagem de negócio
- O que a LIA faz e o que ela não faz (limites claros)
- Como o especialista humano recebe o lead (handoff)
- Tipos de mensagem que a LIA processa (texto) e como responde a mídias
- Filtros de segurança (grupos, mensagens próprias, números bloqueados)
- Como bloquear um número (lead já em atendimento)
- Monitoramento: como saber se está funcionando (health check)
- Benefícios: disponibilidade 24/7, padronização, escalabilidade, qualidade do atendimento

---

### DOCUMENTO 3 — Proposta Comercial (`proposta.html`)

Destinatário: decisores da AE Alugue Estética para aprovação e pagamento.  
Tom: profissional, confiante, orientado a valor.

Deve conter:
- Capa com nome das partes (ZafalaoTech × AE Alugue Estética), data, confidencial
- Contexto: desafio do cliente e solução entregue
- Lista de entregáveis da Fase 1 (com check de concluído):
  - Agente LIA com persona e prompt especializado em vendas de franquia
  - Servidor webhook Node.js + Express
  - Integração Claude Sonnet 4 (Anthropic)
  - Integração Z-API (texto, documentos, imagem, áudio, vídeo)
  - Sistema de memória de conversas
  - Filtro de leads em atendimento humano (BLOCKED_PHONES)
  - Deploy em produção (Railway + GitHub CI/CD)
  - Runbook operacional para equipe não-técnica
  - Documentação técnica completa
  - Documento funcional para equipe de negócios
- Tabela de investimento Fase 1 (valores com placeholder R$ [——] para preencher)
- Plano de manutenção mensal (o que inclui, valor placeholder)
- Custos de infraestrutura de terceiros (responsabilidade do cliente)
- Roadmap de evoluções futuras (v2, v3, v4) com descrição e estimativa placeholder
- Condições gerais (prazo, pagamento, propriedade do código, suporte)
- Bloco de assinatura (ZafalaoTech + contratante)

---

**Instruções de geração:**
- Gere os 3 documentos em HTML completo, autocontido (sem dependências externas de CSS/JS)
- Use a paleta de cores definida acima
- Estilo moderno: cards com sombra suave, tabelas com header navy, tags/pills coloridas, diagrama de arquitetura estilizado
- Responsivo para tela e impressão (media print amigável)
- Salve como: `docs/tech-doc.html`, `docs/funcional.html`, `docs/proposta.html`
