const express = require('express');
const router = express.Router();
const ClientesModel = require('../database/models/clientes');
const LogsModel = require('../database/models/logs');
const ConfigsModel = require('../database/models/configs');

// Importar módulos dos sites
const iboplayerAuth = require('../lib/sites/iboplayer/auth');
const iboplayerPlaylist = require('../lib/sites/iboplayer/playlist');
const iboproAuth = require('../lib/sites/ibopro/auth');
const iboproPlaylist = require('../lib/sites/ibopro/playlist');
const vuplayerAuth = require('../lib/sites/vuplayer/auth');
const vuplayerPlaylist = require('../lib/sites/vuplayer/playlist');

// Atualizar API Key do 2Captcha dinamicamente
const captchaUtils = require('../lib/utils/captcha');

// Função para obter módulos do site
function getSiteModules(aplicativo) {
  const modules = {
    iboplayer: { auth: iboplayerAuth, playlist: iboplayerPlaylist },
    ibopro: { auth: iboproAuth, playlist: iboproPlaylist },
    vuplayer: { auth: vuplayerAuth, playlist: vuplayerPlaylist }
  };
  
  return modules[aplicativo];
}

// Fazer login
router.post('/:id/login', async (req, res) => {
  try {
    const cliente = ClientesModel.getById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }

    const modules = getSiteModules(cliente.aplicativo);
    if (!modules) {
      return res.status(400).json({ success: false, error: 'Aplicativo inválido' });
    }

    // Atualizar 2Captcha API Key se configurada
    const apiKey = ConfigsModel.get2CaptchaKey();
    if (apiKey && cliente.aplicativo === 'iboplayer') {
      const fs = require('fs');
      const path = require('path');
      const captchaPath = path.join(__dirname, '../lib/utils/captcha.js');
      try {
        let captchaContent = fs.readFileSync(captchaPath, 'utf8');
        captchaContent = captchaContent.replace(
          /const CAPTCHA_API_KEY = '[^']*';/,
          `const CAPTCHA_API_KEY = '${apiKey}';`
        );
        fs.writeFileSync(captchaPath, captchaContent);
        delete require.cache[require.resolve('../lib/utils/captcha')];
      } catch (e) {
        console.error('Erro ao atualizar 2Captcha key:', e);
      }
    }

    let session;

    // Fazer login baseado no aplicativo
    if (cliente.aplicativo === 'iboplayer') {
      session = await modules.auth.login(cliente.dominio, cliente.mac, cliente.device_key);
    } else if (cliente.aplicativo === 'ibopro') {
      session = await modules.auth.login(cliente.mac, cliente.password);
    } else if (cliente.aplicativo === 'vuplayer') {
      session = await modules.auth.login(cliente.mac, cliente.device_key);
    }

    // Salvar sessão com ID do cliente para evitar conflitos
    const sessionManager = require('../lib/utils/session');
    const sessionKey = `${cliente.aplicativo}-${cliente.id}`;
    await sessionManager.saveSession(sessionKey, session);

    // Atualizar última sincronização
    ClientesModel.updateSincronizacao(cliente.id);

    // Tentar buscar e salvar playlists automaticamente
    try {
      const playlists = await modules.playlist.listPlaylists(session);
      ClientesModel.savePlaylistsSnapshot(cliente.id, playlists);
      
      LogsModel.create({
        cliente_id: cliente.id,
        acao: 'sincronizar_playlists',
        status: 'sucesso',
        mensagem: `${Array.isArray(playlists) ? playlists.length : 0} playlist(s) sincronizada(s)`,
        detalhes: { total: Array.isArray(playlists) ? playlists.length : 0 }
      });
    } catch (syncError) {
      console.error('Erro ao sincronizar playlists após login:', syncError);
    }

    // Criar log de login
    LogsModel.create({
      cliente_id: cliente.id,
      acao: 'login',
      status: 'sucesso',
      mensagem: 'Login realizado com sucesso',
      detalhes: { site: cliente.aplicativo }
    });

    res.json({ 
      success: true, 
      message: 'Login realizado com sucesso',
      data: { session }
    });
  } catch (error) {
    // Criar log de erro
    LogsModel.create({
      cliente_id: req.params.id,
      acao: 'login',
      status: 'erro',
      mensagem: error.message
    });

    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter snapshot de playlists (visualização rápida)
router.get('/:id/playlists-snapshot', async (req, res) => {
  try {
    const cliente = ClientesModel.getById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }

    const snapshot = ClientesModel.getPlaylistsSnapshot(req.params.id);
    
    res.json({ 
      success: true, 
      data: snapshot
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Listar playlists
router.get('/:id/playlists', async (req, res) => {
  try {
    const cliente = ClientesModel.getById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }

    const modules = getSiteModules(cliente.aplicativo);
    if (!modules) {
      return res.status(400).json({ success: false, error: 'Aplicativo inválido' });
    }

    // Obter sessão específica do cliente
    const sessionManager = require('../lib/utils/session');
    const sessionKey = `${cliente.aplicativo}-${cliente.id}`;
    const session = await sessionManager.getSession(sessionKey);
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        error: 'Sessão não encontrada. Faça login primeiro.',
        needsLogin: true
      });
    }

    // Listar playlists
    const playlists = await modules.playlist.listPlaylists(session);

    // Criar log
    LogsModel.create({
      cliente_id: cliente.id,
      acao: 'listar_playlists',
      status: 'sucesso',
      mensagem: `${Array.isArray(playlists) ? playlists.length : 0} playlist(s) encontrada(s)`
    });

    res.json({ 
      success: true, 
      data: playlists 
    });
  } catch (error) {
    LogsModel.create({
      cliente_id: req.params.id,
      acao: 'listar_playlists',
      status: 'erro',
      mensagem: error.message
    });

    res.status(500).json({ success: false, error: error.message });
  }
});

// Adicionar playlist
router.post('/:id/playlists', async (req, res) => {
  try {
    const cliente = ClientesModel.getById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }

    const modules = getSiteModules(cliente.aplicativo);
    if (!modules) {
      return res.status(400).json({ success: false, error: 'Aplicativo inválido' });
    }

    const { name, url, pin, protect, type } = req.body;

    if (!name || !url) {
      return res.status(400).json({ success: false, error: 'Nome e URL são obrigatórios' });
    }

    // Obter sessão específica do cliente
    const sessionManager = require('../lib/utils/session');
    const sessionKey = `${cliente.aplicativo}-${cliente.id}`;
    const session = await sessionManager.getSession(sessionKey);
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        error: 'Sessão não encontrada. Faça login primeiro.',
        needsLogin: true
      });
    }

    // Adicionar playlist
    const result = await modules.playlist.addPlaylist(session, {
      name,
      url,
      pin: pin || '',
      protect: protect || false,
      type: type || 'general'
    });

    // Criar log
    LogsModel.create({
      cliente_id: cliente.id,
      acao: 'adicionar_playlist',
      status: 'sucesso',
      mensagem: `Playlist "${name}" adicionada`,
      detalhes: { name, url, protect }
    });

    res.json({ 
      success: true, 
      message: 'Playlist adicionada com sucesso',
      data: result 
    });
  } catch (error) {
    LogsModel.create({
      cliente_id: req.params.id,
      acao: 'adicionar_playlist',
      status: 'erro',
      mensagem: error.message
    });

    res.status(500).json({ success: false, error: error.message });
  }
});

