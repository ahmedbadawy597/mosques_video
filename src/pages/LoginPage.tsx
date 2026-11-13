import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { APP_CONFIG } from '@/config/app'
import { getAuthErrorMessage, useAuth } from '@/app/providers/AuthProvider'
import { clearTokens } from '@/lib/auth/tokenStorage'
import { isAssistantUser } from '@/lib/api/types'
import './login.css'

export function LoginPage() {
  const { login, logout, isAssistant, loading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = `دخول الإدارة — ${APP_CONFIG.title}`
  }, [])

  if (!loading && isAuthenticated && isAssistant) {
    return <Navigate to="/manage" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const logged = await login(username, password)
      if (!isAssistantUser(logged)) {
        await logout()
        clearTokens()
        setError('هذا الحساب ليس لديه صلاحية إدارة المساجد (مطلوب دور المساعد).')
        return
      }
      navigate('/manage', { replace: true })
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel surface-card">
        <div className="login-hero">
          <img
            src={APP_CONFIG.logoUrl}
            alt=""
            width={88}
            height={88}
            decoding="async"
          />
          <p className="login-org">{APP_CONFIG.orgName}</p>
          <h1>دخول إدارة المساجد</h1>
          <p>للمساعد فقط — باقي المنصة متاحة للجميع دون تسجيل دخول</p>
        </div>

        <form className="login-form" onSubmit={(e) => void onSubmit(e)} noValidate>
          <label className="login-field">
            <span>اسم المستخدم</span>
            <input
              className="input"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="أدخل اسم المستخدم"
              required
            />
          </label>

          <label className="login-field">
            <span>كلمة المرور</span>
            <div className="login-pass">
              <input
                className="input"
                name="password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                required
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden />
              </button>
            </div>
          </label>

          {error ? (
            <div className="login-error" role="alert">
              {error}
            </div>
          ) : null}

          <button className="btn btn-primary login-submit" type="submit" disabled={busy}>
            {busy ? 'جاري التحقق…' : 'دخول الإدارة'}
          </button>
        </form>

        <Link className="login-back" to="/">
          العودة للمنصة العامة
        </Link>
        <p className="login-powered">{APP_CONFIG.poweredBy}</p>
      </div>
    </div>
  )
}
