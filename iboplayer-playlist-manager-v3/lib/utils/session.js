const fs = require('fs').promises;
const path = require('path');

const SESSION_DIR = path.join(__dirname, '../../.sessions');

// Garantir que o diretório existe
async function ensureSessionDir() {
  try {
    await fs.mkdir(SESSION_DIR, { recursive: true });
  } catch (error) {
    // Diretório já existe
  }
}

// Salvar sessão de um site específico
async function saveSession(site, session) {
  await ensureSessionDir();
  const sessionFile = path.join(SESSION_DIR, `${site}.json`);
  await fs.writeFile(sessionFile, JSON.stringify(session, null, 2));
}

// Carregar sessão de um site específico
async function loadSession(site) {
  try {
    const sessionFile = path.join(SESSION_DIR, `${site}.json`);
    const data = await fs.readFile(sessionFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

// Verificar se há sessão ativa para um site
async function hasActiveSession(site) {
  const session = await loadSession(site);
  return session !== null;
}

// Obter sessão ativa (com erro se não existir)
async function getSession(site) {
  const session = await loadSession(site);
  if (!session) {
    throw new Error(`Nenhuma sessão ativa para ${site}. Faça login primeiro.`);
  }
  return session;
}

// Limpar sessão de um site
async function clearSession(site) {
  try {
    const sessionFile = path.join(SESSION_DIR, `${site}.json`);
    await fs.unlink(sessionFile);
  } catch (error) {
    // Arquivo não existe, tudo bem
  }
}

// Listar todas as sessões ativas
async function listActiveSessions() {
  await ensureSessionDir();
  try {
    const files = await fs.readdir(SESSION_DIR);
    const sessions = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const site = file.replace('.json', '');
        const session = await loadSession(site);
        if (session) {
          sessions.push({
            site,
            ...session
          });
        }
      }
    }
    
    return sessions;
  } catch (error) {
    return [];
  }
}

module.exports = {
  saveSession,
  loadSession,
  hasActiveSession,
  getSession,
  clearSession,
  listActiveSessions
};
