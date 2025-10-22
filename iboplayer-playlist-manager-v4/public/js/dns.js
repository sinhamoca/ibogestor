// Módulo de DNS

async function loadDns() {
  try {
    Loading.show('Carregando DNS...');
    const response = await API.dns.getAll();
    const dnsList = response.data;
    renderDns(dnsList);
  } catch (error) {
    Toast.error('Erro ao carregar DNS: ' + error.message);
  } finally {
    Loading.hide();
  }
}

function renderDns(dnsList) {
  const content = document.getElementById('content-dns');
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow">
      <div class="p-6 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-xl font-bold text-gray-800">Gerenciamento de DNS</h2>
            <p class="text-sm text-gray-600 mt-1">Configure os domínios base para troca rápida em playlists</p>
          </div>
          <button onclick="showDnsModal()" 
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-plus mr-2"></i>Novo DNS
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL Base</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criado em</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${dnsList.map(dns => `
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="font-medium text-gray-900">${dns.nome}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <code class="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">${dns.url}</code>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  ${dns.descricao || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  ${statusBadge(dns.ativo)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${formatDate(dns.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div class="flex justify-end space-x-2">
                    <button onclick="toggleDns(${dns.id})" title="${dns.ativo ? 'Desativar' : 'Ativar'}"
                            class="text-blue-600 hover:text-blue-900">
                      <i class="fas fa-${dns.ativo ? 'toggle-on' : 'toggle-off'}"></i>
                    </button>
                    <button onclick="showDnsModal(${dns.id})" title="Editar"
                            class="text-yellow-600 hover:text-yellow-900">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteDns(${dns.id}, '${dns.nome}')" title="Deletar"
                            class="text-red-600 hover:text-red-900">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${dnsList.length === 0 ? `
          <div class="text-center py-12 text-gray-500">
            <i class="fas fa-network-wired text-5xl mb-4"></i>
            <p>Nenhum DNS cadastrado</p>
          </div>
        ` : ''}
      </div>

      <div class="p-6 bg-blue-50 border-t border-blue-100">
        <div class="flex items-start space-x-3">
          <i class="fas fa-info-circle text-blue-600 text-xl mt-1"></i>
          <div class="flex-1">
            <h4 class="font-semibold text-blue-900 mb-1">Como funciona?</h4>
            <p class="text-sm text-blue-800 mb-2">
              Os DNS cadastrados aqui podem ser usados para trocar rapidamente o domínio base das playlists dos clientes.
            </p>
            <p class="text-xs text-blue-700">
              <strong>Exemplo:</strong> Se uma playlist usa <code>https://popo65.live/get.php?...</code> 
              você pode trocar para <code>https://dt303.com/get.php?...</code> com um clique.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Modal de DNS
async function showDnsModal(dnsId = null) {
  const isEdit = dnsId !== null;
  let dns = null;

  if (isEdit) {
    try {
      dns = (await API.dns.getById(dnsId)).data;
    } catch (error) {
      Toast.error('Erro ao carregar DNS');
      return;
    }
  }

  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-2xl font-bold mb-6 text-gray-800">
          ${isEdit ? 'Editar DNS' : 'Novo DNS'}
        </h3>
        
        <form id="form-dns" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input type="text" name="nome" value="${dns?.nome || ''}" required
                   placeholder="Ex: Popo65, DT303"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">URL Base *</label>
            <input type="url" name="url" value="${dns?.url || ''}" required
                   placeholder="https://exemplo.com"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <p class="text-xs text-gray-500 mt-1">
              <i class="fas fa-info-circle mr-1"></i>
              Apenas o domínio base (ex: https://popo65.live)
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea name="descricao" rows="2"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">${dns?.descricao || ''}</textarea>
          </div>

          <div class="flex items-center">
            <label class="flex items-center cursor-pointer">
              <input type="checkbox" name="ativo" ${!dns || dns.ativo ? 'checked' : ''} class="mr-2 h-5 w-5 text-blue-600">
              <span class="text-sm font-medium text-gray-700">DNS Ativo</span>
            </label>
          </div>

          <div class="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button type="button" onclick="closeModal()"
                    class="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">
              Cancelar
            </button>
            <button type="submit"
                    class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              ${isEdit ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('form-dns').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      nome: formData.get('nome'),
      url: formData.get('url'),
      descricao: formData.get('descricao'),
      ativo: formData.get('ativo') ? 1 : 0
    };

    try {
      Loading.show(isEdit ? 'Salvando...' : 'Criando...');
      
      if (isEdit) {
        await API.dns.update(dnsId, data);
        Toast.success('DNS atualizado!');
      } else {
        await API.dns.create(data);
        Toast.success('DNS criado!');
      }
      
      closeModal();
      loadDns();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      Loading.hide();
    }
  });
}

async function toggleDns(id) {
  try {
    Loading.show('Atualizando...');
    await API.dns.toggle(id);
    Toast.success('Status atualizado!');
    loadDns();
  } catch (error) {
    Toast.error(error.message);
  } finally {
    Loading.hide();
  }
}

async function deleteDns(id, nome) {
  confirm(
    `Tem certeza que deseja deletar o DNS "${nome}"?`,
    async function() {
      try {
        Loading.show('Deletando...');
        await API.dns.delete(id);
        Toast.success('DNS deletado!');
        loadDns();
      } catch (error) {
        Toast.error(error.message);
      } finally {
        Loading.hide();
      }
    }
  );
}
