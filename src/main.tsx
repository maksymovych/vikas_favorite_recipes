import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App'
import { FavoritesProvider } from './favorites'
import { LangProvider } from './i18n'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <FavoritesProvider>
          <App />
        </FavoritesProvider>
      </LangProvider>
    </BrowserRouter>
  </StrictMode>,
)
