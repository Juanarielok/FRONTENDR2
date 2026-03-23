import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import type { Cliente } from "../api";
import { ThemeToggle } from "../components/ThemeToggle";
import { AsignarChoferModal } from "../components/AsignarChoferModal";

type FormState = {
  email: string;
  password: string;
  nombre: string;
  dni: string;
  cuit: string;
  telefono: string;
  ubicacion: string;
  localidad: string;
  razonSocial: string;
  tipoComercio: string;
  notas: string;
  fotoUrl: string;
  fotoFile: File | null;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type ColumnaIdentificador = "dni" | "cuit" | "email";
type ColumnaTelefono = "telefono" | "localidad";
type ColumnaExtra = "proxima_visita" | "opcion_2" | "opcion_3";

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("No se pudo leer el archivo"));
    r.readAsDataURL(file);
  });
}

function formatCUIT(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  const p1 = d.slice(0, 2);
  const p2 = d.slice(2, 10);
  const p3 = d.slice(10, 11);
  if (d.length <= 2) return p1;
  if (d.length <= 10) return `${p1}-${p2}`;
  return `${p1}-${p2}-${p3}`;
}

function isValidCUIT(value: string) {
  return /^\d{2}-\d{8}-\d{1}$/.test(value);
}

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

function validate(form: FormState, editing: boolean): FormErrors {
  const errors: FormErrors = {};
  const email = form.email.trim();
  if (!email) errors.email = "Email requerido";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Email inválido";

  const pass = form.password;
  if (!editing) {
    if (!pass) errors.password = "Password requerida";
    else if (pass.length < 8) errors.password = "Mínimo 8 caracteres";
  } else {
    if (pass && pass.length < 8) errors.password = "Mínimo 8 caracteres";
  }

  if (!form.nombre.trim()) errors.nombre = "Nombre requerido";

  const dni = onlyDigits(form.dni);
  if (!dni) errors.dni = "DNI requerido";
  else if (!/^\d{8}$/.test(dni)) errors.dni = "DNI: 8 dígitos";

  const cuit = form.cuit.trim();
  if (!cuit) errors.cuit = "CUIT/CUIL requerido";
  else if (!isValidCUIT(cuit)) errors.cuit = "Formato: XX-XXXXXXXX-X";

  const tel = form.telefono.trim();
  if (!tel) errors.telefono = "Teléfono requerido";
  else if (!/^[+0-9\s()\-]{8,20}$/.test(tel)) errors.telefono = "Teléfono inválido";

  const ub = form.ubicacion.trim();
  if (!ub) errors.ubicacion = "Ubicación requerida";
  else if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,#\-]{3,}$/.test(ub)) {
    errors.ubicacion = "Ubicación inválida";
  }

  if (!form.localidad.trim()) errors.localidad = "Localidad requerida";

  if (!form.razonSocial.trim()) errors.razonSocial = "Razón social requerida";
  if (!form.tipoComercio.trim())
    errors.tipoComercio = "Tipo de comercio requerido";

  if (form.fotoFile) {
    const okType = ["image/png", "image/jpeg"].includes(form.fotoFile.type);
    if (!okType) errors.fotoFile = "Solo PNG o JPG";
    const maxMB = 3;
    if (form.fotoFile.size > maxMB * 1024 * 1024)
      errors.fotoFile = `Máximo ${maxMB}MB`;
  }

  if (form.fotoUrl.trim()) {
    try {
      new URL(form.fotoUrl.trim());
    } catch {
      errors.fotoUrl = "URL inválida";
    }
  }

  return errors;
}

const emptyForm: FormState = {
  email: "",
  password: "",
  nombre: "",
  dni: "",
  cuit: "",
  telefono: "",
  ubicacion: "",
  localidad: "",
  razonSocial: "",
  tipoComercio: "",
  notas: "",
  fotoUrl: "",
  fotoFile: null,
};

