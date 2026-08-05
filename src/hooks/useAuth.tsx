import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../lib/api'

interface AuthState {
  type: 'cliente' | 'admin' | null
  clientId: string | null
  adminId: string | null
  slug: string | null
  pessoaNome: string | null
  clientData: any | null
}

interface AuthContextValue extends AuthState {
  loading: boolean
  clientLogin: (slug: string, senha: string, nome: string) => Promise<void>
  clientRename: (nome: string) => Promise<void>
  adminLogin: (senha: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    type: null, clientId: null, adminId: null, slug: null, pessoaNome: null, clientData: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getClientMe().then(data => {
      setAuth({ type: 'cliente', clientId: data.client_id, adminId: null, slug: data.slug, pessoaNome: data.pessoa_nome, clientData: data })
    }).catch(() => {
      setAuth({ type: null, clientId: null, adminId: null, slug: null, pessoaNome: null, clientData: null })
    }).finally(() => setLoading(false))
  }, [])

  const clientLogin = async (slug: string, senha: string, nome: string) => {
    const data = await api.clientLogin(slug, senha, nome)
    setAuth({ type: 'cliente', clientId: data.client_id, adminId: null, slug: data.slug, pessoaNome: data.pessoa_nome, clientData: data })
  }

  const clientRename = async (nome: string) => {
    await api.clientRename(nome)
    setAuth(prev => ({ ...prev, pessoaNome: nome }))
  }

  const adminLogin = async (senha: string) => {
    const data = await api.adminLogin(senha)
    setAuth({ ...data, type: 'admin', slug: null, clientData: null })
  }

  const logout = async () => {
    await api.logout()
    setAuth({ type: null, clientId: null, adminId: null, slug: null, pessoaNome: null, clientData: null })
  }

  return (
    <AuthContext.Provider value={{ ...auth, loading, clientLogin, clientRename, adminLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
