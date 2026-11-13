import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { VideosProvider } from '@/app/providers/VideosProvider'
import { AppRouter } from '@/app/router'

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <VideosProvider>
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
          </VideosProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
