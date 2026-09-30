import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import type { Cliente } from "../api";
import { ThemeToggle } from "../components/ThemeToggle";
import { AsignarChoferModal } from "../components/AsignarChoferModal";
import {
  IconPencil,
  IconActivity,
  IconSettings,
  IconUser,
  IconLogout,
  IconCheck,
  IconPlus,
  IconFilter,
  IconSearch,
  IconTruck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconEyeOff,
} from "../components/icons";
import {
  formatCuit,
  onlyDigits,
  validateCuit,
  validateDni,
  validateEmail,
  validateHttpUrl,
  validateLocation,
  validatePassword,
  validatePhone,
  validateRequired,
} from "../utils/validation";
import ubicacionesRaw from "../data/ubicaciones.json";

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

function validate(form: FormState, editing: boolean): FormErrors {
  const errors: FormErrors = {};
  const emailError = validateEmail(form.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(form.password, !editing);
  if (passwordError) errors.password = passwordError;

  const nombreError = validateRequired(form.nombre, "Nombre");
  if (nombreError) errors.nombre = nombreError;

  const dniError = validateDni(form.dni);
  if (dniError) errors.dni = dniError;

  const cuitError = validateCuit(form.cuit);
  if (cuitError) errors.cuit = cuitError;

  const telefonoError = validatePhone(form.telefono);
  if (telefonoError) errors.telefono = telefonoError;

  const ubicacionError = validateLocation(form.ubicacion);
  if (ubicacionError) errors.ubicacion = ubicacionError;

  const localidadError = validateRequired(form.localidad, "Localidad");
  if (localidadError) errors.localidad = localidadError;

  const razonSocialError = validateRequired(form.razonSocial, "Razón social");
  if (razonSocialError) errors.razonSocial = razonSocialError;

  const tipoComercioError = validateRequired(
    form.tipoComercio,
    "Tipo de comercio"
  );
  if (tipoComercioError) errors.tipoComercio = tipoComercioError;

  if (form.fotoFile) {
    const okType = ["image/png", "image/jpeg"].includes(form.fotoFile.type);
    if (!okType) errors.fotoFile = "Solo PNG o JPG";
    const maxMB = 3;
    if (form.fotoFile.size > maxMB * 1024 * 1024)
      errors.fotoFile = `Máximo ${maxMB} MB`;
  }

  const fotoUrlError = validateHttpUrl(form.fotoUrl);
  if (fotoUrlError) errors.fotoUrl = fotoUrlError;

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


const OPCIONES_TIPO_COMERCIO = [
  "Restaurante",
  "Bar",
  "Rotisería",
  "Colegio",
  "Comida rápida",
  "Parrilla",
  "Panadería",
  "Confitería",
  "Café",
  "Supermercado",
  "Hotel",
  "Catering",
  "Hospital",
  "Club",
  "Fábrica",
];

type ProvinciaCatalogo = {
  nombre: string;
  localidades: string[];
};

type PaisCatalogo = {
  codigo: string;
  nombre: string;
  bandera: string;
  provincias: ProvinciaCatalogo[];
};

const CATALOGO_UBICACIONES: PaisCatalogo[] = ubicacionesRaw as PaisCatalogo[];

function construirLocalidadFinal(
  localidad: string,
  provincia: string,
  pais: string
) {
  if (!localidad || !provincia || !pais) return "";
  return `${localidad}, ${provincia}, ${pais}`;
}

// Form Input Component
function FormInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  type = "text",
  required = false,
  inputMode,
  maxLength,
  showPassword,
  onTogglePassword,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  inputMode?: "numeric" | "text" | "email" | "tel";
  maxLength?: number;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}) {
  const errorId = `${id}-error`;
  const passwordToggleLabel = showPassword
    ? "Ocultar contraseña"
    : "Mostrar contraseña";

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5"
      >
        {label} {required && <span className="text-amber-500">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={`w-full rounded-lg bg-zinc-50 dark:bg-zinc-950 border text-zinc-900 dark:text-white px-3 py-2.5 text-sm
                     outline-none transition-all duration-200
                     placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                     hover:border-zinc-400 dark:hover:border-zinc-600
                     ${onTogglePassword ? "pr-11" : ""}
                     ${
                       error
                         ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                         : "border-zinc-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                     }`}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        {onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label={passwordToggleLabel}
            aria-pressed={Boolean(showPassword)}
            aria-controls={id}
            title={passwordToggleLabel}
          >
            {showPassword ? (
              <IconEyeOff className="h-4 w-4" />
            ) : (
              <IconEye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p
          id={errorId}
          className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1"
        >
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

export default function Clientes() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Vista de choferes (toggle "VER CHOFERES" junto a añadir cliente)
  const [vistaChoferes, setVistaChoferes] = useState(false);
  const [choferes, setChoferes] = useState<any[]>([]);
  const [loadingChoferes, setLoadingChoferes] = useState(false);
  const [choferesCargados, setChoferesCargados] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [paisSeleccionado, setPaisSeleccionado] = useState("");
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState("");
  const [localidadSeleccionada, setLocalidadSeleccionada] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "disponible" | "asignado">("todos");
  const [filtroLocalidad, setFiltroLocalidad] = useState("todas");
  const [filtroTipoComercio, setFiltroTipoComercio] = useState("todos");
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

  const color1 = "bg-white dark:bg-zinc-900/30";
  const color2 = "bg-zinc-50/70 dark:bg-zinc-900/50";

  const provinciasCatalogo = useMemo(() => {
    const pais = CATALOGO_UBICACIONES.find(
      (item) => item.codigo === paisSeleccionado
    );
    return pais?.provincias || [];
  }, [paisSeleccionado]);

  const localidadesCatalogo = useMemo(() => {
    const provincia = provinciasCatalogo.find(
      (item) => item.nombre === provinciaSeleccionada
    );
    return provincia?.localidades || [];
  }, [provinciasCatalogo, provinciaSeleccionada]);

  function resetSelectorLocalidad() {
    setPaisSeleccionado("");
    setProvinciaSeleccionada("");
    setLocalidadSeleccionada("");
  }

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

    return clientes
      .filter((c) => {
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
          filtroTipoComercio === "todos" ||
          c.tipoComercio === filtroTipoComercio;

        return (
          coincideBusqueda &&
          coincideEstado &&
          coincideLocalidad &&
          coincideTipoComercio
        );
      })
      .sort(
        (a, b) =>
          Number(a.status === "asignado") - Number(b.status === "asignado")
      );
  }, [clientes, searchTerm, filtroEstado, filtroLocalidad, filtroTipoComercio]);

  const filteredChoferes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return choferes;
    return choferes.filter((ch) =>
      [ch.nombre, ch.email, ch.telefono, ch.ubicacion, ch.dni].some((v) =>
        String(v || "").toLowerCase().includes(term)
      )
    );
  }, [choferes, searchTerm]);

  const cantidadSeleccionables = useMemo(
    () => filteredClientes.filter((c) => c.status !== "asignado").length,
    [filteredClientes]
  );

  const idsAsignablesSeleccionados = useMemo(
    () =>
      clientes
        .filter((c) => seleccionados.has(c.id) && c.status !== "asignado")
        .map((c) => c.id),
    [clientes, seleccionados]
  );

  const seleccionIncluyeAsignados = useMemo(
    () => clientes.some((c) => seleccionados.has(c.id) && c.status === "asignado"),
    [clientes, seleccionados]
  );

  const todosLosAsignablesSeleccionados = useMemo(() => {
    const idsAsignables = filteredClientes
      .filter((c) => c.status !== "asignado")
      .map((c) => c.id);

    return (
      idsAsignables.length > 0 &&
      idsAsignables.every((id) => seleccionados.has(id)) &&
      !seleccionIncluyeAsignados
    );
  }, [filteredClientes, seleccionados, seleccionIncluyeAsignados]);

  const puedeAsignarSeleccionados =
    cantidadSeleccionados > 0 &&
    idsAsignablesSeleccionados.length === cantidadSeleccionados &&
    !seleccionIncluyeAsignados;

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

  // Carga perezosa de choferes al abrir la vista por primera vez
  useEffect(() => {
    if (!vistaChoferes || choferesCargados) return;
    setLoadingChoferes(true);
    api
      .listChoferes()
      .then((res: any) => {
        setChoferes(Array.isArray(res?.users) ? res.users : []);
        setChoferesCargados(true);
      })
      .catch((e) => console.error("Error al cargar los choferes:", e))
      .finally(() => setLoadingChoferes(false));
  }, [vistaChoferes, choferesCargados]);

  // Enlace legado /clientes?edit=<id>: redirige al perfil del cliente en modo edición
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) return;
    nav(`/clientes/${editId}?edit=1`, { replace: true });
  }, [searchParams]);

  function logout() {
    localStorage.removeItem("token");
    nav("/login", { replace: true });
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    const nextForm = { ...form, [key]: value };
    setForm(nextForm);
    if (submitError) setSubmitError(null);

    setErrors((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, key)) return prev;

      const nextErrors = { ...prev };
      const fieldError = validate(nextForm, Boolean(editingId))[key];
      if (fieldError) nextErrors[key] = fieldError;
      else delete nextErrors[key];
      return nextErrors;
    });
  }

  function validateFieldOnBlur(key: keyof FormState) {
    const fieldError = validate(form, Boolean(editingId))[key];
    setErrors((prev) => {
      const nextErrors = { ...prev };
      if (fieldError) nextErrors[key] = fieldError;
      else delete nextErrors[key];
      return nextErrors;
    });
  }

  function focusFirstInvalid(nextErrors: FormErrors) {
    const firstField = Object.keys(nextErrors)[0] as keyof FormState | undefined;
    if (!firstField) return;

    let elementId = `cliente-${firstField}`;
    if (firstField === "localidad") {
      if (!paisSeleccionado) elementId = "cliente-pais";
      else if (!provinciaSeleccionada) elementId = "cliente-provincia";
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => document.getElementById(elementId)?.focus());
    });
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
    if (todosLosAsignablesSeleccionados) {
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

  function cancelarEdicion() {
    setEditingId(null);
    setShowPassword(false);
    setForm(emptyForm);
    setErrors({});
    setSubmitError(null);
    resetSelectorLocalidad();
  }

  async function submit() {
    if (submitting) return;
    setSubmitError(null);
    const newErrors = validate(form, !!editingId);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      focusFirstInvalid(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      let fotoFinal: string | undefined;
      if (form.fotoFile) fotoFinal = await readFileAsDataURL(form.fotoFile);
      else if (form.fotoUrl.trim()) fotoFinal = form.fotoUrl.trim();

      const payload: any = {
        email: form.email.trim().toLowerCase(),
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
      setShowPassword(false);
      setErrors({});
      resetSelectorLocalidad();
    } catch (e: any) {
      console.error("ERROR BACKEND:", e);
      setSubmitError(e?.message || "No se pudo guardar el cliente");
    } finally {
      setSubmitting(false);
    }
  }

  function asignarClientes() {
    if (!puedeAsignarSeleccionados) return;
    setShowAsignarModal(true);
  }

  function handleAsignacionExitosa() {
    setSeleccionados(new Set());
    cargarClientes();
  }

  function cancelarSeleccionados() {
    setSeleccionados(new Set());
  }

  return (
    <div className="min-h-screen fondo-home bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 shadow-sm shadow-zinc-900/5">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="grid grid-cols-1 items-center gap-y-2 sm:flex sm:justify-between sm:gap-4">
            <div className="flex w-full sm:w-auto min-w-0 items-center gap-2 sm:gap-4">
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
                  PANEL DE CLIENTES
                </h1>
                <p className="hidden sm:block truncate text-xs text-zinc-500 dark:text-zinc-400">
                  Gestión y asignación de entregas
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
                           hover:text-zinc-900 dark:hover:text-white
                           hover:bg-zinc-100 dark:hover:bg-zinc-800/70
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

      <main
        className={`${showFormPanel ? "max-w-7xl" : "max-w-[98vw]"} mx-auto px-3 sm:px-6 py-4 sm:py-8 transition-all duration-300`}
      >
        <div
          className={`${showFormPanel ? "grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8" : "grid grid-cols-1 gap-0"} transition-all duration-300`}
        >
          {showFormPanel && !editingId && (
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm shadow-zinc-900/5 overflow-hidden lg:sticky lg:top-24">
                <div className="px-4 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFormPanel(false)}
                    className="flex items-center gap-3 text-left flex-1"
                  >
                    {editingId ? (
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center">
                        <IconPencil className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
                        <IconPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                      </div>
                    )}
                    <h2 className="font-semibold">
                      {editingId ? "Editar cliente" : "NUEVO CLIENTE"}
                    </h2>
                  </button>

                  <div className="flex items-center gap-2">
                    {editingId && (
                      <button
                        onClick={cancelarEdicion}
                        className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Cancelar edición"
                      >
                        <IconX className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowFormPanel(false)}
                      className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Ocultar panel"
                    >
                      <IconChevronUp className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                  <FormInput
                    id="cliente-email"
                    label="Email"
                    value={form.email}
                    onChange={(v) => setField("email", v)}
                    onBlur={() => validateFieldOnBlur("email")}
                    error={errors.email}
                    placeholder="cliente@empresa.com"
                    type="email"
                    required
                    inputMode="email"
                  />

                  <FormInput
                    id="cliente-password"
                    label={editingId ? "Contraseña (opcional)" : "Contraseña"}
                    value={form.password}
                    onChange={(v) => setField("password", v)}
                    onBlur={() => validateFieldOnBlur("password")}
                    error={errors.password}
                    placeholder={
                      editingId ? "Dejar vacío para no cambiar" : "Mínimo 8 caracteres"
                    }
                    type={showPassword ? "text" : "password"}
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword((visible) => !visible)}
                    required={!editingId}
                  />

                  <FormInput
                    id="cliente-nombre"
                    label="Nombre completo"
                    value={form.nombre}
                    onChange={(v) => setField("nombre", v)}
                    onBlur={() => validateFieldOnBlur("nombre")}
                    error={errors.nombre}
                    placeholder="Juan Pérez"
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                      id="cliente-dni"
                      label="DNI"
                      value={form.dni}
                      onChange={(v) => setField("dni", onlyDigits(v).slice(0, 8))}
                      onBlur={() => validateFieldOnBlur("dni")}
                      error={errors.dni}
                      placeholder="12345678"
                      required
                      inputMode="numeric"
                      maxLength={8}
                    />

                    <FormInput
                      id="cliente-cuit"
                      label="CUIT/CUIL"
                      value={form.cuit}
                      onChange={(v) => setField("cuit", formatCuit(v))}
                      onBlur={() => validateFieldOnBlur("cuit")}
                      error={errors.cuit}
                      placeholder="27-12345678-9"
                      required
                      inputMode="numeric"
                      maxLength={13}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                      id="cliente-telefono"
                      label="Teléfono"
                      value={form.telefono}
                      onChange={(v) => setField("telefono", v)}
                      onBlur={() => validateFieldOnBlur("telefono")}
                      error={errors.telefono}
                      placeholder="+54 11 1234-5678"
                      required
                      inputMode="tel"
                    />

                    <div>
                      <label
                        htmlFor="cliente-pais"
                        className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5"
                      >
                        Localidad <span className="text-amber-500">*</span>
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select
                          id="cliente-pais"
                          value={paisSeleccionado}
                          onChange={(e) => {
                            setPaisSeleccionado(e.target.value);
                            setProvinciaSeleccionada("");
                            setLocalidadSeleccionada("");
                            setField("localidad", "");
                          }}
                          onBlur={() => validateFieldOnBlur("localidad")}
                          required
                          aria-invalid={Boolean(errors.localidad)}
                          aria-describedby={
                            errors.localidad ? "cliente-localidad-error" : undefined
                          }
                          className={`w-full rounded-lg bg-zinc-50 dark:bg-zinc-950 border text-zinc-900 dark:text-white px-3 py-2.5 text-sm
                                     outline-none transition-all duration-200
                                     ${
                                       errors.localidad
                                         ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                         : "border-zinc-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                     }`}
                        >
                          <option value="">País</option>
                          {CATALOGO_UBICACIONES.map((pais) => (
                            <option key={pais.codigo} value={pais.codigo}>
                              {pais.bandera} {pais.codigo}
                            </option>
                          ))}
                        </select>

                        <select
                          id="cliente-provincia"
                          value={provinciaSeleccionada}
                          onChange={(e) => {
                            setProvinciaSeleccionada(e.target.value);
                            setLocalidadSeleccionada("");
                            setField("localidad", "");
                          }}
                          onBlur={() => validateFieldOnBlur("localidad")}
                          disabled={!paisSeleccionado}
                          required
                          aria-invalid={Boolean(errors.localidad)}
                          aria-describedby={
                            errors.localidad ? "cliente-localidad-error" : undefined
                          }
                          className={`w-full rounded-lg bg-zinc-50 dark:bg-zinc-950 border text-zinc-900 dark:text-white px-3 py-2.5 text-sm
                                     outline-none transition-all duration-200 disabled:opacity-50
                                     ${
                                       errors.localidad
                                         ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                         : "border-zinc-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                     }`}
                        >
                          <option value="">Provincia</option>
                          {provinciasCatalogo.map((provincia) => (
                            <option key={provincia.nombre} value={provincia.nombre}>
                              {provincia.nombre}
                            </option>
                          ))}
                        </select>

                        <select
                          id="cliente-localidad"
                          value={localidadSeleccionada}
                          onChange={(e) => {
                            const valor = e.target.value;
                            setLocalidadSeleccionada(valor);
                            setField(
                              "localidad",
                              construirLocalidadFinal(
                                valor,
                                provinciaSeleccionada,
                                paisSeleccionado
                              )
                            );
                          }}
                          onBlur={() => validateFieldOnBlur("localidad")}
                          disabled={!provinciaSeleccionada}
                          required
                          aria-invalid={Boolean(errors.localidad)}
                          aria-describedby={
                            errors.localidad ? "cliente-localidad-error" : undefined
                          }
                          className={`w-full rounded-lg bg-zinc-50 dark:bg-zinc-950 border text-zinc-900 dark:text-white px-3 py-2.5 text-sm
                                     outline-none transition-all duration-200 disabled:opacity-50
                                     ${
                                       errors.localidad
                                         ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                         : "border-zinc-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                     }`}
                        >
                          <option value="">Localidad</option>
                          {localidadesCatalogo.map((localidad) => (
                            <option key={localidad} value={localidad}>
                              {localidad}
                            </option>
                          ))}
                        </select>
                      </div>

                      {errors.localidad && (
                        <p
                          id="cliente-localidad-error"
                          className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1"
                        >
                          <span>⚠</span> {errors.localidad}
                        </p>
                      )}
                    </div>
                  </div>

                  <FormInput
                    id="cliente-ubicacion"
                    label="Ubicación"
                    value={form.ubicacion}
                    onChange={(v) => setField("ubicacion", v)}
                    onBlur={() => validateFieldOnBlur("ubicacion")}
                    error={errors.ubicacion}
                    placeholder="Buenos Aires"
                    required
                  />

                  <div className="flex items-center gap-3 pt-2">
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Información comercial
                    </h3>
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                  </div>

                  <div className="space-y-5 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormInput
                          id="cliente-razonSocial"
                          label="Razón social"
                          value={form.razonSocial}
                          onChange={(v) => setField("razonSocial", v)}
                          onBlur={() => validateFieldOnBlur("razonSocial")}
                          error={errors.razonSocial}
                          placeholder="Empresa S.A."
                          required
                        />

                        <div>
  <label htmlFor="cliente-tipoComercio" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
    Tipo de comercio <span className="text-amber-500">*</span>
  </label>
  <select
    id="cliente-tipoComercio"
    value={form.tipoComercio}
    onChange={(e) => setField("tipoComercio", e.target.value)}
    onBlur={() => validateFieldOnBlur("tipoComercio")}
    className={`w-full rounded-lg bg-zinc-50 dark:bg-zinc-950 border
           text-zinc-900 dark:text-white px-3 py-2.5 text-sm
           outline-none transition-all duration-200
           ${errors.tipoComercio
             ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
             : "border-zinc-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
           }`}
    required
    aria-invalid={Boolean(errors.tipoComercio)}
    aria-describedby={errors.tipoComercio ? "cliente-tipoComercio-error" : undefined}
  >
    <option value="">Elegir tipo</option>
    {OPCIONES_TIPO_COMERCIO.map((tipo) => (
      <option key={tipo} value={tipo}>
        {tipo}
      </option>
    ))}
  </select>

  {errors.tipoComercio && (
    <p id="cliente-tipoComercio-error" className="mt-1 text-xs text-red-500 dark:text-red-400">
      ⚠ {errors.tipoComercio}
    </p>
  )}
</div>
                      </div>

                      <div>
                        <label
                          htmlFor="cliente-notas"
                          className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5"
                        >
                          Notas
                        </label>
                        <textarea
                          id="cliente-notas"
                          value={form.notas}
                          onChange={(e) => setField("notas", e.target.value)}
                          className="w-full rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700
                                 text-zinc-900 dark:text-white px-3 py-2.5 text-sm
                                 outline-none transition-all duration-200 resize-none
                                 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
                                 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                          rows={3}
                          maxLength={1000}
                          placeholder="Observaciones del cliente..."
                        />
                      </div>

                      <div className="p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 space-y-4">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Foto del cliente (opcional)
                        </p>

                        <FormInput
                          id="cliente-fotoUrl"
                          label="URL de imagen"
                          value={form.fotoUrl}
                          onChange={(v) => setField("fotoUrl", v)}
                          onBlur={() => validateFieldOnBlur("fotoUrl")}
                          error={errors.fotoUrl}
                          placeholder="https://..."
                        />

                        <div>
                          <label
                            htmlFor="cliente-fotoFile"
                            className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5"
                          >
                            O subir archivo
                          </label>
                          <input
                            id="cliente-fotoFile"
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={(e) =>
                              setField("fotoFile", e.target.files?.[0] ?? null)
                            }
                            onBlur={() => validateFieldOnBlur("fotoFile")}
                            aria-invalid={Boolean(errors.fotoFile)}
                            aria-describedby={
                              errors.fotoFile ? "cliente-fotoFile-error" : undefined
                            }
                            className="w-full text-sm text-zinc-600 dark:text-zinc-400
                                   file:mr-4 file:py-2 file:px-4 file:rounded-lg
                                   file:border file:border-zinc-300 dark:file:border-zinc-600
                                   file:text-sm file:font-medium
                                   file:bg-zinc-100 dark:file:bg-zinc-800
                                   file:text-zinc-700 dark:file:text-zinc-300
                                   hover:file:bg-zinc-200 dark:hover:file:bg-zinc-700
                                   file:cursor-pointer file:transition-colors"
                          />
                          {errors.fotoFile && (
                            <p id="cliente-fotoFile-error" className="mt-1 text-xs text-red-500 dark:text-red-400">
                              ⚠ {errors.fotoFile}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                  {submitError && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                    >
                      {submitError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className="w-full rounded-lg bg-amber-500 text-zinc-950 font-semibold py-3 px-4
                           shadow-sm shadow-amber-500/20 transition-all duration-200
                           hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/25
                           active:scale-[0.99]
                           disabled:opacity-70 disabled:cursor-not-allowed
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

          {!editingId && (
          <div className={`${showFormPanel ? "lg:col-span-3" : "lg:col-span-1"} z-30 w-full min-w-0 transition-all duration-300`}>
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm shadow-zinc-900/5 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-amber-100 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      {vistaChoferes ? (
                        <IconTruck className="w-4 h-4" />
                      ) : (
                        <IconUser className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-semibold tracking-wide">
                        {vistaChoferes ? "CHOFERES" : "CLIENTES"}
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {vistaChoferes ? choferes.length : clientes.length}{" "}
                        {(vistaChoferes ? choferes.length : clientes.length) === 1
                          ? "registrado"
                          : "registrados"}
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full sm:w-auto flex-wrap items-center gap-2 sm:justify-end">
                    {!vistaChoferes && (
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowFiltros((v) => !v)}
                        className={`min-h-10 shrink-0 px-3 py-2 text-xs font-semibold rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                          showFiltros
                            ? "bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300"
                            : "bg-zinc-100/90 dark:bg-zinc-800/90 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600"
                        }`}
                        aria-expanded={showFiltros}
                      >
                        <IconFilter className="w-4 h-4" />
                        <span>FILTRAR</span>
                        {showFiltros ? (
                          <IconChevronUp className="w-4 h-4" />
                        ) : (
                          <IconChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {showFiltros && (
                        <div className="absolute -left-4 sm:left-auto sm:right-0 top-full mt-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-2xl shadow-zinc-900/10 dark:shadow-black/40 z-50 overflow-hidden animate-slide-down">
                          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconFilter className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                              <span className="text-xs font-semibold tracking-[0.08em] text-zinc-700 dark:text-zinc-300">
                                FILTROS
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setShowFiltros(false)}
                              className="min-h-10 min-w-10 p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                              aria-label="Cerrar filtros"
                            >
                              <IconX className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="p-4 space-y-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.08em] mb-1.5">
                                Estado
                              </label>
                              <select
                                value={filtroEstado}
                                onChange={(e) =>
                                  setFiltroEstado(
                                    e.target.value as "todos" | "disponible" | "asignado"
                                  )
                                }
                                className="w-full rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                              >
                                <option value="todos">Todos</option>
                                <option value="disponible">Disponible</option>
                                <option value="asignado">Asignado</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.08em] mb-1.5">
                                Localidad
                              </label>
                              <select
                                value={filtroLocalidad}
                                onChange={(e) => setFiltroLocalidad(e.target.value)}
                                className="w-full rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
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
                              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.08em] mb-1.5">
                                Tipo de comercio
                              </label>
                              <select
                                value={filtroTipoComercio}
                                onChange={(e) => setFiltroTipoComercio(e.target.value)}
                                className="w-full rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                              >
                                <option value="todos">Todos</option>
                                {tiposComercioDisponibles.map((tipo) => (
                                  <option key={tipo} value={tipo}>
                                    {tipo}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={limpiarFiltros}
                              className="min-h-10 flex-1 px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                              LIMPIAR
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowFiltros(false)}
                              className="min-h-10 flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-500 border border-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors"
                            >
                              CERRAR
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setVistaChoferes((v) => !v);
                        setShowFormPanel(false);
                        cancelarEdicion();
                        setSeleccionados(new Set());
                        setShowFiltros(false);
                      }}
                      className="min-h-10 shrink-0 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-2
                                 bg-zinc-100/90 dark:bg-zinc-800/90 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300
                                 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600"
                    >
                      {vistaChoferes ? (
                        <IconUser className="w-4 h-4" />
                      ) : (
                        <IconTruck className="w-4 h-4" />
                      )}
                      {vistaChoferes ? "VER CLIENTES" : "VER CHOFERES"}
                    </button>

                    {!vistaChoferes && (
                    <button
                      type="button"
                      onClick={() => {
                        cancelarEdicion();
                        setShowFormPanel((v) => !v);
                      }}
                      className={`min-h-10 shrink-0 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        showFormPanel
                          ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          : "bg-amber-500 border-amber-500 text-zinc-950 hover:bg-amber-400 shadow-sm shadow-amber-500/20"
                      }`}
                    >
                      {showFormPanel ? "CERRAR +" : "AÑADIR CLIENTE +"}
                    </button>
                    )}

                    <div className="relative basis-full sm:basis-auto sm:flex-1 sm:w-72">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={vistaChoferes ? "Buscar chofer..." : "Buscar cliente..."}
                        className="w-full rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700
                                 text-zinc-900 dark:text-white pl-10 pr-4 py-2 text-sm
                                 outline-none transition-all duration-200
                                 hover:border-zinc-400 dark:hover:border-zinc-600
                                 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
                                 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                      />
                      <IconSearch className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {!vistaChoferes && filteredClientes.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      disabled={cantidadSeleccionables === 0}
                      title={
                        cantidadSeleccionables === 0
                          ? "No hay clientes disponibles para seleccionar"
                          : undefined
                      }
                      className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-zinc-500 transition-colors"
                    >
                      {todosLosAsignablesSeleccionados
                        ? "Deseleccionar disponibles"
                        : "Seleccionar disponibles"}
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">
                        {cantidadSeleccionados}{" "}
                        {cantidadSeleccionados === 1 ? "seleccionado" : "seleccionados"}
                      </span>
                      {cantidadSeleccionados > 0 && (
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={`${showFormPanel ? "lg:max-h-[calc(100vh-320px)]" : "lg:max-h-[calc(100vh-230px)]"} overflow-y-auto overflow-x-auto overscroll-x-contain`}>
                {vistaChoferes ? (
                  loadingChoferes ? (
                    <div className="px-6 py-16 text-center">
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
                      <p className="mt-4 text-zinc-500 text-sm">Cargando choferes...</p>
                    </div>
                  ) : filteredChoferes.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                      <IconTruck className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600" />
                      <p className="mt-4 text-zinc-600 dark:text-zinc-400 font-medium">
                        {searchTerm
                          ? "No se encontraron resultados"
                          : "No hay choferes registrados"}
                      </p>
                      {searchTerm && (
                        <p className="text-zinc-500 dark:text-zinc-600 text-sm mt-1">
                          Intentá con otra búsqueda
                        </p>
                      )}
                    </div>
                  ) : (
                    <table
                      className="w-full min-w-[952px] border-collapse table-fixed"
                      style={{ fontSize: "12px", lineHeight: "14px" }}
                    >
                      <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                        <tr className="text-left uppercase text-zinc-500 dark:text-zinc-400">
                          <th className="h-5 px-2 py-0 w-40 border-r border-zinc-200 dark:border-zinc-700">Chofer</th>
                          <th className="h-5 px-2 py-0 w-44 border-r border-zinc-200 dark:border-zinc-700">Email</th>
                          <th className="h-5 px-2 py-0 w-28 border-r border-zinc-200 dark:border-zinc-700">Teléfono</th>
                          <th className="h-5 px-2 py-0 w-32 border-r border-zinc-200 dark:border-zinc-700">DNI</th>
                          <th className="h-5 px-2 py-0 w-32 border-r border-zinc-200 dark:border-zinc-700">Ubicación</th>
                          <th className="h-5 px-2 py-0 w-24">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredChoferes.map((ch: any, index: number) => {
                          const rowColor = index % 2 === 0 ? color1 : color2;
                          const st = String(ch.status || "").toLowerCase();
                          const activo = st === "disponible" || st === "activo";

                          return (
                            <tr
                              key={ch.id}
                              className={`h-11 sm:h-9 border-b border-zinc-200 dark:border-zinc-800 ${rowColor} hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60`}
                            >
                              <td className="h-11 sm:h-9 px-2 py-0 align-middle border-r border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
                                <span className="block truncate" title={ch.nombre}>{ch.nombre || "-"}</span>
                              </td>
                              <td className="h-5 px-2 py-0 align-middle border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300">
                                <span className="block truncate" title={ch.email}>{ch.email || "-"}</span>
                              </td>
                              <td className="h-5 px-2 py-0 align-middle border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                                <span className="block truncate" title={ch.telefono}>{ch.telefono || "-"}</span>
                              </td>
                              <td className="h-5 px-2 py-0 align-middle border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300">
                                <span className="block truncate" title={ch.dni}>{ch.dni || "-"}</span>
                              </td>
                              <td className="h-5 px-2 py-0 align-middle border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300">
                                <span className="block truncate" title={ch.ubicacion}>{ch.ubicacion || "-"}</span>
                              </td>
                              <td className="h-5 px-2 py-0 align-middle text-center">
                                {st ? (
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${
                                      activo
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                                        : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 shrink-0 rounded-full ${activo ? "bg-emerald-500" : "bg-amber-500"}`}
                                    />
                                    {ch.status}
                                  </span>
                                ) : (
                                  <span className="text-zinc-400 dark:text-zinc-500">-</span>
                                )}
                              </td>
                          </tr>
                        );
                        })}
                      </tbody>
                    </table>
                  )
                ) : loading ? (
                  <div className="px-6 py-16 text-center">
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
                    <div className="w-16 h-16 mx-auto">
                     <img
  src="/images/clientes/no-user.png"
  alt=""
  className="w-18 h-18 object-contain"
/>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                      {searchTerm
                        ? "No se encontraron resultados"
                        : "No hay clientes registrados"}
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-600 text-sm mt-1">
                      {searchTerm
                        ? "Intentá con otra búsqueda"
                        : "Creá tu primer cliente para comenzar"}
                    </p>
                  </div>
                ) : (
                  <table
                    className="w-full min-w-[952px] border-collapse table-fixed"
                    style={{ fontSize: "12px", lineHeight: "14px" }}
                  >
                    <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <tr className="text-left uppercase text-zinc-500 dark:text-zinc-400">
                        <th className="h-5 px-2 py-0 w-10 border-r border-zinc-200 dark:border-zinc-700">Sel.</th>
                        <th className="h-5 px-2 py-0 w-40 border-r border-zinc-200 dark:border-zinc-700">Cliente</th>
                        <th className="h-5 px-2 py-0 w-44 border-r border-zinc-200 dark:border-zinc-700">
                          <select
                            value={columnaIdentificador}
                            onChange={(e) =>
                              setColumnaIdentificador(
                                e.target.value as ColumnaIdentificador
                              )
                            }
                            className="w-full bg-transparent outline-none text-[12px] uppercase font-semibold text-zinc-500 dark:text-zinc-400"
                            title="Elegir dato a mostrar"
                          >
                            <option value="dni">DNI</option>
                            <option value="cuit">CUIT/CUIL</option>
                            <option value="email">Correo electrónico</option>
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
                        const estaAsignado = c.status === "asignado";
                        const rowColor = checked
                          ? "bg-amber-50 dark:bg-amber-500/10"
                          : index % 2 === 0
                            ? color1
                            : color2;
                        const estadoColor = estaAsignado
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
                        const textoSecundario = "text-zinc-600 dark:text-zinc-300";
                        const textoPrincipal = "text-zinc-900 dark:text-white";

                        return (
                          <tr
                            key={c.id}
                            onClick={(event) => {
                              if (
                                (event.target as Element).closest(
                                  "a, button, input, select, textarea"
                                )
                              ) {
                                return;
                              }
                              toggleSeleccion(c.id);
                            }}
                            onKeyDown={(event) => {
                              if (
                                event.currentTarget !== event.target ||
                                (event.key !== "Enter" && event.key !== " ")
                              ) {
                                return;
                              }
                              event.preventDefault();
                              toggleSeleccion(c.id);
                            }}
                            tabIndex={0}
                            aria-selected={checked}
                            className={`group h-11 sm:h-9 cursor-pointer border-b border-zinc-200 dark:border-zinc-800 ${rowColor} ${
                              checked
                                ? "hover:bg-amber-100 dark:hover:bg-amber-500/20"
                                : "hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60"
                            }`}
                          >
                            <td className={`h-11 sm:h-9 px-1 sm:px-2 py-0 align-middle border-l-[3px] border-r border-zinc-200 dark:border-zinc-800 ${
                              checked
                                ? "border-l-amber-500"
                                : "border-l-transparent"
                            }`}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSeleccion(c.id);
                                }}
                                className={`mx-auto w-9 h-9 sm:w-6 sm:h-6 rounded-md sm:rounded border flex items-center justify-center transition-all ${
                                  checked
                                    ? "bg-amber-500 border-amber-600 ring-2 ring-amber-500/25 shadow-sm shadow-amber-500/30"
                                    : "bg-white dark:bg-zinc-900 border-zinc-400 dark:border-zinc-500"
                                } hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10`}
                                aria-label={`${checked ? "Deseleccionar" : "Seleccionar"} a ${c.nombre}`}
                                aria-pressed={checked}
                              >
                                {checked && <IconCheck className="w-4 h-4 text-zinc-950" />}
                              </button>
                            </td>

                            <td className={`relative h-5 px-2 py-0 align-middle border-r border-zinc-200 dark:border-zinc-800 ${textoPrincipal}`}>
                              <span className="block truncate" title={c.nombre}>
                                {c.nombre}
                              </span>
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

                            <td className={`h-5 px-2 py-0 align-middle border-r border-zinc-200 dark:border-zinc-800 text-center ${estadoColor}`}>
                              <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wide">
                                {estaAsignado ? "Asignado" : "Disponible"}
                              </span>
                            </td>

                            <td className="h-5 px-2 py-0 align-middle text-zinc-500 dark:text-zinc-400">
                              <span className="block truncate">&nbsp;</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {!vistaChoferes && (
              <div className="p-2 sm:p-1 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70">
                <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3">
                  <div
                    title={
                      seleccionIncluyeAsignados
                        ? "Desmarcá los clientes ya asignados para realizar una nueva asignación"
                        : undefined
                    }
                    className={`flex-1 flex items-stretch rounded-lg overflow-hidden transition-all duration-200 ${
  !puedeAsignarSeleccionados
    ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600"
    : "bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-sm shadow-amber-500/25"
}`}
                  >
                    <button
                      onClick={asignarClientes}
                      disabled={!puedeAsignarSeleccionados}
                      title={
                        seleccionIncluyeAsignados
                          ? "Desmarcá los clientes ya asignados para realizar una nueva asignación"
                          : cantidadSeleccionados === 0
                            ? "Seleccioná al menos un cliente disponible"
                            : "Asignar los clientes seleccionados a un chofer"
                      }
                      className="min-h-11 flex-1 flex items-center justify-center gap-2 sm:gap-3 py-2 sm:py-1 px-2 disabled:cursor-not-allowed"
                    >
                      <img src="/images/clientes/delivery-truck.png" alt="Camión" className="w-9 h-9 object-contain" />
                      <span className="text-xs sm:text-sm font-semibold">
                        ASIGNAR {puedeAsignarSeleccionados && `(${idsAsignablesSeleccionados.length})`} A UN CHOFER
                      </span>
                    </button>

                    {cantidadSeleccionados > 3 && (
                      <button
                        type="button"
                        onClick={cancelarSeleccionados}
                        className="m-1 px-3 py-2 rounded-md border border-current text-[11px] font-semibold uppercase tracking-[0.02em] hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-colors"
                      >
                        Cancelar {cantidadSeleccionados} seleccionados
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const primero = Array.from(seleccionados)[0];
                      if (primero) nav(`/clientes/${primero}`);
                    }}
                    disabled={cantidadSeleccionados !== 1}
                    title={
                      cantidadSeleccionados === 1
                        ? "Ver el detalle del cliente seleccionado"
                        : "Seleccioná un solo cliente para ver su detalle"
                    }
                    className={`min-h-11 flex-1 flex items-center justify-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed ${
  cantidadSeleccionados !== 1
    ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600"
    : "bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"
}`}
                  >
                    <IconEye className="w-5 h-5" />
                    <span className="font-semibold">VER DETALLES</span>
                  </button>
                </div>
              </div>
              )}
            </div>
          </div>
          )}
        </div>
      </main>

      <AsignarChoferModal
        isOpen={showAsignarModal}
        onClose={() => setShowAsignarModal(false)}
        clientIds={idsAsignablesSeleccionados}
        onSuccess={handleAsignacionExitosa}
      />
    </div>
  );
}
