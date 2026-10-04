import { createContext, useContext } from "react";

export type ToastApi = {
  /** Confirmación de una acción exitosa; se cierra sola al consumirse la tira. */
  success: (text: string) => void;
};

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
