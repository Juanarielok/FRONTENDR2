import { useEffect, useState } from "react";
import { api } from "../api";
import { Modal } from "./Modal.tsx";

type Chofer = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  ubicacion: string;
};

type AsignarChoferModalProps = {
  isOpen: boolean;
  onClose: () => void;
  clientIds: string[];
  onSuccess: () => void;
};

function IconTruck({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function IconUser({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconPhone({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function IconMapPin({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconCheck({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function AsignarChoferModal({
  isOpen,
  onClose,
  clientIds,
  onSuccess,
}: AsignarChoferModalProps) {
  const [choferes, setChoferes] = useState<Chofer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedChofer, setSelectedChofer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadChoferes();
      setSelectedChofer(null);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  async function loadChoferes() {
    setLoading(true);
    try {
      const res = await api.listChoferes();
      setChoferes(res.users || []);
    } catch (e: any) {
      console.error(e);
      setError("Error cargando choferes");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign() {
    if (!selectedChofer) return;

    setSubmitting(true);
    setError(null);

    try {
      await api.assignClients(selectedChofer, clientIds);
      setSuccess(true);
      
      // Wait a moment to show success, then close
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Error al asignar clientes");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar a Chofer" size="md">
      {/* Info badge */}
      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <IconTruck className="w-5 h-5" />
          <span className="font-medium">
            {clientIds.length} cliente{clientIds.length !== 1 ? "s" : ""} seleccionado
            {clientIds.length !== 1 ? "s" : ""}
          </span>
        </div>
        <p className="mt-1 text-sm text-amber-600 dark:text-amber-500">
          Seleccioná un chofer para asignar los clientes
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <IconCheck className="w-5 h-5" />
            <span className="font-medium">¡Clientes asignados correctamente!</span>
          </div>
        </div>
      )}

      {/* Choferes list */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {loading ? (
          <div className="py-8 text-center">
            <svg
              className="animate-spin h-8 w-8 mx-auto text-amber-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="mt-2 text-sm text-zinc-500">Cargando choferes...</p>
          </div>
        ) : choferes.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
              <IconUser className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
              No hay choferes disponibles
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              Creá un chofer primero para poder asignar clientes
            </p>
          </div>
        ) : (
          choferes.map((chofer) => {
            const isSelected = selectedChofer === chofer.id;
            return (
              <button
                key={chofer.id}
                onClick={() => setSelectedChofer(chofer.id)}
                disabled={success}
                className={`w-full p-4 text-left transition-all duration-200 border ${
                  isSelected
                    ? "bg-amber-50 dark:bg-amber-500/10 border-amber-500"
                    : "bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
                } ${success ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-start gap-4">
                  {/* Selection indicator */}
                  <div
                    className={`w-5 h-5 mt-0.5 border flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? "bg-amber-500 border-amber-500"
                        : "border-zinc-400 dark:border-zinc-600"
                    }`}
                  >
                    {isSelected && <IconCheck className="w-3 h-3 text-zinc-950" />}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                      {chofer.nombre
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-zinc-900 dark:text-white truncate">
                      {chofer.nombre}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
                      {chofer.telefono && (
                        <div className="flex items-center gap-1">
                          <IconPhone className="w-3 h-3" />
                          <span>{chofer.telefono}</span>
                        </div>
                      )}
                      {chofer.ubicacion && (
                        <div className="flex items-center gap-1">
                          <IconMapPin className="w-3 h-3" />
                          <span className="truncate">{chofer.ubicacion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium
                   bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 
                   text-zinc-700 dark:text-zinc-300
                   hover:bg-zinc-200 dark:hover:bg-zinc-700 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleAssign}
          disabled={!selectedChofer || submitting || success}
          className="px-4 py-2 text-sm font-semibold
                   bg-amber-500 text-zinc-950
                   hover:bg-amber-400 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors flex items-center gap-2"
        >
          {submitting ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Asignando...</span>
            </>
          ) : (
            <>
              <IconTruck className="w-4 h-4" />
              <span>Asignar</span>
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}