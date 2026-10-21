import { createBrowserRouter, type RouteObject } from 'react-router'
import { HomePage } from '@/features/home/HomePage'
import { PlaceholderPage } from '@/features/placeholder/PlaceholderPage'
import { AppLayout } from './AppLayout'

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'feed',
        element: <PlaceholderPage title="Feed" message="As leituras de todo mundo vão aparecer aqui." />,
      },
      {
        path: 'meus-livros',
        element: <PlaceholderPage title="Meus livros" message="Sua prateleira está sendo montada." />,
      },
      {
        path: 'clubes',
        element: <PlaceholderPage title="Clubes" message="Seus clubes de leitura vão aparecer aqui." />,
      },
      {
        path: 'publicar',
        element: <PlaceholderPage title="Publicar leitura" message="O formulário chega em breve." />,
      },
      {
        path: '*',
        element: <PlaceholderPage title="Página não encontrada" message="Esta página se perdeu na estante." />,
      },
    ],
  },
]

export const createRouter = () => createBrowserRouter(routes)
