# Multi-Site IPTV Playlist Manager

Sistema CLI modular e escalável para gerenciar playlists em múltiplos sites IPTV de forma automatizada.

## 🎯 Objetivo

Automatizar o gerenciamento de playlists em 500+ clientes, eliminando trabalho manual repetitivo através de um sistema unificado que suporta múltiplos sites IPTV com diferentes métodos de autenticação.

---

## 📁 Estrutura Completa do Projeto

```
iboplayer-playlist-manager/
├── app.js                              # CLI principal unificado
├── package.json                        # Dependências do projeto
├── README.md                           # Documentação (este arquivo)
│
├── lib/                                # Bibliotecas do projeto
│   ├── sites/                          # Módulos específicos por site
│   │   ├── iboplayer/                  # IBOPlayer/BOBPlayer
│   │   │   ├── auth.js                 # Autenticação com captcha
│   │   │   └── playlist.js             # CRUD de playlists
│   │   │
│   │   └── ibopro/                     # IBOPro
│   │       ├── auth.js                 # Autenticação JWT + SHA3-512
│   │       └── playlist.js             # CRUD de playlists
│   │
│   └── utils/                          # Utilitários compartilhados
│       ├── captcha.js                  # Resolução de captcha (2Captcha)
│       └── session.js                  # Gerenciamento de sessões
│
└── .sessions/                          # Sessões salvas (auto-criado)
    ├── iboplayer.json                  # Sessão do IBOPlayer
    └── ibopro.json                     # Sessão do IBOPro
```

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18.x ou superior
- npm 9.x ou superior
- (Opcional) Proxychains configurado com proxy residencial BR

### Passos

```bash
# 1. Clone ou crie o projeto
mkdir iboplayer-playlist-manager
cd iboplayer-playlist-manager

# 2. Crie a estrutura de pastas
mkdir -p lib/sites/iboplayer lib/sites/ibopro lib/utils .sessions

# 3. Copie todos os arquivos do projeto para suas respectivas pastas

# 4. Instale as dependências
npm install

# 5. (Opcional) Adicione .sessions ao .gitignore
echo ".sessions/" >> .gitignore
```

---

## 📦 Dependências

```json
{
  "axios": "^1.6.2",           // Cliente HTTP
  "commander": "^11.1.0",      // Framework CLI
  "form-data": "^4.0.0",       // Envio de formulários
  "sharp": "^0.33.0",          // Conversão de imagens (SVG → PNG)
  "chalk": "^4.1.2",           // Cores no terminal
  "js-sha3": "^0.9.3"          // Hash SHA3-512 para IBOPro
}
```

---

## 🌐 Sites Suportados

### 1. IBOPlayer / BOBPlayer

**Características:**
- Suporta múltiplos domínios (iboplayer.com, bobplayer.com, etc)
- Autenticação via MAC Address + Device Key
- **Captcha SVG resolvido automaticamente** via 2Captcha (~$0.001 por login)
- Cookies de sessão (express:sess)

**Tecnologias:**
- Captcha: SVG com atributos duplicados → PNG → 2Captcha
- Sessão: Cookies HTTP
- API: `/frontend/*`

### 2. IBOPro

**Características:**
- API REST moderna (api.iboproapp.com)
- Autenticação via MAC Address + Password
- **Sem captcha** ✅
- **Requer tokens customizados SHA3-512 em TODAS as requisições**
- JWT Token (validade ~10 dias)

**Tecnologias:**
- Tokens customizados: 6 tokens SHA3-512 gerados dinamicamente
- Sessão: JWT Bearer Token
- API: `/auth/*`, `/playlistw`
- **IMPORTANTE:** Requer proxy residencial BR (Cloudflare bloqueia VPS)

**Estrutura dos Tokens IBOPro:**

