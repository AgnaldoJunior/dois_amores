/** URLs para onde o Supabase redireciona depois de confirmar e-mail, recuperar senha ou entrar com Google. */
export const authRedirect = {
  home: () => `${window.location.origin}/`,
  resetPassword: () => `${window.location.origin}/redefinir-senha`,
}

/** Destino seguro após o login: só caminhos internos. */
export function safeNext(from: unknown): string {
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/'
}
