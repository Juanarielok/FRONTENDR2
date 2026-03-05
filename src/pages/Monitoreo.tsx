import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import type { Cliente, Remito } from "../api";
import { ThemeToggle } from "../components/ThemeToggle";
import { LiveTrackingView } from "../components/LiveTrackingView";

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

// ============ ICONS ============

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

function IconNavigation({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
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

function IconMail({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
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

function IconFileText({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
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

function IconDollarSign({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function IconTrendingUp({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconAlertCircle({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconTarget({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

// ============ HELPERS ============

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


function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
}


// ============ COMPONENTS ============

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
  color: "amber" | "emerald" | "blue" | "purple" | "red" | "cyan";
  trend?: "up" | "down" | "neutral";
}) {
  const colorClasses = {
    amber: "bg-amber-100 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400",
    emerald: "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-100 dark:bg-purple-500/20 border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400",
    red: "bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400",
    cyan: "bg-cyan-100 dark:bg-cyan-500/20 border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400",
  };

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 border flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`text-xs font-medium ${
            trend === "up" ? "text-emerald-600 dark:text-emerald-400" :
            trend === "down" ? "text-red-600 dark:text-red-400" :
            "text-zinc-500"
          }`}>
            {trend === "up" && "↑"}
            {trend === "down" && "↓"}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-1">{label}</p>
        {subValue && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{subValue}</p>
        )}
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  color,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  color: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 border flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ============ MAIN COMPONENT ============

export default function Monitoreo() {
  const nav = useNavigate();

  const [choferesActivos, setChoferesActivos] = useState<ChoferActivo[]>([]);
  const [todosChoferes, setTodosChoferes] = useState<Chofer[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Para ver historial de un chofer
  const [selectedChofer, setSelectedChofer] = useState<string | null>(null);
  const [historial, setHistorial] = useState<ChoferHistorial | null>(null);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Tab activa
  const [activeTab, setActiveTab] = useState<"overview" | "choferes" | "clientes" | "remitos" | "rastreo">("overview");

  // Remitos
  const [remitos, setRemitos] = useState<Remito[]>([]);
  const [loadingRemitos, setLoadingRemitos] = useState(false);

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
      setLastUpdate(new Date());
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
      const res = await api.getHistorialChofer(choferId, 20);
      setHistorial(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistorial(false);
    }
  }

  async function loadRemitos() {
    if (remitos.length > 0) return;
    setLoadingRemitos(true);
    try {
      const res = await api.getAllRemitos();
      setRemitos(res.remitos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRemitos(false);
    }
  }

  useEffect(() => {
    if (activeTab === "remitos") loadRemitos();
  }, [activeTab]);

  function logout() {
    localStorage.removeItem("token");
    nav("/login", { replace: true });
  }

  // ============ COMPUTED VALUES ============

  const stats = useMemo(() => {
    const clientesAsignados = clientes.filter((c) => c.status === "asignado").length;
    const clientesVisitados = clientes.filter((c) => c.status === "visitado").length;
    const clientesDisponibles = clientes.filter((c) => c.status === "disponible" || !c.status).length;

    const choferesInactivos = todosChoferes.length - choferesActivos.length;
    const tasaActividad = todosChoferes.length > 0
      ? Math.round((choferesActivos.length / todosChoferes.length) * 100)
      : 0;

    const tasaCobertura = clientes.length > 0
      ? Math.round(((clientesVisitados + clientesAsignados) / clientes.length) * 100)
      : 0;

    const tasaVisitas = clientes.length > 0
      ? Math.round((clientesVisitados / clientes.length) * 100)
      : 0;

    // Tiempo promedio activo
    const tiempoTotalActivo = choferesActivos.reduce((sum, a) => sum + a.tiempoTranscurrido.minutos, 0);
    const tiempoPromedioActivo = choferesActivos.length > 0
      ? Math.round(tiempoTotalActivo / choferesActivos.length)
      : 0;

    return {
      clientesAsignados,
      clientesVisitados,
      clientesDisponibles,
      choferesInactivos,
      tasaActividad,
      tasaCobertura,
      tasaVisitas,
      tiempoPromedioActivo,
      tiempoTotalActivo,
    };
  }, [clientes, todosChoferes, choferesActivos]);

  // Agrupar clientes por status
  const clientesPorStatus = useMemo(() => {
    return {
      disponibles: clientes.filter((c) => c.status === "disponible" || !c.status),
      asignados: clientes.filter((c) => c.status === "asignado"),
      visitados: clientes.filter((c) => c.status === "visitado"),
    };
  }, [clientes]);

  // Choferes con más tiempo activo hoy
  const choferesRanking = useMemo(() => {
    return [...choferesActivos].sort((a, b) => 
      b.tiempoTranscurrido.minutos - a.tiempoTranscurrido.minutos
    );
  }, [choferesActivos]);

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
                    Centro de Monitoreo
                  </h1>
                  <p className="text-xs text-zinc-500">
                    Última actualización: {formatTime(lastUpdate.toISOString())}
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
                onClick={() => nav("/admin")}
                className="w-10 h-10 flex items-center justify-center
                  bg-zinc-100 dark:bg-zinc-900
                  border border-zinc-300 dark:border-zinc-700
                  text-zinc-600 dark:text-zinc-400
                  hover:bg-zinc-200 dark:hover:bg-zinc-800
                  hover:text-zinc-900 dark:hover:text-white
                  hover:border-zinc-400 dark:hover:border-zinc-600
                  transition-all duration-200"
                title="Gestion"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                         bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 
                         text-zinc-700 dark:text-zinc-300
                         hover:bg-zinc-200 dark:hover:bg-zinc-800 
                         transition-all duration-200"
              >
                <IconLogout className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4 -mb-4 border-b border-transparent">
            {[
              { id: "overview", label: "Resumen", icon: IconActivity },
              { id: "choferes", label: "Choferes", icon: IconTruck },
              { id: "clientes", label: "Clientes", icon: IconUsers },
              { id: "remitos", label: "Remitos", icon: IconFileText },
              { id: "rastreo", label: "Rastreo", icon: IconNavigation },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
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
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            {/* ============ OVERVIEW TAB ============ */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Grid - Row 1 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={IconTruck}
                    label="Choferes Activos"
                    value={choferesActivos.length}
                    subValue={`de ${todosChoferes.length} totales`}
                    color="emerald"
                  />
                  <StatCard
                    icon={IconTarget}
                    label="Tasa de Actividad"
                    value={`${stats.tasaActividad}%`}
                    subValue="choferes trabajando"
                    color="blue"
                  />
                  <StatCard
                    icon={IconCheckCircle}
                    label="Clientes Visitados"
                    value={stats.clientesVisitados}
                    subValue={`${stats.tasaVisitas}% del total`}
                    color="purple"
                  />
                  <StatCard
                    icon={IconClock}
                    label="Tiempo Promedio"
                    value={`${Math.floor(stats.tiempoPromedioActivo / 60)}h ${stats.tiempoPromedioActivo % 60}m`}
                    subValue="por chofer activo"
                    color="cyan"
                  />
                </div>

                {/* Stats Grid - Row 2 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={IconUser}
                    label="Clientes Asignados"
                    value={stats.clientesAsignados}
                    subValue="pendientes de visita"
                    color="amber"
                  />
                  <StatCard
                    icon={IconUsers}
                    label="Clientes Disponibles"
                    value={stats.clientesDisponibles}
                    subValue="sin asignar"
                    color="red"
                  />
                  <StatCard
                    icon={IconTrendingUp}
                    label="Cobertura Total"
                    value={`${stats.tasaCobertura}%`}
                    subValue="asignados + visitados"
                    color="emerald"
                  />
                  <StatCard
                    icon={IconActivity}
                    label="Tiempo Total Hoy"
                    value={`${Math.floor(stats.tiempoTotalActivo / 60)}h ${stats.tiempoTotalActivo % 60}m`}
                    subValue="todos los choferes"
                    color="blue"
                  />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Choferes Activos - Live */}
                  <div className="lg:col-span-2 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                    <SectionHeader
                      icon={IconActivity}
                      title="Actividad en Tiempo Real"
                      subtitle={`${choferesActivos.length} choferes trabajando ahora`}
                      color="bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      action={
                        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          En vivo
                        </div>
                      }
                    />

                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800/50 max-h-80 overflow-y-auto">
                      {choferesActivos.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                          <div className="w-12 h-12 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                            <IconTruck className="w-6 h-6 text-zinc-400" />
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                            No hay choferes activos
                          </p>
                          <p className="text-sm text-zinc-500 mt-1">
                            Ningún chofer ha iniciado jornada hoy
                          </p>
                        </div>
                      ) : (
                        choferesActivos.map((activo, index) => (
                          <div key={activo.id} className="px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="relative">
                                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                      {activo.chofer.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-zinc-950 text-xs font-bold flex items-center justify-center">
                                    {index + 1}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-medium text-zinc-900 dark:text-white">
                                    {activo.chofer.nombre}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500">
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
                                    {activo.ubicacionCheckIn && (
                                      <div className="flex items-center gap-1">
                                        <IconMapPin className="w-3 h-3" />
                                        <span>{activo.ubicacionCheckIn}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                  {activo.tiempoTranscurrido.formato}
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">
                                  {activo.tiempoTranscurrido.minutos} min
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Estado de Clientes */}
                  <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                    <SectionHeader
                      icon={IconUsers}
                      title="Estado de Clientes"
                      subtitle={`${clientes.length} totales`}
                      color="bg-purple-100 dark:bg-purple-500/20 border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400"
                    />

                    <div className="p-6 space-y-6">
                      {/* Donut-like visualization */}
                      <div className="flex items-center justify-center">
                        <div className="relative w-40 h-40">
                          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            {/* Background circle */}
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-zinc-200 dark:text-zinc-800" />
                            
                            {/* Visitados (green) */}
                            <circle
                              cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3"
                              strokeDasharray={`${stats.tasaVisitas} ${100 - stats.tasaVisitas}`}
                              className="text-emerald-500"
                            />
                            
                            {/* Asignados (amber) - offset by visitados */}
                            <circle
                              cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3"
                              strokeDasharray={`${(stats.clientesAsignados / clientes.length) * 100} ${100 - (stats.clientesAsignados / clientes.length) * 100}`}
                              strokeDashoffset={`-${stats.tasaVisitas}`}
                              className="text-amber-500"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.tasaCobertura}%</p>
                            <p className="text-xs text-zinc-500">cobertura</p>
                          </div>
                        </div>
                      </div>

                      {/* Legend with details */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500" />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">Visitados</span>
                          </div>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.clientesVisitados}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-amber-500" />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">Asignados</span>
                          </div>
                          <span className="font-semibold text-amber-600 dark:text-amber-400">{stats.clientesAsignados}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-zinc-400 dark:bg-zinc-600" />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">Disponibles</span>
                          </div>
                          <span className="font-semibold text-zinc-600 dark:text-zinc-400">{stats.clientesDisponibles}</span>
                        </div>
                      </div>

                      {/* Alert if too many disponibles */}
                      {stats.clientesDisponibles > stats.clientesAsignados + stats.clientesVisitados && (
                        <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-2">
                          <IconAlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Hay muchos clientes sin asignar. Considera asignar más clientes a los choferes activos.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar full width */}
                <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Progreso del Día</h3>
                    <span className="text-sm text-zinc-500">
                      {stats.clientesVisitados} de {clientes.length} clientes atendidos
                    </span>
                  </div>
                  <div className="h-6 bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500 flex items-center justify-center"
                      style={{ width: `${stats.tasaVisitas}%` }}
                    >
                      {stats.tasaVisitas > 10 && (
                        <span className="text-xs font-medium text-white">{stats.tasaVisitas}%</span>
                      )}
                    </div>
                    <div
                      className="h-full bg-amber-500 transition-all duration-500 flex items-center justify-center"
                      style={{ width: `${(stats.clientesAsignados / clientes.length) * 100}%` }}
                    >
                      {(stats.clientesAsignados / clientes.length) * 100 > 10 && (
                        <span className="text-xs font-medium text-zinc-900">
                          {Math.round((stats.clientesAsignados / clientes.length) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============ CHOFERES TAB ============ */}
            {activeTab === "choferes" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lista de todos los choferes */}
                <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                  <SectionHeader
                    icon={IconUsers}
                    title="Todos los Choferes"
                    subtitle={`${todosChoferes.length} registrados`}
                    color="bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400"
                  />

                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800/50 max-h-[600px] overflow-y-auto">
                    {todosChoferes.length === 0 ? (
                      <div className="px-6 py-12 text-center">
                        <p className="text-zinc-500">No hay choferes registrados</p>
                      </div>
                    ) : (
                      todosChoferes.map((chofer) => {
                        const isActive = choferesActivos.some((a) => a.chofer.id === chofer.id);
                        const activoData = choferesActivos.find((a) => a.chofer.id === chofer.id);
                        const isExpanded = selectedChofer === chofer.id;

                        return (
                          <div key={chofer.id}>
                            <button
                              onClick={() => loadHistorial(chofer.id)}
                              className="w-full px-6 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 border flex items-center justify-center flex-shrink-0 ${
                                    isActive
                                      ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30"
                                      : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                                  }`}>
                                    <span className={`text-sm font-semibold ${
                                      isActive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"
                                    }`}>
                                      {chofer.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-medium text-zinc-900 dark:text-white">
                                        {chofer.nombre}
                                      </h3>
                                      {isActive && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                          Activo
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                                      <div className="flex items-center gap-1">
                                        <IconMail className="w-3 h-3" />
                                        <span>{chofer.email}</span>
                                      </div>
                                    </div>
                                    {isActive && activoData && (
                                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                        Trabajando hace {activoData.tiempoTranscurrido.formato}
                                      </p>
                                    )}
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
                                  <div className="py-6 text-center">
                                    <svg className="animate-spin h-6 w-6 mx-auto text-amber-500" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  </div>
                                ) : historial ? (
                                  <div className="space-y-4 pt-2">
                                    {/* Resumen del chofer */}
                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="p-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 text-center">
                                        <p className="text-xl font-bold text-zinc-900 dark:text-white">
                                          {historial.resumen.totalJornadas}
                                        </p>
                                        <p className="text-xs text-zinc-500">Jornadas</p>
                                      </div>
                                      <div className="p-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 text-center">
                                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                          {historial.resumen.jornadasCompletadas}
                                        </p>
                                        <p className="text-xs text-zinc-500">Completadas</p>
                                      </div>
                                      <div className="p-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 text-center">
                                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                          {historial.resumen.tiempoTotal.formato}
                                        </p>
                                        <p className="text-xs text-zinc-500">Total</p>
                                      </div>
                                    </div>

                                    {/* Lista de jornadas */}
                                    <div>
                                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
                                        Últimas jornadas
                                      </p>
                                      <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {historial.jornadas.length === 0 ? (
                                          <p className="text-sm text-zinc-500 py-2">Sin jornadas registradas</p>
                                        ) : (
                                          historial.jornadas.map((jornada) => (
                                            <div
                                              key={jornada.id}
                                              className="p-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700"
                                            >
                                              <div className="flex items-center justify-between">
                                                <div>
                                                  <div className="flex items-center gap-2 text-sm">
                                                    <IconCalendar className="w-4 h-4 text-zinc-400" />
                                                    <span className="font-medium text-zinc-900 dark:text-white">
                                                      {formatDateTime(jornada.checkIn)}
                                                    </span>
                                                  </div>
                                                  {jornada.ubicacionCheckIn && (
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                                                      <IconMapPin className="w-3 h-3" />
                                                      <span>{jornada.ubicacionCheckIn}</span>
                                                    </div>
                                                  )}
                                                  {jornada.notas && (
                                                    <p className="mt-1 text-xs text-zinc-500 italic">
                                                      "{jornada.notas}"
                                                    </p>
                                                  )}
                                                </div>
                                                <div className="text-right">
                                                  {jornada.checkOut ? (
                                                    <span className="inline-flex items-center px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                                                      {jornada.duracion?.formato}
                                                    </span>
                                                  ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium">
                                                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                                      En curso
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
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

                {/* Ranking de choferes activos */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                    <SectionHeader
                      icon={IconTrendingUp}
                      title="Ranking de Actividad"
                      subtitle="Por tiempo trabajado hoy"
                      color="bg-amber-100 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400"
                    />

                    <div className="p-6">
                      {choferesRanking.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-zinc-500">No hay choferes activos</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {choferesRanking.slice(0, 5).map((activo, index) => (
                            <div
                              key={activo.id}
                              className={`flex items-center gap-4 p-3 ${
                                index === 0 ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20" : ""
                              }`}
                            >
                              <div className={`w-8 h-8 flex items-center justify-center font-bold ${
                                index === 0 ? "bg-amber-500 text-zinc-950" :
                                index === 1 ? "bg-zinc-300 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200" :
                                index === 2 ? "bg-amber-700 text-white" :
                                "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                              }`}>
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-zinc-900 dark:text-white">
                                  {activo.chofer.nombre}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  Check-in: {formatTime(activo.checkIn)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-zinc-900 dark:text-white">
                                  {activo.tiempoTranscurrido.formato}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {activo.tiempoTranscurrido.minutos} min
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Choferes inactivos */}
                  <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                    <SectionHeader
                      icon={IconAlertCircle}
                      title="Choferes Inactivos"
                      subtitle={`${stats.choferesInactivos} sin jornada activa`}
                      color="bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400"
                    />

                    <div className="p-6">
                      {stats.choferesInactivos === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                            ¡Todos los choferes están activos!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {todosChoferes
                            .filter((c) => !choferesActivos.some((a) => a.chofer.id === c.id))
                            .map((chofer) => (
                              <div key={chofer.id} className="flex items-center gap-3 p-2">
                                <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                  <span className="text-xs font-semibold text-zinc-500">
                                    {chofer.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    {chofer.nombre}
                                  </p>
                                </div>
                                <span className="text-xs text-red-500">Sin actividad</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============ CLIENTES TAB ============ */}
            {activeTab === "clientes" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Clientes Disponibles */}
                <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                  <SectionHeader
                    icon={IconUser}
                    title="Disponibles"
                    subtitle={`${clientesPorStatus.disponibles.length} sin asignar`}
                    color="bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400"
                  />
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800/50 max-h-96 overflow-y-auto">
                    {clientesPorStatus.disponibles.length === 0 ? (
                      <div className="px-6 py-8 text-center">
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                          ¡Todos asignados!
                        </p>
                      </div>
                    ) : (
                      clientesPorStatus.disponibles.map((cliente) => (
                        <Link
                          key={cliente.id}
                          to={`/clientes/${cliente.id}`}
                          className="block px-6 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                          <p className="font-medium text-zinc-900 dark:text-white text-sm">
                            {cliente.nombre}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">{cliente.ubicacion}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                {/* Clientes Asignados */}
                <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                  <SectionHeader
                    icon={IconTarget}
                    title="Asignados"
                    subtitle={`${clientesPorStatus.asignados.length} pendientes`}
                    color="bg-amber-100 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400"
                  />
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800/50 max-h-96 overflow-y-auto">
                    {clientesPorStatus.asignados.length === 0 ? (
                      <div className="px-6 py-8 text-center">
                        <p className="text-zinc-500">Ningún cliente asignado</p>
                      </div>
                    ) : (
                      clientesPorStatus.asignados.map((cliente) => (
                        <Link
                          key={cliente.id}
                          to={`/clientes/${cliente.id}`}
                          className="block px-6 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                          <p className="font-medium text-zinc-900 dark:text-white text-sm">
                            {cliente.nombre}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">{cliente.ubicacion}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                {/* Clientes Visitados */}
                <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                  <SectionHeader
                    icon={IconCheckCircle}
                    title="Visitados"
                    subtitle={`${clientesPorStatus.visitados.length} completados`}
                    color="bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  />
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800/50 max-h-96 overflow-y-auto">
                    {clientesPorStatus.visitados.length === 0 ? (
                      <div className="px-6 py-8 text-center">
                        <p className="text-zinc-500">Ningún cliente visitado aún</p>
                      </div>
                    ) : (
                      clientesPorStatus.visitados.map((cliente) => (
                        <Link
                          key={cliente.id}
                          to={`/clientes/${cliente.id}`}
                          className="block px-6 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-white text-sm">
                                {cliente.nombre}
                              </p>
                              <p className="text-xs text-zinc-500 truncate">{cliente.ubicacion}</p>
                            </div>
                            <IconCheckCircle className="w-4 h-4 text-emerald-500" />
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============ REMITOS TAB ============ */}
            {activeTab === "remitos" && (
              <div className="space-y-6">
                {loadingRemitos ? (
                  <div className="flex items-center justify-center py-20">
                    <svg className="animate-spin h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : remitos.length === 0 ? (
                  <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-12 text-center">
                    <IconFileText className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                    <p className="text-zinc-500">No hay remitos registrados</p>
                  </div>
                ) : (
                  <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <StatCard
                        icon={IconFileText}
                        label="Total Remitos"
                        value={remitos.length}
                        color="blue"
                      />
                      <StatCard
                        icon={IconDollarSign}
                        label="Facturación Total"
                        value={formatCurrency(remitos.reduce((s, r) => s + r.total, 0))}
                        color="emerald"
                      />
                      <StatCard
                        icon={IconPackage}
                        label="Productos Entregados"
                        value={remitos.reduce((s, r) => s + r.productos.reduce((ps, p) => ps + p.cantidad, 0), 0)}
                        color="amber"
                      />
                    </div>

                    {/* Remitos list */}
                    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                      <SectionHeader
                        icon={IconFileText}
                        title="Todos los Remitos"
                        subtitle={`${remitos.length} registros`}
                        color="bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400"
                      />
                      <div className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                        {[...remitos]
                          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                          .map((remito) => {
                            const cliente = clientes.find((c) => c.id === remito.clienteId);
                            return (
                              <div key={remito.id} className="px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-medium text-zinc-900 dark:text-white">
                                        {cliente?.nombre || `Cliente ${remito.clienteId}`}
                                      </h3>
                                      <span className="text-xs text-zinc-400">{remito.id}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                                      <div className="flex items-center gap-1">
                                        <IconCalendar className="w-3 h-3" />
                                        <span>{formatDateTime(remito.fecha)}</span>
                                      </div>
                                      {remito.chofer && (
                                        <div className="flex items-center gap-1">
                                          <IconTruck className="w-3 h-3" />
                                          <span>{remito.chofer.nombre}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {remito.productos.map((prod, pi) => (
                                        <span
                                          key={pi}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400"
                                        >
                                          <IconPackage className="w-3 h-3" />
                                          {prod.cantidad}x {prod.nombre}
                                        </span>
                                      ))}
                                    </div>
                                    {remito.notas && (
                                      <p className="text-xs text-zinc-400 italic mt-1">"{remito.notas}"</p>
                                    )}
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-zinc-900 dark:text-white">
                                      {formatCurrency(remito.total)}
                                    </p>
                                    <p className="text-[10px] text-zinc-400 mt-0.5">
                                      IVA: {formatCurrency(remito.iva)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ============ RASTREO TAB ============ */}
            {activeTab === "rastreo" && (
              <LiveTrackingView clientes={clientes} />
            )}

          </>
        )}
      </main>
    </div>
  );
}