```javascript
X-Gc-Token:  SHA3-512(mac + timestamp + 2*timestamp)
x-hash:      SHA3-512(mac + "___" + password)
x-hash-2:    SHA3-512(mac + "___" + password + "__" + timestamp)
x-token:     SHA3-512(mac + timestamp)
x-token-2:   SHA3-512(mac)
x-token-3:   Base64(mac) com codificação especial F()
```

**Funções de codificação:**
- `F(t)`: Adiciona "iBo" e "PrO" em posições específicas
- `T(t)`: Aplica F() → Base64 → F() novamente
- `L(e)`: Gera hash SHA3-512 com timestamp

---

## 📖 Comandos Completos

### Comandos Globais

#### Ver todas as sessões ativas
```bash
node app.js sessions
```

Mostra todas as sessões ativas de todos os sites.

---

## 🎯 IBOPlayer / BOBPlayer

### Login
```bash
node app.js iboplayer login -d <dominio> -m <mac> -k <device_key>
```

**Parâmetros:**
- `-d, --domain` - Domínio (iboplayer.com, bobplayer.com, etc)
- `-m, --mac` - Endereço MAC do dispositivo
- `-k, --key` - Device Key

**Exemplos:**
```bash
node app.js iboplayer login -d iboplayer.com -m "b3:fd:13:34:c8:61" -k "420889"
node app.js iboplayer login -d bobplayer.com -m "00:c3:f4:65:69:a1" -k "388785"
```

**O que acontece:**
1. Obtém captcha SVG do servidor
2. Limpa SVG (remove atributos duplicados)
3. Converte SVG → PNG
4. Envia para 2Captcha resolver (~10-30 segundos)
5. Faz login com captcha resolvido
6. Salva cookies de sessão

### Listar Playlists
```bash
node app.js iboplayer list
```

### Adicionar Playlist
```bash
# Playlist simples
node app.js iboplayer add -n "Nome" -u "https://url.m3u"

# Playlist protegida com PIN
node app.js iboplayer add -n "Nome VIP" -u "https://url.m3u" --protect -p "1234"
```

**Parâmetros:**
- `-n, --name` - Nome da playlist (obrigatório)
- `-u, --url` - URL da playlist M3U (obrigatório)
- `-p, --pin` - PIN de proteção (opcional)
- `--protect` - Ativar proteção com PIN
- `-t, --type` - Tipo da playlist (default: general)

### Editar Playlist
```bash
# Editar nome
node app.js iboplayer edit -i "68f3a0e4..." -n "Novo Nome"

# Editar URL
node app.js iboplayer edit -i "68f3a0e4..." -u "https://nova-url.m3u"

# Adicionar proteção
node app.js iboplayer edit -i "68f3a0e4..." --protect -p "senha123"

# Remover proteção
node app.js iboplayer edit -i "68f3a0e4..." --unprotect
```

**Nota:** Se não passar um parâmetro, mantém o valor atual.

### Deletar Playlist
```bash
# Com confirmação
node app.js iboplayer delete -i "68f3a0e4..."

# Sem confirmação
node app.js iboplayer delete -i "68f3a0e4..." -y
```

---

## 🎯 IBOPro

**⚠️ IMPORTANTE:** IBOPro requer proxy devido ao bloqueio Cloudflare de VPS (ASN 51167 bloqueado).

### Login
```bash
proxychains node app.js ibopro login -m <mac> -p <password>
```

**Parâmetros:**
- `-m, --mac` - Endereço MAC
- `-p, --password` - Senha do dispositivo

**Exemplo:**
```bash
proxychains node app.js ibopro login -m "60:45:0a:60:91:04" -p "601825"
```

**O que acontece:**
1. Gera 6 tokens customizados SHA3-512
2. Envia requisição POST /auth/login
3. Recebe JWT token (válido por ~10 dias)
4. Salva sessão com MAC + password (necessário para gerar tokens depois)

### Listar Playlists
```bash
proxychains node app.js ibopro list
```

**Nota:** Gera novos tokens SHA3-512 a cada requisição.