// Editar playlist
router.put('/:id/playlists/:playlistId', async (req, res) => {
  try {
    const cliente = ClientesModel.getById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }

    const modules = getSiteModules(cliente.aplicativo);
    if (!modules) {
      return res.status(400).json({ success: false, error: 'Aplicativo inválido' });
    }

    const { name, url, pin, protect, type } = req.body;

    // Obter sessão específica do cliente
    const sessionManager = require('../lib/utils/session');
    const sessionKey = `${cliente.aplicativo}-${cliente.id}`;
    const session = await sessionManager.getSession(sessionKey);
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        error: 'Sessão não encontrada. Faça login primeiro.',
        needsLogin: true
      });
    }

    // Editar playlist
    const result = await modules.playlist.editPlaylist(session, req.params.playlistId, {
      name,
      url,
      pin: pin || '',
      protect: protect || false,
      type: type || 'general'
    });

    // Criar log
    LogsModel.create({
      cliente_id: cliente.id,
      acao: 'editar_playlist',
      status: 'sucesso',
      mensagem: `Playlist "${name}" editada`,
      detalhes: { playlistId: req.params.playlistId, name, url }
    });

    res.json({ 
      success: true, 
      message: 'Playlist editada com sucesso',
      data: result 
    });
  } catch (error) {
    LogsModel.create({
      cliente_id: req.params.id,
      acao: 'editar_playlist',
      status: 'erro',
      mensagem: error.message
    });

    res.status(500).json({ success: false, error: error.message });
  }
});

// Deletar playlist
router.delete('/:id/playlists/:playlistId', async (req, res) => {
  try {
    const cliente = ClientesModel.getById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }

    const modules = getSiteModules(cliente.aplicativo);
    if (!modules) {
      return res.status(400).json({ success: false, error: 'Aplicativo inválido' });
    }

    const { pin } = req.body;

    // Obter sessão específica do cliente
    const sessionManager = require('../lib/utils/session');
    const sessionKey = `${cliente.aplicativo}-${cliente.id}`;
    const session = await sessionManager.getSession(sessionKey);
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        error: 'Sessão não encontrada. Faça login primeiro.',
        needsLogin: true
      });
    }

    // Deletar playlist
    await modules.playlist.deletePlaylist(session, req.params.playlistId, pin);

    // Criar log
    LogsModel.create({
      cliente_id: cliente.id,
      acao: 'deletar_playlist',
      status: 'sucesso',
      mensagem: `Playlist deletada`,
      detalhes: { playlistId: req.params.playlistId }
    });

    res.json({ 
      success: true, 
      message: 'Playlist deletada com sucesso'
    });
  } catch (error) {
    LogsModel.create({
      cliente_id: req.params.id,
      acao: 'deletar_playlist',
      status: 'erro',
      mensagem: error.message
    });

    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

// Listar playlists
router.get('/:id/playlists', async (req, res) => {
  try {
    const cliente = ClientesModel.getById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }

    const modules = getSiteModules(cliente.aplicativo);
    if (!modules) {
      return res.status(400).json({ success: false, error: 'Aplicativo inválido' });
    }

    // Obter sessão
    const session = await modules.auth.getSession();
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        error: 'Sessão não encontrada. Faça login primeiro.',
        needsLogin: true
      });
    }

    // Listar playlists
    const playlists = await modules.playlist.listPlaylists(session);

    // Criar log
    LogsModel.create({
      cliente_id: cliente.id,
      acao: 'listar_playlists',
      status: 'sucesso',
      mensagem: `${Array.isArray(playlists) ? playlists.length : 0} playlist(s) encontrada(s)`
    });

    res.json({ 
      success: true, 
      data: playlists 
    });
  } catch (error) {
    LogsModel.create({
      cliente_id: req.params.id,
      acao: 'listar_playlists',
      status: 'erro',
      mensagem: error.message
    });

    res.status(500).json({ success: false, error: error.message });
  }
});

