// Módulo de Grupos

async function loadGrupos() {
  try {
    Loading.show('Carregando grupos...');
    const response = await API.grupos.getAll();
    const grupos = response.data;
    renderGrupos(grupos);
  } catch (error) {
    Toast.error('Erro ao carregar grupos: ' + error.message);
  } finally {
    Loading.hide();
  }
}

function renderGrupos(grupos) {
  const content = document.getElementById('content-grupos');
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow">
      <div class="p-6 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-800">Grupos</h2>
          <button onclick="showGrupoModal()" 
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-plus mr-2"></i>Novo Grupo
          </button>
        </div>
      </div>

      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${grupos.map(grupo => `
            <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
              <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-semibold text-gray-800">${grupo.nome}</h3>
                <div class="flex space-x-2">
                  <button onclick="showGrupoModal(${grupo.id})" title="Editar"
                          class="text-yellow-600 hover:text-yellow-800">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="deleteGrupo(${grupo.id}, '${grupo.nome}', ${grupo.total_clientes})" title="Deletar"
                          class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              
              <p class="text-sm text-gray-600 mb-3">${grupo.descricao || 'Sem descrição'}</p>
              
              <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                <span class="text-sm text-gray-500">
                  <i class="fas fa-users mr-1"></i>
                  ${grupo.total_clientes} cliente(s)
                </span>
                <div class="flex items-center space-x-2">
                  <button onclick="showBulkDnsChangeModal(${grupo.id}, '${grupo.nome.replace(/'/g, "\\'")}')" 
                          title="Trocar DNS em Massa"
                          class="text-purple-600 hover:text-purple-800 transition">
                    <i class="fas fa-exchange-alt"></i>
                  </button>
                  <button onclick="showGrupoModal(${grupo.id})" title="Editar"
                          class="text-yellow-600 hover:text-yellow-800">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="deleteGrupo(${grupo.id}, '${grupo.nome}', ${grupo.total_clientes})" title="Deletar"
                          class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        ${grupos.length === 0 ? `
          <div class="text-center py-12 text-gray-500">
            <i class="fas fa-folder-open text-5xl mb-4"></i>
            <p>Nenhum grupo cadastrado</p>
            <button onclick="showGrupoModal()" class="mt-4 text-blue-600 hover:text-blue-800">
              Criar primeiro grupo
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

async function deleteGrupo(id, nome, totalClientes) {
  if (totalClientes > 0) {
    Toast.error(`Não é possível deletar "${nome}" pois existem ${totalClientes} cliente(s) vinculado(s)`);
    return;
  }

  confirm(
    `Tem certeza que deseja deletar o grupo "${nome}"?`,
    async function() {
      try {
        Loading.show('Deletando...');
        await API.grupos.delete(id);
        Toast.success('Grupo deletado!');
        loadGrupos();
      } catch (error) {
        Toast.error(error.message);
      } finally {
        Loading.hide();
      }
    }
  );
}

// Modal de Troca DNS em Massa
async function showBulkDnsChangeModal(grupoId, grupoNome) {
  let dnsList;
  
  try {
    Loading.show('Carregando...');
    dnsList = (await API.dns.getAll(true)).data;
  } catch (error) {
    Toast.error('Erro ao carregar DNS');
    Loading.hide();
    return;
  } finally {
    Loading.hide();
  }

  if (dnsList.length === 0) {
    Toast.warning('Nenhum DNS cadastrado. Cadastre DNS primeiro na aba DNS.');
    return;
  }

  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 class="text-2xl font-bold mb-4 flex items-center">
          <i class="fas fa-exchange-alt text-purple-600 mr-2"></i>
          Troca DNS em Massa - ${grupoNome}
        </h3>
        
        <div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p class="text-sm text-yellow-800">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            <strong>Atenção:</strong> Esta ação irá modificar as playlists de TODOS os clientes deste grupo.
          </p>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">Selecione o novo DNS:</label>
          <div class="space-y-2">
            ${dnsList.map(dns => `
              <div class="border-2 border-gray-300 rounded-lg p-4 hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition"
                   onclick="previewBulkDnsChange(${grupoId}, '${grupoNome.replace(/'/g, "\\'")}', ${dns.id}, '${dns.nome}', '${dns.url}')">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold text-gray-800 text-lg">${dns.nome}</p>
                    <code class="text-sm text-purple-600">${dns.url}</code>
                    ${dns.descricao ? `<p class="text-xs text-gray-500 mt-1">${dns.descricao}</p>` : ''}
                  </div>
                  <i class="fas fa-arrow-right text-2xl text-gray-400"></i>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4 border-t">
          <button onclick="closeModal()" 
                  class="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  `;
}

// Preview de troca em massa
window.previewBulkDnsChange = async function(grupoId, grupoNome, dnsId, dnsNome, dnsUrl) {
  try {
    Loading.show('Analisando grupo...');
    const preview = (await API.dns.previewBulk(grupoId, dnsId)).data;
    Loading.hide();

    const analise = preview.analise;

    closeModal();
    
    setTimeout(() => {
      const container = document.getElementById('modal-container');
      container.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
          <div class="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 class="text-2xl font-bold mb-6 flex items-center">
              <i class="fas fa-chart-bar text-blue-600 mr-2"></i>
              Análise do Grupo - ${grupoNome}
            </h3>
            
            <!-- Estatísticas -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-blue-600">${analise.total}</p>
                <p class="text-xs text-blue-800 mt-1">Total de Clientes</p>
              </div>
              <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-green-600">${analise.comSessao}</p>
                <p class="text-xs text-green-800 mt-1">Com Sessão Ativa</p>
              </div>
              <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-red-600">${analise.semSessao}</p>
                <p class="text-xs text-red-800 mt-1">Sem Sessão</p>
              </div>
              <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <p class="text-lg font-bold text-purple-600">${dnsNome}</p>
                <p class="text-xs text-purple-800 mt-1">Novo DNS</p>
              </div>
            </div>

            <!-- Distribuição por Aplicativo -->
            <div class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 class="font-semibold text-gray-800 mb-3">Distribuição por Aplicativo:</h4>
              <div class="grid grid-cols-3 gap-4">
                ${analise.iboplayer > 0 ? `
                  <div class="text-center">
                    <p class="text-xl font-bold text-blue-600">${analise.iboplayer}</p>
                    <p class="text-xs text-gray-600">IBOPlayer</p>
                  </div>
                ` : ''}
                ${analise.ibopro > 0 ? `
                  <div class="text-center">
                    <p class="text-xl font-bold text-purple-600">${analise.ibopro}</p>
                    <p class="text-xs text-gray-600">IBOPro</p>
                  </div>
                ` : ''}
                ${analise.vuplayer > 0 ? `
                  <div class="text-center">
                    <p class="text-xl font-bold text-green-600">${analise.vuplayer}</p>
                    <p class="text-xs text-gray-600">VU Player</p>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Avisos -->
            ${analise.semSessao > 0 ? `
              <div class="mb-6 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                <p class="text-sm text-cyan-800">
                  <i class="fas fa-info-circle mr-2"></i>
                  <strong>Login Automático:</strong> ${analise.semSessao} cliente(s) estão sem sessão ativa.
                  <br>O sistema fará login automaticamente em cada um antes de trocar o DNS.
                </p>
              </div>
            ` : `
              <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p class="text-sm text-green-800">
                  <i class="fas fa-check-circle mr-2"></i>
                  <strong>Tudo pronto:</strong> Todos os ${analise.comSessao} cliente(s) têm sessão ativa!
                </p>
              </div>
            `}

            <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-sm text-blue-800">
                <i class="fas fa-cog mr-2"></i>
                O sistema irá:
              </p>
              <ul class="text-sm text-blue-700 mt-2 ml-6 list-disc space-y-1">
                <li>Fazer login automático em clientes sem sessão ativa</li>
                <li>Processar cada cliente individualmente</li>
                <li>Atualizar todas as playlists não protegidas</li>
                <li>Pular playlists que já usam o DNS correto</li>
                <li>Gerar relatório completo ao final</li>
              </ul>
            </div>

            <!-- Lista de Clientes -->
            <div class="mb-6 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="px-4 py-2 text-left">Cliente</th>
                    <th class="px-4 py-2 text-left">App</th>
                    <th class="px-4 py-2 text-center">Sessão</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  ${analise.clientes.map(c => `
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-2">${c.nome}</td>
                      <td class="px-4 py-2">${appBadge(c.aplicativo)}</td>
                      <td class="px-4 py-2 text-center">
                        ${c.hasSession ? 
                          '<span class="text-green-600"><i class="fas fa-check-circle"></i></span>' : 
                          '<span class="text-red-600"><i class="fas fa-times-circle"></i></span>'
                        }
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Confirmação -->
            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button onclick="closeModal()" 
                      class="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">
                Cancelar
              </button>
              <button onclick="executeBulkDnsChange(${grupoId}, '${grupoNome.replace(/'/g, "\\'")}', ${dnsId}, '${dnsNome}', ${analise.total})" 
                      class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                <i class="fas fa-play mr-2"></i>Iniciar Processamento (${analise.total} cliente(s))
              </button>
            </div>
          </div>
        </div>
      `;
    }, 100);

  } catch (error) {
    Toast.error('Erro ao analisar grupo: ' + error.message);
    Loading.hide();
  }
};

// Executar troca em massa
window.executeBulkDnsChange = async function(grupoId, grupoNome, dnsId, dnsNome, totalClientes) {
  closeModal();
  
  // Modal de progresso
  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold mb-4 text-center">
          <i class="fas fa-cog fa-spin text-purple-600 mr-2"></i>
          Processando Troca em Massa
        </h3>
        
        <div class="mb-6">
          <div class="bg-gray-200 rounded-full h-4 overflow-hidden">
            <div id="progress-bar" class="bg-purple-600 h-full transition-all duration-300" style="width: 0%"></div>
          </div>
          <p id="progress-text" class="text-center text-sm text-gray-600 mt-2">Iniciando...</p>
        </div>

        <p class="text-sm text-gray-600 text-center">
          Por favor, aguarde. Este processo pode levar alguns minutos.
        </p>
      </div>
    </div>
  `;

  try {
    const resultado = (await API.dns.bulkChange(grupoId, dnsId)).data;
    
    // Atualizar progresso
    document.getElementById('progress-bar').style.width = '100%';
    document.getElementById('progress-text').textContent = 'Concluído!';
    
    setTimeout(() => {
      closeModal();
      showBulkResultModal(grupoNome, dnsNome, resultado);
    }, 1000);

  } catch (error) {
    closeModal();
    Toast.error('Erro ao processar: ' + error.message);
  }
};

// Modal de resultado
function showBulkResultModal(grupoNome, dnsNome, resultado) {
  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
      <div class="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 class="text-2xl font-bold mb-6 flex items-center">
          <i class="fas fa-flag-checkered text-green-600 mr-2"></i>
          Resultado da Troca em Massa
        </h3>
        
        <!-- Estatísticas Principais -->
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p class="text-3xl font-bold text-blue-600">${resultado.total}</p>
            <p class="text-sm text-blue-800">Total</p>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p class="text-3xl font-bold text-green-600">${resultado.sucessos}</p>
            <p class="text-sm text-green-800">Sucessos</p>
          </div>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p class="text-3xl font-bold text-red-600">${resultado.erros}</p>
            <p class="text-sm text-red-800">Erros</p>
          </div>
        </div>

        <!-- Estatísticas de Login -->
        ${resultado.loginsSucesso > 0 || resultado.loginsErro > 0 ? `
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-cyan-50 border border-cyan-200 rounded-lg p-3 text-center">
              <p class="text-2xl font-bold text-cyan-600">${resultado.loginsSucesso}</p>
              <p class="text-xs text-cyan-800">Logins Automáticos OK</p>
            </div>
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
              <p class="text-2xl font-bold text-orange-600">${resultado.loginsErro}</p>
              <p class="text-xs text-orange-800">Falhas no Login</p>
            </div>
          </div>
        ` : ''}

        <div class="mb-6 max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          ${resultado.detalhes.map(d => `
            <div class="p-4 border-b border-gray-100 hover:bg-gray-50">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2">
                    <p class="font-semibold text-gray-800">${d.cliente}</p>
                    ${appBadge(d.aplicativo)}
                    ${d.precisouLogin ? '<span class="text-xs bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full"><i class="fas fa-sign-in-alt mr-1"></i>Auto-Login</span>' : ''}
                  </div>
                  ${d.status === 'sucesso' ? `
                    <div class="mt-2 space-y-1">
                      <p class="text-sm text-green-600">
                        <i class="fas fa-check-circle mr-1"></i>
                        ${d.playlistsAtualizadas} playlist(s) atualizada(s)
                      </p>
                      ${d.playlistsPuladas > 0 ? `
                        <p class="text-xs text-gray-500">
                          <i class="fas fa-info-circle mr-1"></i>
                          ${d.playlistsPuladas} playlist(s) puladas (protegidas ou já usando DNS correto)
                        </p>
                      ` : ''}
                      ${d.erros && d.erros.length > 0 ? `
                        <details class="text-xs text-yellow-600 mt-1">
                          <summary class="cursor-pointer">${d.erros.length} erro(s) em algumas playlists</summary>
                          <ul class="ml-4 mt-1 list-disc">
                            ${d.erros.map(e => `<li>${e}</li>`).join('')}
                          </ul>
                        </details>
                      ` : ''}
                    </div>
                  ` : `
                    <p class="text-sm text-red-600 mt-1">
                      <i class="fas fa-times-circle mr-1"></i>
                      ${d.mensagem}
                    </p>
                  `}
                </div>
                <span class="ml-4">
                  ${d.status === 'sucesso' ? 
                    '<i class="fas fa-check text-2xl text-green-500"></i>' : 
                    '<i class="fas fa-times text-2xl text-red-500"></i>'
                  }
                </span>
              </div>
            </div>
          `).join('')}
        </div>

        ${resultado.loginsSucesso > 0 ? `
          <div class="mb-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
            <p class="text-sm text-cyan-800">
              <i class="fas fa-info-circle mr-2"></i>
              <strong>Login Automático:</strong> ${resultado.loginsSucesso} cliente(s) estavam sem sessão ativa 
              e o sistema fez login automaticamente antes de processar.
            </p>
          </div>
        ` : ''}

        <div class="flex justify-end space-x-3 pt-4 border-t">
          <button onclick="closeModal()" 
                  class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            <i class="fas fa-check mr-2"></i>Concluir
          </button>
        </div>
      </div>
    </div>
  `;
}
