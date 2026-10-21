import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { createRouter } from '@/app/router'
import { applyTokens } from '@/theme/cssVars'
import './index.css'

applyTokens()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={createRouter()} />
  </StrictMode>,
)
