import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import type { Cliente } from "../api";
import { ThemeToggle } from "../components/ThemeToggle";
import { LiveTrackingView } from "../components/LiveTrackingView";
import {
  IconActivity,
  IconTruck,
  IconUser,
  IconUsers,
  IconClock,
  IconMapPin,
  IconNavigation,
  IconPhone,
  IconMail,
  IconCalendar,
  IconCheckCircle,
  IconRefresh,
  IconChevronDown,
  IconTrendingUp,
  IconAlertCircle,
  IconTarget,
  IconArrowLeft,
  IconLogout,
  IconSettings,
} from "../components/icons";

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

type ActivityRange = "1h" | "6h" | "10h" | "today";

const ACTIVITY_RANGE_OPTIONS: {
  value: ActivityRange;
  label: string;
  ariaLabel: string;
}[] = [
  { value: "1h", label: "1 h", ariaLabel: "Última hora, limitada al día de hoy" },
  { value: "6h", label: "6 h", ariaLabel: "Últimas 6 horas, limitadas al día de hoy" },
  { value: "10h", label: "10 h", ariaLabel: "Últimas 10 horas, limitadas al día de hoy" },
  { value: "today", label: "Hoy", ariaLabel: "Desde el inicio de hoy" },
];

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

function formatMinutes(totalMinutes: number) {
  const minutes = Math.max(0, Math.round(totalMinutes));
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function getActivityRangeStart(range: ActivityRange, end: Date) {
  const startOfToday = new Date(end);
  startOfToday.setHours(0, 0, 0, 0);

  if (range === "today") return startOfToday.getTime();

  const hours = range === "1h" ? 1 : range === "6h" ? 6 : 10;
  return Math.max(startOfToday.getTime(), end.getTime() - hours * 60 * 60 * 1000);
}

// ============ COMPONENTS ============

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color: _color,
  trend,
  scope,
  scopeTone = "neutral",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
  color: "amber" | "emerald" | "blue" | "purple" | "red" | "cyan";
  trend?: "up" | "down" | "neutral";
  scope?: string;
  scopeTone?: "neutral" | "accent";
}) {
  void _color;

  return (
    <div
      className="group p-[3px] rounded-xl transition-all duration-500"
    >
      <div
        className="rounded-xl bg-white dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-sm shadow-zinc-900/5 overflow-hidden p-4 transition-all duration-500 group-hover:border-amber-300 dark:group-hover:border-amber-500/40"
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 flex items-center justify-center text-zinc-700 dark:text-zinc-300 transition-colors duration-300">
            <Icon className="w-6 h-6 transition-all duration-300" />
          </div>

          {scope ? (
            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide ${
              scopeTone === "accent"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}>
              {scope}
            </span>
          ) : trend ? (
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
              {trend === "up" && "↑"}
              {trend === "down" && "↓"}
            </div>
          ) : null}
        </div>

        <div className="mt-4 px-2 text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-white transition-colors duration-300">
            {value}
          </p>
          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[3px] mt-1 transition-colors duration-300">
            {label}
          </p>
          {subValue && (
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-1 transition-colors duration-300">
              {subValue}
            </p>
          )}
        </div>
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
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${color}`}>
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

  // Pestaña activa
  const [activeTab, setActiveTab] = useState<"overview" | "choferes" | "clientes" | "rastreo">("overview");
  const [activityRange, setActivityRange] = useState<ActivityRange>("today");

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

    // Actualización automática cada 30 segundos
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
    const tasaCobertura = clientes.length > 0
      ? Math.round(((clientesVisitados + clientesAsignados) / clientes.length) * 100)
      : 0;

    const tasaVisitas = clientes.length > 0
      ? Math.round((clientesVisitados / clientes.length) * 100)
      : 0;

    return {
      clientesAsignados,
      clientesVisitados,
      clientesDisponibles,
      choferesInactivos,
      tasaCobertura,
      tasaVisitas,
    };
  }, [clientes, todosChoferes, choferesActivos]);

  const selectedActivityRange = ACTIVITY_RANGE_OPTIONS.find(
    (option) => option.value === activityRange
  ) ?? ACTIVITY_RANGE_OPTIONS[3];

  const rangedActivity = useMemo(() => {
    const end = lastUpdate.getTime();
    const start = getActivityRangeStart(activityRange, lastUpdate);

    const activeDurations = choferesActivos.flatMap((active) => {
      const checkIn = Date.parse(active.checkIn);
      if (!Number.isFinite(checkIn) || checkIn > end) return [];

      return [Math.max(0, end - Math.max(checkIn, start))];
    });

    const totalMilliseconds = activeDurations.reduce((sum, duration) => sum + duration, 0);

    return {
      totalMinutes: Math.floor(totalMilliseconds / 60000),
      averageMinutes: activeDurations.length > 0
        ? Math.round(totalMilliseconds / activeDurations.length / 60000)
        : 0,
    };
  }, [activityRange, choferesActivos, lastUpdate]);

  // Agrupar clientes por estado
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
    <div className="min-h-screen fondo-home bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors duration-300">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-[0] dark:opacity-[0.02] pointer-events-none">
        <div
          className="absolute inset-0"

        />
      </div>

      {/* Header */}
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
                  src="/images/brand/arttaius-logo-compact.png"
                  alt="Arttaius"
                  className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
                />
              </Link>
              <div className="min-w-0 px-3 sm:px-4 py-2 sm:py-3 border-l-[3px] border-amber-500">
                <h1 className="truncate text-sm sm:text-lg font-semibold text-zinc-800 dark:text-zinc-100 tracking-[1.5px] sm:tracking-[3px]">
                  PANEL DE MONITOREO
                </h1>
                <p className="hidden sm:block truncate text-xs text-zinc-500 dark:text-zinc-400">
                  Última actualización: {formatTime(lastUpdate.toISOString())}
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
        <button
  onClick={handleRefresh}
  disabled={refreshing}
  className="flex items-center gap-2 px-3 py-2 text-sm font-medium
             rounded-lg bg-transparent border-0 shadow-none
             text-zinc-700 dark:text-zinc-300
             hover:bg-zinc-100 dark:hover:bg-zinc-800/70
             focus:outline-none focus:ring-0
             disabled:opacity-50
             transition-all duration-200"
>
  <IconRefresh className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
  <span className="hidden sm:inline">Actualizar</span>
</button>
        <button
  onClick={() => nav("/admin")}
  className="w-10 h-10 flex items-center justify-center
             rounded-lg bg-transparent border-0 shadow-none
             text-zinc-700 dark:text-zinc-400
             hover:bg-zinc-100 dark:hover:bg-zinc-800/70
             hover:text-zinc-900 dark:hover:text-white
             focus:outline-none focus:ring-0
             transition-all duration-200"
  title="Gestión"
>
  <IconSettings className="w-5 h-5" />
</button>
              <ThemeToggle />
<button
  onClick={logout}
  className="flex items-center gap-2 px-4 py-2 text-sm font-medium
             rounded-lg bg-transparent border-0 shadow-none
             text-zinc-700 dark:text-zinc-300
             hover:bg-zinc-100 dark:hover:bg-zinc-800/70
             focus:outline-none focus:ring-0
             transition-all duration-200"
>
  <IconLogout className="w-5 h-5" />
  <span className="hidden sm:inline">Salir</span>
</button>
            </nav>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4 -mb-4 border-b border-transparent">
            {[
              { id: "overview", label: "Resumen", icon: IconActivity },
              { id: "choferes", label: "Choferes", icon: IconTruck },
              { id: "clientes", label: "Clientes", icon: IconUsers },
              { id: "rastreo", label: "Rastreo", icon: IconNavigation },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
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
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-8">
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <IconClock className="h-4 w-4 text-zinc-500" />
                      <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Tiempo de jornadas activas
                      </h2>
                    </div>
                    <p id="activity-range-help" className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Los rangos se limitan al día de hoy y solo incluyen las jornadas que siguen activas. «Actual» no aplica ningún filtro temporal.
                    </p>
                  </div>

                  <fieldset className="w-full sm:w-auto" aria-describedby="activity-range-help">
                    <legend className="sr-only">Período de actividad</legend>
                    <div className="grid w-full grid-cols-4 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-900 sm:w-auto">
                      {ACTIVITY_RANGE_OPTIONS.map((option) => (
                        <label key={option.value} className="cursor-pointer">
                          <input
                            type="radio"
                            name="activity-range"
                            value={option.value}
                            checked={activityRange === option.value}
                            onChange={() => setActivityRange(option.value)}
                            className="peer sr-only"
                            aria-label={option.ariaLabel}
                          />
                          <span className="flex min-h-10 items-center justify-center whitespace-nowrap rounded-md px-2.5 text-xs font-semibold text-zinc-600 transition-colors hover:text-zinc-900 peer-checked:bg-white peer-checked:text-amber-700 peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-amber-500/50 dark:text-zinc-400 dark:hover:text-white dark:peer-checked:bg-zinc-800 dark:peer-checked:text-amber-400 sm:px-3">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <p className="sr-only" aria-live="polite">
                    Período seleccionado: {selectedActivityRange.ariaLabel}. Tiempo promedio: {formatMinutes(rangedActivity.averageMinutes)}. Tiempo activo: {formatMinutes(rangedActivity.totalMinutes)}.
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard
                    icon={IconTruck}
                    label="Choferes activos"
                    value={choferesActivos.length}
                    subValue={`de ${todosChoferes.length} en total`}
                    color="emerald"
                    scope="Actual"
                  />
                  <StatCard
                    icon={IconCheckCircle}
                    label="Clientes visitados"
                    value={stats.clientesVisitados}
                    subValue={`${stats.tasaVisitas}% del total`}
                    color="purple"
                    scope="Actual"
                  />
                  <StatCard
                    icon={IconClock}
                    label="Tiempo promedio"
                    value={formatMinutes(rangedActivity.averageMinutes)}
                    subValue="por jornada actualmente activa"
                    color="cyan"
                    scope={selectedActivityRange.label}
                    scopeTone="accent"
                  />
                  <StatCard
                    icon={IconUser}
                    label="Clientes asignados"
                    value={stats.clientesAsignados}
                    subValue="pendientes de visita"
                    color="amber"
                    scope="Actual"
                  />
                  <StatCard
                    icon={IconUsers}
                    label="Clientes disponibles"
                    value={stats.clientesDisponibles}
                    subValue="sin asignar"
                    color="red"
                    scope="Actual"
                  />
                  <StatCard
                    icon={IconActivity}
                    label="Tiempo activo"
                    value={formatMinutes(rangedActivity.totalMinutes)}
                    subValue="solo jornadas actualmente activas"
                    color="blue"
                    scope={selectedActivityRange.label}
                    scopeTone="accent"
                  />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Choferes activos en vivo */}
                  <div className="lg:col-span-2 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm shadow-zinc-900/5 overflow-hidden">
                    <SectionHeader
                      icon={IconActivity}
                      title="Actividad en tiempo real"
                      subtitle={`${choferesActivos.length} ${choferesActivos.length === 1 ? "chofer" : "choferes"} trabajando ahora`}
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
                            Ningún chofer ha iniciado una jornada hoy
                          </p>
                        </div>
                      ) : (
                        choferesActivos.map((activo, index) => (
                          <div key={activo.id} className="px-6 py-4 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="relative">
                                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                      {activo.chofer.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-zinc-950 text-xs font-bold flex items-center justify-center">
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
                                      <span>Inicio: {formatTime(activo.checkIn)}</span>
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
                                <div className="inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
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
                  <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm shadow-zinc-900/5 overflow-hidden">
                    <SectionHeader
                      icon={IconUsers}
                      title="Estado de clientes"
                      subtitle={`${clientes.length} en total`}
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
                        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500" />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">Visitados</span>
                          </div>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.clientesVisitados}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-amber-500" />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">Asignados</span>
                          </div>
                          <span className="font-semibold text-amber-600 dark:text-amber-400">{stats.clientesAsignados}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-zinc-400 dark:bg-zinc-600" />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">Disponibles</span>
                          </div>
                          <span className="font-semibold text-zinc-600 dark:text-zinc-400">{stats.clientesDisponibles}</span>
                        </div>
                      </div>

                      {/* Alert if too many disponibles */}
                      {stats.clientesDisponibles > stats.clientesAsignados + stats.clientesVisitados && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-2">
                          <IconAlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-600 dark:text-red-400">
                            ¡Hay clientes sin asignar!
                          </p>
                        </div>
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
                <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm shadow-zinc-900/5 overflow-hidden">
                  <SectionHeader
                    icon={IconUsers}
                    title="Todos los choferes"
                    subtitle={`${todosChoferes.length} ${todosChoferes.length === 1 ? "registrado" : "registrados"}`}
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
                              className="w-full px-6 py-4 text-left hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-lg border flex items-center justify-center flex-shrink-0 ${
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
                                        <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
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
                                        Trabajando desde hace {activoData.tiempoTranscurrido.formato}
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
                                      <div className="p-3 rounded-lg bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 text-center">
                                        <p className="text-xl font-bold text-zinc-900 dark:text-white">
                                          {historial.resumen.totalJornadas}
                                        </p>
                                        <p className="text-xs text-zinc-500">Jornadas</p>
                                      </div>
                                      <div className="p-3 rounded-lg bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 text-center">
                                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                          {historial.resumen.jornadasCompletadas}
                                        </p>
                                        <p className="text-xs text-zinc-500">Completadas</p>
                                      </div>
                                      <div className="p-3 rounded-lg bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 text-center">
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
                                              className="p-3 rounded-lg bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700"
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
                                                    <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                      {jornada.duracion?.formato}
                                                    </span>
                                                  ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
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
                  <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm shadow-zinc-900/5 overflow-hidden">
                    <SectionHeader
                      icon={IconTrendingUp}
                      title="Ranking de actividad"
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
                                index === 0 ? "rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20" : ""
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
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
                                  Inicio: {formatTime(activo.checkIn)}
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
                  <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm shadow-zinc-900/5 overflow-hidden">
                    <SectionHeader
                      icon={IconAlertCircle}
                      title="Choferes inactivos"
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
                                <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                  <span className="text-xs font-semibold text-zinc-500">
                                    {chofer.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    {chofer.nombre}
                                  </p>
                                </div>
                                <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  Sin actividad
                                </span>
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
                <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm shadow-zinc-900/5 overflow-hidden">
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
                          className="block px-6 py-3 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors"
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
                <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm shadow-zinc-900/5 overflow-hidden">
                  <SectionHeader
                    icon={IconTarget}
                    title="Asignados"
                    subtitle={`${clientesPorStatus.asignados.length} ${clientesPorStatus.asignados.length === 1 ? "pendiente" : "pendientes"}`}
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
                          className="block px-6 py-3 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors"
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
                <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm shadow-zinc-900/5 overflow-hidden">
                  <SectionHeader
                    icon={IconCheckCircle}
                    title="Visitados"
                    subtitle={`${clientesPorStatus.visitados.length} ${clientesPorStatus.visitados.length === 1 ? "completado" : "completados"}`}
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
                          className="block px-6 py-3 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors"
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
