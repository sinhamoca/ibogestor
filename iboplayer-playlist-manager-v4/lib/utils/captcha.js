const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');

const CAPTCHA_API_KEY = '87fd25839e716a8ad24b3cbb81067b75';

// Função auxiliar para sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Limpar SVG removendo atributos duplicados
function cleanSvg(svgContent) {
  let cleanedSvg = svgContent;
  cleanedSvg = cleanedSvg.replace(/(<svg[^>]*width="[^"]*"[^>]*)(width="[^"]*")/gi, '$1');
  cleanedSvg = cleanedSvg.replace(/(<svg[^>]*height="[^"]*"[^>]*)(height="[^"]*")/gi, '$1');
  return cleanedSvg;
}

// Converter SVG para PNG
async function svgToPng(svgContent) {
  const cleanedSvg = cleanSvg(svgContent);
  const pngBuffer = await sharp(Buffer.from(cleanedSvg))
    .png()
    .toBuffer();
  return pngBuffer;
}

// Resolver captcha com 2Captcha
async function solveCaptcha(svgContent) {
  // Converter SVG para PNG
  const pngBuffer = await svgToPng(svgContent);
  const pngBase64 = pngBuffer.toString('base64');
  
  // Enviar para 2Captcha
  const formData = new FormData();
  formData.append('key', CAPTCHA_API_KEY);
  formData.append('method', 'base64');
  formData.append('body', pngBase64);
  formData.append('numeric', '2');
  formData.append('min_len', '2');
  formData.append('max_len', '2');
  formData.append('json', '1');
  
  const submitResponse = await axios.post('http://2captcha.com/in.php', formData, {
    headers: formData.getHeaders()
  });
  
  if (submitResponse.data.status !== 1) {
    throw new Error(`Erro ao enviar captcha: ${submitResponse.data.request}`);
  }
  
  const captchaId = submitResponse.data.request;
  
  // Aguardar resolução
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    await sleep(3000);
    
    const resultResponse = await axios.get('http://2captcha.com/res.php', {
      params: {
        key: CAPTCHA_API_KEY,
        action: 'get',
        id: captchaId,
        json: 1
      }
    });
    
    if (resultResponse.data.status === 1) {
      return resultResponse.data.request;
    }
    
    if (resultResponse.data.request !== 'CAPCHA_NOT_READY') {
      throw new Error(`Erro na resolução: ${resultResponse.data.request}`);
    }
    
    attempts++;
  }
  
  throw new Error('Timeout ao resolver captcha');
}

module.exports = {
  solveCaptcha,
  svgToPng,
  cleanSvg
};
