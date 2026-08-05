import { useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { CLIENT_OFFICE } from '../data/fiedra-demo'
import '../styles/portal-cliente.css'

export default function ClienteLogin() {
  const { slug } = useParams<{ slug: string }>()
  const { type, clientLogin, loading, slug: loggedSlug } = useAuth()
  const navigate = useNavigate()
  const isFiedraDemo = slug === 'fiedra'
  const [senha, setSenha] = useState(isFiedraDemo ? 'fiedra2026' : '')
  const [nome, setNome] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="portal-login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="logo">FGX</div>
      </div>
    )
  }
  if (type === 'cliente' && loggedSlug === slug) {
    return <Navigate to={`/c/${slug}/visao`} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || nome.trim().length < 2) {
      setError('Informe seu nome para entrarmos.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await clientLogin(slug!, senha, nome.trim())
      navigate(`/c/${slug}/visao`)
    } catch (err: any) {
      setError(err.message || 'Senha incorreta.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="portal-login">
      <div className="login-card">
        <div className="logo">FGX</div>
        <h1>Portal do Cliente</h1>
        <p className="sub">{isFiedraDemo ? 'Fiedra, Britto & Ferreira Neto Advocacia Empresarial' : slug}</p>
        {error && <div className="err">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="pw">Senha de acesso</label>
            <input
              id="pw"
              type="password"
              autoComplete="current-password"
              placeholder="Senha compartilhada do escritório"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="nm">Seu nome</label>
            <input
              id="nm"
              type="text"
              autoComplete="name"
              placeholder="Como você quer aparecer nos comentários"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
            />
            <p className="hint">Usamos seu nome para identificar automaticamente cada comentário e cada aprovação.</p>
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        {isFiedraDemo && (
          <div className="demo-creds">
            No ambiente de validação, a senha é <code>fiedra2026</code>.
            <br />
            Escritório: {CLIENT_OFFICE}
          </div>
        )}
      </div>
    </div>
  )
}