### Adicionar Playlist
```bash
# Playlist simples
proxychains node app.js ibopro add -n "Nome" -u "https://url.m3u"

# Playlist protegida
proxychains node app.js ibopro add -n "VIP" -u "https://url.m3u" --protect -p "1234"
```

### Editar Playlist
```bash
proxychains node app.js ibopro edit -i "68f42166..." -n "Novo Nome"
proxychains node app.js ibopro edit -i "68f42166..." --protect -p "senha"
```

### Deletar Playlist
```bash
# Playlist sem proteção
proxychains node app.js ibopro delete -i "68f42166..." -y

# Playlist protegida (precisa do PIN)
proxychains node app.js ibopro delete -i "68f42166..." -p "1234" -y
```

---

## 🔄 Fluxos de Uso Completos

### Workflow: IBOPlayer

```bash
# 1. Login
node app.js iboplayer login -d iboplayer.com -m "xx:xx:xx:xx:xx:xx" -k "123456"

# 2. Ver status
node app.js sessions

# 3. Listar playlists existentes
node app.js iboplayer list

# 4. Adicionar nova playlist
node app.js iboplayer add -n "Minha Lista" -u "https://exemplo.com/lista.m3u"

# 5. Editar (pegue o ID do comando list)
node app.js iboplayer edit -i "68f3a0e4..." -n "Lista Atualizada"

# 6. Deletar
node app.js iboplayer delete -i "68f3a0e4..." -y

# 7. Trocar de domínio (fazer novo login)
node app.js iboplayer login -d bobplayer.com -m "aa:bb:cc:dd:ee:ff" -k "999999"
```

### Workflow: IBOPro

```bash
# 1. Login (via proxy)
proxychains node app.js ibopro login -m "60:45:0a:60:91:04" -p "601825"

# 2. Listar playlists
proxychains node app.js ibopro list

# 3. Adicionar playlist
proxychains node app.js ibopro add -n "Teste" -u "https://exemplo.com/teste.m3u"

# 4. Editar
proxychains node app.js ibopro edit -i "68f42166..." -n "Teste Editado"

# 5. Deletar
proxychains node app.js ibopro delete -i "68f42166..." -y
```

---

## 🔐 Segurança e Sessões

### Armazenamento de Sessões

As sessões são salvas em `.sessions/` com estrutura JSON:

**IBOPlayer:**
```json
{
  "site": "iboplayer",
  "domain": "iboplayer.com",
  "macAddress": "b3:fd:13:34:c8:61",
  "deviceKey": "420889",
  "deviceId": "68cc2a35bba6e7de42da61d1",
  "cookies": ["express:sess=...", "express:sess.sig=..."],
  "loginTime": "2025-10-18T15:09:00.000Z",
  "device": {...}
}
```

**IBOPro:**
```json
{
  "site": "ibopro",
  "macAddress": "60:45:0a:60:91:04",
  "password": "601825",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "loginTime": "2025-10-18T21:55:11.000Z",
  "message": "Login success!"
}
```

### Boas Práticas

1. **Nunca commite `.sessions/`** - Adicione ao `.gitignore`
2. **Renovação de sessões** - IBOPlayer expira conforme servidor, IBOPro ~10 dias
3. **Proxy para IBOPro** - Sempre use `proxychains` para evitar bloqueio Cloudflare
4. **Custo 2Captcha** - ~$0.001 por login do IBOPlayer

---

## ⚙️ Configuração de Proxy (IBOPro)

### Instalar Proxychains

```bash
# Ubuntu/Debian
sudo apt-get install proxychains4

# Editar configuração
sudo nano /etc/proxychains4.conf
```

### Configurar Proxy

No final do arquivo `/etc/proxychains4.conf`:

```
[ProxyList]
# Exemplo: SOCKS5
socks5 IP_DO_PROXY PORTA USUARIO SENHA

# Exemplo: HTTP
http IP_DO_PROXY PORTA USUARIO SENHA
```

### Testar Proxy

