// App Principal - Controlador de Tabs e Inicialização

let currentTab = 'clientes';

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 IPTV Manager carregado');
  
  // Verificar health da API
  try {
    const health = await API.health();
    console.log('✅ API Status:', health);
  } catch (error) {
    console.error('❌ API Offline:', error);
    Toast.error('Erro ao conectar com a API');
    updateStatusIndicator(false);
    return;
  }

  // Carregar tab inicial
  showTab('clientes');
});

// Trocar de tab
function showTab(tabName) {
  // Remover classe active de todos os botões
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active', 'border-blue-600', 'text-blue-600');
    btn.classList.add('border-transparent', 'text-gray-600');
  });

  // Adicionar classe active no botão clicado
  const activeBtn = document.getElementById(`tab-${tabName}`);
  activeBtn.classList.add('active', 'border-blue-600', 'text-blue-600');
  activeBtn.classList.remove('border-transparent', 'text-gray-600');

  // Esconder todos os conteúdos
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });

  // Mostrar conteúdo da tab ativa
  document.getElementById(`content-${tabName}`).classList.remove('hidden');

  // Atualizar tab atual
  currentTab = tabName;

  // Carregar dados da tab
  loadTabData(tabName);
}

// Carregar dados de cada tab
async function loadTabData(tabName) {
  switch(tabName) {
    case 'clientes':
      await loadClientes();
      break;
    case 'grupos':
      await loadGrupos();
      break;
    case 'dominios':
      await loadDominios();
      break;
    case 'dns':
      await loadDns();
      break;
    case 'logs':
      await loadLogs();
      break;
    case 'config':
      await loadConfig();
      break;
  }
}

// Atualizar indicador de status
function updateStatusIndicator(online = true) {
  const indicator = document.getElementById('status-indicator');
  if (online) {
    indicator.innerHTML = `
      <span class="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
      <span class="text-sm">Online</span>
    `;
  } else {
    indicator.innerHTML = `
      <span class="h-2 w-2 bg-red-400 rounded-full"></span>
      <span class="text-sm">Offline</span>
    `;
  }
}

// Atalhos de teclado (opcional)
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + 1-6 para trocar tabs
  if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '6') {
    e.preventDefault();
    const tabs = ['clientes', 'grupos', 'dominios', 'dns', 'logs', 'config'];
    const index = parseInt(e.key) - 1;
    if (tabs[index]) {
      showTab(tabs[index]);
    }
  }

  // ESC para fechar modal
  if (e.key === 'Escape') {
    closeModal();
  }

  // Ctrl/Cmd + R para recarregar tab atual
  if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
    e.preventDefault();
    loadTabData(currentTab);
    Toast.info('Dados recarregados');
  }
});

// Auto-refresh (opcional - descomente se quiser)
// setInterval(() => {
//   if (currentTab === 'logs') {
//     loadLogs();
//   }
// }, 30000); // A cada 30 segundos

// Tornar funções globais
window.showTab = showTab;
window.loadTabData = loadTabData;

// Log de inicialização
console.log(`
╔══════════════════════════════════════╗
║   IPTV Playlist Manager v2.0.0      ║
║   Frontend carregado com sucesso!    ║
╚══════════════════════════════════════╝

Atalhos:
- Ctrl/Cmd + 1-5: Trocar tabs
- Ctrl/Cmd + R: Recarregar tab atual
- ESC: Fechar modal
`);
