const express = require('express');
const router = express.Router();
const DnsModel = require('../database/models/dns');

// Listar todos os DNS
router.get('/', (req, res) => {
  try {
    const apenasAtivos = req.query.ativos === 'true';
    const dnsList = DnsModel.getAll(apenasAtivos);
    res.json({ success: true, data: dnsList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Buscar DNS por ID
router.get('/:id', (req, res) => {
  try {
    const dns = DnsModel.getById(req.params.id);
    
    if (!dns) {
      return res.status(404).json({ success: false, error: 'DNS não encontrado' });
    }
    
    res.json({ success: true, data: dns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Criar novo DNS
router.post('/', (req, res) => {
  try {
    const { nome, url, descricao, ativo } = req.body;

    if (!nome || nome.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }

    if (!url || url.trim() === '') {
      return res.status(400).json({ success: false, error: 'URL é obrigatória' });
    }

    // Validar formato da URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'URL inválida' });
    }

    // Verificar se já existe
    if (DnsModel.exists(url)) {
      return res.status(400).json({ success: false, error: 'Esta URL já está cadastrada' });
    }

    const novoDns = DnsModel.create({ nome, url, descricao, ativo: ativo !== undefined ? ativo : 1 });
    res.status(201).json({ success: true, data: novoDns, message: 'DNS criado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Atualizar DNS
router.put('/:id', (req, res) => {
  try {
    const { nome, url, descricao, ativo } = req.body;

    // Verificar se DNS existe
    const dnsExistente = DnsModel.getById(req.params.id);
    if (!dnsExistente) {
      return res.status(404).json({ success: false, error: 'DNS não encontrado' });
    }

    if (!nome || nome.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }

    if (!url || url.trim() === '') {
      return res.status(400).json({ success: false, error: 'URL é obrigatória' });
    }

    // Validar formato da URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'URL inválida' });
    }

    // Verificar se URL já existe em outro registro
    if (DnsModel.exists(url, req.params.id)) {
      return res.status(400).json({ success: false, error: 'Esta URL já está cadastrada' });
    }

    const dnsAtualizado = DnsModel.update(req.params.id, { nome, url, descricao, ativo });
    res.json({ success: true, data: dnsAtualizado, message: 'DNS atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deletar DNS
router.delete('/:id', (req, res) => {
  try {
    const deleted = DnsModel.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'DNS não encontrado' });
    }
    
    res.json({ success: true, message: 'DNS deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ativar/Desativar DNS
router.patch('/:id/toggle', (req, res) => {
  try {
    const dns = DnsModel.toggleAtivo(req.params.id);
    
    if (!dns) {
      return res.status(404).json({ success: false, error: 'DNS não encontrado' });
    }
    
    const status = dns.ativo === 1 ? 'ativado' : 'desativado';
    res.json({ success: true, data: dns, message: `DNS ${status} com sucesso` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Preview de troca de DNS
router.post('/preview', (req, res) => {
  try {
    const { originalUrl, newDnsId } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ success: false, error: 'URL original é obrigatória' });
    }

    if (!newDnsId) {
      return res.status(400).json({ success: false, error: 'DNS é obrigatório' });
    }

    const dns = DnsModel.getById(newDnsId);
    if (!dns) {
      return res.status(404).json({ success: false, error: 'DNS não encontrado' });
    }

    const newUrl = DnsModel.replaceDomain(originalUrl, dns.url);
    
    if (!newUrl) {
      return res.status(400).json({ success: false, error: 'Erro ao gerar nova URL' });
    }

    res.json({ 
      success: true, 
      data: {
        originalUrl,
        newUrl,
        dns: dns
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Preview de troca em massa por grupo
router.post('/preview-bulk', async (req, res) => {
  try {
    const { grupoId, newDnsId } = req.body;

    if (!grupoId) {
      return res.status(400).json({ success: false, error: 'Grupo é obrigatório' });
    }

    if (!newDnsId) {
      return res.status(400).json({ success: false, error: 'DNS é obrigatório' });
    }

    const ClientesModel = require('../database/models/clientes');

    // Buscar DNS
    const dns = DnsModel.getById(newDnsId);
    if (!dns) {
      return res.status(404).json({ success: false, error: 'DNS não encontrado' });
    }

    // Buscar clientes do grupo
    const clientes = ClientesModel.getByGrupo(grupoId);
    
    if (clientes.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhum cliente encontrado neste grupo' });
    }

    // Analisar compatibilidade
    const analise = {
      total: clientes.length,
      iboplayer: clientes.filter(c => c.aplicativo === 'iboplayer').length,
      ibopro: clientes.filter(c => c.aplicativo === 'ibopro').length,
      vuplayer: clientes.filter(c => c.aplicativo === 'vuplayer').length,
      comSessao: 0,
      semSessao: 0,
      clientes: []
    };

    // Verificar sessões
    const sessionManager = require('../lib/utils/session');
    
    for (const cliente of clientes) {
      const sessionKey = `${cliente.aplicativo}-${cliente.id}`;
      const hasSession = await sessionManager.hasActiveSession(sessionKey);
      
      if (hasSession) {
        analise.comSessao++;
      } else {
        analise.semSessao++;
      }

      analise.clientes.push({
        id: cliente.id,
        nome: cliente.nome,
        aplicativo: cliente.aplicativo,
        hasSession
      });
    }

    res.json({
      success: true,
      data: {
        analise,
        dns,
        grupoId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Executar troca em massa
router.post('/bulk-change', async (req, res) => {
  try {
    const { grupoId, newDnsId, autoLogin = true } = req.body;

    if (!grupoId || !newDnsId) {
      return res.status(400).json({ success: false, error: 'Grupo e DNS são obrigatórios' });
    }

    const ClientesModel = require('../database/models/clientes');
    const LogsModel = require('../database/models/logs');
    const ConfigsModel = require('../database/models/configs');

    // Módulos dos sites
    const iboplayerAuth = require('../lib/sites/iboplayer/auth');
    const iboplayerPlaylist = require('../lib/sites/iboplayer/playlist');
    const iboproAuth = require('../lib/sites/ibopro/auth');
    const iboproPlaylist = require('../lib/sites/ibopro/playlist');
    const vuplayerAuth = require('../lib/sites/vuplayer/auth');
    const vuplayerPlaylist = require('../lib/sites/vuplayer/playlist');

    const modules = {
      iboplayer: { auth: iboplayerAuth, playlist: iboplayerPlaylist },
      ibopro: { auth: iboproAuth, playlist: iboproPlaylist },
      vuplayer: { auth: vuplayerAuth, playlist: vuplayerPlaylist }
    };

    const dns = DnsModel.getById(newDnsId);
    if (!dns) {
      return res.status(404).json({ success: false, error: 'DNS não encontrado' });
    }

    const clientes = ClientesModel.getByGrupo(grupoId);
    
    const resultado = {
      total: clientes.length,
      processados: 0,
      sucessos: 0,
      erros: 0,
      loginsSucesso: 0,
      loginsErro: 0,
      detalhes: []
    };

    // Atualizar 2Captcha API Key se configurada (para IBOPlayer)
    const apiKey = ConfigsModel.get2CaptchaKey();
    if (apiKey) {
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

    // Processar cada cliente
    for (const cliente of clientes) {
      resultado.processados++;
      
      try {
        const siteModules = modules[cliente.aplicativo];
        if (!siteModules) {
          throw new Error(`Aplicativo ${cliente.aplicativo} não suportado`);
        }

        let session = null;
        let precisouLogin = false;

        // Criar chave única para sessão deste cliente
        const sessionKey = `${cliente.aplicativo}-${cliente.id}`;
        const sessionManager = require('../lib/utils/session');

        // Tentar obter sessão existente
        try {
          session = await sessionManager.getSession(sessionKey);
        } catch (e) {
          session = null;
        }

        // Se não tem sessão ativa e auto-login está ativo, fazer login
        if (!session && autoLogin) {
          try {
            console.log(`[Troca DNS Massa] Cliente ${cliente.nome} (ID:${cliente.id}) sem sessão, fazendo login...`);
            
            if (cliente.aplicativo === 'iboplayer') {
              session = await siteModules.auth.login(cliente.dominio, cliente.mac, cliente.device_key);
            } else if (cliente.aplicativo === 'ibopro') {
              session = await siteModules.auth.login(cliente.mac, cliente.password);
            } else if (cliente.aplicativo === 'vuplayer') {
              session = await siteModules.auth.login(cliente.mac, cliente.device_key);
            }
            
            // Salvar sessão com chave única
            await sessionManager.saveSession(sessionKey, session);
            
            precisouLogin = true;
            resultado.loginsSucesso++;
            
            // Atualizar sincronização
            ClientesModel.updateSincronizacao(cliente.id);
            
            console.log(`[Troca DNS Massa] Login OK para ${cliente.nome} (ID:${cliente.id})`);
          } catch (loginError) {
            console.error(`[Troca DNS Massa] Erro no login de ${cliente.nome} (ID:${cliente.id}):`, loginError.message);
            resultado.loginsErro++;
            throw new Error(`Falha no login: ${loginError.message}`);
          }
        }

        // Verificar se conseguiu sessão
        if (!session) {
          throw new Error('Sessão não disponível e auto-login desabilitado');
        }

        // Listar playlists
        const playlists = await siteModules.playlist.listPlaylists(session);
        
        if (!Array.isArray(playlists) || playlists.length === 0) {
          throw new Error('Nenhuma playlist encontrada');
        }

        let playlistsAtualizadas = 0;
        let playlistsPuladas = 0;
        const errosPlaylist = [];

        // Processar cada playlist
        for (const pl of playlists) {
          try {
            const url = pl.url || pl.playlist_url;
            const name = pl.playlist_name || pl.name;
            const id = pl._id || pl.id;

            if (!url) {
              playlistsPuladas++;
              continue;
            }

            if (pl.is_protected) {
              playlistsPuladas++;
              continue;
            }

            // Trocar DNS
            const newUrl = DnsModel.replaceDomain(url, dns.url);
            
            if (!newUrl) {
              errosPlaylist.push(`${name}: Erro ao gerar URL`);
              continue;
            }

            // Verificar se já está usando o DNS correto
            if (url === newUrl) {
              playlistsPuladas++;
              continue;
            }

            // Atualizar playlist
            await siteModules.playlist.editPlaylist(session, id, {
              name,
              url: newUrl,
              protect: false,
              pin: ''
            });

            playlistsAtualizadas++;
            
            // Pequeno delay entre atualizações para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (playlistError) {
            errosPlaylist.push(`${pl.playlist_name || pl.name}: ${playlistError.message}`);
          }
        }

        // Salvar snapshot atualizado
        try {
          const playlistsAtualizados = await siteModules.playlist.listPlaylists(session);
          ClientesModel.savePlaylistsSnapshot(cliente.id, playlistsAtualizados);
        } catch (e) {
          console.error('Erro ao salvar snapshot:', e);
        }

        // Log de sucesso
        LogsModel.create({
          cliente_id: cliente.id,
          acao: 'troca_dns_massa',
          status: 'sucesso',
          mensagem: `${playlistsAtualizadas} playlist(s) atualizadas para ${dns.nome}${precisouLogin ? ' (login automático)' : ''}`,
          detalhes: { 
            playlistsAtualizadas,
            playlistsPuladas,
            errosPlaylist,
            precisouLogin,
            dns: dns.nome,
            grupoId 
          }
        });

        resultado.sucessos++;
        resultado.detalhes.push({
          cliente: cliente.nome,
          aplicativo: cliente.aplicativo,
          status: 'sucesso',
          precisouLogin,
          playlistsAtualizadas,
          playlistsPuladas,
          erros: errosPlaylist
        });

      } catch (error) {
        // Log de erro
        LogsModel.create({
          cliente_id: cliente.id,
          acao: 'troca_dns_massa',
          status: 'erro',
          mensagem: error.message,
          detalhes: { dns: dns.nome, grupoId }
        });

        resultado.erros++;
        resultado.detalhes.push({
          cliente: cliente.nome,
          aplicativo: cliente.aplicativo,
          status: 'erro',
          mensagem: error.message
        });
      }
    }

    res.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
