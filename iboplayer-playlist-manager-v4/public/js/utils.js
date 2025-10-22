// Utilitários gerais

// Toast Notifications
const Toast = {
  show(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const icons = {
      success: '<i class="fas fa-check-circle"></i>',
      error: '<i class="fas fa-exclamation-circle"></i>',
      warning: '<i class="fas fa-exclamation-triangle"></i>',
      info: '<i class="fas fa-info-circle"></i>'
    };

    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    };

    toast.className = `${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300 translate-x-full opacity-0`;
    toast.innerHTML = `
      <span class="text-xl">${icons[type]}</span>
      <span class="font-medium">${message}</span>
      <button onclick="this.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
        <i class="fas fa-times"></i>
      </button>
    `;

    container.appendChild(toast);

    // Animar entrada
    setTimeout(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
    }, 10);

    // Auto-remover
    if (duration > 0) {
      setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  },

  success(message, duration) {
    this.show(message, 'success', duration);
  },

  error(message, duration) {
    this.show(message, 'error', duration);
  },

  warning(message, duration) {
    this.show(message, 'warning', duration);
  },

  info(message, duration) {
    this.show(message, 'info', duration);
  }
};

// Loading Spinner
const Loading = {
  show(message = 'Carregando...') {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
        <div class="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
          <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
          <p class="text-gray-700 font-medium">${message}</p>
        </div>
      </div>
    `;
  },

  hide() {
    document.getElementById('modal-container').innerHTML = '';
  }
};

// Confirmação
function confirm(message, onConfirm, onCancel = null) {
  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold mb-4 text-gray-800">Confirmação</h3>
        <p class="text-gray-600 mb-6">${message}</p>
        <div class="flex justify-end space-x-3">
          <button onclick="closeModal(); ${onCancel ? onCancel.name + '()' : ''}" 
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">
            Cancelar
          </button>
          <button onclick="closeModal(); ${onConfirm.name}()" 
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  `;
}

// Fechar modal
function closeModal() {
  document.getElementById('modal-container').innerHTML = '';
}

// Formatar data
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Formatar aplicativo
function formatAplicativo(app) {
  const apps = {
    'iboplayer': 'IBOPlayer',
    'ibopro': 'IBOPro',
    'vuplayer': 'VU Player'
  };
  return apps[app] || app;
}

// Badge de status
function statusBadge(ativo) {
  if (ativo === 1 || ativo === true) {
    return '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Ativo</span>';
  } else {
    return '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Inativo</span>';
  }
}

// Badge de aplicativo
function appBadge(app) {
  const colors = {
    'iboplayer': 'bg-blue-100 text-blue-800',
    'ibopro': 'bg-purple-100 text-purple-800',
    'vuplayer': 'bg-green-100 text-green-800'
  };
  
  return `<span class="px-2 py-1 ${colors[app] || 'bg-gray-100 text-gray-800'} text-xs font-semibold rounded-full">${formatAplicativo(app)}</span>`;
}

// Debounce para inputs de busca
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Validar MAC Address
function isValidMAC(mac) {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
}

// Validar URL
function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Copiar para clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    Toast.success('Copiado para a área de transferência!');
  } catch (err) {
    Toast.error('Erro ao copiar');
  }
}

// Exportar dados como JSON
function exportJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  Toast.success('Arquivo exportado!');
}

// Filtrar tabela
function filterTable(tableId, searchValue) {
  const table = document.getElementById(tableId);
  if (!table) return;
  
  const rows = table.querySelectorAll('tbody tr');
  const search = searchValue.toLowerCase();
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(search) ? '' : 'none';
  });
}
