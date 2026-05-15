// zapi.js - Integração com Z-API
require('dotenv').config();
const axios = require('axios');

// Estas variáveis vêm do painel Z-API
// Painel → tua instância → "Credenciais"
const INSTANCE_ID = process.env.ZAPI_INSTANCE_ID;
const TOKEN = process.env.ZAPI_TOKEN;
const CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

const BASE_URL = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}`;

const headers = {
  'Content-Type': 'application/json',
  ...(CLIENT_TOKEN && CLIENT_TOKEN !== 'COLOCA_O_CLIENT_TOKEN_AQUI' && { 'Client-Token': CLIENT_TOKEN })
};

// Envia mensagem de texto simples
async function sendText(phone, message) {
  try {
    const response = await axios.post(
      `${BASE_URL}/send-text`,
      {
        phone: phone,
        message: message
      },
      { headers }
    );
    console.log(`[Z-API] Mensagem enviada para ${phone}`);
    return response.data;
  } catch (error) {
    console.error(`[Z-API] Erro ao enviar mensagem:`, error.response?.data || error.message);
    throw error;
  }
}

// Envia documento/arquivo via URL pública
async function sendDocument(phone, fileUrl, fileName, caption = '') {
  try {
    const response = await axios.post(
      `${BASE_URL}/send-document/url`,
      {
        phone: phone,
        url: fileUrl,
        fileName: fileName,
        caption: caption
      },
      { headers }
    );
    console.log(`[Z-API] Documento enviado para ${phone}: ${fileName}`);
    return response.data;
  } catch (error) {
    console.error(`[Z-API] Erro ao enviar documento:`, error.response?.data || error.message);
    throw error;
  }
}

// Envia imagem via URL pública
async function sendImage(phone, imageUrl, caption = '') {
  try {
    const response = await axios.post(
      `${BASE_URL}/send-image`,
      { phone, image: imageUrl, caption },
      { headers }
    );
    console.log(`[Z-API] Imagem enviada para ${phone}`);
    return response.data;
  } catch (error) {
    console.error(`[Z-API] Erro ao enviar imagem:`, error.response?.data || error.message);
    throw error;
  }
}

// Envia áudio via URL pública (converte para base64 internamente)
async function sendAudio(phone, audioUrl) {
  try {
    const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    const audioType = audioResponse.headers['content-type'];
    const audioBase64 = `data:${audioType};base64,${Buffer.from(audioResponse.data, 'binary').toString('base64')}`;

    const response = await axios.post(
      `${BASE_URL}/send-audio`,
      { phone, audio: audioBase64 },
      { headers }
    );
    console.log(`[Z-API] Áudio enviado para ${phone}`);
    return response.data;
  } catch (error) {
    console.error(`[Z-API] Erro ao enviar áudio:`, error.response?.data || error.message);
    throw error;
  }
}

// Envia vídeo via URL pública
async function sendVideo(phone, videoUrl, caption = '') {
  try {
    const response = await axios.post(
      `${BASE_URL}/send-video`,
      { phone, video: videoUrl, caption },
      { headers }
    );
    console.log(`[Z-API] Vídeo enviado para ${phone}`);
    return response.data;
  } catch (error) {
    console.error(`[Z-API] Erro ao enviar vídeo:`, error.response?.data || error.message);
    throw error;
  }
}

// Verifica status da conexão WhatsApp
async function checkConnection() {
  try {
    const response = await axios.get(
      `${BASE_URL}/status`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error(`[Z-API] Erro ao verificar conexão:`, error.message);
    return null;
  }
}

module.exports = { sendText, sendDocument, sendImage, sendAudio, sendVideo, checkConnection };
