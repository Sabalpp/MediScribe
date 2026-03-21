import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="fixed top-0 z-50 flex w-full items-center justify-between bg-surface px-8 py-4">
      <Link to="/" className="text-xl font-bold tracking-tight text-primary">
        MediScribe
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        <a href="#" className="border-b-2 border-primary-container font-semibold text-primary-container">
          Product
        </a>
        <a href="#" className="text-on-surface-variant hover:text-primary transition-colors">
          Solutions
        </a>
        <a href="#" className="text-on-surface-variant hover:text-primary transition-colors">
          Security
        </a>
      </div>

      <div className="flex items-center gap-6">
        <Link to="/login" className="font-medium text-on-surface-variant hover:text-primary transition-colors">
          Login
        </Link>
        <Link
          to="/dashboard"
          className="clinical-gradient rounded-lg px-5 py-2 font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
        >
          Demo
        </Link>
      </div>
    </nav>
  )
}
