import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import AdminLayout from './AdminLayout'

export default function AdminSenha() {
  const navigate = useNavigate()
  const [hasInitial, setHasInitial] = useState(true)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getClientMe().catch(() => {}).then(() => setHasInitial(false)).catch(() => setHasInitial(false))
    // Try admin me to check if initial password
    api.getAdminChannels().then(() => setHasInitial(false)).catch(() => setHasInitial(true))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (senhaNova !== confirmar) { setError('Senhas não conferem'); return }
    if (senhaNova.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return }
    setSaving(true)
    try {
      if (hasInitial) {
        await api.changeAdminInitialPassword(senhaNova)
        setSuccess('Senha alterada com sucesso!')
        setHasInitial(false)
      } else {
        await api.changeAdminPassword(senhaAtual, senhaNova)
        setSuccess('Senha alterada com sucesso!')
      }
      setSenhaAtual(''); setSenhaNova(''); setConfirmar('')
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <h2 className="font-titillium font-bold text-2xl text-ink mb-6">Alterar senha</h2>

      {hasInitial && (
        <div className="card p-4 mb-6 bg-fgx-gold/10 border-fgx-gold">
          <p className="text-sm font-montserrat font-semibold text-ink">A senha inicial ainda não foi trocada. Altere-a agora por segurança.</p>
        </div>
      )}

      {success && <div className="card p-3 mb-4 bg-fgx-green/10 border-fgx-green text-fgx-green text-sm font-montserrat">{success}</div>}
      {error && <div className="card p-3 mb-4 bg-fgx-red/10 border-fgx-red text-fgx-red text-sm font-montserrat">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-4 max-w-md">
        {!hasInitial && (
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Senha atual</label>
            <input type="password" className="input-field" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} required />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">Nova senha</label>
          <input type="password" className="input-field" value={senhaNova} onChange={e => setSenhaNova(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">Confirmar nova senha</label>
          <input type="password" className="input-field" value={confirmar} onChange={e => setConfirmar(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Alterar senha'}</button>
      </form>
    </AdminLayout>
  )
}
