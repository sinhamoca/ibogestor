#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const sessionManager = require('./lib/utils/session');

// Importar módulos dos sites
const iboplayerAuth = require('./lib/sites/iboplayer/auth');
const iboplayerPlaylist = require('./lib/sites/iboplayer/playlist');
const iboproAuth = require('./lib/sites/ibopro/auth');
const iboproPlaylist = require('./lib/sites/ibopro/playlist');

// Mapeamento de sites
const SITES = {
  iboplayer: {
    auth: iboplayerAuth,
    playlist: iboplayerPlaylist,
    name: 'IBOPlayer'
  },
  ibopro: {
    auth: iboproAuth,
    playlist: iboproPlaylist,
    name: 'IBOPro'
  }
};

program
  .name('playlist-manager')
  .description('CLI para gerenciar playlists em múltiplos sites IPTV')
  .version('2.0.0');

// ========== COMANDO: iboplayer ==========
const iboplayerCmd = program.command('iboplayer').description('Comandos para IBOPlayer/BOBPlayer');

iboplayerCmd
  .command('login')
  .description('Fazer login no IBOPlayer')
  .requiredOption('-d, --domain <domain>', 'Domínio (ex: iboplayer.com, bobplayer.com)')
  .requiredOption('-m, --mac <mac>', 'Endereço MAC')
  .requiredOption('-k, --key <key>', 'Device Key')
  .action(async (options) => {
    try {
      const session = await iboplayerAuth.login(options.domain, options.mac, options.key);
      console.log(chalk.green('\n✅ Login realizado com sucesso!'));
      console.log(chalk.cyan('🌐 Domínio:'), session.domain);
      console.log(chalk.cyan('📅 Expira em:'), session.device.expire_date);
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error.message);
      process.exit(1);
    }
  });

iboplayerCmd
  .command('list')
  .description('Listar playlists')
  .action(async () => {
    try {
      const session = await iboplayerAuth.getSession();
      const playlists = await iboplayerPlaylist.listPlaylists(session);
      
      console.log(chalk.green('\n📋 Playlists:'), playlists.length);
      playlists.forEach((pl, i) => {
        console.log(chalk.cyan(`\n[${i + 1}] ${pl.playlist_name}`));
        console.log(chalk.gray('  ID:'), pl._id);
        if (pl.is_protected === 1) {
          console.log(chalk.yellow('  🔒 Protegida'));
        } else {
          console.log(chalk.gray('  URL:'), pl.url);
        }
      });
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error.message);
      process.exit(1);
    }
  });

iboplayerCmd
  .command('add')
  .description('Adicionar playlist')
  .requiredOption('-n, --name <name>', 'Nome da playlist')
  .requiredOption('-u, --url <url>', 'URL da playlist')
  .option('-p, --pin <pin>', 'PIN de proteção')
  .option('--protect', 'Proteger com PIN')
  .action(async (options) => {
    try {
      const session = await iboplayerAuth.getSession();
      const result = await iboplayerPlaylist.addPlaylist(session, options);
      console.log(chalk.green('\n✅ Playlist adicionada!'));
      console.log(chalk.cyan('ID:'), result._id);
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error.message);
      process.exit(1);
    }
  });

iboplayerCmd
  .command('edit')
  .description('Editar playlist')
  .requiredOption('-i, --id <id>', 'ID da playlist')
  .option('-n, --name <name>', 'Novo nome')
  .option('-u, --url <url>', 'Nova URL')
  .option('-p, --pin <pin>', 'Novo PIN')
  .option('--protect', 'Proteger')
  .option('--unprotect', 'Remover proteção')
  .action(async (options) => {
    try {
      const session = await iboplayerAuth.getSession();
      const playlists = await iboplayerPlaylist.listPlaylists(session);
      const current = playlists.find(p => p._id === options.id);
      
      if (!current) throw new Error('Playlist não encontrada');
      
      const editData = {
        name: options.name || current.playlist_name,
        url: options.url || current.url,
        pin: options.pin !== undefined ? options.pin : current.pin,
        protect: options.protect ? true : (options.unprotect ? false : current.is_protected === 1)
      };
      
      await iboplayerPlaylist.editPlaylist(session, options.id, editData);
      console.log(chalk.green('\n✅ Playlist editada!'));
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error.message);
      process.exit(1);
    }
  });

iboplayerCmd
  .command('delete')
  .description('Deletar playlist')
  .requiredOption('-i, --id <id>', 'ID da playlist')
  .option('-y, --yes', 'Confirmar automaticamente')
  .action(async (options) => {
    try {
      const session = await iboplayerAuth.getSession();
      
      if (!options.yes) {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        await new Promise((resolve) => {
          readline.question(chalk.yellow('Confirma exclusão? (s/N): '), (answer) => {
            readline.close();
            if (answer.toLowerCase() !== 's') {
              console.log(chalk.blue('Cancelado.'));
              process.exit(0);
            }
            resolve();
          });
        });
      }
      
      await iboplayerPlaylist.deletePlaylist(session, options.id);
      console.log(chalk.green('\n✅ Playlist deletada!'));
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error.message);
      process.exit(1);
    }
  });

