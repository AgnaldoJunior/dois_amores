import { createBrowserRouter, type RouteObject } from 'react-router'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { SignUpPage } from '@/features/auth/SignUpPage'
import { ClubPage } from '@/features/clubs/ClubPage'
import { ClubsPage } from '@/features/clubs/ClubsPage'
import { ClubSuggestionsPage } from '@/features/clubs/ClubSuggestionsPage'
import { CreateClubPage } from '@/features/clubs/CreateClubPage'
import { MemberPage } from '@/features/clubs/MemberPage'
import { ProposePage } from '@/features/clubs/ProposePage'
import { FeedPage } from '@/features/feed/FeedPage'
import { HomePage } from '@/features/home/HomePage'
import { PrivacyPage } from '@/features/legal/PrivacyPage'
import { MagazinePage } from '@/features/magazine/MagazinePage'
import { PlaceholderPage } from '@/features/placeholder/PlaceholderPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { ReadingFormPage } from '@/features/readings/ReadingFormPage'
import { BookPage } from '@/features/shelf/BookPage'
import { ShelfPage } from '@/features/shelf/ShelfPage'
import { SuggestionsPage } from '@/features/shelf/SuggestionsPage'
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
          { path: 'meus-livros', element: <ShelfPage /> },
          { path: 'meus-livros/sugestoes', element: <SuggestionsPage /> },
          { path: 'livros/:bookId', element: <BookPage /> },
          { path: 'clubes', element: <ClubsPage /> },
          { path: 'clubes/novo', element: <CreateClubPage /> },
          { path: 'clubes/:clubId', element: <ClubPage /> },
          { path: 'clubes/:clubId/propor', element: <ProposePage /> },
          { path: 'clubes/:clubId/sugestoes', element: <ClubSuggestionsPage /> },
          { path: 'clubes/:clubId/membros/:userId', element: <MemberPage /> },
          { path: 'clubes/:clubId/revista', element: <MagazinePage /> },
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
