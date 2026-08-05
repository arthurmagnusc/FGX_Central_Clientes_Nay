import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Logo, DemoCredBox } from '../components/Shared'

export default function AdminLogin() {
  const { adminLogin, type } = useAuth()
  const navigate = useNavigate()
  const [senha, setSenha] = useState('fgxadmin2026')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (type === 'admin') {
    navigate('/admin/dashboard')
    return null
  }

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
    <div className="min-h-screen bg-fgx-gray flex items-center justify-center px-4 py-10">
      <div className="card p-8 md:p-10 w-full max-w-md overflow-visible animate-fade-up">
        <div className="flex justify-center mb-6">
          <Logo size={48} />
        </div>
        <h1 className="font-titillium font-bold text-2xl text-center text-ink mb-1">Admin FGX</h1>
        <p className="text-center text-ink-3 text-sm mb-6 font-montserrat">Ambiente de teste / validação</p>

        <DemoCredBox>
          <p className="font-semibold text-ink mb-1">Como entrar (demo)</p>
          <p className="text-ink-2">
            Senha: <code className="font-titillium font-bold text-fgx-red">fgxadmin2026</code>
          </p>
          <p className="text-ink-3 text-xs mt-2">O campo já vem preenchido — basta clicar em Entrar.</p>
        </DemoCredBox>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-ink-2 mb-1.5" htmlFor="admin-senha">
              Senha de administrador
            </label>
            <input
              id="admin-senha"
              type="password"
              className="input-field"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
              autoFocus
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="bg-fgx-red/5 border border-fgx-red/20 rounded-lg px-4 py-3">
              <p className="text-fgx-red text-sm font-montserrat font-medium">{error}</p>
            </div>
          )}
          <button type="submit" className="btn-primary w-full py-2.5 text-base" disabled={submitting}>
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
