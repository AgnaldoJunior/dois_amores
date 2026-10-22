type AuthLikeError = { code?: string; message?: string; status?: number } | null | undefined

const BY_CODE: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar. Procure a mensagem na sua caixa de entrada.',
  user_already_exists: 'Este e-mail já tem cadastro. Tente entrar ou recuperar a senha.',
  email_exists: 'Este e-mail já tem cadastro. Tente entrar ou recuperar a senha.',
  weak_password: 'A senha precisa ter pelo menos 8 caracteres, com letras e números.',
  same_password: 'A nova senha precisa ser diferente da atual.',
  over_email_send_rate_limit: 'Muitos e-mails enviados. Aguarde alguns minutos e tente de novo.',
  over_request_rate_limit: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  email_address_invalid: 'Este endereço de e-mail não é válido.',
  validation_failed: 'Confira os dados informados.',
  signup_disabled: 'Novos cadastros estão temporariamente desativados.',
  otp_expired: 'O link expirou. Peça um novo.',
  flow_state_expired: 'O link expirou. Peça um novo.',
  session_not_found: 'Sua sessão expirou. Entre novamente.',
}

/** Traduz erros do Supabase Auth para mensagens em português. */
export function translateAuthError(error: AuthLikeError): string {
  if (!error) return ''
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code]!
  const message = error.message?.toLowerCase() ?? ''
  if (message.includes('invalid login credentials')) return BY_CODE.invalid_credentials!
  if (message.includes('email not confirmed')) return BY_CODE.email_not_confirmed!
  if (message.includes('already registered')) return BY_CODE.user_already_exists!
  if (message.includes('password should be')) return BY_CODE.weak_password!
  if (message.includes('failed to fetch') || message.includes('network'))
    return 'Sem conexão. Verifique sua internet e tente de novo.'
  return 'Algo deu errado. Tente de novo em instantes.'
}

export const PASSWORD_MIN_LENGTH = 8

/** Mesma regra do Supabase (config.toml: letters_digits, mínimo 8). */
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return 'Use letras e números.'
  return null
}

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
