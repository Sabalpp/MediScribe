import { Link, useLocation, useNavigate } from 'react-router-dom'
import BrandMark from './BrandMark'

function scrollToHash(hash) {
  const el = document.getElementById(hash)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
    return true
  }
  return false
}

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleAnchorClick = (e, hash) => {
    e.preventDefault()
    if (location.pathname === '/') {
      scrollToHash(hash)
    } else {
      navigate('/')
      setTimeout(() => scrollToHash(hash), 100)
    }
  }

  return (
    <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-8 py-4 backdrop-blur-sm">
      <Link to="/" className="flex items-center">
        <BrandMark showWordmark wordmarkClassName="text-xl font-bold tracking-tight text-primary" />
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        <a
          href="#patient-experience"
          onClick={(e) => handleAnchorClick(e, 'patient-experience')}
          className="border-b-2 border-primary-container font-semibold text-primary-container"
        >
          How it works
        </a>
        <a
          href="#clinical-insight"
          onClick={(e) => handleAnchorClick(e, 'clinical-insight')}
          className="text-on-surface-variant transition-colors hover:text-primary"
        >
          Your visit
        </a>
        <a
          href="#trust"
          onClick={(e) => handleAnchorClick(e, 'trust')}
          className="text-on-surface-variant transition-colors hover:text-primary"
        >
          Privacy
        </a>
      </div>

      <div className="flex items-center gap-6">
        <Link to="/login" className="font-medium text-on-surface-variant transition-colors hover:text-primary">
          Sign up
        </Link>
        <Link
          to="/login"
          className="clinical-gradient rounded-lg px-5 py-2 font-medium text-white shadow-sm transition-opacity hover:opacity-90"
        >
          Launch MediScribe
        </Link>
      </div>
    </nav>
  )
}
