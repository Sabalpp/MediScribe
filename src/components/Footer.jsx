import { Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import BrandMark from './BrandMark'

export default function Footer() {
  const { showToast } = useToast()

  return (
    <footer className="dark-section px-8 pb-12 pt-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="mb-6">
              <BrandMark
                size="lg"
                variant="onDark"
                showWordmark
                wordmarkClassName="text-2xl font-black text-white"
              />
            </div>
            <p className="mb-8 max-w-xs font-medium text-white/60">
              Understand every word your doctor says, in the language you think in.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => showToast('Share link copied (demo).')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 transition-all hover:bg-white/20 hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">share</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-white">Help</h4>
            <ul className="space-y-4 text-sm font-medium text-white/60">
              <li>
                <button type="button" onClick={() => showToast('Get help — demo.')} className="text-left hover:text-white">
                  Get help
                </button>
              </li>
              <li>
                <button type="button" onClick={() => showToast('How it works — demo.')} className="text-left hover:text-white">
                  How it works
                </button>
              </li>
              <li>
                <a href="mailto:support@mediscribe.demo" className="hover:text-white">
                  Contact us
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-white">Legal</h4>
            <ul className="space-y-4 text-sm font-medium text-white/60">
              <li>
                <button type="button" onClick={() => showToast('Privacy policy — full text coming soon (demo).')} className="text-left hover:text-white">
                  Privacy
                </button>
              </li>
              <li>
                <button type="button" onClick={() => showToast('Accessibility statement — demo.')} className="text-left hover:text-white">
                  Accessibility
                </button>
              </li>
              <li>
                <button type="button" onClick={() => showToast('Terms of use — demo.')} className="text-left hover:text-white">
                  Terms of use
                </button>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/[0.08] p-8 md:col-span-4 md:sticky md:top-24 md:z-10 md:self-start md:shadow-[0_12px_40px_rgba(0,0,0,0.35)] md:backdrop-blur-sm">
            <h4 className="mb-4 text-lg font-black text-white">Take control of your health today</h4>
            <p className="mb-6 text-sm font-medium text-white/60">
              Don't just listen, when you can truly understand with MediScribe.
            </p>
            <Link
              to="/login"
              className="clinical-gradient mb-4 block w-full rounded-lg py-3 text-center font-bold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Launch MediScribe
            </Link>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
              YOUR DATA IS PROTECTED WITH GoDaddy
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs font-bold uppercase tracking-widest text-white/40 md:flex-row">
          <div>&copy; {new Date().getFullYear()} MediScribe. All rights reserved.</div>
          <div className="flex flex-wrap justify-center gap-8">
            <button type="button" onClick={() => showToast('Privacy Policy — full text coming soon (demo).')} className="hover:text-white">
              Privacy Policy
            </button>
            <button type="button" onClick={() => showToast('Terms of Service — full text coming soon (demo).')} className="hover:text-white">
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
