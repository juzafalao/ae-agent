// agent.js - Lógica principal do agente Lia
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const { SYSTEM_PROMPT } = require('./prompt');
const { getHistory, addMessage, getLeadSummary } = require('./memory');
const { sendText, sendDocument, sendImage, sendAudio, sendVideo } = require('./zapi');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// URLs dos documentos — coloca os links reais aqui quando tiveres
// Podes hospedar no Google Drive, Dropbox ou qualquer storage público
const DOCUMENTS = {
  apresentacao: {
    url: 'https://SEU_STORAGE/apresentacao-ae-alugue-estetica.pdf',
    name: 'Apresentacao_AE_Alugue_Estetica.pdf',
    caption: '📋 Apresentação completa da AE Alugue Estética'
  },
  planoNegocios: {
    url: 'https://SEU_STORAGE/plano-de-negocios-ae.pdf',
    name: 'Plano_de_Negocios_AE.pdf',
    caption: '📊 Plano de Negócios com projeções financeiras'
  },
  cof: {
    url: 'https://SEU_STORAGE/cof-ae-alugue-estetica.pdf',
    name: 'COF_AE_Alugue_Estetica.pdf',
    caption: '📄 Circular de Oferta de Franquia (documento oficial)'
  }
};

// Processa as tags de ação que o Claude inclui nas respostas
async function processActions(phone, responseText) {
  const actions = [];

  if (responseText.includes('[ENVIAR_APRESENTACAO]')) {
    actions.push('enviar_docs');
  }

  if (responseText.includes('[TRANSFERIR_LEAD]')) {
    actions.push('transferir');
  }

  // Remove as tags do texto antes de enviar
  const cleanText = responseText
    .replace(/\[ENVIAR_APRESENTACAO\]/g, '')
    .replace(/\[TRANSFERIR_LEAD\]/g, '')
    .trim();

  return { cleanText, actions };
}

// Envia os materiais da franquia
async function sendMaterials(phone) {
  await sendText(phone, '📎 Vou te enviar os materiais agora. Um momento...');

  // Pequeno delay entre envios para não parecer spam
  for (const [key, doc] of Object.entries(DOCUMENTS)) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      await sendDocument(phone, doc.url, doc.name, doc.caption);
    } catch (err) {
      console.error(`[Agent] Erro ao enviar ${key}:`, err.message);
    }
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendText(phone, '✅ Materiais enviados! Qualquer dúvida sobre o que leu, pode perguntar aqui. 😊');
}

// Notifica o especialista sobre o lead quente
async function notifySpecialist(phone, leadPhone) {
  const specialistPhone = process.env.SPECIALIST_PHONE;
  const specialistName = process.env.SPECIALIST_NAME || 'Consultor';
  const summary = getLeadSummary(leadPhone);

  const notification = `🔥 *LEAD QUENTE - AE Alugue Estética*\n\n` +
    `📱 Contato: ${leadPhone}\n\n` +
    `📝 *Resumo da conversa:*\n${summary.substring(0, 1500)}...\n\n` +
    `⚡ Lead qualificado pela Lia e pronto para atendimento especializado!`;

  await sendText(specialistPhone, notification);
  console.log(`[Agent] Especialista ${specialistName} notificado sobre lead ${leadPhone}`);
}

// Função principal — processa mensagem do lead
async function processMessage(phone, userMessage) {
  console.log(`[Agent] Processando mensagem de ${phone}: ${userMessage.substring(0, 50)}...`);

  // Adiciona mensagem do usuário ao histórico
  addMessage(phone, 'user', userMessage);

  const history = getHistory(phone);

  try {
    // Chama o Claude com o histórico completo
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: history
    });

    const rawResponse = response.content[0].text;
    const { cleanText, actions } = await processActions(phone, rawResponse);

    // Adiciona resposta ao histórico (sem as tags)
    addMessage(phone, 'assistant', cleanText);

    // Envia resposta principal
    if (cleanText) {
      // Divide mensagens longas em partes (WhatsApp fica melhor assim)
      const parts = splitMessage(cleanText);
      for (const part of parts) {
        await sendText(phone, part);
        if (parts.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
    }

    // Executa ações identificadas
    for (const action of actions) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (action === 'enviar_docs') {
        await sendMaterials(phone);
      }

      if (action === 'transferir') {
        await notifySpecialist(phone, phone);
        await sendText(phone,
          `✨ Já avisei nosso consultor especialista sobre nossa conversa! ` +
          `Ele vai entrar em contato em breve para continuar o atendimento. ` +
          `Qualquer coisa, pode chamar aqui também! 😊`
        );
      }
    }

  } catch (error) {
    console.error('[Agent] Erro ao processar mensagem:', error.message);
    await sendText(phone,
      'Desculpe, tive um problema técnico agora. Pode repetir sua mensagem? 🙏'
    );
  }
}

// Divide mensagens longas em partes menores (máx 1000 chars)
function splitMessage(text, maxLength = 1000) {
  if (text.length <= maxLength) return [text];

  const parts = [];
  const paragraphs = text.split('\n\n');
  let current = '';

  for (const paragraph of paragraphs) {
    if ((current + paragraph).length > maxLength && current) {
      parts.push(current.trim());
      current = paragraph;
    } else {
      current += (current ? '\n\n' : '') + paragraph;
    }
  }

  if (current) parts.push(current.trim());
  return parts;
}

module.exports = { processMessage };
