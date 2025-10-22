// Cliente API centralizado
const API_BASE = '/api';

const API = {
  // Helpers
  async request(url, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na requisição');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Health Check
  async health() {
    return await this.request('/health');
  },

  // Grupos
  grupos: {
    getAll: async () => await API.request('/grupos'),
    getById: async (id) => await API.request(`/grupos/${id}`),
    create: async (data) => await API.request('/grupos', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: async (id, data) => await API.request(`/grupos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: async (id) => await API.request(`/grupos/${id}`, {
      method: 'DELETE'
    })
  },

  // Clientes
  clientes: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams(filters);
      return await API.request(`/clientes?${params}`);
    },
    getById: async (id) => await API.request(`/clientes/${id}`),
    getStats: async () => await API.request('/clientes/stats'),
    create: async (data) => await API.request('/clientes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: async (id, data) => await API.request(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: async (id) => await API.request(`/clientes/${id}`, {
      method: 'DELETE'
    }),
    getLogs: async (id, limit = 50) => await API.request(`/clientes/${id}/logs?limit=${limit}`)
  },

  // Domínios
  dominios: {
    getAll: async (apenasAtivos = false) => {
      return await API.request(`/dominios?ativos=${apenasAtivos}`);
    },
    getById: async (id) => await API.request(`/dominios/${id}`),
    create: async (data) => await API.request('/dominios', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: async (id, data) => await API.request(`/dominios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: async (id) => await API.request(`/dominios/${id}`, {
      method: 'DELETE'
    }),
    toggle: async (id) => await API.request(`/dominios/${id}/toggle`, {
      method: 'PATCH'
    })
  },

  // DNS
  dns: {
    getAll: async (apenasAtivos = false) => {
      return await API.request(`/dns?ativos=${apenasAtivos}`);
    },
    getById: async (id) => await API.request(`/dns/${id}`),
    create: async (data) => await API.request('/dns', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: async (id, data) => await API.request(`/dns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: async (id) => await API.request(`/dns/${id}`, {
      method: 'DELETE'
    }),
    toggle: async (id) => await API.request(`/dns/${id}/toggle`, {
      method: 'PATCH'
    }),
    preview: async (originalUrl, newDnsId) => await API.request('/dns/preview', {
      method: 'POST',
      body: JSON.stringify({ originalUrl, newDnsId })
    }),
    previewBulk: async (grupoId, newDnsId) => await API.request('/dns/preview-bulk', {
      method: 'POST',
      body: JSON.stringify({ grupoId, newDnsId })
    }),
    bulkChange: async (grupoId, newDnsId) => await API.request('/dns/bulk-change', {
      method: 'POST',
      body: JSON.stringify({ grupoId, newDnsId })
    })
  },

  // Configurações
  config: {
    getAll: async () => await API.request('/config'),
    get: async (key) => await API.request(`/config/${key}`),
    set: async (key, value, descricao) => await API.request('/config', {
      method: 'POST',
      body: JSON.stringify({ key, value, descricao })
    }),
    update: async (key, value, descricao) => await API.request(`/config/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, descricao })
    }),
    delete: async (key) => await API.request(`/config/${key}`, {
      method: 'DELETE'
    }),
    get2CaptchaKey: async () => await API.request('/config/2captcha/key'),
    set2CaptchaKey: async (apiKey) => await API.request('/config/2captcha/key', {
      method: 'POST',
      body: JSON.stringify({ apiKey })
    })
  },

  // Logs
  logs: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams(filters);
      return await API.request(`/logs?${params}`);
    },
    getById: async (id) => await API.request(`/logs/${id}`),
    getStats: async (clienteId = null) => {
      const params = clienteId ? `?cliente_id=${clienteId}` : '';
      return await API.request(`/logs/stats${params}`);
    },
    cleanup: async (days = 30) => await API.request(`/logs/cleanup?days=${days}`, {
      method: 'DELETE'
    })
  },

  // Ações (Playlists)
  acoes: {
    login: async (clienteId) => await API.request(`/acoes/${clienteId}/login`, {
      method: 'POST'
    }),
    getPlaylists: async (clienteId) => await API.request(`/acoes/${clienteId}/playlists`),
    getPlaylistsSnapshot: async (clienteId) => await API.request(`/acoes/${clienteId}/playlists-snapshot`),
    addPlaylist: async (clienteId, data) => await API.request(`/acoes/${clienteId}/playlists`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    editPlaylist: async (clienteId, playlistId, data) => {
      return await API.request(`/acoes/${clienteId}/playlists/${playlistId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    deletePlaylist: async (clienteId, playlistId, pin = null) => {
      return await API.request(`/acoes/${clienteId}/playlists/${playlistId}`, {
        method: 'DELETE',
        body: JSON.stringify({ pin })
      });
    }
  }
};
