export function LoadingState({ message = 'جاري تحميل البيانات...' }: { message?: string }) {
  return (
    <div className="surface-card" style={{ padding: 48, textAlign: 'center' }} role="status">
      <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 28, color: 'var(--primary-btn)' }} aria-hidden />
      <p style={{ marginTop: 12, color: 'var(--mute)', fontWeight: 700 }}>{message}</p>
    </div>
  )
}