// Icons
function IconPencil({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconActivity({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
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

function IconLogout({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
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

function IconPlus({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconFilter({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="3 4 21 4 14 12 14 19 10 21 10 12 3 4" />
    </svg>
  );
}

function IconX({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconChevronDown({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconChevronUp({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

// Form Input Component
function FormInput({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  required = false,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  inputMode?: "numeric" | "text" | "email" | "tel";
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-amber-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-zinc-50 dark:bg-zinc-950 border text-zinc-900 dark:text-white px-3 py-2.5 text-sm
                   outline-none transition-all duration-200
                   placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                   ${
                     error
                       ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                       : "border-zinc-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                   }`}
        placeholder={placeholder}
        inputMode={inputMode}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

export default function Clientes() {
  const nav = useNavigate();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFormPanel, setShowFormPanel] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "disponible" | "asignado">("todos");
  const [filtroLocalidad, setFiltroLocalidad] = useState("todas");
  const [filtroTipoComercio, setFiltroTipoComercio] = useState("todos");
  const [modoEdicionRapida, setModoEdicionRapida] = useState(false);
  const [columnaIdentificador, setColumnaIdentificador] =
    useState<ColumnaIdentificador>(() => {
      const guardado = localStorage.getItem("clientes_columna_identificador");
      if (guardado === "dni" || guardado === "cuit" || guardado === "email") {
        return guardado;
      }
      return "dni";
    });
  const [columnaTelefono, setColumnaTelefono] =
    useState<ColumnaTelefono>(() => {
      const guardado = localStorage.getItem("clientes_columna_telefono");
      if (guardado === "telefono" || guardado === "localidad") {
        return guardado;
      }
      return "telefono";
    });
  const [columnaExtra, setColumnaExtra] = useState<ColumnaExtra>(() => {
    const guardado = localStorage.getItem("clientes_columna_extra");
    if (
      guardado === "proxima_visita" ||
      guardado === "opcion_2" ||
      guardado === "opcion_3"
    ) {
      return guardado;
    }
    return "proxima_visita";
  });

  useEffect(() => {
    localStorage.setItem(
      "clientes_columna_identificador",
      columnaIdentificador
    );
  }, [columnaIdentificador]);

  useEffect(() => {
    localStorage.setItem("clientes_columna_telefono", columnaTelefono);
  }, [columnaTelefono]);

  useEffect(() => {
    localStorage.setItem("clientes_columna_extra", columnaExtra);
  }, [columnaExtra]);

  function getValorColumnaIdentificador(c: Cliente) {
    if (columnaIdentificador === "cuit") return c.cuit || "-";
    if (columnaIdentificador === "email") return c.email || "-";
    return c.dni || "-";
  }

  function getValorColumnaTelefono(c: Cliente) {
    if (columnaTelefono === "localidad") return (c as any).localidad || "-";
    return c.telefono || "-";
  }

  // Modal de asignación
  const [showAsignarModal, setShowAsignarModal] = useState(false);

  const cantidadSeleccionados = useMemo(
    () => seleccionados.size,
    [seleccionados]
  );

  const color1 = "bg-white dark:bg-zinc-950";
  const color2 = "bg-zinc-50 dark:bg-zinc-900";

  const localidadesDisponibles = useMemo(() => {
    return Array.from(
      new Set(
        clientes
          .map((c) => String((c as any).localidad || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [clientes]);

  const tiposComercioDisponibles = useMemo(() => {
    return Array.from(
      new Set(clientes.map((c) => String(c.tipoComercio || "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [clientes]);

  const filteredClientes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return clientes.filter((c) => {
      const localidad = String((c as any).localidad || "").trim();
      const coincideBusqueda =
        !term ||
        c.nombre.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.ubicacion.toLowerCase().includes(term) ||
        localidad.toLowerCase().includes(term);

      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "asignado" && c.status === "asignado") ||
        (filtroEstado === "disponible" && c.status !== "asignado");

      const coincideLocalidad =
        filtroLocalidad === "todas" || localidad === filtroLocalidad;

      const coincideTipoComercio =
        filtroTipoComercio === "todos" || c.tipoComercio === filtroTipoComercio;

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincideLocalidad &&
        coincideTipoComercio
      );
    });
  }, [clientes, searchTerm, filtroEstado, filtroLocalidad, filtroTipoComercio]);

  const cantidadSeleccionables = useMemo(
    () => filteredClientes.filter((c) => c.status !== "asignado").length,
    [filteredClientes]
  );

  async function cargarClientes() {
    setLoading(true);
    try {
      const data: any = await api.listClientes();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.users)
        ? data.users
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setClientes(list);
    } catch (e) {
      console.error(e);
      localStorage.removeItem("token");
      nav("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarClientes();
  }, []);

  function logout() {
    localStorage.removeItem("token");
    nav("/login", { replace: true });
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function limpiarFiltros() {
    setFiltroEstado("todos");
    setFiltroLocalidad("todas");
    setFiltroTipoComercio("todos");
  }

  function toggleSeleccion(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (cantidadSeleccionados === cantidadSeleccionables) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(
        new Set(
          filteredClientes
            .filter((c) => c.status !== "asignado")
            .map((c) => c.id)
        )
      );
    }
  }

  function activarEdicionRapida() {
    setModoEdicionRapida(true);
    setEditingId(null);
    setShowFormPanel(false);
  }

  function detenerEdicionRapida() {
    setModoEdicionRapida(false);
    cancelarEdicion();
    setShowFormPanel(false);
  }

  function loadToEdit(c: Cliente) {
    setEditingId(c.id);
    setForm({
      email: c.email,
      password: "",
      nombre: c.nombre,
      dni: c.dni,
      cuit: c.cuit,
      telefono: c.telefono,
      ubicacion: c.ubicacion,
      localidad: (c as any).localidad || "",
      razonSocial: c.razonSocial,
      tipoComercio: c.tipoComercio,
      notas: c.notas,
      fotoUrl: c.foto?.startsWith("http") ? c.foto : "",
      fotoFile: null,
    });
    setErrors({});
    setShowFormPanel(true);
    // Auto-expand advanced if editing
    setShowAdvanced(true);
  }

  function cancelarEdicion() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  }

  async function submit() {
    const newErrors = validate(form, !!editingId);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);

    let fotoFinal: string | undefined = undefined;
    if (form.fotoFile) fotoFinal = await readFileAsDataURL(form.fotoFile);
    else if (form.fotoUrl.trim()) fotoFinal = form.fotoUrl.trim();

    const payload: any = {
      email: form.email.trim(),
      password: form.password,
      role: "cliente",
      nombre: form.nombre.trim(),
      dni: onlyDigits(form.dni),
      cuit: form.cuit.trim(),
      telefono: form.telefono.trim(),
      ubicacion: form.ubicacion.trim(),
      localidad: form.localidad.trim(),
      razonSocial: form.razonSocial.trim(),
      tipoComercio: form.tipoComercio.trim(),
      notas: form.notas.trim(),
      foto: fotoFinal,
    };

    try {
      if (editingId) {
        if (!form.password) delete payload.password;
        const updated = await api.updateUser(editingId, payload);
        const user = (updated.user ?? updated) as Cliente;
        setClientes((prev) => prev.map((c) => (c.id === editingId ? user : c)));
        cancelarEdicion();
        return;
      }

      const res = await api.createCliente(payload);
      const creado = res.user as Cliente;
      setClientes((prev) => [creado, ...prev]);
      setForm(emptyForm);
      setErrors({});
    } catch (e: any) {
      console.error("ERROR BACKEND:", e);
      alert(e?.message || "Error creando/actualizando");
    } finally {
      setSubmitting(false);
    }
  }

  function asignarClientes() {
    setShowAsignarModal(true);
  }

  function handleAsignacionExitosa() {
    // Limpiar selección y recargar clientes
    setSeleccionados(new Set());
    cargarClientes();
  }

  function cancelarSeleccionados() {
    setSeleccionados(new Set());
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors duration-300">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-[0.77] dark:opacity-[0.02] pointer-events-none">
        <div
  className="fixed inset-0 pointer-events-none opacity-20"
style={{
  backgroundImage: "url('/bgu7.jpg')",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  backgroundPosition: "center",
}}
/>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#ffffff80] dark:bg-zinc-950 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
  <img
  src="/ARRTAIUS1.png"
  alt="Arttaius"
  className="w-10 h-10 object-contain"
/>
              <div>
                <h1 className="text-lg font-semibold tracking-[0.4px]">
                  PANEL DE CLIENTES
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  Gestión y asignación de entregas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-500 bg-[#f3f3f300] dark:border-[#f0000000] px-3 py-2 border border-[#f0000000] dark:border-[#f0000000]">
                 <img src="/asterisco1.png" alt="icono" className="w-5 h-5 object-contain" />
                <span>Admin</span>
              </div>
            <Link
  to="/monitoreo"
  className="flex items-center gap-2 px-4 py-2 text-sm font-medium
             bg-[#F2F3F5] text-zinc-950
             hover:bg-[#8ab1ff]
             transition-all duration-200
             rounded-full"
>
  <img src="/monitor11.png" alt="icono" className="w-5 h-5 object-contain" />
  <span className="hidden sm:inline">MONITOREO</span>
</Link>
              <ThemeToggle />
             <button
  onClick={() => nav("/admin")}
  className="w-10 h-10 flex items-center justify-center
    bg-zinc-100 dark:bg-zinc-900
    text-zinc-600 dark:text-zinc-400
    hover:bg-zinc-200 dark:hover:bg-zinc-800
    hover:text-zinc-900 dark:hover:text-white
    transition-all duration-200
    rounded-lg"
  title="Gestion"
>
  <img src="/gestion3.png" alt="icono" className="w-5 h-5 object-contain" />
</button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                         bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700
                         text-zinc-700 dark:text-zinc-300
                         hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white
                         hover:border-zinc-400 dark:hover:border-zinc-600
                         transition-all duration-200"
              >
           <img src="/gestion1.png" alt="icono" className="w-5 h-5 object-contain" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`${showFormPanel ? "max-w-7xl" : "max-w-[98vw]"} mx-auto px-6 py-8 font-semibold transition-all duration-300`}
      >
        <div
          className={`${showFormPanel ? "grid grid-cols-1 lg:grid-cols-5 gap-8" : "grid grid-cols-1 gap-0"} transition-all duration-300`}
        >
          {/* Form Panel */}
          {showFormPanel && (
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 sticky top-24 shadow-sm dark:shadow-none">
              {/* Form Header */}
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                      if (modoEdicionRapida) {
                        detenerEdicionRapida();
                        return;
                      }
                      setShowFormPanel(false);
                    }}
                  className="flex items-center gap-3 text-left flex-1"
                >
                  {editingId ? (
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center">
                      <IconPencil className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
                      <IconPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                    </div>
                  )}
                  <h2 className="font-semibold">
                    {editingId ? "Editar Cliente" : "NUEVO CLIENTE"}
                  </h2>
                </button>

                <div className="flex items-center gap-2">
                  {editingId && (
                    <button
                      onClick={cancelarEdicion}
                      className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Cancelar edición"
                    >
                      <IconX className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (modoEdicionRapida) {
                        detenerEdicionRapida();
                        return;
                      }
                      setShowFormPanel(false);
                    }}
                    className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Ocultar panel"
                  >
                    <IconChevronUp className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-5 font-semibold">
                <FormInput
                  label="Email"
                  value={form.email}
                  onChange={(v) => setField("email", v)}
                  error={errors.email}
                  placeholder="cliente@empresa.com"
                  type="email"
                  required
                  inputMode="email"
                />

                <FormInput
                  label={editingId ? "Password (opcional)" : "Password"}
                  value={form.password}
                  onChange={(v) => setField("password", v)}
                  error={errors.password}
                  placeholder={
                    editingId ? "Dejar vacío para no cambiar" : "Mínimo 8 caracteres"
                  }
                  type="password"
                  required={!editingId}
                />

                <FormInput
                  label="Nombre completo"
                  value={form.nombre}
                  onChange={(v) => setField("nombre", v)}
                  error={errors.nombre}
                  placeholder="Juan Pérez"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="DNI"
                    value={form.dni}
                    onChange={(v) => setField("dni", v)}
                    error={errors.dni}
                    placeholder="12345678"
                    required
                    inputMode="numeric"
                  />

                  <FormInput
                    label="CUIT/CUIL"
                    value={form.cuit}
                    onChange={(v) => setField("cuit", formatCUIT(v))}
                    error={errors.cuit}
                    placeholder="27-12345678-9"
                    required
                    inputMode="numeric"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Teléfono"
                    value={form.telefono}
                    onChange={(v) => setField("telefono", v)}
                    error={errors.telefono}
                    placeholder="+54 11 1234-5678"
                    required
                    inputMode="tel"
                  />

                  <FormInput
                    label="Localidad"
                    value={form.localidad}
                    onChange={(v) => setField("localidad", v)}
                    error={errors.localidad}
                    placeholder="Capital Federal"
                    required
                  />
                </div>

                <FormInput
                  label="Ubicación"
                  value={form.ubicacion}
                  onChange={(v) => setField("ubicacion", v)}
                  error={errors.ubicacion}
                  placeholder="Buenos Aires"
                  required
                />

                {/* Advanced Toggle */}
                <button
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 
                           bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 
                           text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200
                           transition-colors"
                >
                  <span>Campos adicionales</span>
                  {showAdvanced ? (
                    <IconChevronUp className="w-4 h-4" />
                  ) : (
                    <IconChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Advanced Fields */}
                {showAdvanced && (
                  <div className="space-y-5 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        label="Razón social"
                        value={form.razonSocial}
                        onChange={(v) => setField("razonSocial", v)}
                        error={errors.razonSocial}
                        placeholder="Empresa S.A."
                        required
                      />

                      <FormInput
                        label="Tipo comercio"
                        value={form.tipoComercio}
                        onChange={(v) => setField("tipoComercio", v)}
                        error={errors.tipoComercio}
                        placeholder="Mayorista"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                        Notas
                      </label>
                      <textarea
                        value={form.notas}
                        onChange={(e) => setField("notas", e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 
                                 text-zinc-900 dark:text-white px-3 py-2.5 text-sm
                                 outline-none transition-all duration-200 resize-none
                                 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20
                                 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                        rows={3}
                        placeholder="Observaciones del cliente..."
                      />
                    </div>

                    <div className="p-4 bg-zinc-100 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 space-y-4">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Foto del cliente (opcional)
                      </p>

                      <FormInput
                        label="URL de imagen"
                        value={form.fotoUrl}
                        onChange={(v) => setField("fotoUrl", v)}
                        error={errors.fotoUrl}
                        placeholder="https://..."
                      />

                      <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                          O subir archivo
                        </label>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={(e) =>
                            setField("fotoFile", e.target.files?.[0] ?? null)
                          }
                          className="w-full text-sm text-zinc-600 dark:text-zinc-400 
                                   file:mr-4 file:py-2 file:px-4
                                   file:border file:border-zinc-300 dark:file:border-zinc-600 
                                   file:text-sm file:font-medium
                                   file:bg-zinc-100 dark:file:bg-zinc-800 
                                   file:text-zinc-700 dark:file:text-zinc-300
                                   hover:file:bg-zinc-200 dark:hover:file:bg-zinc-700 
                                   file:cursor-pointer file:transition-colors"
                        />
                        {errors.fotoFile && (
                          <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                            ⚠ {errors.fotoFile}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full bg-amber-500 text-zinc-950 font-semibold py-3 px-4
                           transition-all duration-200 
                           hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20
                           disabled:opacity-100 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
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
                          className="opacity-100"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>GUARDANDO...</span>
                    </>
                  ) : (
                    <>
                      {editingId ? (
                        <>
                          <IconCheck className="w-5 h-5" />
                          <span>GUARDAR CAMBIOS</span>
                        </>
                      ) : (
                        <>
                          <IconPlus className="w-5 h-5" />
                          <span>CREAR CLIENTE</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Client List Panel */}
          <div className={`${showFormPanel ? "lg:col-span-3" : "lg:col-span-1"} z-30 w-full transition-all duration-300`}>
            <div className="bg-[#ffffffa4] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
              {/* List Header */}
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                   <div className="w-11 h-11 flex items-center justify-center overflow-hidden">
  <img src="/mancliente3.png" alt="Cliente" className="w-11 h-11 object-contain" />
</div>
                    <div>
                      <h2 className="font-semibold">CLIENTES</h2>
                      <p className="text-xs text-zinc-500">
                        {clientes.length} registrados
                      </p>
                    </div>
                  </div>

                  {/* Search + toggle */}
                  <div className="flex w-full sm:w-auto items-center gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setShowFiltros((v) => !v)}
                      className={`shrink-0 px-3 py-2 text-xs font-medium border transition-colors flex items-center gap-2 ${
                        showFiltros
                          ? "bg-amber-100 dark:bg-amber-500/20 border-amber-400 text-amber-700 dark:text-amber-400"
                          : "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      <IconFilter className="w-4 h-4" />
                      <span>FILTRAR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModoEdicionRapida(false);
                        cancelarEdicion();
                        setShowFormPanel((v) => !v);
                      }}
                      className="shrink-0 px-3 py-2 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      {showFormPanel ? "CERRAR +" : "AÑADIR CLIENTE +"}
                    </button>

                    <div className="relative flex-1 sm:w-72">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar cliente..."
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 
                                 text-zinc-900 dark:text-white pl-10 pr-4 py-2 text-sm
                                 outline-none transition-all duration-200
                                 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20
                                 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                      />
                      <svg
                        viewBox="0 0 24 24"
                        className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                      </svg>
                    </div>
                  </div>
                </div>

                {showFiltros && (
                  <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                          Estado
                        </label>
                        <select
                          value={filtroEstado}
                          onChange={(e) =>
                            setFiltroEstado(
                              e.target.value as "todos" | "disponible" | "asignado"
                            )
                          }
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                        >
                          <option value="todos">Todos</option>
                          <option value="disponible">Disponible</option>
                          <option value="asignado">Asignado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                          Localidad
                        </label>
                        <select
                          value={filtroLocalidad}
                          onChange={(e) => setFiltroLocalidad(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                        >
                          <option value="todas">Todas</option>
                          {localidadesDisponibles.map((localidad) => (
                            <option key={localidad} value={localidad}>
                              {localidad}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                          Tipo de comercio
                        </label>
                        <select
                          value={filtroTipoComercio}
                          onChange={(e) => setFiltroTipoComercio(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                        >
                          <option value="todos">Todos</option>
                          {tiposComercioDisponibles.map((tipo) => (
                            <option key={tipo} value={tipo}>
                              {tipo}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={limpiarFiltros}
                          className="w-full px-3 py-2.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          LIMPIAR FILTROS
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selection bar */}
                {!modoEdicionRapida && filteredClientes.length > 0 && (
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={selectAll}
                      className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                    >
                      {cantidadSeleccionados === cantidadSeleccionables && cantidadSeleccionables > 0
                        ? "Deseleccionar todos"
                        : "Seleccionar todos"}
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">
                        {cantidadSeleccionados} seleccionados
                      </span>
                      {cantidadSeleccionados > 0 && (
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Client List */}
              <div className={`${showFormPanel ? "max-h-[calc(100vh-320px)]" : "max-h-[calc(100vh-230px)]"} overflow-y-auto overflow-x-auto`}>
                {loading ? (
                  <div className="px-6 py-16 text-center">
                    <svg
                      className="animate-spin h-8 w-8 mx-auto text-amber-500"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-100"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-100"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <p className="mt-4 text-zinc-500 text-sm">
                      Cargando clientes...
                    </p>
                  </div>
                ) : filteredClientes.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                      <IconUser className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                      {searchTerm
                        ? "No se encontraron resultados"
                        : "No hay clientes registrados"}
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-600 text-sm mt-1">
                      {searchTerm
                        ? "Intenta con otra búsqueda"
                        : "Crea el primer cliente usando el formulario"}
                    </p>
                  </div>
                ) : (
                  <table
                    className="min-w-full border-collapse table-fixed"
                    style={{ fontSize: "12px", lineHeight: "14px" }}
                  >
                    <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <tr className="text-left uppercase text-zinc-500 dark:text-zinc-400">
                        <th className="h-5 px-2 py-0 w-10 border-r border-zinc-200 dark:border-zinc-700">Sel</th>
                        <th className="h-5 px-2 py-0 w-40 border-r border-zinc-200 dark:border-zinc-700">Cliente</th>
                        <th className="h-5 px-2 py-0 w-44 border-r border-zinc-200 dark:border-zinc-700">
                          <select
                            value={columnaIdentificador}
                            onChange={(e) =>
                              setColumnaIdentificador(
                                e.target.value as ColumnaIdentificador
                              )
                            }
                            className="w-full bg-transparent outline-none text-[12x] uppercase font-semibold text-zinc-500 dark:text-zinc-400"
                            title="Elegir dato a mostrar"
                          >
                            <option value="dni">DNI</option>
                            <option value="cuit">CUIT/CUIL</option>
                            <option value="email">Mail</option>
                          </select>
                        </th>
                        <th className="h-5 px-2 py-0 w-28 border-r border-zinc-200 dark:border-zinc-700">
                          <select
                            value={columnaTelefono}
                            onChange={(e) =>
                              setColumnaTelefono(
                                e.target.value as ColumnaTelefono
                              )
                            }
                            className="w-full bg-transparent outline-none text-[12px] uppercase font-semibold text-zinc-500 dark:text-zinc-400"
                            title="Elegir dato a mostrar"
                          >
                            <option value="telefono">Teléfono</option>
                            <option value="localidad">Localidad</option>
                          </select>
                        </th>
                        <th className="h-5 px-2 py-0 w-32 border-r border-zinc-200 dark:border-zinc-700">Ubicación</th>
                        <th className="h-5 px-2 py-0 w-32 border-r border-zinc-200 dark:border-zinc-700">Razón social</th>
                        <th className="h-5 px-2 py-0 w-24 border-r border-zinc-200 dark:border-zinc-700">Estado</th>
                        <th className="h-5 px-2 py-0 w-28 border-l border-zinc-200 dark:border-zinc-700">
                          <select
                            value={columnaExtra}
                            onChange={(e) =>
                              setColumnaExtra(e.target.value as ColumnaExtra)
                            }
                            className="w-full bg-transparent outline-none text-[12px] uppercase font-semibold text-zinc-500 dark:text-zinc-400"
                            title="Elegir dato a mostrar"
                          >
                            <option value="proxima_visita">Próxima visita</option>
                            <option value="opcion_2">Opción 2</option>
                            <option value="opcion_3">Opción 3</option>
                          </select>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredClientes.map((c, index) => {
                        const checked = seleccionados.has(c.id);
                        const disabled = c.status === "asignado";
                        const rowColor = index % 2 === 0 ? color1 : color2;
                        const estadoColor = disabled
                          ? "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300"
                          : "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300";
                        const textoSecundario = disabled
                          ? "text-zinc-400 dark:text-zinc-500"
                          : "text-zinc-600 dark:text-zinc-300";
                        const textoPrincipal = disabled
                          ? "text-zinc-400 dark:text-zinc-500"
                          : "text-zinc-900 dark:text-white";

                        return (
                          <tr
                            key={c.id}
                            onClick={() => {
                              if (modoEdicionRapida) loadToEdit(c);
                            }}
                            className={`group border-b border-zinc-200 dark:border-zinc-800 ${rowColor} ${
                              modoEdicionRapida
                                ? "cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-500/10"
                                : "hover:brightness-[0.985] dark:hover:brightness-110"
                            }`}
                            style={{ height: "25px" }}
                          >
                            <td className="h-5 px-2 py-0 align-middle border-r border-zinc-200 dark:border-zinc-800">
                              <button
                                disabled={disabled || modoEdicionRapida}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (disabled || modoEdicionRapida) return;
                                  toggleSeleccion(c.id);
                                }}
                                className={`w-[14px] h-[14px] border flex items-center justify-center ${
                                  checked
                                    ? "bg-amber-500 border-amber-500"
                                    : "border-zinc-400 dark:border-zinc-600"
                                } ${modoEdicionRapida ? "opacity-40 cursor-not-allowed" : ""}`}
                              >
                                {checked && <IconCheck className="w-[12x] h-[15px] text-zinc-950" />}
                              </button>
                            </td>

                            <td className={`relative h-5 px-2 py-0 align-middle border-r border-zinc-200 dark:border-zinc-800 ${textoPrincipal}`}>
                              {modoEdicionRapida && (
                                <div className="pointer-events-none absolute inset-0 hidden group-hover:flex items-center justify-center bg-amber-200/60 dark:bg-amber-500/10 z-10">
                                  <span className="text-[12px] font-bold tracking-[0.14em] text-amber-900 dark:text-amber-300">
                                    EDITAR CONTACTO
                                  </span>
                                </div>
                              )}

                              {modoEdicionRapida ? (
                                <span className="block truncate" title={c.nombre}>
                                  {c.nombre}
                                </span>
                              ) : (
                                <Link
                                  to={`/clientes/${c.id}`}
                                  className={`block truncate ${disabled ? "" : "hover:text-amber-600 dark:hover:text-amber-500"}`}
                                  title={c.nombre}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {c.nombre}
                                </Link>
                              )}
                            </td>

                            <td className={`h-5 px-2 py-0 align-middle border-r border-zinc-200 dark:border-zinc-800 ${textoSecundario}`}>
                              <span className="block truncate" title={getValorColumnaIdentificador(c)}>{getValorColumnaIdentificador(c)}</span>
                            </td>

                            <td className={`h-5 px-2 py-0 align-middle border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap ${textoSecundario}`}>
                              <span className="block truncate" title={getValorColumnaTelefono(c)}>
                                {getValorColumnaTelefono(c)}
                              </span>
                            </td>

                            <td className={`h-5 px-2 py-0 align-middle border-r border-zinc-200 dark:border-zinc-800 ${textoSecundario}`}>
                              <span className="block truncate" title={c.ubicacion || "-"}>{c.ubicacion || "-"}</span>
                            </td>

                            <td className={`h-5 px-2 py-0 align-middle border-r border-zinc-200 dark:border-zinc-800 ${textoSecundario}`}>
                              <span className="block truncate" title={c.razonSocial || "-"}>{c.razonSocial || "-"}</span>
                            </td>

                            <td className={`h-5 px-2 py-0 align-middle border-r border-zinc-200 dark:border-zinc-800 uppercase text-center font-semibold ${estadoColor}`}>
                              {disabled ? "Asignado" : "Disponible"}
                            </td>

                            <td className={`h-5 px-2 py-0 align-middle ${disabled ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-500 dark:text-zinc-400"}`}>
                              <span className="block truncate">&nbsp;</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Assign Button */}
              <div className="px-1 py-1 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <div className="flex items-stretch gap-3">
                  <div
                    className={`flex-[7] flex items-stretch border-2 border-dashed transition-all duration-200 ${
                      cantidadSeleccionados === 0 || modoEdicionRapida
                        ? "border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600"
                        : "border-amber-500 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                    }`}
                  >
                    <button
                      onClick={asignarClientes}
                      disabled={cantidadSeleccionados === 0 || modoEdicionRapida}
                      className="flex-1 flex items-center justify-center gap-3 py-1 px-1 disabled:cursor-not-allowed"
                    >
                     <img src="/camioncito.png" alt="Camión" className="w-9 h-9 object-contain" />
                      <span className="font-semibold">
                        ASIGNAR {cantidadSeleccionados > 0 && `(${cantidadSeleccionados})`} A CHOFER
                      </span>
                    </button>

                    {cantidadSeleccionados > 3 && !modoEdicionRapida && (
                      <button
                        type="button"
                        onClick={cancelarSeleccionados}
                        className="m-1 px-3 py-2 border border-current text-[11px] font-semibold uppercase tracking-[0.02em] hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-colors"
                      >
                        Cancelar {cantidadSeleccionados} seleccionados
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={modoEdicionRapida ? detenerEdicionRapida : activarEdicionRapida}
                    className={`flex-[3] flex items-center justify-center gap-3 py-3 px-4 border-2 border-dashed transition-all duration-200 ${
                      modoEdicionRapida
                        ? "border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                        : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {modoEdicionRapida ? (
                      <>
                        <IconX className="w-5 h-5" />
                        <span className="font-semibold">DETENER EDICIÓN</span>
                      </>
                    ) : (
                      <>
                        <IconPencil className="w-5 h-5" />
                        <span className="font-semibold">EDITAR</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de asignación */}
      <AsignarChoferModal
        isOpen={showAsignarModal}
        onClose={() => setShowAsignarModal(false)}
        clientIds={Array.from(seleccionados)}
        onSuccess={handleAsignacionExitosa}
      />
    </div>
  );
}
