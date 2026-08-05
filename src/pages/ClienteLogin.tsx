import { useState, useEffect } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Logo, DemoCredBox } from '../components/Shared'

export default function ClienteLogin() {
  const { slug } = useParams<{ slug: string }>()
  const { type, clientLogin, loading, slug: loggedSlug } = useAuth()
  const navigate = useNavigate()
  const isFiedraDemo = slug === 'fiedra'
  const [senha, setSenha] = useState(isFiedraDemo ? 'fiedra123' : '')
  const [nome, setNome] = useState(isFiedraDemo ? 'Maria Teste' : '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [accessState, setAccessState] = useState<'ok' | 'not_configured'>('ok')

  useEffect(() => {
    setAccessState('ok')
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-fgx-gray flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-fgx-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (type === 'cliente' && loggedSlug === slug) {
    return <Navigate to={`/c/${slug}/entregaveis`} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      setError('Informe seu nome para continuar')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await clientLogin(slug!, senha, nome.trim())
      navigate(`/c/${slug}/entregaveis`)
    } catch (err: any) {
      const msg = err.message || 'Erro ao entrar'
      if (msg.includes('não configurado')) setAccessState('not_configured')
      else setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (accessState === 'not_configured') {
    return (
      <div className="min-h-screen bg-fgx-gray flex items-center justify-center px-4">
        <div className="card p-10 w-full max-w-md text-center overflow-visible">
          <div className="flex justify-center mb-6">
            <Logo size={48} />
          </div>
          <h1 className="font-titillium font-bold text-2xl text-ink mb-2">Acesso não liberado</h1>
          <p className="text-ink-3 text-sm font-montserrat leading-relaxed">
            O acesso ao portal para <strong>{slug}</strong> ainda não foi configurado pela equipe FGX. Entre em
            contato com seu gerente de relacionamento.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fgx-gray flex items-center justify-center px-4 py-10">
      <div className="card p-8 md:p-10 w-full max-w-md overflow-visible animate-fade-up">
        <div className="flex justify-center mb-6">
          <Logo size={48} />
        </div>
        <h1 className="font-titillium font-bold text-2xl text-center text-ink mb-1">Portal do Cliente</h1>
        <p className="text-center text-ink-3 text-sm mb-6 font-montserrat">
          {slug && (
            <span className="inline-block bg-fgx-gray px-3 py-0.5 rounded-full font-medium text-ink-2">{slug}</span>
          )}
        </p>

        {isFiedraDemo && (
          <DemoCredBox>
            <p className="font-semibold text-ink mb-2">Como entrar (demo Fiedra)</p>
            <ul className="space-y-1 text-ink-2">
              <li>
                Nome: <code className="font-titillium font-bold text-fgx-red">Maria Teste</code>
              </li>
              <li>
                Senha: <code className="font-titillium font-bold text-fgx-red">fiedra123</code>
              </li>
            </ul>
            <p className="text-ink-3 text-xs mt-2">Campos já preenchidos — basta clicar em Entrar.</p>
          </DemoCredBox>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-ink-2 mb-1.5" htmlFor="cliente-nome">
              Seu nome
            </label>
            <input
              id="cliente-nome"
              type="text"
              className="input-field"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Como devemos te chamar?"
              autoFocus={!isFiedraDemo}
              autoComplete="name"
            />
            <p className="text-xs text-ink-3 mt-1">Seu nome aparecerá nos comentários e aprovações</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-2 mb-1.5" htmlFor="cliente-senha">
              Senha do escritório
            </label>
            <input
              id="cliente-senha"
              type="password"
              className="input-field"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha compartilhada"
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
