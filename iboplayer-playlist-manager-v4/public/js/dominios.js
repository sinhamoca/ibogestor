// Módulo de Domínios

async function loadDominios() {
  try {
    Loading.show('Carregando domínios...');
    const response = await API.dominios.getAll();
    const dominios = response.data;
    renderDominios(dominios);
  } catch (error) {
    Toast.error('Erro ao carregar domínios: ' + error.message);
  } finally {
    Loading.hide();
  }
}

function renderDominios(dominios) {
  const content = document.getElementById('content-dominios');
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow">
      <div class="p-6 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-xl font-bold text-gray-800">Domínios IBOPlayer</h2>
            <p class="text-sm text-gray-600 mt-1">Configure os domínios disponíveis para clientes IBOPlayer</p>
          </div>
          <button onclick="showDominioModal()" 
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-plus mr-2"></i>Novo Domínio
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domínio</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criado em</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${dominios.map(dominio => `
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="font-medium text-gray-900">${dominio.nome}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <code class="text-sm bg-gray-100 px-2 py-1 rounded">${dominio.dominio}</code>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  ${statusBadge(dominio.ativo)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${formatDate(dominio.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div class="flex justify-end space-x-2">
                    <button onclick="toggleDominio(${dominio.id})" title="${dominio.ativo ? 'Desativar' : 'Ativar'}"
                            class="text-blue-600 hover:text-blue-900">
                      <i class="fas fa-${dominio.ativo ? 'toggle-on' : 'toggle-off'}"></i>
                    </button>
                    <button onclick="showDominioModal(${dominio.id})" title="Editar"
                            class="text-yellow-600 hover:text-yellow-900">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteDominio(${dominio.id}, '${dominio.nome}')" title="Deletar"
                            class="text-red-600 hover:text-red-900">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${dominios.length === 0 ? `
          <div class="text-center py-12 text-gray-500">
            <i class="fas fa-globe text-5xl mb-4"></i>
            <p>Nenhum domínio cadastrado</p>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

async function toggleDominio(id) {
  try {
    Loading.show('Atualizando...');
    await API.dominios.toggle(id);
    Toast.success('Status atualizado!');
    loadDominios();
  } catch (error) {
    Toast.error(error.message);
  } finally {
    Loading.hide();
  }
}

async function deleteDominio(id, nome) {
  confirm(
    `Tem certeza que deseja deletar o domínio "${nome}"?<br><br>Isso afetará clientes que usam este domínio.`,
    async function() {
      try {
        Loading.show('Deletando...');
        await API.dominios.delete(id);
        Toast.success('Domínio deletado!');
        loadDominios();
      } catch (error) {
        Toast.error(error.message);
      } finally {
        Loading.hide();
      }
    }
  );
}