// ========== COMANDO: ibopro ==========
const iboproCmd = program.command('ibopro').description('Comandos para IBOPro');

iboproCmd
  .command('login')
  .description('Fazer login no IBOPro')
  .requiredOption('-m, --mac <mac>', 'Endereço MAC')
  .requiredOption('-p, --password <password>', 'Senha')
  .action(async (options) => {
    try {
      const session = await iboproAuth.login(options.mac, options.password);
      console.log(chalk.green('\n✅ Login realizado com sucesso!'));
      console.log(chalk.cyan('🔑 MAC:'), session.macAddress);
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error.message);
      process.exit(1);
    }
  });

iboproCmd
  .command('list')
  .description('Listar playlists')
  .action(async () => {
    try {
      const session = await iboproAuth.getSession();
      const playlists = await iboproPlaylist.listPlaylists(session);
      
      // A API retorna array direto, não objeto com playlists dentro
      const playlistArray = Array.isArray(playlists) ? playlists : [];
      
      console.log(chalk.green('\n📋 Playlists:'), playlistArray.length);
      
      if (playlistArray.length === 0) {
        console.log(chalk.yellow('Nenhuma playlist encontrada.'));
        return;
      }
      
      playlistArray.forEach((pl, i) => {
        console.log(chalk.cyan(`\n[${i + 1}] ${pl.name}`));
        console.log(chalk.gray('  ID:'), pl.id);
        console.log(chalk.gray('  Tipo:'), pl.type);
        if (pl.is_protected) {
          console.log(chalk.yellow('  🔒 Protegida'));
        } else {
          console.log(chalk.gray('  URL:'), pl.url);
        }
        console.log(chalk.gray('  Criada:'), pl.created_at);
      });
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error.message);
      process.exit(1);
    }
  });

iboproCmd
  .command('add')
  .description('Adicionar playlist')
  .requiredOption('-n, --name <name>', 'Nome da playlist')
  .requiredOption('-u, --url <url>', 'URL da playlist')
  .option('-p, --pin <pin>', 'PIN de proteção')
  .option('--protect', 'Proteger com PIN')
  .action(async (options) => {
    try {
      const session = await iboproAuth.getSession();
      const result = await iboproPlaylist.addPlaylist(session, options);
      console.log(chalk.green('\n✅ Playlist adicionada!'));
      console.log(chalk.cyan('ID:'), result.id);
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error.message);
      process.exit(1);
    }
  });

iboproCmd
  .command('edit')
  .description('Editar playlist')
  .requiredOption('-i, --id <id>', 'ID da playlist')
  .option('-n, --name <name>', 'Novo nome')
  .option('-u, --url <url>', 'Nova URL')
  .option('-p, --pin <pin>', 'Novo PIN')
  .option('--protect', 'Proteger')
  .option('--unprotect', 'Remover proteção')
  .action(async (options) => {
    try {
      const session = await iboproAuth.getSession();
      const playlists = await iboproPlaylist.listPlaylists(session);
      const current = playlists.find(p => p.id === options.id);
      
      if (!current) throw new Error('Playlist não encontrada');
      
      const editData = {
        name: options.name || current.name,
        url: options.url || current.url,
        pin: options.pin !== undefined ? options.pin : '',
        protect: options.protect ? true : (options.unprotect ? false : current.is_protected)
      };
      
      await iboproPlaylist.editPlaylist(session, options.id, editData);
      console.log(chalk.green('\n✅ Playlist editada!'));
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error.message);
      process.exit(1);
    }
  });

iboproCmd
  .command('delete')
  .description('Deletar playlist')
  .requiredOption('-i, --id <id>', 'ID da playlist')
  .option('-p, --pin <pin>', 'PIN (se protegida)')
  .option('-y, --yes', 'Confirmar automaticamente')
  .action(async (options) => {
    try {
      const session = await iboproAuth.getSession();
      
      if (!options.yes) {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        await new Promise((resolve) => {
          readline.question(chalk.yellow('Confirma exclusão? (s/N): '), (answer) => {
            readline.close();
            if (answer.toLowerCase() !== 's') {
              console.log(chalk.blue('Cancelado.'));
              process.exit(0);
            }
            resolve();
          });
        });
      }
      
      await iboproPlaylist.deletePlaylist(session, options.id, options.pin);
      console.log(chalk.green('\n✅ Playlist deletada!'));
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error.message);
      process.exit(1);
    }
  });

// ========== COMANDO GLOBAL: sessions ==========
program
  .command('sessions')
  .description('Ver todas as sessões ativas')
  .action(async () => {
    try {
      const sessions = await sessionManager.listActiveSessions();
      
      if (sessions.length === 0) {
        console.log(chalk.yellow('\nNenhuma sessão ativa.'));
        return;
      }
      
      console.log(chalk.green('\n📱 Sessões Ativas:\n'));
      sessions.forEach((s, i) => {
        console.log(chalk.cyan(`[${i + 1}] ${SITES[s.site].name}`));
        if (s.domain) console.log(chalk.gray('    Domínio:'), s.domain);
        if (s.macAddress) console.log(chalk.gray('    MAC:'), s.macAddress);
        console.log(chalk.gray('    Login:'), new Date(s.loginTime).toLocaleString('pt-BR'));
      });
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
