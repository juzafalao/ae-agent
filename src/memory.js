// memory.js - Gerencia histórico de conversas em memória
// Sem banco de dados — simples e funcional para começar

const conversations = new Map();

// Quantas mensagens manter no histórico por conversa
const MAX_HISTORY = 20;

function getHistory(phone) {
  if (!conversations.has(phone)) {
    conversations.set(phone, []);
  }
  return conversations.get(phone);
}

function addMessage(phone, role, content) {
  const history = getHistory(phone);
  history.push({ role, content });

  // Mantém só as últimas MAX_HISTORY mensagens para não explodir o contexto
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}

function clearHistory(phone) {
  conversations.delete(phone);
}

// Retorna um resumo do lead para handoff
function getLeadSummary(phone) {
  const history = getHistory(phone);
  const messages = history
    .map(m => `${m.role === 'user' ? 'Lead' : 'Lia'}: ${m.content}`)
    .join('\n');
  return messages;
}

module.exports = { getHistory, addMessage, clearHistory, getLeadSummary };
