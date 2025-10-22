const https = require('https');
const { generateAllTokens } = require('./auth');

const API_BASE = 'api.iboproapp.com';

// Função auxiliar para fazer requisições HTTPS com tokens customizados
async function makeRequest(method, path, session, data = null) {
  // Gerar tokens customizados SHA3-512 para cada requisição
  const tokens = await generateAllTokens(session.macAddress, session.password);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://iboplayer.pro',
        'Referer': 'https://iboplayer.pro/',
        ...tokens // Adicionar todos os tokens customizados
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let response = '';
      
      res.on('data', (chunk) => {
        response += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(response);
          resolve(result);
        } catch (error) {
          reject(new Error('Erro ao processar resposta: ' + error.message));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Listar playlists
async function listPlaylists(session) {
  return await makeRequest('GET', '/playlistw', session);
}

// Adicionar playlist
async function addPlaylist(session, options) {
  const {
    name,
    url,
    pin = '',
    protect = false,
    type = 'URL'
  } = options;
  
  const payload = {
    mac_address: session.macAddress,
    playlist_name: name,
    playlist_url: url,
    playlist_type: type,
    type: type,
    is_protected: protect,
    pin: pin,
    playlist_id: null,
    playlist_host: '',
    playlist_username: '',
    playlist_password: ''
  };
  
  return await makeRequest('POST', '/playlistw', session, payload);
}

// Editar playlist
async function editPlaylist(session, playlistId, options) {
  const {
    name,
    url,
    pin = '',
    protect = false,
    type = 'URL'
  } = options;
  
  const payload = {
    mac_address: session.macAddress,
    playlist_id: playlistId,
    playlist_name: name,
    playlist_url: url,
    playlist_type: type,
    type: type,
    is_protected: protect,
    pin: pin,
    playlist_host: '',
    playlist_username: '',
    playlist_password: ''
  };
  
  return await makeRequest('POST', '/playlistw', session, payload);
}

// Deletar playlist
async function deletePlaylist(session, playlistId, pin = null) {
  // Se tiver PIN, usar endpoint protegido
  if (pin) {
    return await makeRequest('POST', '/playlistw/protected', session, {
      playlist_id: playlistId,
      pin: pin
    });
  }
  
  // Sem PIN, usar DELETE normal com tokens customizados
  const tokens = await generateAllTokens(session.macAddress, session.password);
  
  return new Promise((resolve, reject) => {
    const data = {
      mac_address: session.macAddress,
      playlist_id: playlistId
    };
    
    const jsonData = JSON.stringify(data);
    
    const options = {
      hostname: API_BASE,
      port: 443,
      path: '/playlistw',
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonData),
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://iboplayer.pro',
        'Referer': 'https://iboplayer.pro/',
        ...tokens
      }
    };

    const req = https.request(options, (res) => {
      let response = '';
      
      res.on('data', (chunk) => {
        response += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(response);
          resolve(result);
        } catch (error) {
          reject(new Error('Erro ao processar resposta: ' + error.message));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(jsonData);
    req.end();
  });
}

module.exports = {
  listPlaylists,
  addPlaylist,
  editPlaylist,
  deletePlaylist
};
