// Modais centralizados

// Modal de Cliente (Criar/Editar)
async function showClienteModal(clienteId = null) {
  const isEdit = clienteId !== null;
  let cliente = null;
  let grupos = [];
  let dominios = [];

  try {
    // Carregar dados necessários
    grupos = (await API.grupos.getAll()).data;
    dominios = (await API.dominios.getAll(true)).data;

    if (isEdit) {
      cliente = (await API.clientes.getById(clienteId)).data;
    }
  } catch (error) {
    Toast.error('Erro ao carregar dados');
    return;
  }

  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 class="text-2xl font-bold mb-6 text-gray-800">
          ${isEdit ? 'Editar Cliente' : 'Novo Cliente'}
        </h3>
        
        <form id="form-cliente" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input type="text" name="nome" value="${cliente?.nome || ''}" required
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">MAC Address *</label>
              <input type="text" name="mac" value="${cliente?.mac || ''}" required
                     placeholder="00:1A:2B:3C:4D:5E"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Aplicativo *</label>
              <select name="aplicativo" required onchange="handleAplicativoChange(this.value)"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Selecione...</option>
                <option value="iboplayer" ${cliente?.aplicativo === 'iboplayer' ? 'selected' : ''}>IBOPlayer</option>
                <option value="ibopro" ${cliente?.aplicativo === 'ibopro' ? 'selected' : ''}>IBOPro</option>
                <option value="vuplayer" ${cliente?.aplicativo === 'vuplayer' ? 'selected' : ''}>VU Player</option>
              </select>
            </div>

            <div id="field-dominio" class="${cliente?.aplicativo === 'iboplayer' ? '' : 'hidden'}">
              <label class="block text-sm font-medium text-gray-700 mb-1">Domínio</label>
              <select name="dominio" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Selecione...</option>
                ${dominios.map(d => `<option value="${d.dominio}" ${cliente?.dominio === d.dominio ? 'selected' : ''}>${d.nome}</option>`).join('')}
              </select>
            </div>

            <div id="field-device-key" class="${cliente?.aplicativo === 'ibopro' ? 'hidden' : ''}">
              <label class="block text-sm font-medium text-gray-700 mb-1">Device Key</label>
              <input type="text" name="device_key" value="${cliente?.device_key || ''}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>

            <div id="field-password" class="${cliente?.aplicativo === 'ibopro' ? '' : 'hidden'}">
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="text" name="password" value="${cliente?.password || ''}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
              <select name="grupo_id" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Sem grupo</option>
                ${grupos.map(g => `<option value="${g.id}" ${cliente?.grupo_id === g.id ? 'selected' : ''}>${g.nome}</option>`).join('')}
              </select>
            </div>

            <div class="flex items-center">
              <label class="flex items-center cursor-pointer">
                <input type="checkbox" name="ativo" ${!cliente || cliente.ativo ? 'checked' : ''} class="mr-2 h-5 w-5 text-blue-600">
                <span class="text-sm font-medium text-gray-700">Cliente Ativo</span>
              </label>
            </div>
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

  // Handler do formulário
  document.getElementById('form-cliente').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      nome: formData.get('nome'),
      mac: formData.get('mac'),
      device_key: formData.get('device_key') || null,
      password: formData.get('password') || null,
      grupo_id: formData.get('grupo_id') || null,
      aplicativo: formData.get('aplicativo'),
      dominio: formData.get('dominio') || null,
      ativo: formData.get('ativo') ? 1 : 0
    };

    try {
      Loading.show(isEdit ? 'Salvando...' : 'Criando...');
      
      if (isEdit) {
        await API.clientes.update(clienteId, data);
        Toast.success('Cliente atualizado com sucesso!');
      } else {
        await API.clientes.create(data);
        Toast.success('Cliente criado com sucesso!');
      }
      
      closeModal();
      loadClientes();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      Loading.hide();
    }
  });
}

// Handler para mudança de aplicativo
window.handleAplicativoChange = function(aplicativo) {
  const fieldDominio = document.getElementById('field-dominio');
  const fieldDeviceKey = document.getElementById('field-device-key');
  const fieldPassword = document.getElementById('field-password');

  // Resetar todos
  fieldDominio.classList.add('hidden');
  fieldDeviceKey.classList.add('hidden');
  fieldPassword.classList.add('hidden');

  // Mostrar campos específicos
  if (aplicativo === 'iboplayer') {
    fieldDominio.classList.remove('hidden');
    fieldDeviceKey.classList.remove('hidden');
  } else if (aplicativo === 'ibopro') {
    fieldPassword.classList.remove('hidden');
  } else if (aplicativo === 'vuplayer') {
    fieldDeviceKey.classList.remove('hidden');
  }
};

// Modal de Grupo
async function showGrupoModal(grupoId = null) {
  const isEdit = grupoId !== null;
  let grupo = null;

  if (isEdit) {
    try {
      grupo = (await API.grupos.getById(grupoId)).data;
    } catch (error) {
      Toast.error('Erro ao carregar grupo');
      return;
    }
  }

  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-2xl font-bold mb-6 text-gray-800">
          ${isEdit ? 'Editar Grupo' : 'Novo Grupo'}
        </h3>
        
        <form id="form-grupo" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input type="text" name="nome" value="${grupo?.nome || ''}" required
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea name="descricao" rows="3"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">${grupo?.descricao || ''}</textarea>
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

  document.getElementById('form-grupo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      nome: formData.get('nome'),
      descricao: formData.get('descricao')
    };

    try {
      Loading.show(isEdit ? 'Salvando...' : 'Criando...');
      
      if (isEdit) {
        await API.grupos.update(grupoId, data);
        Toast.success('Grupo atualizado!');
      } else {
        await API.grupos.create(data);
        Toast.success('Grupo criado!');
      }
      
      closeModal();
      loadGrupos();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      Loading.hide();
    }
  });
}

// Modal de Domínio
async function showDominioModal(dominioId = null) {
  const isEdit = dominioId !== null;
  let dominio = null;

  if (isEdit) {
    try {
      dominio = (await API.dominios.getById(dominioId)).data;
    } catch (error) {
      Toast.error('Erro ao carregar domínio');
      return;
    }
  }

  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-2xl font-bold mb-6 text-gray-800">
          ${isEdit ? 'Editar Domínio' : 'Novo Domínio'}
        </h3>
        
        <form id="form-dominio" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input type="text" name="nome" value="${dominio?.nome || ''}" required
                   placeholder="Ex: IBOPlayer"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Domínio *</label>
            <input type="text" name="dominio" value="${dominio?.dominio || ''}" required
                   placeholder="Ex: iboplayer.com"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>

          <div class="flex items-center">
            <label class="flex items-center cursor-pointer">
              <input type="checkbox" name="ativo" ${!dominio || dominio.ativo ? 'checked' : ''} class="mr-2 h-5 w-5 text-blue-600">
              <span class="text-sm font-medium text-gray-700">Domínio Ativo</span>
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

  document.getElementById('form-dominio').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      nome: formData.get('nome'),
      dominio: formData.get('dominio'),
      ativo: formData.get('ativo') ? 1 : 0
    };

    try {
      Loading.show(isEdit ? 'Salvando...' : 'Criando...');
      
      if (isEdit) {
        await API.dominios.update(dominioId, data);
        Toast.success('Domínio atualizado!');
      } else {
        await API.dominios.create(data);
        Toast.success('Domínio criado!');
      }
      
      closeModal();
      loadDominios();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      Loading.hide();
    }
  });
}