// Adicionar playlist
router.post('/:id/playlists', async (req, res) => {
  try {
    const cliente = ClientesModel.getById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }

    const modules = getSiteModules(cliente.aplicativo);
    if (!modules) {
      return res.status(400).json({ success: false, error: 'Aplicativo inválido' });
    }

    const { name, url, pin, protect, type } = req.body;

    if (!name || !url) {
      return res.status(400).json({ success: false, error: 'Nome e URL são obrigatórios' });
    }

    // Obter sessão
    const session = await modules.auth.getSession();
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        error: 'Sessão não encontrada. Faça login primeiro.',
        needsLogin: true
      });
    }

    // Adicionar playlist
    const result = await modules.playlist.addPlaylist(session, {
      name,
      url,
      pin: pin || '',
      protect: protect || false,
      type: type || 'general'
    });

    // Criar log
    LogsModel.create({
      cliente_id: cliente.id,
      acao: 'adicionar_playlist',
      status: 'sucesso',
      mensagem: `Playlist "${name}" adicionada`,
      detalhes: { name, url, protect }
    });

    res.json({ 
      success: true, 
      message: 'Playlist adicionada com sucesso',
      data: result 
    });
  } catch (error) {
    LogsModel.create({
      cliente_id: req.params.id,
      acao: 'adicionar_playlist',
      status: 'erro',
      mensagem: error.message
    });

    res.status(500).json({ success: false, error: error.message });
  }
});

// Editar playlist
router.put('/:id/playlists/:playlistId', async (req, res) => {
  try {
    const cliente = ClientesModel.getById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }

    const modules = getSiteModules(cliente.aplicativo);
    if (!modules) {
      return res.status(400).json({ success: false, error: 'Aplicativo inválido' });
    }

    const { name, url, pin, protect, type } = req.body;

    // Obter sessão
    const session = await modules.auth.getSession();
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        error: 'Sessão não encontrada. Faça login primeiro.',
        needsLogin: true
      });
    }

    // Editar playlist
    const result = await modules.playlist.editPlaylist(session, req.params.playlistId, {
      name,
      url,
      pin: pin || '',
      protect: protect || false,
      type: type || 'general'
    });

    // Criar log
    LogsModel.create({
      cliente_id: cliente.id,
      acao: 'editar_playlist',
      status: 'sucesso',
      mensagem: `Playlist "${name}" editada`,
      detalhes: { playlistId: req.params.playlistId, name, url }
    });

    res.json({ 
      success: true, 
      message: 'Playlist editada com sucesso',
      data: result 
    });
  } catch (error) {
    LogsModel.create({
      cliente_id: req.params.id,
      acao: 'editar_playlist',
      status: 'erro',
      mensagem: error.message
    });

    res.status(500).json({ success: false, error: error.message });
  }
});

// Deletar playlist
router.delete('/:id/playlists/:playlistId', async (req, res) => {
  try {
    const cliente = ClientesModel.getById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }

    const modules = getSiteModules(cliente.aplicativo);
    if (!modules) {
      return res.status(400).json({ success: false, error: 'Aplicativo inválido' });
    }

    const { pin } = req.body;

    // Obter sessão
    const session = await modules.auth.getSession();
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        error: 'Sessão não encontrada. Faça login primeiro.',
        needsLogin: true
      });
    }

    // Deletar playlist
    await modules.playlist.deletePlaylist(session, req.params.playlistId, pin);

    // Criar log
    LogsModel.create({
      cliente_id: cliente.id,
      acao: 'deletar_playlist',
      status: 'sucesso',
      mensagem: `Playlist deletada`,
      detalhes: { playlistId: req.params.playlistId }
    });

    res.json({ 
      success: true, 
      message: 'Playlist deletada com sucesso'
    });
  } catch (error) {
    LogsModel.create({
      cliente_id: req.params.id,
      acao: 'deletar_playlist',
      status: 'erro',
      mensagem: error.message
    });

    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
