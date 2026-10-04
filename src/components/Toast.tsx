import { useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ToastContext } from "../hooks/useToast";
import { IconCheckCircle, IconX } from "./icons";

const DURACION_MS = 4000;
const MAX_VISIBLES = 3;

type Toast = { id: number; text: string };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((text: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-(MAX_VISIBLES - 1)), { id, text }]);
  }, []);

  const api = useMemo(() => ({ success }), [success]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="fixed top-4 inset-x-0 z-[110] flex flex-col items-center gap-2 px-4 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="status"
              className="toast pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-lg border
                         bg-emerald-50 dark:bg-emerald-950
                         border-emerald-300 dark:border-emerald-700
                         text-emerald-800 dark:text-emerald-300
                         shadow-lg shadow-zinc-900/10 dark:shadow-black/40 animate-slide-down"
            >
              <div className="flex items-center gap-3 pl-4 pr-2 py-3">
                <IconCheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="flex-1 min-w-0 text-sm font-medium break-words">{toast.text}</span>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="p-1.5 rounded-md text-emerald-700/70 dark:text-emerald-400/70
                             hover:text-emerald-900 dark:hover:text-emerald-200
                             hover:bg-emerald-100 dark:hover:bg-emerald-900/60
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50
                             transition-colors"
                  aria-label="Cerrar"
                  title="Cerrar"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              {/* Tira que se consume; al terminar, el toast desaparece */}
              <div
                className="toast-strip absolute bottom-0 left-0 h-1 w-full bg-emerald-500"
                style={{ animationDuration: `${DURACION_MS}ms` }}
                onAnimationEnd={() => dismiss(toast.id)}
              />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
