import { useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Logo } from '../components/Shared'

export default function ClienteLogin() {
  const { slug } = useParams<{ slug: string }>()
  const { type, clientLogin, loading, slug: loggedSlug } = useAuth()
  const navigate = useNavigate()
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <div className="p-8 text-center text-ink-3">Carregando...</div>
  if (type === 'cliente' && loggedSlug === slug) return <Navigate to={`/c/${slug}/entregaveis`} replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) { setError('Informe seu nome'); return }
    setError('')
    setSubmitting(true)
    try {
      await clientLogin(slug!, senha, nome.trim())
      navigate(`/c/${slug}/entregaveis`)
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-fgx-gray flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h1 className="font-titillium font-bold text-2xl text-center text-ink mb-1">Portal do Cliente</h1>
        <p className="text-center text-ink-3 text-sm mb-6 font-montserrat">{slug}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Seu nome</label>
            <input type="text" className="input-field" value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Como devemos te chamar?" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Senha do escritório</label>
            <input type="password" className="input-field" value={senha} onChange={e => setSenha(e.target.value)}
              placeholder="Senha compartilhada" />
          </div>
          {error && <p className="text-fgx-red text-sm font-montserrat font-medium">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
