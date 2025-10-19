const axios = require('axios');
const captcha = require('../../utils/captcha');
const sessionManager = require('../../utils/session');

const SITE_NAME = 'iboplayer';

// Obter captcha SVG e token
async function getCaptcha(domain) {
  const response = await axios.get(`https://${domain}/frontend/captcha/generate`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': `https://${domain}/frontend/device/login`
    }
  });
  
  return response.data;
}

// Fazer login
async function login(domain, macAddress, deviceKey) {
  console.log('🔐 Iniciando login no IBOPlayer...');
  
  // Obter captcha
  console.log('📥 Obtendo captcha...');
  const captchaData = await getCaptcha(domain);
  const token = captchaData.token;
  
  if (!captchaData.svg || !token) {
    throw new Error('Captcha ou token não encontrado');
  }
  
  console.log('✅ Captcha obtido!');
  
  // Resolver captcha
  console.log('🔍 Resolvendo captcha...');
  const captchaSolution = await captcha.solveCaptcha(captchaData.svg);
  console.log(`✅ Captcha resolvido: ${captchaSolution}`);
  
  // Fazer login
  console.log('🔐 Fazendo login...');
  const response = await axios.post(
    `https://${domain}/frontend/device/login`,
    {
      mac_address: macAddress,
      device_key: deviceKey,
      captcha: captchaSolution,
      token: token
    },
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': `https://${domain}`,
        'Referer': `https://${domain}/frontend/device/login`
      }
    }
  );
  
  if (response.data.status !== 'success') {
    throw new Error('Login falhou: ' + JSON.stringify(response.data));
  }
  
  // Extrair cookies
  const cookies = response.headers['set-cookie'];
  
  // Criar sessão
  const session = {
    site: SITE_NAME,
    domain,
    macAddress,
    deviceKey,
    deviceId: response.data.device._id,
    cookies: cookies,
    loginTime: new Date().toISOString(),
    device: response.data.device
  };
  
  await sessionManager.saveSession(SITE_NAME, session);
  
  console.log('✅ Login realizado com sucesso!');
  console.log(`📱 Device ID: ${session.deviceId}`);
  
  return session;
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
  clearSession
};
