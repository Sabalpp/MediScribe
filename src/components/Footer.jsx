import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-outline-variant/10 bg-surface px-8 pb-12 pt-24 text-on-surface-variant">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="mb-6 text-2xl font-black text-primary">MediScribe</div>
            <p className="mb-8 max-w-xs font-medium">
              Engineering global health equity through architectural clinical precision and linguistic intelligence.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high transition-all hover:bg-primary-container hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">public</span>
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high transition-all hover:bg-primary-container hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">share</span>
              </a>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-on-surface">Platform</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="hover:text-primary">EHR Integration</a></li>
              <li><a href="#" className="hover:text-primary">Security &amp; HIPAA</a></li>
              <li><a href="#" className="hover:text-primary">Medical SDK</a></li>
              <li><a href="#" className="hover:text-primary">Pricing</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-on-surface">Company</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="hover:text-primary">Our Story</a></li>
              <li><a href="#" className="hover:text-primary">Research Papers</a></li>
              <li><a href="#" className="hover:text-primary">Clinical Partners</a></li>
              <li><a href="#" className="hover:text-primary">Careers</a></li>
            </ul>
          </div>

          <div className="rounded-xl bg-surface-container-low p-8 md:col-span-4">
            <h4 className="mb-4 text-lg font-black text-on-surface">Ready to transform your clinic?</h4>
            <p className="mb-6 text-sm font-medium">Join over 400 leading healthcare institutions using MediScribe.</p>
            <Link
              to="/login"
              className="clinical-gradient mb-4 block w-full rounded-lg py-3 text-center font-bold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Request a Demo
            </Link>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-outline">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
              HIPAA &amp; GDPR COMPLIANT
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/20 pt-8 text-xs font-bold uppercase tracking-widest opacity-50 md:flex-row">
          <div>&copy; {new Date().getFullYear()} MediScribe Clinical Intelligence. All rights reserved.</div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-primary">Privacy Policy</a>
            <a href="#" className="hover:text-primary">Terms of Service</a>
            <a href="#" className="hover:text-primary">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
