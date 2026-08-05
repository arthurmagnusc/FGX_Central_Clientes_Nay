import { Link } from 'react-router-dom'
import { Logo } from '../components/Shared'

export default function Home() {
  return (
    <div className="min-h-screen bg-fgx-gray">
      <header className="fgx-gradient-header px-6 py-10 text-white">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Logo />
          <div>
            <p className="font-titillium font-black text-3xl tracking-wide">FGX</p>
            <p className="font-montserrat text-sm opacity-90">Portal do Cliente</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 -mt-4">
        <div className="card p-8">
          <h1 className="font-titillium font-bold text-2xl text-ink mb-2">
            Bem-vindo ao Portal do Cliente FGX
          </h1>
          <p className="font-montserrat text-ink-2 mb-8 leading-relaxed">
            Acesse os entregáveis do contrato e valide o conteúdo editorial do seu escritório.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link to="/c/fiedra" className="card p-5 border border-line hover:border-fgx-red transition-colors">
              <p className="font-titillium font-semibold text-lg text-ink">Entrar como cliente</p>
              <p className="text-sm text-ink-3 font-montserrat mt-1">Demo Fiedra</p>
              <p className="text-xs text-ink-2 font-montserrat mt-3 leading-relaxed">
                Nome: <span className="font-semibold text-fgx-red">Maria Teste</span>
                <br />
                Senha: <span className="font-semibold text-fgx-red">fiedra123</span>
              </p>
            </Link>
            <Link to="/admin" className="card p-5 border border-line hover:border-fgx-orange transition-colors">
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
