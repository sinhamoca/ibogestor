const axios = require('axios');

// Listar playlists
async function listPlaylists(session) {
  const response = await axios.get(
    `https://${session.domain}/frontend/device/playlists`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': `https://${session.domain}/dashboard`,
        'Cookie': session.cookies.join('; ')
      }
    }
  );
  
  if (response.data.status !== 'Sucess') {
    throw new Error('Erro ao listar playlists');
  }
  
  return response.data.playlists;
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
  
  const payload = {
    current_playlist_url_id: -1,
    password: '',
    pin: pin,
    playlist_name: name,
    playlist_type: type,
    playlist_url: url,
    protect: protect ? 'true' : 'false',
    username: '',
    xml_url: ''
  };
  
  const response = await axios.post(
    `https://${session.domain}/frontend/device/savePlaylist`,
    payload,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': `https://${session.domain}`,
        'Referer': `https://${session.domain}/dashboard`,
        'Cookie': session.cookies.join('; ')
      }
    }
  );
  
  if (response.data.status !== 'success') {
    throw new Error('Erro ao adicionar playlist: ' + JSON.stringify(response.data));
  }
  
  return response.data.data;
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
  
  const payload = {
    current_playlist_url_id: playlistId,
    password: '',
    pin: pin,
    playlist_name: name,
    playlist_type: type,
    playlist_url: url,
    protect: protect ? 'true' : 'false',
    username: '',
    xml_url: ''
  };
  
  const response = await axios.post(
    `https://${session.domain}/frontend/device/savePlaylist`,
    payload,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': `https://${session.domain}`,
        'Referer': `https://${session.domain}/dashboard`,
        'Cookie': session.cookies.join('; ')
      }
    }
  );
  
  if (response.data.status !== 'success') {
    throw new Error('Erro ao editar playlist: ' + JSON.stringify(response.data));
  }
  
  return response.data.data;
}

// Deletar playlist
async function deletePlaylist(session, playlistId) {
  const response = await axios.delete(
    `https://${session.domain}/frontend/device/deletePlayListUrl/${playlistId}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': `https://${session.domain}/dashboard`,
        'Cookie': session.cookies.join('; ')
      }
    }
  );
  
  if (response.data.status !== 'success') {
    throw new Error('Erro ao deletar playlist: ' + JSON.stringify(response.data));
  }
  
  return response.data;
}

module.exports = {
  listPlaylists,
  addPlaylist,
  editPlaylist,
  deletePlaylist
};
