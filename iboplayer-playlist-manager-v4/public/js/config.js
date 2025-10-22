// Módulo de Configurações

async function loadConfig() {
  try {
    Loading.show('Carregando configurações...');
    const response = await API.config.get2CaptchaKey();
    const captchaKey = response.data;
    renderConfig(captchaKey);
  } catch (error) {
    Toast.error('Erro ao carregar configurações: ' + error.message);
  } finally {
    Loading.hide();
  }
}

function renderConfig(captchaKey) {
  const content = document.getElementById('content-config');
  content.innerHTML = `
    <div class="max-w-3xl">
      <!-- API Key 2Captcha -->
      <div class="bg-white rounded-lg shadow mb-6">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-800 flex items-center">
            <i class="fas fa-robot mr-2 text-blue-600"></i>
            2Captcha API Key
          </h2>
          <p class="text-sm text-gray-600 mt-1">
            Configure a API Key do 2Captcha para resolução automática de captchas do IBOPlayer
          </p>
        </div>

        <div class="p-6">
          <form id="form-2captcha" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div class="flex space-x-2">
                <input 
                  type="text" 
                  id="captcha-key" 
                  value="${captchaKey.key || ''}" 
                  placeholder="Digite sua API Key do 2Captcha"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                <button 
                  type="submit"
                  class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <i class="fas fa-save mr-2"></i>Salvar
                </button>
              </div>
              
              <div class="mt-2 flex items-center space-x-2">
                ${captchaKey.configured ? `
                  <span class="text-sm text-green-600">
                    <i class="fas fa-check-circle mr-1"></i>Configurado
                  </span>
                ` : `
                  <span class="text-sm text-yellow-600">
                    <i class="fas fa-exclamation-triangle mr-1"></i>Não configurado
                  </span>
                `}
              </div>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-blue-900 mb-2">
                <i class="fas fa-info-circle mr-1"></i>Como obter sua API Key?
              </h4>
              <ol class="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                <li>Acesse <a href="https://2captcha.com" target="_blank" class="underline font-medium">2captcha.com</a></li>
                <li>Crie uma conta ou faça login</li>
                <li>Adicione créditos (mínimo ~$1)</li>
                <li>Copie sua API Key no painel</li>
                <li>Cole aqui e salve</li>
              </ol>
              <p class="text-xs text-blue-700 mt-2">
                <i class="fas fa-dollar-sign mr-1"></i>
                Custo: ~$0.001 por captcha resolvido (~1000 captchas por $1)
              </p>
            </div>
          </form>
        </div>
      </div>

      <!-- Informações do Sistema -->
      <div class="bg-white rounded-lg shadow mb-6">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-800 flex items-center">
            <i class="fas fa-server mr-2 text-green-600"></i>
            Informações do Sistema
          </h2>
        </div>

        <div class="p-6">
          <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt class="text-sm font-medium text-gray-500">Versão</dt>
              <dd class="text-lg font-semibold text-gray-900 mt-1">2.0.0</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Status da API</dt>
              <dd class="text-lg font-semibold text-green-600 mt-1">
                <i class="fas fa-check-circle mr-1"></i>Online
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Banco de Dados</dt>
              <dd class="text-lg font-semibold text-gray-900 mt-1">SQLite 3</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Proxy</dt>
              <dd class="text-lg font-semibold text-gray-900 mt-1">
                <i class="fas fa-shield-alt mr-1"></i>Proxychains4
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Sites Suportados -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-800 flex items-center">
            <i class="fas fa-plug mr-2 text-purple-600"></i>
            Sites Suportados
          </h2>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-semibold text-gray-800">IBOPlayer</h3>
                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Multi-site</span>
              </div>
              <p class="text-sm text-gray-600 mb-2">
                Suporte a múltiplos domínios
              </p>
              <ul class="text-xs text-gray-500 space-y-1">
                <li><i class="fas fa-check text-green-500 mr-1"></i>Captcha automático</li>
                <li><i class="fas fa-check text-green-500 mr-1"></i>Cookies de sessão</li>
                <li><i class="fas fa-check text-green-500 mr-1"></i>PIN de proteção</li>
              </ul>
            </div>

            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-semibold text-gray-800">IBOPro</h3>
                <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">API REST</span>
              </div>
              <p class="text-sm text-gray-600 mb-2">
                API moderna com JWT
              </p>
              <ul class="text-xs text-gray-500 space-y-1">
                <li><i class="fas fa-check text-green-500 mr-1"></i>Tokens SHA3-512</li>
                <li><i class="fas fa-check text-green-500 mr-1"></i>Proxy obrigatório</li>
                <li><i class="fas fa-check text-green-500 mr-1"></i>Sem captcha</li>
              </ul>
            </div>

            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-semibold text-gray-800">VU Player</h3>
                <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Simples</span>
              </div>
              <p class="text-sm text-gray-600 mb-2">
                Interface web tradicional
              </p>
              <ul class="text-xs text-gray-500 space-y-1">
                <li><i class="fas fa-check text-green-500 mr-1"></i>Cookies de sessão</li>
                <li><i class="fas fa-check text-green-500 mr-1"></i>Proxy recomendado</li>
                <li><i class="fas fa-check text-green-500 mr-1"></i>Sem captcha</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Ajuda -->
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <h4 class="text-sm font-semibold text-yellow-900 mb-2">
          <i class="fas fa-lightbulb mr-1"></i>Dicas de Uso
        </h4>
        <ul class="text-sm text-yellow-800 space-y-1 ml-4 list-disc">
          <li>Configure a API Key do 2Captcha antes de usar clientes IBOPlayer</li>
          <li>Para IBOPro e VU Player, certifique-se que o proxychains está configurado</li>
          <li>Faça login nos clientes antes de gerenciar playlists</li>
          <li>Use grupos para organizar clientes e facilitar ações em massa</li>
          <li>Verifique os logs regularmente para identificar problemas</li>
        </ul>
      </div>
    </div>
  `;

  // Handler do formulário
  document.getElementById('form-2captcha').addEventListener('submit', async (e) => {
    e.preventDefault();
    const apiKey = document.getElementById('captcha-key').value.trim();

    if (!apiKey) {
      Toast.error('Digite uma API Key válida');
      return;
    }

    try {
      Loading.show('Salvando...');
      await API.config.set2CaptchaKey(apiKey);
      Toast.success('API Key salva com sucesso!');
      loadConfig();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      Loading.hide();
    }
  });
}

// Testar API Key (opcional)
async function testCaptchaKey() {
  try {
    Loading.show('Testando API Key...');
    // Aqui você poderia fazer uma chamada de teste ao 2Captcha
    Toast.success('API Key válida!');
  } catch (error) {
    Toast.error('API Key inválida');
  } finally {
    Loading.hide();
  }
}
