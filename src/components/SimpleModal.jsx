export default function SimpleModal({ open, onClose, title, children }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="simple-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="simple-modal-title" className="text-lg font-bold text-on-surface">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-outline transition-colors hover:bg-surface-container-high hover:text-on-surface"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        <div className="text-sm leading-relaxed text-on-surface-variant">{children}</div>
      </div>
    </div>
  )
}
