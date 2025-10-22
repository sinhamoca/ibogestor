const https = require('https');
const { URLSearchParams } = require('url');
const sessionManager = require('../../utils/session');

const SITE_NAME = 'vuplayer';
const DOMAIN = 'vuproplayer.org';

// Fazer login
async function login(macAddress, deviceKey) {
  console.log('🔐 Iniciando login no VU Player Pro...');
  
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      mac_address: macAddress,
      device_key: deviceKey,
      submit: ''
    });

    const postData = params.toString();

    const options = {
      hostname: DOMAIN,
      port: 443,
      path: '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Referer': `https://${DOMAIN}/login`,
        'Origin': `https://${DOMAIN}`
      }
    };

    const req = https.request(options, async (res) => {
      let cookies = [];

      if (res.headers['set-cookie']) {
        cookies = res.headers['set-cookie'];
      }

      res.on('data', () => {});
      
      res.on('end', async () => {
        if (res.statusCode === 302 && cookies.length > 0) {
          const cookie = cookies[0].split(';')[0];
          
          // Criar sessão
          const session = {
            site: SITE_NAME,
            macAddress,
            deviceKey,
            cookie,
            loginTime: new Date().toISOString()
          };
          
          await sessionManager.saveSession(SITE_NAME, session);
          
          console.log('✅ Login realizado com sucesso!');
          console.log(`🔑 MAC: ${macAddress}`);
          
          resolve(session);
        } else {
          reject(new Error('Login falhou - credenciais inválidas ou servidor indisponível'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Obter sessão ativa
async function getSession() {
  return await sessionManager.getSession(SITE_NAME);
}

// Limpar sessão
async function clearSession() {
  return await sessionManager.clearSession(SITE_NAME);
}

module.exports = {
  login,
  getSession,
  clearSession,
  DOMAIN
};
