import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { SignUpPage } from '@/features/auth/SignUpPage'
import { ClubPage } from '@/features/clubs/ClubPage'
import { ClubReviewPage } from '@/features/clubs/ClubReviewPage'
import { ClubsPage } from '@/features/clubs/ClubsPage'
import { ClubSuggestionsPage } from '@/features/clubs/ClubSuggestionsPage'
import { CreateClubPage } from '@/features/clubs/CreateClubPage'
import { InvitePage } from '@/features/clubs/InvitePage'
import { MemberPage } from '@/features/clubs/MemberPage'
import { ProposePage } from '@/features/clubs/ProposePage'
import { RankingPage } from '@/features/clubs/RankingPage'
import { CommentsPage } from '@/features/feed/CommentsPage'
import { HomePage } from '@/features/home/HomePage'
import { PrivacyPage } from '@/features/legal/PrivacyPage'
import { MagazinePage } from '@/features/magazine/MagazinePage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { NumbersPage } from '@/features/numbers/NumbersPage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { FollowsPage } from '@/features/people/FollowsPage'
import { PersonPage } from '@/features/people/PersonPage'
import { PlaceholderPage } from '@/features/placeholder/PlaceholderPage'
import { AvatarBuilderPage } from '@/features/profile/AvatarBuilderPage'
import { FavoritesPage } from '@/features/profile/FavoritesPage'
import { ProfileOverviewPage } from '@/features/profile/ProfileOverviewPage'
import { ProfileEditPage } from '@/features/profile/ProfilePage'
import { SettingsPage } from '@/features/profile/SettingsPage'
import { QuizPage } from '@/features/quiz/QuizPage'
import { ReadingFormPage } from '@/features/readings/ReadingFormPage'
import { SearchPage } from '@/features/search/SearchPage'
import { BookPage } from '@/features/shelf/BookPage'
import { NewShelfPage } from '@/features/shelf/NewShelfPage'
import { ShelfDetailPage } from '@/features/shelf/ShelfDetailPage'
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
      // Telas de tela cheia, sem o menu inferior.
      { path: 'bem-vindo/:passo?', element: <OnboardingPage /> },
      { path: 'teste/:passo?', element: <QuizPage /> },
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'feed', element: <Navigate to="/" replace /> },
          { path: 'fichas/:postId', element: <CommentsPage /> },
          { path: 'notificacoes', element: <NotificationsPage /> },
          { path: 'buscar/:aba?', element: <SearchPage /> },
          { path: 'descobrir', element: <SuggestionsPage /> },

          { path: 'estantes', element: <ShelfPage /> },
          { path: 'estantes/nova', element: <NewShelfPage /> },
          { path: 'estantes/:shelf', element: <ShelfDetailPage /> },
          { path: 'meus-livros', element: <Navigate to="/estantes" replace /> },
          { path: 'meus-livros/sugestoes', element: <Navigate to="/descobrir" replace /> },
          { path: 'livros/:bookId', element: <BookPage /> },
          { path: 'publicar', element: <ReadingFormPage /> },
          { path: 'leituras/:id/editar', element: <ReadingFormPage /> },

          { path: 'numeros/:aba?', element: <NumbersPage /> },

          { path: 'clubes', element: <ClubsPage /> },
          { path: 'clubes/novo', element: <CreateClubPage /> },
          { path: 'convite/:code', element: <InvitePage /> },
          { path: 'clubes/:clubId/:aba?', element: <ClubPage /> },
          { path: 'clubes/:clubId/propor', element: <ProposePage /> },
          { path: 'clubes/:clubId/sugestoes', element: <ClubSuggestionsPage /> },
          { path: 'clubes/:clubId/membros/:userId', element: <MemberPage /> },
          { path: 'clubes/:clubId/revista', element: <MagazinePage /> },
          { path: 'clubes/:clubId/ranking', element: <RankingPage /> },
          { path: 'clubes/:clubId/livros/:clubBookId', element: <ClubReviewPage /> },

          { path: 'perfil', element: <ProfileOverviewPage /> },
          { path: 'perfil/editar', element: <ProfileEditPage /> },
          { path: 'perfil/avatar', element: <AvatarBuilderPage /> },
          { path: 'perfil/favoritos', element: <FavoritesPage /> },
          { path: 'configuracoes', element: <SettingsPage /> },
          { path: 'pessoas/:userId', element: <PersonPage /> },
          { path: 'pessoas/:userId/seguidores', element: <FollowsPage tab="seguidores" /> },
          { path: 'pessoas/:userId/seguindo', element: <FollowsPage tab="seguindo" /> },
          { path: 'pessoas/:userId/estantes/:shelf', element: <ShelfDetailPage /> },
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
