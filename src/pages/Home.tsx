import { Link } from 'react-router-dom'
import { Logo } from '../components/Shared'

export default function Home() {
  return (
    <div className="min-h-screen bg-fgx-gray">
      <header className="fgx-header px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Logo size={48} />
          <div className="leading-tight">
            <p className="font-titillium font-semibold text-lg text-ink">Central de Entregas</p>
            <p className="font-montserrat text-sm text-ink-3">FGX Gestão · Portal do Cliente</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="card p-8 sm:p-10 overflow-visible animate-fade-up">
          <h1 className="font-titillium font-bold text-2xl sm:text-[1.75rem] text-ink mb-2 tracking-tight">
            Bem-vindo ao Portal do Cliente
          </h1>
          <p className="font-montserrat text-ink-2 mb-8 leading-relaxed">
            Acesse os entregáveis do contrato e valide o conteúdo editorial do seu escritório.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/c/fiedra"
              className="card card-interactive p-5 overflow-visible no-underline"
            >
              <p className="font-titillium font-semibold text-lg text-ink">Entrar como cliente</p>
              <p className="text-sm text-ink-3 font-montserrat mt-1">Demo Fiedra</p>
              <p className="text-xs text-ink-2 font-montserrat mt-3 leading-relaxed">
                Nome: <span className="font-semibold text-fgx-red">Maria Teste</span>
                <br />
                Senha: <span className="font-semibold text-fgx-red">fiedra123</span>
              </p>
            </Link>
            <Link
              to="/admin"
              className="card card-interactive p-5 overflow-visible no-underline"
            >
              <p className="font-titillium font-semibold text-lg text-ink">Área administrativa</p>
              <p className="text-sm text-ink-3 font-montserrat mt-1">Equipe FGX</p>
              <p className="text-xs text-ink-2 font-montserrat mt-3 leading-relaxed">
                Senha: <span className="font-semibold text-fgx-red">fgxadmin2026</span>
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
