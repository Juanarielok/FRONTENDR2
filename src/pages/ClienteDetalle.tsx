import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { api } from "../api";
import type { Cliente, Remito } from "../api";
import { ThemeToggle } from "../components/ThemeToggle";
import { ClienteFicha } from "../components/ClienteFicha";
import { useToast } from "../hooks/useToast";
import {
  IconDownload,
  IconLogout,
  IconTrash,
  IconFilter,
  IconArrowLeft,
  IconActivity,
  IconSettings,
  IconUser,
} from "../components/icons";

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
  const [searchParams, setSearchParams] = useSearchParams();
  // Con /clientes/<id>?edit=1 la ficha arranca directamente en modo edición
  const empezarEditando = searchParams.get("edit") !== null;
  const nav = useNavigate();
  const toast = useToast();

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
    const clienteId = id;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [clienteRes, remitosRes] = await Promise.all([
          api.getCliente(clienteId),
          api.getRemitosByCliente(clienteId),
        ]);

        setCliente(clienteRes.user);
        setRemitos(remitosRes.remitos || []);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Error al cargar los datos");
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
      toast.success(cliente?.nombre ? `"${cliente.nombre}" eliminado` : "Cliente eliminado");
      nav("/clientes", { replace: true });
    } catch (e: any) {
      console.error("Error al borrar al cliente:", e);
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

  const periodosDisponibles = useMemo(() => {
    const unicos = Array.from(new Set(remitos.map((remito) => getPeriodoKey(remito.fecha))));
    return unicos.sort((a, b) => b.localeCompare(a));
  }, [remitos]);

  const remitosFiltrados = useMemo(() => {
    if (periodoSeleccionado === "todos") return remitos;
    return remitos.filter((remito) => getPeriodoKey(remito.fecha) === periodoSeleccionado);
  }, [remitos, periodoSeleccionado]);

  return (
    <div className="min-h-screen overflow-x-hidden fondo-home bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 shadow-sm shadow-zinc-900/5">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="grid grid-cols-1 items-center gap-y-2 sm:flex sm:justify-between sm:gap-4">
            <div className="flex w-full sm:w-auto min-w-0 items-center gap-2 sm:gap-4">
              <Link
                to="/clientes"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                         text-zinc-600 dark:text-zinc-400
                         hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-white
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
                         transition-colors"
                title="Volver a clientes"
                aria-label="Volver a clientes"
              >
                <IconArrowLeft className="w-5 h-5" />
              </Link>
              <Link
                to="/clientes"
                title="Ir al inicio"
                aria-label="Ir al inicio"
                className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
              >
                <img
                  src="/images/brand/arttaius-logo.png"
                  alt="Arttaius"
                  className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
                />
              </Link>
              <div className="min-w-0 px-3 sm:px-4 py-2 sm:py-3 border-l-[3px] border-amber-500">
                <h1 className="truncate text-sm sm:text-lg font-semibold text-zinc-800 dark:text-zinc-100 tracking-[1.5px] sm:tracking-[3px]">
                  DETALLE DEL CLIENTE
                </h1>
                <p className="hidden sm:block truncate text-xs text-zinc-500 dark:text-zinc-400">
                  Información completa y remitos
                </p>
              </div>
            </div>

            <nav
              className="flex w-full sm:w-auto min-w-0 sm:shrink-0 items-center justify-end gap-1 sm:gap-2"
              aria-label="Acciones principales"
            >
              <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 px-3 py-1.5 rounded-full bg-zinc-100/80 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80">
                <IconUser className="w-4 h-4" />
                <span>Admin</span>
              </div>
              <Link
                to="/monitoreo"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                         text-zinc-600 dark:text-zinc-400
                         hover:text-zinc-900 dark:hover:text-white
                         hover:bg-zinc-100 dark:hover:bg-zinc-800/70
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
                         transition-colors duration-200"
                title="Monitoreo"
                aria-label="Ir a monitoreo"
              >
                <IconActivity className="w-5 h-5" />
              </Link>
              <button
                type="button"
                onClick={() => nav("/admin")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                         text-zinc-600 dark:text-zinc-400
                         hover:text-zinc-900 dark:hover:text-white
                         hover:bg-zinc-100 dark:hover:bg-zinc-800/70
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
                         transition-colors duration-200"
                title="Gestión"
                aria-label="Ir a gestión"
              >
                <IconSettings className="w-5 h-5" />
              </button>
              <ThemeToggle />
              <button
                type="button"
                onClick={logout}
                className="flex h-10 min-w-10 shrink-0 items-center justify-center gap-2 rounded-lg px-2 sm:px-3 text-sm font-medium
                         text-zinc-600 dark:text-zinc-400
                         hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/70
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
                         transition-colors duration-200"
                title="Salir"
              >
                <IconLogout className="w-5 h-5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-[96vw] 2xl:max-w-[1800px] mx-auto px-3 sm:px-6 py-4 sm:py-8 overflow-x-hidden">
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
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 shadow-sm shadow-zinc-900/5 p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button onClick={() => nav("/clientes")} className="mt-4 text-sm text-red-700 dark:text-red-300 underline">
              Volver a clientes
            </button>
          </div>
        ) : cliente ? (
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.7fr] gap-3 xl:gap-4">
            <div className="min-w-0 z-30">
              <ClienteFicha
                cliente={cliente}
                startInEdit={empezarEditando}
                onSaved={(c) => {
                  setCliente(c);
                  if (empezarEditando) setSearchParams({}, { replace: true });
                }}
                onCancelEdit={() => {
                  if (empezarEditando) setSearchParams({}, { replace: true });
                }}
                onDelete={() => setShowDeleteModal(true)}
                deleting={deleting}
              />
            </div>

            <div className="min-w-0 z-30">
              <div className="rounded-xl overflow-hidden bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm shadow-zinc-900/5">
                <div className="px-4 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                        <img src="/images/cliente-detalle/package.png" alt="Paquete" className="w-8 h-8 object-contain" />
                      </div>

                      <div className="min-w-0">
                        <h2 className="font-semibold">Remitos</h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {remitosFiltrados.length} documento{remitosFiltrados.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setMostrarFiltroPeriodos((prev) => !prev)}
                        className="min-h-10 flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg
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
                        <div className="absolute right-0 top-full mt-2 w-[min(13rem,calc(100vw-1.5rem))] rounded-lg overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-lg shadow-zinc-900/10 z-40">
                          <button
                            onClick={() => {
                              setPeriodoSeleccionado("todos");
                              setMostrarFiltroPeriodos(false);
                            }}
                            className={`min-h-10 w-full text-left px-3 py-2 text-xs border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${
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
                              className={`min-h-10 w-full text-left px-3 py-2 text-xs border-b last:border-b-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${
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

                <div className="p-4 sm:p-6">
                  <div className="w-full overflow-x-auto overscroll-x-contain rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    <table
                      className="w-full min-w-[800px] border-collapse table-fixed"
                      style={{ fontSize: "12px", lineHeight: "14px" }}
                    >
                      <thead className="sticky top-0 z-10">
                        <tr className="h-9 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400">
                          <th className="align-middle px-2 py-0 w-[8%] text-left border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">Remito</th>
                          <th className="align-middle px-2 py-0 w-[13%] text-left border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">Fecha</th>
                          <th className="align-middle px-2 py-0 w-[10%] text-left border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">Chofer</th>
                          <th className="align-middle px-2 py-0 w-[10%] text-left border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">Cargo</th>
                          <th className="align-middle px-2 py-0 w-[19%] text-left border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">Detalle</th>
                          <th className="align-middle px-2 py-0 w-[7%] text-center border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">Cantidad</th>
                          <th className="align-middle px-2 py-0 w-[11%] text-right border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">Subtotal</th>
                          <th className="align-middle px-2 py-0 w-[7%] text-right border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">IVA</th>
                          <th className="align-middle px-2 py-0 w-[10%] text-right border-r border-zinc-200 dark:border-zinc-700 whitespace-normal break-words">Total</th>
                          <th className="align-middle px-2 py-0 w-[5%] text-center whitespace-normal break-words">PDF</th>
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
                                ? "bg-white dark:bg-zinc-900/30"
                                : "bg-zinc-50/70 dark:bg-zinc-900/50";

                            return (
                              <tr key={remito.id} className={`h-11 sm:h-9 border-b border-zinc-200 dark:border-zinc-800 ${rowColor}`}>
                                <td className="align-middle px-2 py-0 border-r border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-medium whitespace-normal break-words">
                                  #{remito.id.slice(-8).toUpperCase()}
                                </td>
                                <td className="align-middle px-2 py-0 border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 whitespace-normal break-words">
                                  {formatDateTime(remito.fecha)}
                                </td>
                                <td
                                  className="align-middle px-2 py-0 border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 whitespace-normal break-words"
                                  title={remito.chofer?.nombre || "-"}
                                >
                                  {remito.chofer?.nombre || "-"}
                                </td>
                                <td
                                  className="align-middle px-2 py-0 border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 whitespace-normal break-words"
                                  title={getCargoRemito(remito)}
                                >
                                  {getCargoRemito(remito)}
                                </td>
                                <td
                                  className="align-middle px-2 py-0 border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 whitespace-normal break-words"
                                  title={getDetalleRemito(remito)}
                                >
                                  {getDetalleRemito(remito)}
                                </td>
                                <td className="align-middle px-2 py-0 text-center border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 whitespace-normal break-words">
                                  {getCantidadItems(remito)}
                                </td>
                                <td className="align-middle px-2 py-0 text-right border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 whitespace-normal break-words">
                                  {formatCurrency(remito.subtotal)}
                                </td>
                                <td className="align-middle px-2 py-0 text-right border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 whitespace-normal break-words">
                                  {formatCurrency(remito.iva)}
                                </td>
                                <td className="align-middle px-2 py-0 text-right border-r border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-semibold whitespace-normal break-words">
                                  {formatCurrency(remito.total)}
                                </td>
                                <td className="align-middle px-2 py-0 text-center">
                                  <button
                                    onClick={() => downloadPDF(remito.id)}
                                    className="inline-flex items-center justify-center w-9 h-9 sm:w-7 sm:h-7 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
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
              ¿Estás seguro de que quieres borrar al cliente{" "}
              <span className="font-semibold text-zinc-900 dark:text-white">{cliente?.nombre}</span>? Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="min-h-10 px-4 py-2 text-sm font-medium rounded-lg
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
                className="min-h-10 px-4 py-2 text-sm font-medium rounded-lg
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
