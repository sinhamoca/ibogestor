const https = require('https');
const { URLSearchParams } = require('url');
const zlib = require('zlib');
const { DOMAIN } = require('./auth');

// Função auxiliar para fazer requisições
function makeRequest(method, path, cookie, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: DOMAIN,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36',
        'Accept': method === 'GET' ? 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' : 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Referer': `https://${DOMAIN}/mylist`
      }
    };

    if (data) {
      const postData = data.toString();
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
      options.headers['Origin'] = `https://${DOMAIN}`;
    }

    const req = https.request(options, (res) => {
      let response = '';
      const encoding = res.headers['content-encoding'];
      let stream = res;

      // Lidar com compressão
      if (encoding === 'br') {
        stream = res.pipe(zlib.createBrotliDecompress());
      } else if (encoding === 'gzip' || encoding === 'deflate') {
        stream = res.pipe(zlib.createUnzip());
      }

      stream.on('data', (chunk) => {
        response += chunk.toString();
      });

      stream.on('end', () => {
        if (res.statusCode === 200) {
          resolve(response);
        } else {
          reject(new Error(`Erro HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(data.toString());
    }
    
    req.end();
  });
}

// Extrair playlists do HTML
function parsePlaylistsHTML(html) {
  const playlists = [];
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
  
  if (!tbodyMatch) {
    return playlists;
  }
  
  const tbody = tbodyMatch[1];
  const rowRegex = /<tr>\s*<td class="text-center">([^<]+)<\/td>\s*<td class="text-center">([^<]+)<\/td>\s*<td class="text-center">[\s\S]*?data-current_id="([^"]+)"[\s\S]*?data-protected="([^"]+)"[\s\S]*?data-playlist_type="([^"]*)"/g;
  
  let match;
  
  while ((match = rowRegex.exec(tbody)) !== null) {
    playlists.push({
      name: match[1].trim(),
      url: match[2].trim(),
      id: match[3].trim(),
      is_protected: match[4] === '1',
      type: match[5].trim() || 'general'
    });
  }
  
  return playlists;
}

// Listar playlists
async function listPlaylists(session) {
  const html = await makeRequest('GET', '/mylist', session.cookie);
  return parsePlaylistsHTML(html);
}

// Adicionar playlist
async function addPlaylist(session, options) {
  const {
    name,
    url,
    pin = '',
    protect = false,
    type = 'general'
  } = options;
  
  const params = new URLSearchParams({
    current_playlist_url_id: '-1',
    playlist_name: name,
    playlist_url: url,
    protect: protect ? '1' : '0',
    pin: protect ? pin : '', // Só envia PIN se estiver protegida
    playlist_type: type,
    user_name: '',
    password: ''
  });

  const response = await makeRequest('POST', '/savePlaylist', session.cookie, params);
  
  try {
    const result = JSON.parse(response);
    if (result.status === 'success') {
      return result.data;
    } else {
      throw new Error(result.msg || 'Erro ao adicionar playlist');
    }
  } catch (error) {
    throw new Error('Erro ao processar resposta: ' + error.message);
  }
}

// Editar playlist
async function editPlaylist(session, playlistId, options) {
  const {
    name,
    url,
    pin = '',
    protect = false,
    type = 'general'
  } = options;
  
  const params = new URLSearchParams({
    current_playlist_url_id: playlistId,
    playlist_name: name,
    playlist_url: url,
    protect: protect ? '1' : '0',
    pin: protect ? pin : '', // Só envia PIN se estiver protegida
    playlist_type: type,
    user_name: '',
    password: ''
  });

  const response = await makeRequest('POST', '/savePlaylist', session.cookie, params);
  
  try {
    const result = JSON.parse(response);
    if (result.status === 'success') {
      return result.data;
    } else {
      throw new Error(result.msg || 'Erro ao editar playlist');
    }
  } catch (error) {
    throw new Error('Erro ao processar resposta: ' + error.message);
  }
}

// Deletar playlist
async function deletePlaylist(session, playlistId) {
  const params = new URLSearchParams({
    playlist_url_id: playlistId
  });

  const response = await makeRequest('DELETE', '/deletePlayListUrl', session.cookie, params);
  
  try {
    const result = JSON.parse(response);
    if (result.status === 'success') {
      return result;
    } else {
      throw new Error('Erro ao deletar playlist');
    }
  } catch (error) {
    throw new Error('Erro ao processar resposta: ' + error.message);
  }
}

module.exports = {
  listPlaylists,
  addPlaylist,
  editPlaylist,
  deletePlaylist
};
