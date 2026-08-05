import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import AdminLayout from './AdminLayout'
import { Loading, ErrorMessage } from '../../components/Shared'
import type { Client, Channel } from '../../types'

export default function AdminClienteEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'novo'
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [form, setForm] = useState({
    nome: '', slug: '', senha: '', tom_voz: '', areas_chave: '', regra_base_ref: '', ativo: true,
    channel_ids: [] as string[],
  })

  useEffect(() => {
    api.getAdminChannels().then(setChannels).catch(e => setError(e.message))
    if (!isNew) {
      api.getAdminClient(id!).then(c => setForm({
        nome: c.nome, slug: c.slug, senha: '', tom_voz: c.tom_voz || '', areas_chave: c.areas_chave || '',
        regra_base_ref: c.regra_base_ref || '', ativo: c.ativo,
        channel_ids: (c.channels || []).map((ch: any) => ch.channel_id),
      })).catch(e => setError(e.message)).finally(() => setLoading(false))
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isNew) {
        await api.createClient(form)
      } else {
        await api.updateClient(id!, form)
      }
      navigate('/admin/clientes')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLayout><Loading /></AdminLayout>

  return (
    <AdminLayout>
      <h2 className="font-titillium font-bold text-2xl text-ink mb-6">{isNew ? 'Novo cliente' : 'Editar cliente'}</h2>
      {error && <ErrorMessage message={error} />}
      <form onSubmit={handleSubmit} className="card p-6 space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">Nome</label>
          <input className="input-field" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">Slug</label>
          <input className="input-field" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">Senha {!isNew && '(deixe em branco para manter)'}</label>
          <input type="password" className="input-field" value={form.senha} onChange={e => setForm({...form, senha: e.target.value})} required={isNew} />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">Tom de voz</label>
          <textarea className="input-field" rows={2} value={form.tom_voz} onChange={e => setForm({...form, tom_voz: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">Áreas-chave</label>
          <input className="input-field" value={form.areas_chave} onChange={e => setForm({...form, areas_chave: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">Regra base (referência)</label>
          <input className="input-field" value={form.regra_base_ref} onChange={e => setForm({...form, regra_base_ref: e.target.value})} />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-2">
            <input type="checkbox" checked={form.ativo} onChange={e => setForm({...form, ativo: e.target.checked})} />
            Ativo
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-2 mb-2">Canais contratados</label>
          <div className="flex flex-wrap gap-2">
            {channels.map(ch => (
              <label key={ch.id} className="flex items-center gap-1 text-sm bg-fgx-gray rounded px-3 py-1 cursor-pointer hover:bg-line">
                <input type="checkbox" checked={form.channel_ids.includes(ch.id)}
                  onChange={e => {
                    if (e.target.checked) setForm({...form, channel_ids: [...form.channel_ids, ch.id]})
                    else setForm({...form, channel_ids: form.channel_ids.filter(cid => cid !== ch.id)})
                  }} />
                {ch.nome}
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/clientes')}>Cancelar</button>
        </div>
      </form>
    </AdminLayout>
  )
}
