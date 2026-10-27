import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthProvider'

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  getUser: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
}))
vi.mock('@/lib/supabase', () => ({ supabase: { auth } }))

const session = { access_token: 't', user: { id: 'apagado', email: 'x@example.com' } }

function Probe() {
  const { session, loading } = useAuth()
  return <p>{loading ? 'carregando' : session ? `logado:${session.user.id}` : 'deslogado'}</p>
}

beforeEach(() => {
  vi.clearAllMocks()
  auth.getSession.mockResolvedValue({ data: { session } })
  auth.signOut.mockResolvedValue({ error: null })
})

describe('AuthProvider', () => {
  it('mantém a sessão quando o servidor confirma o usuário', async () => {
    auth.getUser.mockResolvedValue({ data: { user: session.user }, error: null })
    render(<AuthProvider><Probe /></AuthProvider>)
    expect(await screen.findByText('logado:apagado')).toBeInTheDocument()
    expect(auth.signOut).not.toHaveBeenCalled()
  })

  it('sessão de conta que não existe mais: sai automaticamente', async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: { status: 403, code: 'user_not_found' } })
    render(<AuthProvider><Probe /></AuthProvider>)
    expect(await screen.findByText('deslogado')).toBeInTheDocument()
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('sem internet não desloga (o app funciona offline)', async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: { status: 0, name: 'AuthRetryableFetchError' } })
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('logado:apagado')).toBeInTheDocument())
    expect(auth.signOut).not.toHaveBeenCalled()
  })
})
