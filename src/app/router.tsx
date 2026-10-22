import { createBrowserRouter, type RouteObject } from 'react-router'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { SignUpPage } from '@/features/auth/SignUpPage'
import { FeedPage } from '@/features/feed/FeedPage'
import { HomePage } from '@/features/home/HomePage'
import { PrivacyPage } from '@/features/legal/PrivacyPage'
import { PlaceholderPage } from '@/features/placeholder/PlaceholderPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { ReadingFormPage } from '@/features/readings/ReadingFormPage'
import { AppLayout } from './AppLayout'
import { RequireAuth } from './RequireAuth'

export const routes: RouteObject[] = [
  { path: 'entrar', element: <LoginPage /> },
  { path: 'cadastro', element: <SignUpPage /> },
  { path: 'recuperar-senha', element: <ForgotPasswordPage /> },
  { path: 'redefinir-senha', element: <ResetPasswordPage /> },
  { path: 'privacidade', element: <PrivacyPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'feed', element: <FeedPage /> },
          {
            path: 'meus-livros',
            element: <PlaceholderPage title="Meus livros" message="Sua prateleira está sendo montada." />,
          },
          {
            path: 'clubes',
            element: <PlaceholderPage title="Clubes" message="Seus clubes de leitura vão aparecer aqui." />,
          },
          { path: 'publicar', element: <ReadingFormPage /> },
          { path: 'leituras/:id/editar', element: <ReadingFormPage /> },
          { path: 'perfil', element: <ProfilePage /> },
          {
            path: '*',
            element: <PlaceholderPage title="Página não encontrada" message="Esta página se perdeu na estante." />,
          },
        ],
      },
    ],
  },
]

export const createRouter = () => createBrowserRouter(routes)
