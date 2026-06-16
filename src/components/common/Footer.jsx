const Footer = () => {
  return (
    <footer className="border-t border-gray-100 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink/40">
        <p>© {new Date().getFullYear()} RateIt. All rights reserved.</p>
        <p>Built with React, Express & PostgreSQL</p>
      </div>
    </footer>
  )
}

export default Footer