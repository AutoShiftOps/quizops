// Minimal 404 for the embed route — no NavBar/footer (already suppressed
// for /embed/* by SiteChrome), no links back into the main site, since this
// renders inside someone else's iframe.
export default function EmbedNotFound() {
  return (
    <div style={{ textAlign: 'center', paddingTop: 40, color: '#94A3B8', fontSize: 14 }}>
      Quiz not found.
    </div>
  );
}
