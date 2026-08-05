import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import '../styles/portal-admin.css'

export default function AdminLogin() {
  const { adminLogin, type } = useAuth()
  const navigate = useNavigate()
  const [senha, setSenha] = useState('fgxadmin2026')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (type === 'admin') {
    navigate('/admin/ciclos')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await adminLogin(senha)
      navigate('/admin/ciclos')
    } catch (err: any) {
      setError(err.message || 'Senha inválida')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="login-card">
        <div className="logo">FGX</div>
        <h1>Painel administrativo</h1>
        <p className="sub">Área interna da equipe FGX</p>
        <div className="warn">
          <b>Ambiente de validação.</b> Use a senha demo abaixo. Em produção, troque a senha inicial assim que entrar.
        </div>
        {error && <div className="err">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="pw">Senha de administrador</label>
            <input
              id="pw"
              className="inp"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoFocus
            />
          </div>
          <button className="btn btn-dark btn-full" type="submit" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <div className="demo-creds">
          No ambiente de validação, a senha é <code>fgxadmin2026</code>.
        </div>
      </div>
    </div>
  )
}
