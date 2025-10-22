#!/usr/bin/env node

const https = require('https');
const { URLSearchParams } = require('url');
const fs = require('fs');
const path = require('path');

// Arquivo para salvar a sessão
const SESSION_FILE = path.join(__dirname, '.session.json');

/**
 * Salva sessão em arquivo
 */
function salvarSessao(cookie, mac, deviceKey) {
    const sessao = {
        cookie: cookie,
        mac: mac,
        deviceKey: deviceKey,
        timestamp: new Date().toISOString()
    };
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessao, null, 2));
}

/**
 * Carrega sessão do arquivo
 */
function carregarSessao() {
    try {
        if (fs.existsSync(SESSION_FILE)) {
            const data = fs.readFileSync(SESSION_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        return null;
    }
    return null;
}

/**
 * Remove sessão
 */
function limparSessao() {
    if (fs.existsSync(SESSION_FILE)) {
        fs.unlinkSync(SESSION_FILE);
    }
}

/**
 * Função para fazer login
 */
async function fazerLogin(macAddress, deviceKey) {
    return new Promise((resolve, reject) => {
        const params = new URLSearchParams({
            mac_address: macAddress,
            device_key: deviceKey,
            submit: ''
        });

        const postData = params.toString();

        const options = {
            hostname: 'vuproplayer.org',
            port: 443,
            path: '/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                'Referer': 'https://vuproplayer.org/login',
                'Origin': 'https://vuproplayer.org'
            }
        };

        const req = https.request(options, (res) => {
            let cookies = [];

            if (res.headers['set-cookie']) {
                cookies = res.headers['set-cookie'];
            }

            res.on('data', () => {});
            res.on('end', () => {
                if (res.statusCode === 302 && cookies.length > 0) {
                    const cookie = cookies[0].split(';')[0];
                    resolve(cookie);
                } else {
                    reject(new Error('Login falhou'));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * Função para buscar as playlists
 */
async function buscarPlaylists(cookie) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'vuproplayer.org',
            port: 443,
            path: '/mylist',
            method: 'GET',
            headers: {
                'Cookie': cookie,
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                'Referer': 'https://vuproplayer.org/login'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            const encoding = res.headers['content-encoding'];
            let stream = res;

            if (encoding === 'br') {
                const zlib = require('zlib');
                stream = res.pipe(zlib.createBrotliDecompress());
            } else if (encoding === 'gzip' || encoding === 'deflate') {
                const zlib = require('zlib');
                stream = res.pipe(zlib.createUnzip());
            }

            stream.on('data', (chunk) => {
                data += chunk.toString();
            });

            stream.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error('Erro ao buscar playlists'));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

/**
 * Extrai informações das playlists do HTML
 */
function extrairPlaylists(html) {
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
            nome: match[1].trim(),
            url: match[2].trim(),
            id: match[3].trim(),
            protegida: match[4] === '1',
            tipo: match[5].trim() || 'general'
        });
    }
    
    return playlists;
}

/**
 * Editar playlist
 */
async function editarPlaylist(cookie, playlistId, nome, url, protegida = false, pin = '', tipo = 'general') {
    return new Promise((resolve, reject) => {
        const params = new URLSearchParams({
            current_playlist_url_id: playlistId,
            playlist_name: nome,
            playlist_url: url,
            protect: protegida ? '1' : '0',
            pin: pin,
            playlist_type: tipo,
            user_name: '',
            password: ''
        });

        const postData = params.toString();

        const options = {
            hostname: 'vuproplayer.org',
            port: 443,
            path: '/savePlaylist',
            method: 'POST',
            headers: {
                'Cookie': cookie,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                'Referer': 'https://vuproplayer.org/mylist',
                'Origin': 'https://vuproplayer.org'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.status === 'success') {
                        resolve(response);
                    } else {
                        reject(new Error(response.msg || 'Erro ao editar playlist'));
                    }
                } catch (error) {
                    reject(new Error('Erro ao processar resposta'));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * Deletar playlist
 */
async function deletarPlaylist(cookie, playlistId) {
    return new Promise((resolve, reject) => {
        const params = new URLSearchParams({
            playlist_url_id: playlistId
        });

        const postData = params.toString();

        const options = {
            hostname: 'vuproplayer.org',
            port: 443,
            path: '/deletePlayListUrl',
            method: 'DELETE',
            headers: {
                'Cookie': cookie,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                'Referer': 'https://vuproplayer.org/mylist',
                'Origin': 'https://vuproplayer.org'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.status === 'success') {
                        resolve(response);
                    } else {
                        reject(new Error('Erro ao deletar playlist'));
                    }
                } catch (error) {
                    reject(new Error('Erro ao processar resposta'));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * Comandos CLI
 */
async function comandoLogin(mac, deviceKey) {
    console.log('⏳ Fazendo login...');
    try {
        const cookie = await fazerLogin(mac, deviceKey);
        salvarSessao(cookie, mac, deviceKey);
        console.log('✅ Login realizado com sucesso!');
        console.log('📝 Sessão salva. Você pode usar os outros comandos agora.');
    } catch (error) {
        console.error('❌ Erro no login:', error.message);
        process.exit(1);
    }
}

async function comandoList() {
    const sessao = carregarSessao();
    if (!sessao) {
        console.error('❌ Sessão não encontrada. Faça login primeiro com: node login-test.js login <mac> <key>');
        process.exit(1);
    }

    console.log('⏳ Buscando playlists...');
    try {
        const html = await buscarPlaylists(sessao.cookie);
        const playlists = extrairPlaylists(html);
        
        if (playlists.length === 0) {
            console.log('⚠️  Nenhuma playlist encontrada');
            return;
        }
        
        console.log(`\n✅ ${playlists.length} playlist(s) encontrada(s):\n`);
        console.log('═'.repeat(100));
        
        playlists.forEach((pl, index) => {
            console.log(`\n📺 Playlist #${index + 1}`);
            console.log(`   Nome: ${pl.nome}`);
            console.log(`   URL: ${pl.url}`);
            console.log(`   ID: ${pl.id}`);
            console.log(`   Tipo: ${pl.tipo}`);
            console.log(`   Protegida: ${pl.protegida ? 'Sim' : 'Não'}`);
        });
        
        console.log('\n' + '═'.repeat(100));
    } catch (error) {
        console.error('❌ Erro ao listar playlists:', error.message);
        process.exit(1);
    }
}

async function comandoEdit(id, nome, url) {
    const sessao = carregarSessao();
    if (!sessao) {
        console.error('❌ Sessão não encontrada. Faça login primeiro.');
        process.exit(1);
    }

    console.log('⏳ Editando playlist...');
    try {
        const resultado = await editarPlaylist(sessao.cookie, id, nome, url);
        console.log('✅', resultado.msg);
        console.log('📝 Dados atualizados:');
        console.log(`   Nome: ${resultado.data.playlist_name}`);
        console.log(`   URL: ${resultado.data.url}`);
        console.log(`   ID: ${resultado.data._id}`);
    } catch (error) {
        console.error('❌ Erro ao editar:', error.message);
        process.exit(1);
    }
}

async function comandoDelete(id) {
    const sessao = carregarSessao();
    if (!sessao) {
        console.error('❌ Sessão não encontrada. Faça login primeiro.');
        process.exit(1);
    }

    console.log('⏳ Deletando playlist...');
    try {
        await deletarPlaylist(sessao.cookie, id);
        console.log('✅ Playlist deletada com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao deletar:', error.message);
        process.exit(1);
    }
}

function comandoLogout() {
    limparSessao();
    console.log('✅ Sessão encerrada com sucesso!');
}

function comandoStatus() {
    const sessao = carregarSessao();
    if (!sessao) {
        console.log('❌ Nenhuma sessão ativa');
        console.log('   Use: node login-test.js login <mac> <key>');
        return;
    }
    
    console.log('✅ Sessão ativa');
    console.log(`   MAC: ${sessao.mac}`);
    console.log(`   Device Key: ${sessao.deviceKey}`);
    console.log(`   Login em: ${new Date(sessao.timestamp).toLocaleString('pt-BR')}`);
}

function exibirAjuda() {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║          VU PLAYER PRO - GERENCIADOR CLI                       ║
╚════════════════════════════════════════════════════════════════╝

📋 COMANDOS DISPONÍVEIS:

  login <mac> <key>           Faz login e salva a sessão
  list                        Lista todas as playlists
  edit <id> <nome> <url>      Edita uma playlist
  delete <id>                 Deleta uma playlist
  status                      Mostra status da sessão atual
  logout                      Encerra a sessão atual
  help                        Mostra esta ajuda

📝 EXEMPLOS:

  node login-test.js login a2:ac:6e:2f:54:b0 282651
  node login-test.js list
  node login-test.js edit 68f43cdfd1c8aa409c06ecd3 "Minha Playlist" "http://url.com"
  node login-test.js delete 68f43cdfd1c8aa409c06ecd3
  node login-test.js status
  node login-test.js logout

`);
}

/**
 * Main
 */
async function main() {
    const args = process.argv.slice(2);
    const comando = args[0];

    if (!comando || comando === 'help') {
        exibirAjuda();
        return;
    }

    switch (comando) {
        case 'login':
            if (args.length < 3) {
                console.error('❌ Uso: node login-test.js login <mac> <key>');
                process.exit(1);
            }
            await comandoLogin(args[1], args[2]);
            break;

        case 'list':
            await comandoList();
            break;

        case 'edit':
            if (args.length < 4) {
                console.error('❌ Uso: node login-test.js edit <id> <nome> <url>');
                process.exit(1);
            }
            await comandoEdit(args[1], args[2], args[3]);
            break;

        case 'delete':
            if (args.length < 2) {
                console.error('❌ Uso: node login-test.js delete <id>');
                process.exit(1);
            }
            await comandoDelete(args[1]);
            break;

        case 'logout':
            comandoLogout();
            break;

        case 'status':
            comandoStatus();
            break;

        default:
            console.error(`❌ Comando desconhecido: ${comando}`);
            console.log('   Use: node login-test.js help');
            process.exit(1);
    }
}

main();
