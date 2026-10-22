import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { isValidEmail, translateAuthError, validatePassword } from '@/lib/auth/authErrors'
import { renderApp } from '@/test/renderApp'
import { safeNext } from './authRedirects'

const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({ supabase: { auth } }))

beforeEach(() => vi.clearAllMocks())

describe('regras de autenticação', () => {
  it('traduz erros do Supabase', () => {
    expect(translateAuthError({ code: 'invalid_credentials' })).toBe('E-mail ou senha incorretos.')
    expect(translateAuthError({ message: 'Email not confirmed' })).toMatch(/Confirme seu e-mail/)
    expect(translateAuthError({ message: 'TypeError: Failed to fetch' })).toMatch(/Sem conexão/)
    expect(translateAuthError({ code: 'desconhecido' })).toMatch(/Algo deu errado/)
  })

  it('valida senha e e-mail com as mesmas regras do Supabase', () => {
    expect(validatePassword('curta1')).toMatch(/8 caracteres/)
    expect(validatePassword('somenteletras')).toMatch(/letras e números/)
    expect(validatePassword('livros2026')).toBeNull()
    expect(isValidEmail('leyna@example.com')).toBe(true)
    expect(isValidEmail('leyna@')).toBe(false)
  })

  it('só redireciona para caminhos internos depois do login', () => {
    expect(safeNext('/clubes')).toBe('/clubes')
    expect(safeNext('//evil.example')).toBe('/')
    expect(safeNext('https://evil.example')).toBe('/')
    expect(safeNext(undefined)).toBe('/')
  })
})

describe('tela de login', () => {
  it('tem campos com rótulo e não mostra login com Apple', () => {
    renderApp('/entrar', null)
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Continuar com Google' })).toBeInTheDocument()
    expect(screen.queryByText(/Apple/)).not.toBeInTheDocument()
  })

  it('mostra o erro traduzido quando a senha está errada', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } })
    renderApp('/entrar', null)
    await userEvent.type(screen.getByLabelText('E-mail'), 'leyna@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'leyna@example.com', password: 'errada123' })
  })

  it('login com Google volta para o app', async () => {
    auth.signInWithOAuth.mockResolvedValue({ error: null })
    renderApp('/entrar', null)
    await userEvent.click(screen.getByRole('button', { name: 'Continuar com Google' }))
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
  })
})

describe('cadastro', () => {
  it('valida os campos antes de chamar o Supabase', async () => {
    renderApp('/cadastro', null)
    await userEvent.type(screen.getByLabelText('E-mail'), 'leyna@example')
    await userEvent.type(screen.getByLabelText('Senha'), 'abc')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'abd')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(screen.getByLabelText('Nome')).toHaveAccessibleDescription('Conte como quer ser chamada(o).')
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Confirmar senha')).toHaveAccessibleDescription('As senhas não são iguais.')
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it('pede confirmação por e-mail depois do cadastro', async () => {
    auth.signUp.mockResolvedValue({ data: { session: null, user: { id: 'x' } }, error: null })
    renderApp('/cadastro', null)
    await userEvent.type(screen.getByLabelText('Nome'), 'Leyna')
    await userEvent.type(screen.getByLabelText('E-mail'), 'leyna@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'livros2026')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'livros2026')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('heading', { name: 'Confira seu e-mail' })).toBeInTheDocument()
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'leyna@example.com',
      password: 'livros2026',
      options: { data: { full_name: 'Leyna' }, emailRedirectTo: `${window.location.origin}/` },
    })
  })
})

describe('recuperação de senha', () => {
  it('envia o link apontando para /redefinir-senha', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null })
    renderApp('/recuperar-senha', null)
    await userEvent.type(screen.getByLabelText('E-mail'), 'irla@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }))
    await waitFor(() =>
      expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('irla@example.com', {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(/irla@example.com/)
  })

  it('link expirado mostra como pedir outro', () => {
    renderApp('/redefinir-senha', null)
    expect(screen.getByRole('alert')).toHaveTextContent(/expirou/)
    expect(screen.getByRole('link', { name: 'Pedir novo link' })).toBeInTheDocument()
  })
})
