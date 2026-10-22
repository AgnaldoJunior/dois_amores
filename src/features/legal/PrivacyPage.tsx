import type { ReactNode } from 'react'
import { AuthLayout, TextLink } from '@/features/auth/AuthLayout'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-2xl uppercase leading-none text-primary">{title}</h2>
      <div className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-primary">{children}</div>
    </section>
  )
}

/** Política de privacidade (pública; exigida para publicar o login com Google). */
export function PrivacyPage() {
  return (
    <AuthLayout title="Política de privacidade">
      <p className="font-mono text-xs uppercase tracking-label text-primary">Atualizada em 21 de outubro de 2026</p>

      <Section title="O que é o Dois Amores">
        <p>
          Um aplicativo gratuito e sem fins comerciais para registrar leituras e organizar clubes do livro entre amigas
          e amigos.
        </p>
      </Section>

      <Section title="Quais dados guardamos">
        <p>
          <strong>Conta:</strong> nome, e-mail e, se você entrar com Google, a foto do seu perfil Google. Se preferir,
          você pode enviar outra foto.
        </p>
        <p>
          <strong>Leituras:</strong> livros, datas de início e fim, notas, personagem e citação favoritos e comentários
          que você cadastrar.
        </p>
        <p>
          <strong>Clubes:</strong> clubes que você cria ou em que entra, livros propostos e votos.
        </p>
        <p>
          Fotos enviadas são redimensionadas no seu aparelho e têm os metadados (como localização) removidos antes do
          envio.
        </p>
      </Section>

      <Section title="Quem vê o quê">
        <p>
          Seu nome, sua foto e suas leituras aparecem para as pessoas cadastradas no app (feed e resumos de membros).
          Os dados de um clube só aparecem para os membros dele. Sua lista "Quero ler" é só sua.
        </p>
      </Section>

      <Section title="Serviços usados">
        <p>
          Supabase (banco de dados, login e arquivos), Vercel (hospedagem), Google (login com Google e sugestões por
          inteligência artificial com o Gemini) e Open Library (informações e capas de livros). Para as sugestões por
          IA, enviamos apenas títulos, autores, resumos e notas, nunca seu e-mail.
        </p>
        <p>Não vendemos dados nem usamos anúncios.</p>
      </Section>

      <Section title="Seus direitos">
        <p>
          Você pode editar seus dados a qualquer momento e excluir sua conta na tela de Perfil. A exclusão apaga
          perfil, leituras, posts e foto de forma definitiva.
        </p>
      </Section>

      <TextLink to="/">Voltar</TextLink>
    </AuthLayout>
  )
}
