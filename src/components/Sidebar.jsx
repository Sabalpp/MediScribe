import { Link } from 'react-router-dom'

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', href: '#' },
  { icon: 'mic_external_on', label: 'Live Session', href: '#', active: true },
  { icon: 'history', label: 'History', href: '#' },
  { icon: 'person_search', label: 'Patient Records', href: '#' },
  { icon: 'settings', label: 'Settings', href: '#' },
]

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-transparent bg-surface-container-low">
      <div className="flex h-full flex-col gap-2 p-4">
        <div className="px-3 py-6">
          <Link to="/" className="text-lg font-black tracking-tighter text-primary">
            MediScribe
          </Link>
        </div>

        <div className="mb-4 flex items-center gap-3 px-3 py-4">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-primary-container text-on-primary-container">
            <span className="material-symbols-outlined text-[20px]">person</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-on-surface">Dr. Richardson</span>
            <span className="text-xs text-outline">General Surgery</span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-all ${
                item.active
                  ? 'bg-white text-primary-container shadow-sm'
                  : 'text-outline hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="mt-auto px-2">
          <button className="clinical-gradient mb-6 w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm active:scale-[0.98] transition-transform duration-200">
            New Session
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-outline hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
            <span>Support</span>
          </a>
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-outline hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Sign Out</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}
