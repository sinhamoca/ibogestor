// Módulo de Logs

async function loadLogs() {
  try {
    Loading.show('Carregando logs...');
    const [logsResp, statsResp] = await Promise.all([
      API.logs.getAll({ limit: 100 }),
      API.logs.getStats()
    ]);
    
    const logs = logsResp.data;
    const stats = statsResp.data;
    
    renderLogs(logs, stats);
  } catch (error) {
    Toast.error('Erro ao carregar logs: ' + error.message);
  } finally {
    Loading.hide();
  }
}

function renderLogs(logs, stats) {
  const content = document.getElementById('content-logs');
  content.innerHTML = `
    <!-- Estatísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total</p>
            <p class="text-2xl font-bold text-gray-800">${stats.total}</p>
          </div>
          <i class="fas fa-list text-3xl text-gray-500"></i>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Sucessos</p>
            <p class="text-2xl font-bold text-green-600">${stats.sucessos}</p>
          </div>
          <i class="fas fa-check-circle text-3xl text-green-500"></i>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Erros</p>
            <p class="text-2xl font-bold text-red-600">${stats.erros}</p>
          </div>
          <i class="fas fa-exclamation-circle text-3xl text-red-500"></i>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Pendentes</p>
            <p class="text-2xl font-bold text-yellow-600">${stats.pendentes}</p>
          </div>
          <i class="fas fa-clock text-3xl text-yellow-500"></i>
        </div>
      </div>
    </div>

    <!-- Tabela -->
    <div class="bg-white rounded-lg shadow">
      <div class="p-6 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-800">Histórico de Ações</h2>
          <div class="flex space-x-2">
            <button onclick="loadLogs()" title="Atualizar"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <i class="fas fa-sync-alt mr-2"></i>Atualizar
            </button>
            <button onclick="cleanupLogs()" title="Limpar logs antigos"
                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              <i class="fas fa-broom mr-2"></i>Limpar Antigos
            </button>
          </div>
        </div>

        <div class="mt-4 flex space-x-4">
          <select id="filter-status" onchange="filterLogs()" 
                  class="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">Todos os Status</option>
            <option value="sucesso">Sucesso</option>
            <option value="erro">Erro</option>
            <option value="pendente">Pendente</option>
          </select>

          <select id="filter-acao" onchange="filterLogs()" 
                  class="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">Todas as Ações</option>
            <option value="login">Login</option>
            <option value="listar_playlists">Listar Playlists</option>
            <option value="adicionar_playlist">Adicionar Playlist</option>
            <option value="editar_playlist">Editar Playlist</option>
            <option value="deletar_playlist">Deletar Playlist</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full" id="logs-table">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mensagem</th>
            </tr>
          </thead>
          <tbody id="logs-tbody" class="divide-y divide-gray-200">
            <!-- Será preenchido via JS -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  renderLogsTable(logs);
  window.allLogs = logs; // Guardar para filtros
}

function renderLogsTable(logs) {
  const tbody = document.getElementById('logs-tbody');
  
  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-gray-500">
          Nenhum log encontrado
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs.map(log => {
    let statusBadge;
    if (log.status === 'sucesso') {
      statusBadge = '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Sucesso</span>';
    } else if (log.status === 'erro') {
      statusBadge = '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Erro</span>';
    } else {
      statusBadge = '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Pendente</span>';
    }

    return `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${formatDate(log.created_at)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm font-medium text-gray-900">${log.cliente_nome || '-'}</div>
          ${log.cliente_aplicativo ? `<div class="text-xs text-gray-500">${formatAplicativo(log.cliente_aplicativo)}</div>` : ''}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${log.acao.replace(/_/g, ' ')}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${statusBadge}
        </td>
        <td class="px-6 py-4 text-sm text-gray-900">
          ${log.mensagem}
        </td>
      </tr>
    `;
  }).join('');
}

function filterLogs() {
  const statusFilter = document.getElementById('filter-status').value;
  const acaoFilter = document.getElementById('filter-acao').value;

  let filtered = window.allLogs || [];

  if (statusFilter) {
    filtered = filtered.filter(l => l.status === statusFilter);
  }

  if (acaoFilter) {
    filtered = filtered.filter(l => l.acao === acaoFilter);
  }

  renderLogsTable(filtered);
}

async function cleanupLogs() {
  const days = prompt('Deletar logs com mais de quantos dias?', '30');
  if (!days) return;

  confirm(
    `Tem certeza que deseja deletar logs com mais de ${days} dias?`,
    async function() {
      try {
        Loading.show('Limpando...');
        const result = await API.logs.cleanup(days);
        Toast.success(`${result.deleted} log(s) deletado(s)!`);
        loadLogs();
      } catch (error) {
        Toast.error(error.message);
      } finally {
        Loading.hide();
      }
    }
  );
}
