import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../api";
import type { Cliente, Remito } from "../api";
import { ThemeToggle } from "../components/ThemeToggle";

// Status badge colors
const statusConfig = {
  disponible: {
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-500/30",
    label: "Disponible",
  },
  asignado: {
    bg: "bg-amber-100 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-500/30",
    label: "Asignado",
  },
  visitado: {
    bg: "bg-blue-100 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-500/30",
    label: "Visitado",
  },
};

// Icons
function IconArrowLeft({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}


function IconMail({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconPhone({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function IconMapPin({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconBuilding({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />
    </svg>
  );
}

function IconCreditCard({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconId({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function IconTag({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function IconFileText({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconNotes({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconCalendar({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconDownload({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconPencil({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconLogout({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconPackage({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}


function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
}

// Info Row Component
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-zinc-900 dark:text-white mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

export default function ClienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [remitos, setRemitos] = useState<Remito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRemito, setExpandedRemito] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [clienteRes, remitosRes] = await Promise.all([
          api.getCliente(id!),
          api.getRemitosByCliente(id!),
        ]);

        setCliente(clienteRes.user);
        setRemitos(remitosRes.remitos || []);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Error cargando datos");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  function logout() {
    localStorage.removeItem("token");
    nav("/login", { replace: true });
  }

async function downloadPDF(remitoId: string) {
  try {
    const token = localStorage.getItem("token");
    const base =
      import.meta.env.VITE_API_URL ||
      "https://backend-redaceite-digitalocean-9nmhi.ondigitalocean.app";

    const res = await fetch(`${base}/remitos/${remitoId}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `remito-${remitoId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    alert("No se pudo descargar el PDF");
  }
}

  const status = cliente?.status || "disponible";
  const statusStyle = statusConfig[status] || statusConfig.disponible;

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors duration-300">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-[0.16] dark:opacity-[0.02] pointer-events-none">
        <div
          className="absolute inset-0"
         style={{
  backgroundImage: "url('/bgu7.jpg')",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  backgroundPosition: "center",
}}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/clientes"
                className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 
                         flex items-center justify-center text-zinc-600 dark:text-zinc-400
                         hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white
                         transition-colors"
              >
                <IconArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  Detalle del Cliente
                </h1>
                <p className="text-xs text-zinc-500">
                  Información completa y remitos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                         bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 
                         text-zinc-700 dark:text-zinc-300
                         hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white 
                         hover:border-zinc-400 dark:hover:border-zinc-600
                         transition-all duration-200"
              >
                <IconLogout className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg
              className="animate-spin h-10 w-10 text-amber-500"
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
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => nav("/clientes")}
              className="mt-4 text-sm text-red-700 dark:text-red-300 underline"
            >
              Volver a clientes
            </button>
          </div>
        ) : cliente ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Client Info Panel */}
            <div className="lg:col-span-1 z-30">
              <div className="bg-white  dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                {/* Header with avatar */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                      {cliente.foto ? (
                        <img
                          src={cliente.foto}
                          alt={cliente.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold text-zinc-400 dark:text-zinc-500">
                          {cliente.nombre
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-semibold truncate">
                        {cliente.nombre}
                      </h2>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                        {cliente.razonSocial}
                      </p>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info rows */}
                <div className="p-6 space-y-1">
                  <InfoRow icon={IconMail} label="Email" value={cliente.email} />
                  <InfoRow icon={IconPhone} label="Teléfono" value={cliente.telefono} />
                  <InfoRow icon={IconMapPin} label="Ubicación" value={cliente.ubicacion} />
                  <InfoRow icon={IconId} label="DNI" value={cliente.dni} />
                  <InfoRow icon={IconCreditCard} label="CUIT" value={cliente.cuit} />
                  <InfoRow icon={IconBuilding} label="Razón Social" value={cliente.razonSocial} />
                  <InfoRow icon={IconTag} label="Tipo de Comercio" value={cliente.tipoComercio} />
                  {cliente.notas && (
                    <InfoRow icon={IconNotes} label="Notas" value={cliente.notas} />
                  )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800">
                  <Link
                    to={`/clientes?edit=${cliente.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                             bg-amber-500 text-zinc-950 font-semibold
                             hover:bg-amber-400 transition-colors"
                  >
                    <IconPencil className="w-4 h-4" />
                    Editar Cliente
                  </Link>
                </div>
              </div>
            </div>

            {/* Remitos Panel */}
            <div className="lg:col-span-2 z-30">
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center">
                        <IconFileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h2 className="font-semibold">Remitos</h2>
                        <p className="text-xs text-zinc-500">
                          {remitos.length} documento{remitos.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remitos List */}
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                  {remitos.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                      <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <IconFileText className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                        No hay remitos
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-600 text-sm mt-1">
                        Este cliente aún no tiene remitos generados
                      </p>
                    </div>
                  ) : (
                    remitos.map((remito) => {
                      const isExpanded = expandedRemito === remito.id;
                      return (
                        <div key={remito.id} className="transition-colors">
                          {/* Remito Header */}
                          <button
                            onClick={() =>
                              setExpandedRemito(isExpanded ? null : remito.id)
                            }
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors text-left"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                                <IconPackage className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                              </div>
                              <div>
                                <p className="font-medium text-zinc-900 dark:text-white">
                                  Remito #{remito.id.slice(-8).toUpperCase()}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                                  <IconCalendar className="w-3 h-3" />
                                  <span>{formatDateTime(remito.fecha)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-semibold text-zinc-900 dark:text-white">
                                  {formatCurrency(remito.total)}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {remito.productos.length} producto
                                  {remito.productos.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <svg
                                viewBox="0 0 24 24"
                                className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                          </button>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="px-6 pb-6 animate-fade-in">
                              {/* Chofer info */}
                              {remito.chofer && (
                                <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                                    Entregado por
                                  </p>
                                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                                    {remito.chofer.nombre}
                                  </p>
                                </div>
                              )}

                              {/* Products table */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                                      <th className="text-left py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Producto
                                      </th>
                                      <th className="text-center py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Cant.
                                      </th>
                                      <th className="text-right py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Precio
                                      </th>
                                      <th className="text-right py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Subtotal
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {remito.productos.map((prod, idx) => (
                                      <tr key={idx}>
                                        <td className="py-2 text-zinc-900 dark:text-white">
                                          {prod.nombre}
                                        </td>
                                        <td className="py-2 text-center text-zinc-600 dark:text-zinc-400">
                                          {prod.cantidad}
                                        </td>
                                        <td className="py-2 text-right text-zinc-600 dark:text-zinc-400">
                                          {formatCurrency(prod.precio)}
                                        </td>
                                        <td className="py-2 text-right text-zinc-900 dark:text-white">
                                          {formatCurrency(prod.subtotal)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot className="border-t border-zinc-200 dark:border-zinc-700">
                                    <tr>
                                      <td colSpan={3} className="py-2 text-right text-zinc-500 dark:text-zinc-400">
                                        Subtotal
                                      </td>
                                      <td className="py-2 text-right text-zinc-900 dark:text-white">
                                        {formatCurrency(remito.subtotal)}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td colSpan={3} className="py-2 text-right text-zinc-500 dark:text-zinc-400">
                                        IVA (21%)
                                      </td>
                                      <td className="py-2 text-right text-zinc-900 dark:text-white">
                                        {formatCurrency(remito.iva)}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td colSpan={3} className="py-2 text-right font-semibold text-zinc-900 dark:text-white">
                                        Total
                                      </td>
                                      <td className="py-2 text-right font-semibold text-amber-600 dark:text-amber-500">
                                        {formatCurrency(remito.total)}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>

                              {/* Notes */}
                              {remito.notas && (
                                <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                                    Notas
                                  </p>
                                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                    {remito.notas}
                                  </p>
                                </div>
                              )}

                              {/* Download PDF button */}
                              <div className="mt-4 flex justify-end">
                                <button
                                  onClick={() => downloadPDF(remito.id)}
                                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                                           bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 
                                           text-zinc-700 dark:text-zinc-300
                                           hover:bg-zinc-200 dark:hover:bg-zinc-700 
                                           transition-colors"
                                >
                                  <IconDownload className="w-4 h-4" />
                                  Descargar PDF
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}