```bash
# Verificar IP sem proxy
curl https://api.ipify.org

# Verificar IP com proxy (deve ser diferente)
proxychains curl https://api.ipify.org
```

---

## 🚧 Limitações Conhecidas

### IBOPlayer
- ✅ Playlists protegidas ocultam dados na listagem
- ✅ Custo de ~$0.001 por login (2Captcha)
- ✅ Sessão pode expirar (precisa fazer login novamente)

### IBOPro
- ⚠️ **Bloqueio Cloudflare em VPS** - ASN 51167 banido, proxy obrigatório
- ✅ Tokens SHA3-512 necessários em TODAS as requisições
- ✅ Password precisa ser salvo na sessão (para gerar tokens depois)
- ✅ Token JWT expira em ~10 dias

---

## 🎯 Roadmap Futuro

### Próximas Funcionalidades

- [ ] **Processamento em lote** - Login/gerenciamento de 500+ clientes simultaneamente
- [ ] **API REST** - Servidor Express.js com endpoints
- [ ] **Dashboard Web** - Interface visual React/Vue
- [ ] **Banco de dados** - PostgreSQL/MongoDB para clientes
- [ ] **Auto-renovação** - Renovar tokens antes de expirar
- [ ] **Webhooks** - Notificações de eventos
- [ ] **Logs estruturados** - Sistema de logging completo
- [ ] **Testes automatizados** - Jest/Mocha
- [ ] **Docker** - Containerização do projeto

### Adicionar Novos Sites

Para adicionar suporte a um novo site IPTV:

1. Crie `lib/sites/novosite/auth.js`:
   ```javascript
   module.exports = {
     login(credentials) { ... },
     getSession() { ... },
     clearSession() { ... }
   }
   ```

2. Crie `lib/sites/novosite/playlist.js`:
   ```javascript
   module.exports = {
     listPlaylists(session) { ... },
     addPlaylist(session, data) { ... },
     editPlaylist(session, id, data) { ... },
     deletePlaylist(session, id) { ... }
   }
   ```

3. Adicione no `app.js`:
   ```javascript
   const SITES = {
     iboplayer: { ... },
     ibopro: { ... },
     novosite: {
       auth: require('./lib/sites/novosite/auth'),
       playlist: require('./lib/sites/novosite/playlist'),
       name: 'NovoSite'
     }
   };
   ```

4. Crie os comandos CLI no `app.js`

---

## 🐛 Troubleshooting

### Erro 403 no IBOPro
**Causa:** Cloudflare bloqueando VPS  
**Solução:** Use `proxychains` com proxy residencial BR

### Erro "Invalid token!" no IBOPro
**Causa:** Password não salvo na sessão ou tokens não sendo gerados  
**Solução:** Faça login novamente e certifique-se que `password` está na sessão

### Captcha não resolve no IBOPlayer
**Causa:** Saldo insuficiente no 2Captcha ou API key inválida  
**Solução:** Verifique saldo em https://2captcha.com e API key em `lib/utils/captcha.js`

### Erro "js-sha3 não encontrado"
**Causa:** Dependência não instalada  
**Solução:** `npm install js-sha3`

### Sessão expirada
**Causa:** Sessão antiga ou token expirado  
**Solução:** Faça login novamente

---

## 📄 Licença

MIT License - Livre para uso pessoal e comercial.

---

## 👨‍💻 Suporte

Para dúvidas ou problemas:
1. Verifique a seção Troubleshooting
2. Revise os logs de erro
3. Teste com `debug-*.js` scripts

---

## 📊 Estatísticas do Projeto

- **Linhas de código:** ~1500
- **Arquivos:** 10
- **Sites suportados:** 2 (IBOPlayer/BOBPlayer, IBOPro)
- **Operações:** Login, Listar, Adicionar, Editar, Deletar
- **Autenticação:** Cookies, JWT, SHA3-512

---

**Desenvolvido para automação eficiente de gerenciamento de playlists IPTV** 🚀
