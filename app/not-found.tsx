export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#080C14',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        fontSize: 120, fontWeight: 800,
        color: '#1E2D45',
        lineHeight: 1,
        letterSpacing: -4,
        marginBottom: 16,
      }}>404</div>
      <h1 style={{
        fontSize: 24, fontWeight: 700,
        color: '#F1F5F9', marginBottom: 8,
      }}>Page not found</h1>
      <p style={{
        fontSize: 15, color: '#475569',
        marginBottom: 32, maxWidth: 400,
        lineHeight: 1.6,
      }}>
        The page you are looking for does not
        exist or has been moved.
      </p>
      <a href="/" style={{
        padding: '12px 24px',
        background: '#3E7BFA',
        color: '#fff',
        borderRadius: 8,
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: 14,
      }}>← Back to QuizOps</a>
    </div>
  );
}
