// Módulo de Clientes

let clientesData = [];
let gruposData = [];

async function loadClientes() {
  try {
    Loading.show('Carregando clientes...');
    
    const [clientesResp, gruposResp, statsResp] = await Promise.all([
      API.clientes.getAll(),
      API.grupos.getAll(),
      API.clientes.getStats()
    ]);

    clientesData = clientesResp.data;
    gruposData = gruposResp.data;
    const stats = statsResp.data;

    renderClientes(stats);
  } catch (error) {
    Toast.error('Erro ao carregar clientes: ' + error.message);
  } finally {
    Loading.hide();
  }
}

function renderClientes(stats) {
  const content = document.getElementById('content-clientes');
  content.innerHTML = `
    <!-- Estatísticas -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total</p>
            <p class="text-2xl font-bold text-gray-800">${stats.total}</p>
          </div>
          <i class="fas fa-users text-3xl text-blue-500"></i>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Ativos</p>
            <p class="text-2xl font-bold text-green-600">${stats.ativos}</p>
          </div>
          <i class="fas fa-check-circle text-3xl text-green-500"></i>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">IBOPlayer</p>
            <p class="text-2xl font-bold text-blue-600">${stats.iboplayer}</p>
          </div>
          <i class="fas fa-tv text-3xl text-blue-500"></i>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">IBOPro</p>
            <p class="text-2xl font-bold text-purple-600">${stats.ibopro}</p>
          </div>
          <i class="fas fa-star text-3xl text-purple-500"></i>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">VU Player</p>
            <p class="text-2xl font-bold text-green-600">${stats.vuplayer}</p>
          </div>
          <i class="fas fa-play-circle text-3xl text-green-500"></i>
        </div>
      </div>
    </div>

    <!-- Tabela -->
    <div class="bg-white rounded-lg shadow">
      <div class="p-6 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-800">Clientes Cadastrados</h2>
          <button onclick="showClienteModal()" 
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-plus mr-2"></i>Novo Cliente
          </button>
        </div>
        
        <div class="mt-4 flex space-x-4">
          <input type="text" id="search-clientes" placeholder="Buscar por nome ou MAC..." 
                 class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          
          <select id="filter-grupo" onchange="filterClientes()" 
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os Grupos</option>
            ${gruposData.map(g => `<option value="${g.id}">${g.nome}</option>`).join('')}
          </select>

          <select id="filter-app" onchange="filterClientes()" 
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os Apps</option>
            <option value="iboplayer">IBOPlayer</option>
            <option value="ibopro">IBOPro</option>
            <option value="vuplayer">VU Player</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full table-hover">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MAC</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aplicativo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Sync</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody id="clientes-tbody" class="bg-white divide-y divide-gray-200">
            <!-- Será preenchido via JS -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  renderClientesTable(clientesData);

  // Busca
  const searchInput = document.getElementById('search-clientes');
  searchInput.addEventListener('input', debounce((e) => {
    filterClientes();
  }, 300));
}

function renderClientesTable(clientes) {
  const tbody = document.getElementById('clientes-tbody');
  
  if (clientes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-8 text-center text-gray-500">
          <i class="fas fa-inbox text-4xl mb-2"></i>
          <p>Nenhum cliente encontrado</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = clientes.map(cliente => `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="font-medium text-gray-900">${cliente.nome}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <code class="text-sm bg-gray-100 px-2 py-1 rounded">${cliente.mac}</code>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${appBadge(cliente.aplicativo)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${cliente.grupo_nome || '-'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${statusBadge(cliente.ativo)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${formatDate(cliente.ultima_sincronizacao)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div class="flex justify-end space-x-2">
          <button onclick="showSnapshotModal(${cliente.id})" title="Ver Playlists (Snapshot)"
                  class="text-indigo-600 hover:text-indigo-900">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="showPlaylistsModal(${cliente.id})" title="Gerenciar Playlists"
                  class="text-blue-600 hover:text-blue-900">
            <i class="fas fa-list"></i>
          </button>
          <button onclick="doLogin(${cliente.id})" title="Fazer Login"
                  class="text-green-600 hover:text-green-900">
            <i class="fas fa-sign-in-alt"></i>
          </button>
          <button onclick="showClienteModal(${cliente.id})" title="Editar"
                  class="text-yellow-600 hover:text-yellow-900">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteCliente(${cliente.id}, '${cliente.nome}')" title="Deletar"
                  class="text-red-600 hover:text-red-900">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterClientes() {
  const search = document.getElementById('search-clientes').value.toLowerCase();
  const grupoFilter = document.getElementById('filter-grupo').value;
  const appFilter = document.getElementById('filter-app').value;

  let filtered = clientesData;

  if (search) {
    filtered = filtered.filter(c => 
      c.nome.toLowerCase().includes(search) || 
      c.mac.toLowerCase().includes(search)
    );
  }

  if (grupoFilter) {
    filtered = filtered.filter(c => c.grupo_id == grupoFilter);
  }

  if (appFilter) {
    filtered = filtered.filter(c => c.aplicativo === appFilter);
  }

  renderClientesTable(filtered);
}

async function deleteCliente(id, nome) {
  confirm(
    `Tem certeza que deseja deletar o cliente "${nome}"?<br><br>Esta ação não pode ser desfeita.`,
    async function() {
      try {
        Loading.show('Deletando...');
        await API.clientes.delete(id);
        Toast.success('Cliente deletado com sucesso!');
        loadClientes();
      } catch (error) {
        Toast.error(error.message);
      } finally {
        Loading.hide();
      }
    }
  );
}

async function doLogin(clienteId) {
  try {
    Loading.show('Fazendo login...');
    await API.acoes.login(clienteId);
    Toast.success('Login realizado com sucesso! Playlists sincronizadas.');
    loadClientes();
  } catch (error) {
    Toast.error('Erro no login: ' + error.message);
  } finally {
    Loading.hide();
  }
}

// Modal de Snapshot (Visualização Rápida)
async function showSnapshotModal(clienteId) {
  let cliente, snapshot;

  try {
    Loading.show('Carregando snapshot...');
    cliente = (await API.clientes.getById(clienteId)).data;
    snapshot = (await API.acoes.getPlaylistsSnapshot(clienteId)).data;
  } catch (error) {
    Toast.error(error.message);
    Loading.hide();
    return;
  } finally {
    Loading.hide();
  }

  const playlists = snapshot.playlists || [];
  const ultimaSync = snapshot.ultima_sincronizacao;

  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
      <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-eye text-indigo-600 mr-2"></i>
              Visualização de Playlists - ${cliente.nome}
            </h3>
            ${ultimaSync ? `
              <p class="text-sm text-gray-500 mt-1">
                <i class="fas fa-sync-alt mr-1"></i>
                Última sincronização: ${formatDate(ultimaSync)}
              </p>
            ` : `
              <p class="text-sm text-yellow-600 mt-1">
                <i class="fas fa-exclamation-triangle mr-1"></i>
                Nenhuma sincronização realizada ainda
              </p>
            `}
          </div>
          <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>

        ${playlists.length === 0 ? `
          <div class="text-center py-12 text-gray-500">
            <i class="fas fa-inbox text-5xl mb-4"></i>
            <p class="mb-2">Nenhuma playlist sincronizada</p>
            <p class="text-sm">Faça login para sincronizar as playlists</p>
            <button onclick="closeModal(); doLogin(${clienteId})" 
                    class="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              <i class="fas fa-sign-in-alt mr-2"></i>Fazer Login Agora
            </button>
          </div>
        ` : `
          <div class="mb-4 flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div>
              <p class="text-sm text-blue-800">
                <i class="fas fa-info-circle mr-1"></i>
                <strong>Modo de visualização:</strong> Estes dados foram capturados no último login.
              </p>
              <p class="text-xs text-blue-600 mt-1">
                Para atualizar, faça login novamente ou gerencie as playlists diretamente.
              </p>
            </div>
            <button onclick="closeModal(); doLogin(${clienteId})" 
                    class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition">
              <i class="fas fa-sync-alt mr-1"></i>Atualizar
            </button>
          </div>

          <div class="space-y-2">
            ${playlists.map((pl, index) => {
              const name = pl.playlist_name || pl.name || 'Sem nome';
              const url = pl.url || pl.playlist_url || '';
              const id = pl._id || pl.id || '';
              const isProtected = pl.is_protected || false;
              
              return `
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <div class="flex items-center space-x-2">
                        <h4 class="font-semibold text-gray-800">${name}</h4>
                        ${isProtected ? '<i class="fas fa-lock text-yellow-500 text-sm" title="Protegida"></i>' : ''}
                      </div>
                      <p class="text-sm text-gray-600 mt-1 break-all">
                        ${isProtected ? '<i class="fas fa-lock text-yellow-500 mr-2"></i>Playlist protegida' : url}
                      </p>
                      ${id ? `<p class="text-xs text-gray-400 mt-1">ID: ${id}</p>` : ''}
                    </div>
                    <div class="ml-4">
                      <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">#${index + 1}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="mt-6 pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
            <div class="flex justify-between items-center">
              <p class="text-sm text-gray-600">
                <strong>${playlists.length}</strong> playlist(s) encontrada(s)
              </p>
              <div class="flex space-x-2">
                <button onclick="showPlaylistsModal(${clienteId})" 
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <i class="fas fa-edit mr-2"></i>Gerenciar Playlists
                </button>
                <button onclick="closeModal()" 
                        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}

// Modal de Playlists
async function showPlaylistsModal(clienteId) {
  let cliente, playlists;

  try {
    Loading.show('Carregando...');
    cliente = (await API.clientes.getById(clienteId)).data;
    playlists = (await API.acoes.getPlaylists(clienteId)).data;
  } catch (error) {
    if (error.message.includes('Sessão não encontrada')) {
      Toast.warning('Faça login primeiro');
      Loading.hide();
      return;
    }
    Toast.error(error.message);
    Loading.hide();
    return;
  } finally {
    Loading.hide();
  }

  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
      <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-bold text-gray-800">
            Playlists - ${cliente.nome}
          </h3>
          <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>

        <div class="mb-4">
          <button onclick="showAddPlaylistModal(${clienteId})" 
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            <i class="fas fa-plus mr-2"></i>Adicionar Playlist
          </button>
        </div>

        <div class="space-y-2">
          ${Array.isArray(playlists) && playlists.length > 0 ? playlists.map((pl, index) => `
            <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-800">${pl.playlist_name || pl.name}</h4>
                  <p class="text-sm text-gray-600 mt-1">
                    ${pl.is_protected ? '<i class="fas fa-lock text-yellow-500 mr-2"></i>Protegida' : pl.url || pl.playlist_url}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">ID: ${pl._id || pl.id}</p>
                </div>
                <div class="flex space-x-2">
                  <button onclick="showChangeDnsModal(${clienteId}, '${pl._id || pl.id}', '${(pl.url || pl.playlist_url || '').replace(/'/g, "\\'")}', '${(pl.playlist_name || pl.name || '').replace(/'/g, "\\'")}')" title="Trocar DNS"
                          class="text-purple-600 hover:text-purple-800">
                    <i class="fas fa-exchange-alt"></i>
                  </button>
                  <button onclick="editPlaylist(${clienteId}, '${pl._id || pl.id}')" title="Editar"
                          class="text-yellow-600 hover:text-yellow-800">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="deletePlaylist(${clienteId}, '${pl._id || pl.id}', ${pl.is_protected})" title="Deletar"
                          class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          `).join('') : '<p class="text-center text-gray-500 py-8">Nenhuma playlist encontrada</p>'}
        </div>

        <div class="mt-6 pt-4 border-t">
          <button onclick="closeModal()" class="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">
            Fechar
          </button>
        </div>
      </div>
    </div>
  `;
}

// Trocar DNS da playlist
window.showChangeDnsModal = async function(clienteId, playlistId, currentUrl, playlistName) {
  let dnsList;
  
  try {
    Loading.show('Carregando DNS...');
    dnsList = (await API.dns.getAll(true)).data; // Apenas ativos
  } catch (error) {
    Toast.error('Erro ao carregar DNS');
    Loading.hide();
    return;
  } finally {
    Loading.hide();
  }

  if (dnsList.length === 0) {
    Toast.warning('Nenhum DNS cadastrado. Cadastre DNS na aba DNS primeiro.');
    return;
  }

  closeModal();
  
  setTimeout(() => {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h3 class="text-xl font-bold mb-4 flex items-center">
            <i class="fas fa-exchange-alt text-purple-600 mr-2"></i>
            Trocar DNS - ${playlistName}
          </h3>
          
          <div class="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p class="text-sm font-medium text-gray-700 mb-1">URL Atual:</p>
            <code class="text-xs bg-white px-2 py-1 rounded border break-all block">${currentUrl}</code>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Selecione o novo DNS:</label>
            <div class="space-y-2">
              ${dnsList.map(dns => `
                <div class="border border-gray-300 rounded-lg p-3 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
                     onclick="selectDns(${clienteId}, '${playlistId}', '${currentUrl.replace(/'/g, "\\'")}', '${playlistName.replace(/'/g, "\\'")}', ${dns.id}, '${dns.url}', '${dns.nome}')">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-semibold text-gray-800">${dns.nome}</p>
                      <code class="text-xs text-blue-600">${dns.url}</code>
                    </div>
                    <i class="fas fa-arrow-right text-gray-400"></i>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button type="button" onclick="showPlaylistsModal(${clienteId})" 
                    class="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    `;
  }, 100);
};

// Selecionar e confirmar DNS
window.selectDns = async function(clienteId, playlistId, currentUrl, playlistName, dnsId, dnsUrl, dnsNome) {
  try {
    Loading.show('Gerando preview...');
    const preview = (await API.dns.preview(currentUrl, dnsId)).data;
    Loading.hide();

    closeModal();
    
    setTimeout(() => {
      const container = document.getElementById('modal-container');
      container.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
          <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-bold mb-4 flex items-center">
              <i class="fas fa-eye text-blue-600 mr-2"></i>
              Confirmar Troca de DNS
            </h3>
            
            <div class="space-y-4 mb-6">
              <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-sm font-medium text-red-700 mb-1">
                  <i class="fas fa-minus-circle mr-1"></i>URL Atual:
                </p>
                <code class="text-xs bg-white px-2 py-1 rounded border break-all block">${preview.originalUrl}</code>
              </div>

              <div class="flex justify-center">
                <i class="fas fa-arrow-down text-3xl text-gray-400"></i>
              </div>

              <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p class="text-sm font-medium text-green-700 mb-1">
                  <i class="fas fa-check-circle mr-1"></i>Nova URL (${dnsNome}):
                </p>
                <code class="text-xs bg-white px-2 py-1 rounded border break-all block">${preview.newUrl}</code>
              </div>
            </div>

            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p class="text-sm text-yellow-800">
                <i class="fas fa-exclamation-triangle mr-1"></i>
                <strong>Atenção:</strong> Esta ação irá modificar a URL da playlist "${playlistName}".
              </p>
            </div>

            <div class="flex justify-end space-x-3">
              <button onclick="showPlaylistsModal(${clienteId})" 
                      class="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition">
                Cancelar
              </button>
              <button onclick="confirmChangeDns(${clienteId}, '${playlistId}', '${playlistName.replace(/'/g, "\\'")}', '${preview.newUrl.replace(/'/g, "\\'")}')" 
                      class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                <i class="fas fa-check mr-2"></i>Confirmar Troca
              </button>
            </div>
          </div>
        </div>
      `;
    }, 100);

  } catch (error) {
    Toast.error('Erro ao gerar preview: ' + error.message);
    Loading.hide();
  }
};

// Confirmar e executar troca de DNS
window.confirmChangeDns = async function(clienteId, playlistId, playlistName, newUrl) {
  try {
    Loading.show('Atualizando playlist...');
    
    await API.acoes.editPlaylist(clienteId, playlistId, {
      name: playlistName,
      url: newUrl,
      protect: false,
      pin: ''
    });
    
    Toast.success('DNS trocado com sucesso!');
    showPlaylistsModal(clienteId);
  } catch (error) {
    Toast.error('Erro ao trocar DNS: ' + error.message);
  } finally {
    Loading.hide();
  }
};

// Adicionar playlist
window.showAddPlaylistModal = function(clienteId) {
  closeModal();
  
  setTimeout(() => {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 class="text-xl font-bold mb-4">Adicionar Playlist</h3>
          
          <form id="form-add-playlist" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nome *</label>
              <input type="text" name="name" required class="w-full px-4 py-2 border rounded-lg">
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">URL *</label>
              <input type="url" name="url" required placeholder="https://..." class="w-full px-4 py-2 border rounded-lg">
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" name="protect" id="protect-check" class="mr-2">
              <label for="protect-check" class="text-sm">Proteger com PIN</label>
            </div>
            
            <div id="pin-field" class="hidden">
              <label class="block text-sm font-medium mb-1">PIN</label>
              <input type="text" name="pin" class="w-full px-4 py-2 border rounded-lg">
            </div>
            
            <div class="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button type="button" onclick="showPlaylistsModal(${clienteId})" class="px-4 py-2 bg-gray-300 rounded-lg">
                Voltar
              </button>
              <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg">
                Adicionar
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.getElementById('protect-check').addEventListener('change', (e) => {
      document.getElementById('pin-field').classList.toggle('hidden', !e.target.checked);
    });
    
    document.getElementById('form-add-playlist').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      try {
        Loading.show('Adicionando...');
        await API.acoes.addPlaylist(clienteId, {
          name: formData.get('name'),
          url: formData.get('url'),
          protect: formData.get('protect') === 'on',
          pin: formData.get('pin') || ''
        });
        Toast.success('Playlist adicionada!');
        showPlaylistsModal(clienteId);
      } catch (error) {
        Toast.error(error.message);
      } finally {
        Loading.hide();
      }
    });
  }, 100);
};

// Editar playlist
window.editPlaylist = function(clienteId, playlistId) {
  closeModal();
  
  setTimeout(() => {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 class="text-xl font-bold mb-4">Editar Playlist</h3>
          
          <form id="form-edit-playlist" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nome *</label>
              <input type="text" name="name" required class="w-full px-4 py-2 border rounded-lg">
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">URL *</label>
              <input type="url" name="url" required placeholder="https://..." class="w-full px-4 py-2 border rounded-lg">
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" name="protect" id="protect-check-edit" class="mr-2">
              <label for="protect-check-edit" class="text-sm">Proteger com PIN</label>
            </div>
            
            <div id="pin-field-edit" class="hidden">
              <label class="block text-sm font-medium mb-1">PIN</label>
              <input type="text" name="pin" class="w-full px-4 py-2 border rounded-lg">
            </div>
            
            <div class="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button type="button" onclick="showPlaylistsModal(${clienteId})" class="px-4 py-2 bg-gray-300 rounded-lg">
                Voltar
              </button>
              <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg">
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.getElementById('protect-check-edit').addEventListener('change', (e) => {
      document.getElementById('pin-field-edit').classList.toggle('hidden', !e.target.checked);
    });
    
    document.getElementById('form-edit-playlist').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      try {
        Loading.show('Salvando...');
        await API.acoes.editPlaylist(clienteId, playlistId, {
          name: formData.get('name'),
          url: formData.get('url'),
          protect: formData.get('protect') === 'on',
          pin: formData.get('pin') || ''
        });
        Toast.success('Playlist editada!');
        showPlaylistsModal(clienteId);
      } catch (error) {
        Toast.error(error.message);
      } finally {
        Loading.hide();
      }
    });
  }, 100);
};

// Deletar playlist
window.deletePlaylist = async function(clienteId, playlistId, isProtected) {
  let pin = null;
  
  if (isProtected) {
    pin = prompt('Esta playlist está protegida. Digite o PIN:');
    if (!pin) return;
  }
  
  try {
    Loading.show('Deletando...');
    await API.acoes.deletePlaylist(clienteId, playlistId, pin);
    Toast.success('Playlist deletada!');
    showPlaylistsModal(clienteId);
  } catch (error) {
    Toast.error(error.message);
  } finally {
    Loading.hide();
  }
};
