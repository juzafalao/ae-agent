// evolution.js - Integração com Evolution API
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE;

const headers = {
  'apikey': API_KEY,
  'Content-Type': 'application/json'
};

// Envia mensagem de texto simples
async function sendText(phone, message) {
  try {
    const response = await axios.post(
      `${BASE_URL}/message/sendText/${INSTANCE}`,
      {
        number: phone,
        text: message
      },
      { headers }
    );
    console.log(`[Evolution] Mensagem enviada para ${phone}`);
    return response.data;
  } catch (error) {
    console.error(`[Evolution] Erro ao enviar mensagem:`, error.response?.data || error.message);
    throw error;
  }
}

// Envia documento/arquivo
async function sendDocument(phone, fileUrl, fileName, caption = '') {
  try {
    const response = await axios.post(
      `${BASE_URL}/message/sendMedia/${INSTANCE}`,
      {
        number: phone,
        mediatype: 'document',
        media: fileUrl,
        fileName: fileName,
        caption: caption
      },
      { headers }
    );
    console.log(`[Evolution] Documento enviado para ${phone}: ${fileName}`);
    return response.data;
  } catch (error) {
    console.error(`[Evolution] Erro ao enviar documento:`, error.response?.data || error.message);
    throw error;
  }
}

// Verifica se a instância está conectada
async function checkConnection() {
  try {
    const response = await axios.get(
      `${BASE_URL}/instance/connectionState/${INSTANCE}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error(`[Evolution] Erro ao verificar conexão:`, error.message);
    return null;
  }
}

module.exports = { sendText, sendDocument, checkConnection };
