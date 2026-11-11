import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'حدث خطأ غير متوقع',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div className="surface-card" style={{ padding: 32, maxWidth: 480, textAlign: 'center' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 36, color: 'var(--gold)' }} aria-hidden />
            <h1 style={{ fontSize: 22, color: 'var(--primary)' }}>تعذر عرض الصفحة</h1>
            <p style={{ color: 'var(--mute)' }}>{this.state.message}</p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, message: '' })
                window.location.assign('/')
              }}
            >
              العودة للرئيسية
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
