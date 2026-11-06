import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { COPY } from '../copy';

export interface SheetProps {
  open: boolean;
  title: string;
  onClose(): void;
  children: React.ReactNode;
  size?: 'auto' | 'full';
  footer?: React.ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/** The one overlay primitive: bottom sheet under 768px, centred dialog at 768px and up. */
export const Sheet: React.FC<SheetProps> = ({ open, title, onClose, children, size = 'auto', footer }) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      returnFocusRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const full = size === 'full';

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-ebony-void/75"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex flex-col w-full bg-ebony-spruce text-ink-primary shadow-sheet focus:outline-none rounded-t-panel md:rounded-panel ${
          full
            ? 'h-[100dvh] md:h-[90vh] md:max-w-4xl rounded-none md:rounded-panel'
            : 'max-h-[88dvh] md:max-w-lg'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <header className="flex items-center justify-between gap-3 pl-5 pr-2 h-14 shrink-0 border-b border-ink-primary/10">
          <h2 id={titleId} className="text-md-20 font-semibold truncate">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={COPY.close}
            className="w-11 h-11 flex items-center justify-center rounded-control text-ink-secondary hover:text-ink-primary hover:bg-ebony-iron"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer && <footer className="shrink-0 px-5 py-3 border-t border-ink-primary/10">{footer}</footer>}
      </div>
    </div>
  );
};

export default Sheet;
