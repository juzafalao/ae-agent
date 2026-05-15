// server.js - Servidor principal
require('dotenv').config();
const express = require('express');
const { processMessage } = require('./agent');
const { checkConnection } = require('./zapi');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ============================================
// WEBHOOK - Z-API envia mensagens aqui
// ============================================
app.post('/webhook', async (req, res) => {
  // Responde 200 imediatamente para a Z-API não tentar reenviar
  res.status(200).json({ status: 'ok' });

  try {
    const body = req.body;

    // Log para debug — remove depois que estiver funcionando
    console.log('[Server] Webhook recebido:', JSON.stringify(body).substring(0, 200));

    // Ignora mensagens enviadas pelo próprio bot
    if (body.fromMe) return;

    // Ignora mensagens de grupos
    if (body.isGroup) return;

    // Ignora se não tem telefone ou texto
    if (!body.phone) return;

    // Z-API envia o número já formatado
    const phone = body.phone;

    // Ignora números bloqueados (leads já em atendimento humano)
    const blockedPhones = (process.env.BLOCKED_PHONES || '').split(',').map(n => n.trim()).filter(Boolean);
    if (blockedPhones.includes(phone)) {
      console.log(`[Server] Número bloqueado ignorado: ${phone}`);
      return;
    }

    // Extrai o texto — Z-API usa body.text.message para texto simples
    let userMessage = '';

    if (body.type === 'ReceivedCallback') {
      if (body.text?.message) {
        userMessage = body.text.message;
      } else if (body.image?.caption) {
        // Lead enviou imagem com legenda — responde pedindo texto
        userMessage = '[imagem recebida]';
      } else if (body.document?.caption) {
        userMessage = '[documento recebido]';
      } else if (body.audio) {
        userMessage = '[áudio recebido]';
      } else {
        console.log(`[Server] Tipo de mensagem não tratado de ${phone}`);
        return;
      }
    } else {
      // Evento que não é mensagem recebida (status, etc.)
      return;
    }

    if (!userMessage.trim()) return;

    // Se recebeu mídia, avisa que só processa texto por enquanto
    if (['[imagem recebida]', '[documento recebido]', '[áudio recebido]'].includes(userMessage)) {
      const { sendText } = require('./zapi');
      await sendText(phone, 'Olá! Por enquanto só consigo processar mensagens de texto. Pode me escrever o que precisa? 😊');
      return;
    }

    console.log(`[Server] Mensagem de ${phone}: ${userMessage.substring(0, 80)}`);

    // Processa de forma assíncrona para não bloquear o webhook
    setImmediate(() => processMessage(phone, userMessage));

  } catch (error) {
    console.error('[Server] Erro no webhook:', error.message);
  }
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', async (req, res) => {
  const connection = await checkConnection();
  res.json({
    status: 'running',
    agent: process.env.AGENT_NAME,
    brand: process.env.BRAND_NAME,
    whatsapp: connection?.state || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// START
// ============================================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   ${process.env.BRAND_NAME} Agent     
║   Agente: ${process.env.AGENT_NAME}                        
║   Porta: ${PORT}                              
║   Webhook: /webhook                    
║   Health: /health                      
╚════════════════════════════════════════╝
  `);
});
