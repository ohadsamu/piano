import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { COPY } from '../copy';

export interface AppHeaderProps {
  title?: string;
  onBack?: () => void;
  backLabel?: string;
  right?: React.ReactNode;
}

/** 56px header: back button (or brand), title, and an optional right slot. */
export const AppHeader: React.FC<AppHeaderProps> = ({ title, onBack, backLabel = COPY.home, right }) => (
  <header
    className="sticky top-0 z-40 shrink-0 bg-ebony-lacquer/95 backdrop-blur border-b border-ink-primary/10"
    style={{ paddingTop: 'env(safe-area-inset-top)' }}
  >
    <div className="mx-auto max-w-[1200px] h-14 flex items-center gap-1 pl-1 pr-2 sm:px-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="shrink-0 h-11 min-w-11 px-2 flex items-center gap-1 rounded-control text-ink-secondary hover:text-ink-primary hover:bg-ebony-iron"
        >
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
          <span className="hidden lg:inline text-base">{backLabel}</span>
        </button>
      ) : (
        <span className="shrink-0 px-3 font-serif text-md-20 font-semibold text-ink-primary">
          {COPY.brand}
        </span>
      )}
      {title && (
        <h1 className="flex-1 min-w-0 truncate font-serif text-md-20 font-semibold text-ink-primary px-1">
          {title}
        </h1>
      )}
      {!title && <div className="flex-1" />}
      {right && <div className="shrink-0 flex items-center gap-1">{right}</div>}
    </div>
  </header>
);

export default AppHeader;
