import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-8 py-4 backdrop-blur-sm">
      <Link to="/" className="text-xl font-bold tracking-tight text-primary">
        MediScribe
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        <Link
          to="/#patient-experience"
          className="border-b-2 border-primary-container font-semibold text-primary-container"
        >
          How it works
        </Link>
        <Link to="/#clinical-insight" className="text-on-surface-variant transition-colors hover:text-primary">
          Your visit
        </Link>
        <Link to="/#trust" className="text-on-surface-variant transition-colors hover:text-primary">
          Privacy
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <Link to="/login" className="font-medium text-on-surface-variant transition-colors hover:text-primary">
          Sign in
        </Link>
        <Link
          to="/login"
          className="clinical-gradient rounded-lg px-5 py-2 font-medium text-white shadow-sm transition-opacity hover:opacity-90"
        >
          Try it
        </Link>
      </div>
    </nav>
  )
}
