const API_BASE = '/api'

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Erro de rede' }))
    throw new Error(body.error || `Erro ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Auth
  clientLogin: (slug: string, senha: string, nome: string) =>
    request('/auth/cliente/login', { method: 'POST', body: JSON.stringify({ slug, senha, nome }) }),

  clientRename: (nome: string) =>
    request('/auth/cliente/rename', { method: 'POST', body: JSON.stringify({ nome }) }),

  adminLogin: (senha: string) =>
    request('/auth/admin/login', { method: 'POST', body: JSON.stringify({ senha }) }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  // Client portal
  getClientMe: () => request('/cliente/me'),
  getClientDeliverables: () => request('/cliente/deliverables'),
  getClientCycles: () => request('/cliente/cycles'),
  getClientCycle: (id: string) => request(`/cliente/cycles/${id}`),
  getClientPiece: (id: string) => request(`/cliente/pieces/${id}`),
  downloadDeliverable: (id: string) => request(`/cliente/deliverables/${id}/download`),

  createComment: (pieceId: string, data: { texto: string; piece_content_id?: string | null; trecho?: string | null }) =>
    request(`/cliente/pieces/${pieceId}/comments`, { method: 'POST', body: JSON.stringify(data) }),

  createApproval: (pieceId: string, tipo: 'aprovou' | 'solicitou_ajuste') =>
    request(`/cliente/pieces/${pieceId}/approvals`, { method: 'POST', body: JSON.stringify({ tipo }) }),

  // Admin
  getAdminClients: () => request('/admin/clients'),
  getAdminClient: (id: string) => request(`/admin/clients/${id}`),
  createClient: (data: any) => request('/admin/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: any) => request(`/admin/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getAdminDeliverables: () => request('/admin/deliverables'),
  createDeliverable: (data: FormData) => {
    return fetch(`${API_BASE}/admin/deliverables`, {
      method: 'POST',
      credentials: 'include',
      body: data,
    }).then(r => { if (!r.ok) throw new Error('Erro'); return r.json() })
  },

  getAdminCycles: () => request('/admin/cycles'),
  createCycle: (data: any) => request('/admin/cycles', { method: 'POST', body: JSON.stringify(data) }),
  updateCycle: (id: string, data: any) => request(`/admin/cycles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCycle: (id: string) => request(`/admin/cycles/${id}`, { method: 'DELETE' }),
  deleteDemoCycle: () => request('/admin/cycles/demo/fiedra', { method: 'DELETE' }),

  getAdminPieces: (cycleId: string) => request(`/admin/cycles/${cycleId}/pieces`),
  getAdminPiece: (id: string) => request(`/admin/pieces/${id}`),
  createPiece: (data: any) => request('/admin/pieces', { method: 'POST', body: JSON.stringify(data) }),
  updatePiece: (id: string, data: any) => request(`/admin/pieces/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  createPieceContent: (data: any) => request('/admin/piece-contents', { method: 'POST', body: JSON.stringify(data) }),
  updatePieceContent: (id: string, data: any) => request(`/admin/piece-contents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePieceContent: (id: string) => request(`/admin/piece-contents/${id}`, { method: 'DELETE' }),
  reorderPieceContents: (pieceId: string, ids: string[]) =>
    request(`/admin/pieces/${pieceId}/contents/reorder`, { method: 'PUT', body: JSON.stringify({ ids }) }),

  createTrail: (data: any) => request('/admin/trails', { method: 'POST', body: JSON.stringify(data) }),
  updateTrail: (id: string, data: any) => request(`/admin/trails/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTrail: (id: string) => request(`/admin/trails/${id}`, { method: 'DELETE' }),

  createReasoning: (data: any) => request('/admin/reasonings', { method: 'POST', body: JSON.stringify(data) }),
  updateReasoning: (id: string, data: any) => request(`/admin/reasonings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReasoning: (id: string) => request(`/admin/reasonings/${id}`, { method: 'DELETE' }),

  createSource: (data: any) => request('/admin/sources', { method: 'POST', body: JSON.stringify(data) }),
  updateSource: (id: string, data: any) => request(`/admin/sources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSource: (id: string) => request(`/admin/sources/${id}`, { method: 'DELETE' }),

  getAdminComments: (pieceId: string) => request(`/admin/pieces/${pieceId}/comments`),
  getCommentsByCycle: (cycleId: string) => request(`/admin/cycles/${cycleId}/comments`),

  createAdjustment: (data: any) => request('/admin/adjustments', { method: 'POST', body: JSON.stringify(data) }),
  updateAdjustment: (id: string, data: any) => request(`/admin/adjustments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  dispatchAdjustment: (id: string) => request(`/admin/adjustments/${id}/dispatch`, { method: 'POST' }),

  getAdditiveDocs: (clientId: string) => request(`/admin/clients/${clientId}/additive-docs`),
  createAdditiveDoc: (data: any) => request('/admin/additive-docs', { method: 'POST', body: JSON.stringify(data) }),
  updateAdditiveDoc: (id: string, data: any) => request(`/admin/additive-docs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  exportAdditiveDoc: (id: string) => request(`/admin/additive-docs/${id}/export`),

  getAdminChannels: () => request('/admin/channels'),
  changeAdminPassword: (senhaAtual: string, senhaNova: string) =>
    request('/auth/admin/change-password', { method: 'POST', body: JSON.stringify({ senhaAtual, senhaNova }) }),

  changeAdminInitialPassword: (senhaNova: string) =>
    request('/auth/admin/change-initial-password', { method: 'POST', body: JSON.stringify({ senhaNova }) }),
}
