import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Logo } from '../components/Shared'

export default function AdminLogin() {
  const { adminLogin, type } = useAuth()
  const navigate = useNavigate()
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (type === 'admin') { navigate('/admin/dashboard'); return null }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await adminLogin(senha)
      navigate('/admin/dashboard')
    } catch (err: any) {
      setError(err.message || 'Senha inválida')
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
        <h1 className="font-titillium font-bold text-2xl text-center text-ink mb-6">Admin FGX</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Senha</label>
            <input type="password" className="input-field" value={senha} onChange={e => setSenha(e.target.value)}
              placeholder="Senha de administrador" autoFocus />
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
