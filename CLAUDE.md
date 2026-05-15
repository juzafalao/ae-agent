# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AE Alugue Estética Agent (Sofia)** — a WhatsApp sales agent that qualifies franchise leads and converts them via AI conversation. Sofia is an AI persona powered by Claude that handles the full sales funnel: welcoming → presentation → materials delivery → objection handling → qualification → specialist handoff.

## Commands

```bash
npm install       # install dependencies
npm run dev       # development with nodemon auto-reload
npm start         # production (node src/server.js)
```

No test suite or linter configured.

## Architecture

**Data flow:**
1. Lead sends WhatsApp message → Z-API webhook → `POST /webhook` (Express)
2. Server filters: ignores own messages, group chats, media without text
3. `processMessage(phone, message)` adds to in-memory history, calls Claude
4. Claude responds with text + optional action tags (`[ENVIAR_APRESENTACAO]`, `[TRANSFERIR_LEAD]`)
5. Agent sends WhatsApp response (splits at 1000 chars) and executes actions

**Key files:**
- [src/server.js](src/server.js) — Express entry point, webhook handler, `GET /health`
- [src/agent.js](src/agent.js) — `processMessage()`, Claude API call, action tag parsing, document delivery
- [src/prompt.js](src/prompt.js) — Full system prompt with franchise details, 6-stage conversation flow, pricing, FAQs
- [src/memory.js](src/memory.js) — In-memory Map (phone → history), capped at 20 messages per lead
- [src/zapi.js](src/zapi.js) — Z-API WhatsApp integration (`sendText`, `sendDocument`, `checkConnection`)
- [src/evolution.js](src/evolution.js) — Evolution API alternative (not wired into server.js currently)

**Claude integration (in `agent.js`):**
- Model: `claude-sonnet-4-20250514`
- Max tokens: 1024
- Conversation history: last 20 messages (managed in `memory.js`)
- Actions are extracted from Claude's response text via regex on action tags

**Webhook processing is non-blocking:** server responds 200 immediately, then processes via `setImmediate()`.

## Environment Variables

Copy `.env.example` to `.env`. Required:

```
ANTHROPIC_API_KEY=
ZAPI_INSTANCE_ID=
ZAPI_TOKEN=
ZAPI_CLIENT_TOKEN=
PORT=3000
AGENT_NAME=Sofia
BRAND_NAME=AE Alugue Estética
SPECIALIST_PHONE=
SPECIALIST_NAME=
```

Document PDF URLs (presentation, business plan, COF) are hardcoded in `src/agent.js`.

## Multi-Brand Deployment

Each brand is a separate copy of the project with its own `.env` and `src/prompt.js`, running on a different port. Production uses PM2 + Nginx reverse proxy. See README.md for VPS setup steps.
