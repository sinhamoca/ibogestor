const https = require('https');
const sessionManager = require('../../utils/session');

// Importar SHA3-512
let sha3_512;
try {
  const { sha3_512: sha3 } = require('js-sha3');
  sha3_512 = sha3;
} catch (e) {
  console.error('❌ Erro: js-sha3 não instalado!');
  console.error('   Execute: npm install js-sha3');
  process.exit(1);
}

const SITE_NAME = 'ibopro';
const API_BASE = 'https://api.iboproapp.com';

// ========== FUNÇÕES DE GERAÇÃO DE TOKENS ==========

function F(t) {
  if (t.length >= 6) {
    return t.substring(0, 3) + "iBo" + t.substring(3, t.length - 3) + "PrO" + t.substring(t.length - 3, t.length);
  }
  if (t.length >= 3) {
    return t.substring(0, 3) + "iBo" + t.substring(3);
  }
  return t + "PrO";
}

function T(t) {
  const encoded = F(t);
  return F(Buffer.from(encoded).toString('base64'));
}

async function L(e) {
  const n = Date.now().toString();
  const o = T(e + n);
  const normalized = o.normalize();
  const r = sha3_512(normalized);
  return T(r + n);
}

async function generateAllTokens(mac, password) {
  const timestamp = Date.now();
  mac = mac || '';
  password = password || '';
  
  const gcToken = await L(`${mac}${timestamp}${2 * timestamp}`);
  const hash1 = await L(`${mac}___${password}`);
  const hash2 = await L(`${mac}___${password}__${timestamp}`);
  const token1 = await L(`${mac}${timestamp}`);
  const token2 = await L(mac);
  const token3 = T(mac);
  
  return {
    'X-Gc-Token': gcToken,
    'x-hash': hash1,
    'x-hash-2': hash2,
    'x-token': token1,
    'x-token-2': token2,
    'x-token-3': token3
  };
}

// ========== FAZER LOGIN ==========

async function login(macAddress, password) {
  console.log('🔐 Iniciando login no IBOPro...');
  console.log('🔧 Gerando tokens SHA3-512...');
  
  const tokens = await generateAllTokens(macAddress, password);
  
  return new Promise((resolve, reject) => {
    const dados = JSON.stringify({
      mac: macAddress,
      password: password
    });
    
    const opcoes = {
      hostname: 'api.iboproapp.com',
      port: 443,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': dados.length,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': 'https://iboplayer.pro',
        'Referer': 'https://iboplayer.pro/',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'Authorization': 'Bearer',
        ...tokens
      }
    };
    
    const req = https.request(opcoes, (res) => {
      let resposta = '';
      
      res.on('data', (chunk) => {
        resposta += chunk;
      });
      
      res.on('end', async () => {
        try {
          const resultado = JSON.parse(resposta);
          
          if (!resultado.status || !resultado.token) {
            reject(new Error('Login falhou: ' + (resultado.message || 'Token não recebido')));
            return;
          }
          
          // Criar sessão com MAC e PASSWORD para gerar tokens depois
          const session = {
            site: SITE_NAME,
            macAddress,
            password, // IMPORTANTE: Salvar password para gerar tokens depois
            token: resultado.token,
            loginTime: new Date().toISOString(),
            message: resultado.message
          };
          
          await sessionManager.saveSession(SITE_NAME, session);
          
          console.log('✅ Login realizado com sucesso!');
          console.log(`🔑 Token JWT recebido`);
          
          resolve(session);
        } catch (erro) {
          reject(new Error('Erro ao processar resposta: ' + erro.message));
        }
      });
    });
    
    req.on('error', (erro) => {
      reject(erro);
    });
    
    req.write(dados);
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
  generateAllTokens, // Exportar para usar em outras requisições
  API_BASE
};
