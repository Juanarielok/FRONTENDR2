import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import type { Cliente } from "../api";
import { ThemeToggle } from "../components/ThemeToggle";

type ChoferActivo = {
  id: string;
  chofer: {
    id: string;
    nombre: string;
    telefono: string;
  };
  checkIn: string;
  ubicacionCheckIn: string;
  tiempoTranscurrido: {
    minutos: number;
    formato: string;
  };
};

type Chofer = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  ubicacion: string;
};

type HistorialJornada = {
  id: string;
  checkIn: string;
  checkOut: string | null;
  ubicacionCheckIn: string;
  ubicacionCheckOut: string | null;
  notas: string;
  duracion: { minutos: number; formato: string } | null;
};

type ChoferHistorial = {
  chofer: { id: string; nombre: string };
  resumen: {
    totalJornadas: number;
    jornadasCompletadas: number;
    tiempoTotal: { minutos: number; formato: string };
  };
  jornadas: HistorialJornada[];
};

// Icons
function IconArrowLeft({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function IconActivity({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconTruck({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function IconUser({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconUsers({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconClock({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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

function IconPhone({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
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

function IconCheckCircle({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconRefresh({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

function IconChevronDown({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
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

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: "amber" | "emerald" | "blue" | "purple";
}) {
  const colorClasses = {
    amber: "bg-amber-100 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400",
    emerald: "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-100 dark:bg-purple-500/20 border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 border flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function Monitoreo() {
  const nav = useNavigate();

  const [choferesActivos, setChoferesActivos] = useState<ChoferActivo[]>([]);
  const [todosChoferes, setTodosChoferes] = useState<Chofer[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Para ver historial de un chofer
  const [selectedChofer, setSelectedChofer] = useState<string | null>(null);
  const [historial, setHistorial] = useState<ChoferHistorial | null>(null);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  async function loadData() {
    try {
      const [activosRes, choferesRes, clientesRes] = await Promise.all([
        api.getJornadasActivas(),
        api.listChoferes(),
        api.listClientes(),
      ]);

      setChoferesActivos(activosRes.choferesActivos || []);
      setTodosChoferes(choferesRes.users || []);
      
      const clientesList = Array.isArray(clientesRes)
        ? clientesRes
        : Array.isArray((clientesRes as any)?.users)
        ? (clientesRes as any).users
        : [];
      setClientes(clientesList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
  }

  async function loadHistorial(choferId: string) {
    if (selectedChofer === choferId) {
      setSelectedChofer(null);
      setHistorial(null);
      return;
    }

    setSelectedChofer(choferId);
    setLoadingHistorial(true);

    try {
      const res = await api.getHistorialChofer(choferId, 10);
      setHistorial(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistorial(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    nav("/login", { replace: true });
  }

  // Calcular estadísticas
  const clientesAsignados = clientes.filter((c) => c.status === "asignado").length;
  const clientesVisitados = clientes.filter((c) => c.status === "visitado").length;
  const clientesDisponibles = clientes.filter((c) => c.status === "disponible" || !c.status).length;

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors duration-300">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-[0.015] dark:opacity-[0.02] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 100px,
              currentColor 100px,
              currentColor 101px
            ), repeating-linear-gradient(
              0deg,
              transparent,
              transparent 100px,
              currentColor 100px,
              currentColor 101px
            )`,
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 flex items-center justify-center">
                  <IconActivity className="w-6 h-6 text-zinc-950" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight">
                    Monitoreo
                  </h1>
                  <p className="text-xs text-zinc-500">
                    Estado en tiempo real
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium
                         bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 
                         text-zinc-700 dark:text-zinc-300
                         hover:bg-zinc-200 dark:hover:bg-zinc-800 
                         disabled:opacity-50
                         transition-all duration-200"
              >
                <IconRefresh className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
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
      <main className="max-w-7xl mx-auto px-6 py-8">
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
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={IconTruck}
                label="Choferes Activos"
                value={choferesActivos.length}
                color="emerald"
              />
              <StatCard
                icon={IconUsers}
                label="Total Choferes"
                value={todosChoferes.length}
                color="blue"
              />
              <StatCard
                icon={IconUser}
                label="Clientes Asignados"
                value={clientesAsignados}
                color="amber"
              />
              <StatCard
                icon={IconCheckCircle}
                label="Clientes Visitados"
                value={clientesVisitados}
                color="purple"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Choferes Activos */}
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
                      <IconActivity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold">Choferes Activos</h2>
                      <p className="text-xs text-zinc-500">Con jornada en curso</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-zinc-200 dark:divide-zinc-800/50 max-h-96 overflow-y-auto">
                  {choferesActivos.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <div className="w-12 h-12 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                        <IconTruck className="w-6 h-6 text-zinc-400" />
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                        No hay choferes activos
                      </p>
                      <p className="text-sm text-zinc-500 mt-1">
                        Ningún chofer ha iniciado jornada
                      </p>
                    </div>
                  ) : (
                    choferesActivos.map((activo) => (
                      <div key={activo.id} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                {activo.chofer.nombre
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-medium text-zinc-900 dark:text-white">
                                {activo.chofer.nombre}
                              </h3>
                              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                                <div className="flex items-center gap-1">
                                  <IconClock className="w-3 h-3" />
                                  <span>Check-in: {formatTime(activo.checkIn)}</span>
                                </div>
                                {activo.chofer.telefono && (
                                  <div className="flex items-center gap-1">
                                    <IconPhone className="w-3 h-3" />
                                    <span>{activo.chofer.telefono}</span>
                                  </div>
                                )}
                              </div>
                              {activo.ubicacionCheckIn && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                                  <IconMapPin className="w-3 h-3" />
                                  <span>{activo.ubicacionCheckIn}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              {activo.tiempoTranscurrido.formato}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Todos los Choferes */}
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center">
                      <IconUsers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold">Todos los Choferes</h2>
                      <p className="text-xs text-zinc-500">Click para ver historial</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-zinc-200 dark:divide-zinc-800/50 max-h-96 overflow-y-auto">
                  {todosChoferes.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <div className="w-12 h-12 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                        <IconUser className="w-6 h-6 text-zinc-400" />
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                        No hay choferes registrados
                      </p>
                    </div>
                  ) : (
                    todosChoferes.map((chofer) => {
                      const isActive = choferesActivos.some((a) => a.chofer.id === chofer.id);
                      const isExpanded = selectedChofer === chofer.id;

                      return (
                        <div key={chofer.id}>
                          <button
                            onClick={() => loadHistorial(chofer.id)}
                            className="w-full px-6 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 border flex items-center justify-center flex-shrink-0 ${
                                  isActive
                                    ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30"
                                    : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                                }`}>
                                  <span className={`text-sm font-semibold ${
                                    isActive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"
                                  }`}>
                                    {chofer.nombre
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-zinc-900 dark:text-white">
                                      {chofer.nombre}
                                    </h3>
                                    {isActive && (
                                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    )}
                                  </div>
                                  <p className="text-xs text-zinc-500">{chofer.email}</p>
                                </div>
                              </div>
                              <IconChevronDown
                                className={`w-5 h-5 text-zinc-400 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </button>

                          {/* Historial expandido */}
                          {isExpanded && (
                            <div className="px-6 pb-4 bg-zinc-50 dark:bg-zinc-800/20">
                              {loadingHistorial ? (
                                <div className="py-4 text-center">
                                  <svg
                                    className="animate-spin h-6 w-6 mx-auto text-amber-500"
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
                              ) : historial ? (
                                <div className="space-y-3">
                                  {/* Resumen */}
                                  <div className="grid grid-cols-3 gap-2 text-center py-3 border-b border-zinc-200 dark:border-zinc-700">
                                    <div>
                                      <p className="text-lg font-bold text-zinc-900 dark:text-white">
                                        {historial.resumen.totalJornadas}
                                      </p>
                                      <p className="text-xs text-zinc-500">Total</p>
                                    </div>
                                    <div>
                                      <p className="text-lg font-bold text-zinc-900 dark:text-white">
                                        {historial.resumen.jornadasCompletadas}
                                      </p>
                                      <p className="text-xs text-zinc-500">Completadas</p>
                                    </div>
                                    <div>
                                      <p className="text-lg font-bold text-zinc-900 dark:text-white">
                                        {historial.resumen.tiempoTotal.formato}
                                      </p>
                                      <p className="text-xs text-zinc-500">Tiempo total</p>
                                    </div>
                                  </div>

                                  {/* Últimas jornadas */}
                                  <div className="space-y-2">
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider">
                                      Últimas jornadas
                                    </p>
                                    {historial.jornadas.length === 0 ? (
                                      <p className="text-sm text-zinc-500 py-2">
                                        Sin jornadas registradas
                                      </p>
                                    ) : (
                                      historial.jornadas.slice(0, 5).map((jornada) => (
                                        <div
                                          key={jornada.id}
                                          className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700"
                                        >
                                          <div className="flex items-center gap-2 text-xs">
                                            <IconCalendar className="w-3 h-3 text-zinc-400" />
                                            <span className="text-zinc-600 dark:text-zinc-300">
                                              {formatDateTime(jornada.checkIn)}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {jornada.checkOut ? (
                                              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                {jornada.duracion?.formato}
                                              </span>
                                            ) : (
                                              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                                En curso
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Resumen de Clientes */}
            <div className="mt-8 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center">
                    <IconUser className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Estado de Clientes</h2>
                    <p className="text-xs text-zinc-500">{clientes.length} clientes registrados</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4">
                  {/* Progress bar */}
                  <div className="flex-1 h-4 bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: clientes.length > 0 ? `${(clientesVisitados / clientes.length) * 100}%` : "0%",
                      }}
                    />
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{
                        width: clientes.length > 0 ? `${(clientesAsignados / clientes.length) * 100}%` : "0%",
                      }}
                    />
                    <div
                      className="h-full bg-zinc-400 dark:bg-zinc-600 transition-all duration-500"
                      style={{
                        width: clientes.length > 0 ? `${(clientesDisponibles / clientes.length) * 100}%` : "0%",
                      }}
                    />
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500" />
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Visitados ({clientesVisitados})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500" />
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Asignados ({clientesAsignados})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-zinc-400 dark:bg-zinc-600" />
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Disponibles ({clientesDisponibles})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}