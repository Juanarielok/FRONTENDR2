import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../api";
import type { Cliente, Remito } from "../api";
import { ThemeToggle } from "../components/ThemeToggle";

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

function IconTrash({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconFilter({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 5h18" />
      <path d="M6 12h12" />
      <path d="M10 19h4" />
    </svg>
  );
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
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

function getStatusLabel(status?: string) {
  if (!status) return "-";
  return statusConfig[status as keyof typeof statusConfig]?.label || status;
}

function extractFromNotas(texto: string | undefined, etiquetas: string[]) {
  if (!texto) return "-";

  for (const etiqueta of etiquetas) {
    const regex = new RegExp(etiqueta + String.raw`:\s*(.*?)(?=\s+[A-ZÁÉÍÓÚÑ][^:]*:|$)`, "i");
    const match = texto.match(regex);
    if (match?.[1]?.trim()) return match[1].trim();
  }

  return "-";
}

function getCargoRemito(remito: Remito) {
  return extractFromNotas((remito as any).notas, ["Cargo"]);
}

function getDetalleRemito(remito: Remito) {
  const nombres = (remito.productos || [])
    .map((prod: any) => prod?.nombre?.trim())
    .filter(Boolean);

  if (nombres.length === 0) return "-";
  return nombres.join(", ");
}

function getCantidadItems(remito: Remito) {
  return (remito.productos || []).reduce((total: number, prod: any) => {
    return total + Number(prod?.cantidad || 0);
  }, 0);
}

function getPeriodoKey(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getPeriodoLabel(periodo: string) {
  const [year, month] = periodo.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  const mes = date.toLocaleDateString("es-AR", {
    month: "long",
  });

  return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${year}`;
}

export default function ClienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [remitos, setRemitos] = useState<Remito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFiltroPeriodos, setMostrarFiltroPeriodos] = useState(false);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("todos");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [clienteRes, remitosRes] = await Promise.all([
          api.getCliente(id),
          api.getRemitosByCliente(id),
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

  async function confirmDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await api.deleteUser(id);
      nav("/clientes", { replace: true });
    } catch (e: any) {
      console.error("Error al borrar cliente:", e);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
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

      if (!res.ok) {
        const texto = await res.text();
        console.error("PDF ERROR", res.status, texto);
        alert(`PDF ${res.status}: ${texto}`);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `remito-${remitoId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error("PDF CATCH", e);
      alert(String(e?.message || e));
    }
  }

  const status = cliente?.status || "disponible";
  const statusStyle = statusConfig[status as keyof typeof statusConfig] || statusConfig.disponible;

  const filasCliente = cliente
    ? [
        ["Nombre", cliente.nombre || "-"],
        ["Razón social", cliente.razonSocial || "-"],
        ["Estado", getStatusLabel(cliente.status)],
        ["Email", cliente.email || "-"],
        ["Teléfono", cliente.telefono || "-"],
        ["DNI", cliente.dni || "-"],
        ["CUIT/CUIL", cliente.cuit || "-"],
        ["Localidad", (cliente as any).localidad || "-"],
        ["Ubicación", cliente.ubicacion || "-"],
        ["Tipo de comercio", cliente.tipoComercio || "-"],
        ["Usuario", (cliente as any).usuario || "-"],
        ["Código de área", (cliente as any).codigoArea || "-"],
        ["Notas", cliente.notas || "-"],
      ]
    : [];

  const periodosDisponibles = useMemo(() => {
    const unicos = Array.from(new Set(remitos.map((remito) => getPeriodoKey(remito.fecha))));
    return unicos.sort((a, b) => b.localeCompare(a));
  }, [remitos]);

  const remitosFiltrados = useMemo(() => {
    if (periodoSeleccionado === "todos") return remitos;
    return remitos.filter((remito) => getPeriodoKey(remito.fecha) === periodoSeleccionado);
  }, [remitos, periodoSeleccionado]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors duration-300">
      <div className="fixed inset-0 opacity-[0.16] dark:opacity-[0.02] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/bg1444.jpg')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </div>

      <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-[96vw] 2xl:max-w-[1800px] mx-auto px-4 xl:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/clientes"
                className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 
                         flex items-center justify-center text-zinc-600 dark:text-zinc-400
                         hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white
                         transition-colors"
              >
                <img src="/volvere.png" alt="Volver" className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Detalle del Cliente</h1>
                <p className="text-xs text-zinc-500">Información completa y remitos</p>
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

      <main className="max-w-[96vw] 2xl:max-w-[1800px] mx-auto px-4 xl:px-6 py-8 overflow-x-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-amber-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
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
            <button onClick={() => nav("/clientes")} className="mt-4 text-sm text-red-700 dark:text-red-300 underline">
              Volver a clientes
            </button>
          </div>
        ) : cliente ? (
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.7fr] gap-3 xl:gap-4">
            <div className="min-w-0 z-30">
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {(cliente as any).foto ? (
                        <img src={(cliente as any).foto} alt={cliente.nombre} className="w-full h-full object-cover" />
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
                      <h2 className="text-xl font-semibold truncate">{cliente.nombre}</h2>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{cliente.razonSocial}</p>
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

                <div className="p-4 xl:p-6">
                  <div className="w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    <table
                      className="w-full border-collapse table-fixed"
                      style={{ fontSize: "10px", lineHeight: "14px" }}
                    >
                      <tbody>
                        {filasCliente.map(([label, value], index) => {
                          const rowColor =
                            index % 2 === 0
                              ? "bg-white dark:bg-zinc-950"
                              : "bg-zinc-50 dark:bg-zinc-900";

                          return (
                            <tr key={label} className={`border-b border-zinc-200 dark:border-zinc-800 ${rowColor}`}>
                              <td className="align-top h-6 px-2 py-1 w-[34%] border-r border-zinc-200 dark:border-zinc-800 font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400 whitespace-normal break-words">
                                {label}
                              </td>
                              <td className="align-top h-6 px-2 py-1 w-[66%] text-zinc-900 dark:text-white whitespace-normal break-words">
                                {value}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
                  <Link
                    to={`/clientes?edit=${cliente.id}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4
                             bg-amber-500 text-zinc-950 font-semibold
                             hover:bg-amber-400 transition-colors"
                  >
                    <IconPencil className="w-4 h-4" />
                    Editar Cliente
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleting}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 font-semibold transition-colors
                             bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400
                             hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IconTrash className="w-4 h-4" />
                    {deleting ? "Borrando..." : "Borrar"}
                  </button>
                </div>
              </div>
            </div>

            <div className="min-w-0 z-30">
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                <div className="px-4 xl:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                        <img src="/pep.png" alt="pep" className="w-8 h-8 object-contain" />
                      </div>

                      <div className="min-w-0">
                        <h2 className="font-semibold">Remitos</h2>
                        <p className="text-xs text-zinc-500">
                          {remitosFiltrados.length} documento{remitosFiltrados.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setMostrarFiltroPeriodos((prev) => !prev)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium
                                 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700
                                 text-zinc-700 dark:text-zinc-300
                                 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white
                                 transition-colors"
                        title="Filtrar por períodos"
                      >
                        <IconFilter className="w-4 h-4" />
                        <span>Períodos</span>
                      </button>

                      {mostrarFiltroPeriodos && (
                        <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-lg z-40">
                          <button
                            onClick={() => {
                              setPeriodoSeleccionado("todos");
                              setMostrarFiltroPeriodos(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${
                              periodoSeleccionado === "todos"
                                ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white"
                                : "text-zinc-600 dark:text-zinc-300"
                            }`}
                          >
                            Todos los períodos
                          </button>

                          {periodosDisponibles.map((periodo) => (
                            <button
                              key={periodo}
                              onClick={() => {
                                setPeriodoSeleccionado(periodo);
                                setMostrarFiltroPeriodos(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs border-b last:border-b-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${
                                periodoSeleccionado === periodo
                                  ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white"
                                  : "text-zinc-600 dark:text-zinc-300"
                              }`}
                            >
                              {getPeriodoLabel(periodo)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 xl:p-6">
                  <div className="w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    <table
                      className="w-full border-collapse table-fixed"
                      style={{ fontSize: "10px", lineHeight: "14px" }}
                    >
                      <thead>
                        <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400">
                          <th className="align-top px-1 py-1 w-[8%] text-left border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">Remito</th>
                          <th className="align-top px-1 py-1 w-[13%] text-left border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">Fecha</th>
                          <th className="align-top px-1 py-1 w-[10%] text-left border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">Chofer</th>
                          <th className="align-top px-1 py-1 w-[10%] text-left border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">Cargo</th>
                          <th className="align-top px-1 py-1 w-[19%] text-left border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">Detalle</th>
                          <th className="align-top px-1 py-1 w-[7%] text-center border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">Cantidad</th>
                          <th className="align-top px-1 py-1 w-[11%] text-right border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">Subtotal</th>
                          <th className="align-top px-1 py-1 w-[7%] text-right border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">IVA</th>
                          <th className="align-top px-1 py-1 w-[10%] text-right border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">Total</th>
                          <th className="align-top px-1 py-1 w-[5%] text-center whitespace-normal break-words">PDF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {remitosFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="h-10 px-3 py-2 text-center text-zinc-500 dark:text-zinc-400">
                              Este cliente aún no tiene remitos generados
                            </td>
                          </tr>
                        ) : (
                          remitosFiltrados.map((remito, index) => {
                            const rowColor =
                              index % 2 === 0
                                ? "bg-white dark:bg-zinc-950"
                                : "bg-zinc-50 dark:bg-zinc-900";

                            return (
                              <tr key={remito.id} className={`border-b border-zinc-200 dark:border-zinc-800 ${rowColor}`}>
                                <td className="align-top px-1 py-1 border-r border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-medium whitespace-normal break-words">
                                  #{remito.id.slice(-8).toUpperCase()}
                                </td>
                                <td className="align-top px-1 py-1 border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 whitespace-normal break-words">
                                  {formatDateTime(remito.fecha)}
                                </td>
                                <td
                                  className="align-top px-1 py-1 border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 whitespace-normal break-words"
                                  title={remito.chofer?.nombre || "-"}
                                >
                                  {remito.chofer?.nombre || "-"}
                                </td>
                                <td
                                  className="align-top px-1 py-1 border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 whitespace-normal break-words"
                                  title={getCargoRemito(remito)}
                                >
                                  {getCargoRemito(remito)}
                                </td>
                                <td
                                  className="align-top px-1 py-1 border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 whitespace-normal break-words"
                                  title={getDetalleRemito(remito)}
                                >
                                  {getDetalleRemito(remito)}
                                </td>
                                <td className="align-top px-1 py-1 text-center border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 whitespace-normal break-words">
                                  {getCantidadItems(remito)}
                                </td>
                                <td className="align-top px-1 py-1 text-right border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 whitespace-normal break-words">
                                  {formatCurrency(remito.subtotal)}
                                </td>
                                <td className="align-top px-1 py-1 text-right border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 whitespace-normal break-words">
                                  {formatCurrency(remito.iva)}
                                </td>
                                <td className="align-top px-1 py-1 text-right border-r border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-semibold whitespace-normal break-words">
                                  {formatCurrency(remito.total)}
                                </td>
                                <td className="align-top px-1 py-1 text-center">
                                  <button
                                    onClick={() => downloadPDF(remito.id)}
                                    className="inline-flex items-center justify-center w-5 h-5 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                    title="Descargar PDF"
                                  >
                                    <IconDownload className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <IconTrash className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Borrar cliente</h3>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              ¿Estás seguro de borrar cliente{" "}
              <span className="font-semibold text-zinc-900 dark:text-white">{cliente?.nombre}</span>? Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium rounded-lg
                         bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300
                         hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors
                         disabled:opacity-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium rounded-lg
                         bg-red-600 text-white hover:bg-red-700 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Borrando..." : "Sí, borrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}