"use client";

import { useEffect, useId, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  eyebrow,
  title,
  icon,
  children,
  footer,
  headerContent,
  maxWidthClassName = "max-w-2xl",
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  headerContent?: ReactNode;
  maxWidthClassName?: string;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className="everie-modal-backdrop absolute inset-0 cursor-default bg-black/78 backdrop-blur-sm"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`everie-modal-surface relative z-10 flex max-h-[88vh] w-full ${maxWidthClassName} flex-col overflow-hidden rounded-[8px] bg-[#09090d]/94 shadow-[0_45px_160px_rgba(0,0,0,0.72),0_0_0_1px_rgba(255,255,255,0.055)] backdrop-blur-2xl`}
      >
        <header className="relative flex items-center justify-between gap-4 bg-white/[0.012] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {headerContent ? (
              <div className="min-w-0">{headerContent}</div>
            ) : (
              <>
                {icon ? (
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-[4px] bg-violet-300/8 text-violet-100">
                    {icon}
                  </div>
                ) : null}
                <div className="min-w-0">
                  {eyebrow ? (
                    <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/35">{eyebrow}</p>
                  ) : null}
                  <h2 id={titleId} className="mt-0.5 truncate text-lg font-medium text-white sm:text-xl">
                    {title}
                  </h2>
                </div>
              </>
            )}
            {headerContent ? <h2 id={titleId} className="sr-only">{title}</h2> : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-[4px] bg-transparent text-white/45 transition hover:bg-white/[0.05] hover:text-white"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {children}
        </div>

        {footer ? (
          <footer className="relative bg-black/14 px-5 py-4 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>
  );
}
