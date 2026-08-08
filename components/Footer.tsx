export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#E4E4E7] mt-auto" style={{ padding: '24px' }}>
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-2 text-center">
        <p className="text-[13px] text-[#71717A]">© 2026 QuizOps by AutoShiftOps</p>
        <nav className="flex items-center gap-4 text-[13px]">
          <a href="/legal/terms" className="text-[#3E7BFA] hover:underline">
            Terms
          </a>
          <a href="/legal/privacy" className="text-[#3E7BFA] hover:underline">
            Privacy
          </a>
          <a href="/security" className="text-[#3E7BFA] hover:underline">
            Security
          </a>
          <a href="/about" className="text-[#3E7BFA] hover:underline">
            About
          </a>
        </nav>
      </div>
    </footer>
  );
}
