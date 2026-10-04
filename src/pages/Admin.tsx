import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import type { Cliente } from "../api";
import { ThemeToggle } from "../components/ThemeToggle";
import { useToast } from "../hooks/useToast";
import {
  IconArrowLeft,
  IconActivity,
  IconLogout,
  IconUserPlus,
  IconUsers,
  IconUser,
  IconPencil as IconEdit,
  IconKey,
  IconX,
  IconTrash,
  IconCheck,
  IconSearch,
  IconEye,
  IconEyeOff,
} from "../components/icons";
import {
  formatCuit,
  onlyDigits,
  validateCuit,
  validateDni,
  validateEmail,
  validateLocation,
  validatePassword,
  validatePhone,
  validateRequired,
} from "../utils/validation";

type User = Omit<Cliente, "role"> & { role: string };

// ============ COMPONENTS ============

type Tab = "crear" | "gestion";

const emptyForm = {
  email: "",
  password: "",
  role: "cliente" as "chofer" | "cliente",
  nombre: "",
  dni: "",
  cuit: "",
  telefono: "",
  ubicacion: "",
  localidad: "",
  razonSocial: "",
  tipoComercio: "",
  notas: "",
};

type AdminForm = typeof emptyForm;
type AdminFormField = Exclude<keyof AdminForm, "role">;
type AdminFormErrors = Partial<Record<AdminFormField, string>>;
type EditField = Exclude<AdminFormField, "password" | "localidad">;
type EditForm = Record<EditField, string>;

const emptyEditForm: EditForm = {
  nombre: "",
  email: "",
  telefono: "",
  dni: "",
  cuit: "",
  ubicacion: "",
  razonSocial: "",
  tipoComercio: "",
  notas: "",
};

const createValidatedFields: AdminFormField[] = [
  "nombre",
  "email",
  "password",
  "telefono",
  "dni",
  "cuit",
  "ubicacion",
  "localidad",
];


const editFields: {
  key: EditField;
  label: string;
  type?: "text" | "email" | "tel";
  inputMode?: "text" | "email" | "tel" | "numeric";
  required?: boolean;
}[] = [
  { key: "nombre", label: "Nombre", required: true },
  { key: "email", label: "Email", type: "email", inputMode: "email", required: true },
  { key: "telefono", label: "Teléfono", type: "tel", inputMode: "tel", required: true },
  { key: "dni", label: "DNI", inputMode: "numeric", required: true },
  { key: "cuit", label: "CUIT/CUIL", inputMode: "numeric", required: true },
  { key: "ubicacion", label: "Ubicación", required: true },
  { key: "razonSocial", label: "Razón social" },
  { key: "tipoComercio", label: "Tipo de comercio" },
  { key: "notas", label: "Notas" },
];

function getCreateFieldError(values: AdminForm, field: AdminFormField) {
  switch (field) {
    case "nombre":
      return validateRequired(values.nombre, "Nombre");
    case "email":
      return validateEmail(values.email);
    case "password":
      return validatePassword(values.password);
    case "telefono":
      return validatePhone(values.telefono);
    case "dni":
      return validateDni(values.dni);
    case "cuit":
      return validateCuit(values.cuit);
    case "ubicacion":
      return validateLocation(values.ubicacion);
    case "localidad":
      return validateRequired(values.localidad, "Localidad");
    default:
      return undefined;
  }
}

function validateCreateForm(values: AdminForm) {
  const errors: AdminFormErrors = {};

  createValidatedFields.forEach((field) => {
    const error = getCreateFieldError(values, field);
    if (error) errors[field] = error;
  });
  return errors;
}

function getEditFieldError(values: EditForm, field: EditField) {
  switch (field) {
    case "nombre":
      return validateRequired(values.nombre, "Nombre");
    case "email":
      return validateEmail(values.email);
    case "telefono":
      return validatePhone(values.telefono);
    case "dni":
      return validateDni(values.dni);
    case "cuit":
      return validateCuit(values.cuit);
    case "ubicacion":
      return validateLocation(values.ubicacion);
    default:
      return undefined;
  }
}

function validateEditForm(values: EditForm) {
  const errors: Partial<Record<EditField, string>> = {};
  editFields.forEach(({ key }) => {
    const error = getEditFieldError(values, key);
    if (error) errors[key] = error;
  });
  return errors;
}

function normalizeCreatePayload(values: AdminForm): AdminForm {
  return {
    ...values,
    email: values.email.trim().toLowerCase(),
    nombre: values.nombre.trim(),
    dni: onlyDigits(values.dni),
    cuit: formatCuit(values.cuit.trim()),
    telefono: values.telefono.trim(),
    ubicacion: values.ubicacion.trim(),
    localidad: values.localidad.trim(),
    razonSocial: values.razonSocial.trim(),
    tipoComercio: values.tipoComercio.trim(),
    notas: values.notas.trim(),
  };
}

function normalizeEditPayload(values: EditForm): EditForm {
  return {
    ...values,
    email: values.email.trim().toLowerCase(),
    nombre: values.nombre.trim(),
    dni: onlyDigits(values.dni),
    cuit: formatCuit(values.cuit.trim()),
    telefono: values.telefono.trim(),
    ubicacion: values.ubicacion.trim(),
    razonSocial: values.razonSocial.trim(),
    tipoComercio: values.tipoComercio.trim(),
    notas: values.notas.trim(),
  };
}

function focusField(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("crear");

  // Create user state
  const [form, setForm] = useState({ ...emptyForm });
  const [createErrors, setCreateErrors] = useState<AdminFormErrors>({});
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [choferes, setChoferes] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ ...emptyEditForm });
  const [editErrors, setEditErrors] = useState<Partial<Record<EditField, string>>>({});
  const [saving, setSaving] = useState(false);
  const [resetModal, setResetModal] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState<string>();
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const toast = useToast();
  const [deleteModal, setDeleteModal] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (tab === "gestion") loadUsers();
  }, [tab]);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const [clienteRes, choferRes] = await Promise.all([
        api.listClientes(),
        api.listChoferes(),
      ]);
      setUsers(clienteRes.users as User[]);
      setChoferes(choferRes.users as User[]);
    } catch {
      setFeedback({ type: "err", text: "Error al cargar los usuarios" });
    } finally {
      setLoadingUsers(false);
    }
  }

  function changeCreateField(field: AdminFormField, value: string) {
    const nextValue =
      field === "cuit"
        ? formatCuit(value)
        : field === "dni"
          ? onlyDigits(value).slice(0, 8)
          : value;
    setForm((current) => ({ ...current, [field]: nextValue }));
    if (createErrors[field]) {
      setCreateErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  function blurCreateField(field: AdminFormField) {
    const error = getCreateFieldError(form, field);
    setCreateErrors((current) => ({ ...current, [field]: error }));
  }

  function changeEditField(field: EditField, value: string) {
    const nextValue =
      field === "cuit"
        ? formatCuit(value)
        : field === "dni"
          ? onlyDigits(value).slice(0, 8)
          : value;
    setEditForm((current) => ({ ...current, [field]: nextValue }));
    if (editErrors[field]) {
      setEditErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  function blurEditField(field: EditField) {
    const error = getEditFieldError(editForm, field);
    setEditErrors((current) => ({ ...current, [field]: error }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;

    const validationErrors = validateCreateForm(form);
    setCreateErrors(validationErrors);
    setCreateMsg(null);
    if (Object.keys(validationErrors).length > 0) {
      const firstField = createValidatedFields.find(
        (field) => validationErrors[field]
      );
      if (firstField) focusField(`create-${firstField}`);
      return;
    }

    const payload = normalizeCreatePayload(form);
    setCreating(true);
    try {
      await api.createCliente(payload);
      toast.success(`Usuario "${payload.nombre}" creado correctamente`);
      setForm({ ...emptyForm });
      setCreateErrors({});
      setShowCreatePassword(false);
    } catch (err: any) {
      const field = err.field as AdminFormField | undefined;
      if (field && createValidatedFields.includes(field)) {
        setCreateErrors((current) => ({ ...current, [field]: err.message }));
        focusField(`create-${field}`);
      }
      setCreateMsg({ type: "err", text: err.message || "Error al crear el usuario" });
    } finally {
      setCreating(false);
    }
  }

  function startEdit(user: User) {
    setEditingUser(user);
    setEditErrors({});
    setEditForm({
      nombre: user.nombre || "",
      email: user.email || "",
      telefono: user.telefono || "",
      dni: user.dni || "",
      cuit: user.cuit || "",
      ubicacion: user.ubicacion || "",
      razonSocial: user.razonSocial || "",
      tipoComercio: user.tipoComercio || "",
      notas: user.notas || "",
    });
  }

  async function handleSaveEdit() {
    if (!editingUser || saving) return;
    const validationErrors = validateEditForm(editForm);
    setEditErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      const firstField = editFields.find(({ key }) => validationErrors[key])?.key;
      if (firstField) focusField(`edit-${firstField}`);
      return;
    }

    const payload = normalizeEditPayload(editForm);
    setSaving(true);
    try {
      await api.updateUser(editingUser.id, payload);
      setFeedback(null);
      toast.success(`"${payload.nombre}" actualizado`);
      setEditingUser(null);
      setEditErrors({});
      loadUsers();
    } catch (err: any) {
      const field = editFields.find(({ key }) => key === err.field)?.key;
      if (field) {
        setEditErrors((current) => ({ ...current, [field]: err.message }));
        focusField(`edit-${field}`);
      }
      setFeedback({ type: "err", text: err.message || "Error al actualizar el usuario" });
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!resetModal || resetting) return;
    const validationError = validatePassword(newPassword);
    setResetPasswordError(validationError);
    if (validationError) {
      focusField("reset-password");
      return;
    }

    setResetting(true);
    try {
      await api.resetPassword(resetModal.id, newPassword);
      setFeedback(null);
      toast.success(`Contraseña de "${resetModal.nombre}" restablecida`);
      setResetModal(null);
      setNewPassword("");
      setResetPasswordError(undefined);
      setShowResetPassword(false);
    } catch (err: any) {
      setFeedback({ type: "err", text: err.message || "Error al restablecer la contraseña" });
    } finally {
      setResetting(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await api.deleteUser(deleteModal.id);
      setFeedback(null);
      toast.success(`"${deleteModal.nombre}" eliminado`);
      setDeleteModal(null);
      loadUsers();
    } catch (err: any) {
      setFeedback({ type: "err", text: err.message || "Error al eliminar el usuario" });
    } finally {
      setDeleting(false);
    }
  }

  const allUsers = [...choferes, ...users];
  const filtered = search
    ? allUsers.filter(
        (u) =>
          u.nombre.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.dni?.includes(search)
      )
    : allUsers;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "crear", label: "Crear usuario", icon: <IconUserPlus className="w-4 h-4" /> },
    { key: "gestion", label: "Gestión de usuarios", icon: <IconUsers className="w-4 h-4" /> },
  ];

  const inputClass =
    "w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors";

  const validatedInputClass = (error?: string) =>
    `${inputClass} ${
      error
        ? "!border-red-500 focus:!border-red-500 focus:!ring-red-500/20"
        : ""
    }`;

  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1";

  return (
    <div className="min-h-screen fondo-home bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 shadow-sm shadow-zinc-900/5">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="grid grid-cols-1 items-center gap-y-2 sm:flex sm:justify-between sm:gap-4">
            <div className="flex w-full sm:w-auto min-w-0 items-center gap-2 sm:gap-4">
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                           text-zinc-600 dark:text-zinc-400
                           hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-white
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
                           transition-colors"
                onClick={() => window.history.back()}
                title="Volver"
                aria-label="Volver"
              >
                <IconArrowLeft className="w-5 h-5" />
              </button>
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
                  GESTIÓN
                </h1>
                <p className="hidden sm:block truncate text-xs text-zinc-500 dark:text-zinc-400">
                  Administración de usuarios
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
                type="button"
                onClick={() => navigate("/monitoreo")}
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
              </button>
              <ThemeToggle />
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/login", { replace: true });
                }}
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

          {/* Tabs */}
          <div className="flex gap-1 mt-4 border-b border-zinc-200 dark:border-zinc-800">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                  tab === t.key
                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Feedback toast */}
        {feedback && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg border text-sm flex items-center justify-between ${
              feedback.type === "ok"
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400"
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="ml-4">
              <IconX className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======== CREAR USUARIO ======== */}
        {tab === "crear" && (
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm shadow-zinc-900/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
              <h2 className="text-lg font-bold">Crear usuario</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Registrar un nuevo chofer o cliente en el sistema
              </p>
            </div>
            <form onSubmit={handleCreate} noValidate className="p-6 space-y-6">
              {/* Role selector */}
              <div>
                <label className={labelClass}>Rol</label>
                <div className="flex gap-2">
                  {(["chofer", "cliente"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm({ ...form, role: r })}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                        form.role === r
                          ? "bg-amber-500 border-amber-500 text-zinc-950 font-semibold shadow-sm shadow-amber-500/20"
                          : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-amber-500"
                      }`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Required fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="create-nombre" className={labelClass}>Nombre *</label>
                  <input
                    id="create-nombre"
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => changeCreateField("nombre", e.target.value)}
                    onBlur={() => blurCreateField("nombre")}
                    className={validatedInputClass(createErrors.nombre)}
                    placeholder="Nombre completo"
                    autoComplete="name"
                    aria-invalid={!!createErrors.nombre}
                    aria-describedby={createErrors.nombre ? "create-nombre-error" : undefined}
                  />
                  {createErrors.nombre && (
                    <p id="create-nombre-error" className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {createErrors.nombre}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="create-email" className={labelClass}>Email *</label>
                  <input
                    id="create-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => changeCreateField("email", e.target.value)}
                    onBlur={() => blurCreateField("email")}
                    className={validatedInputClass(createErrors.email)}
                    placeholder="usuario@email.com"
                    autoComplete="email"
                    inputMode="email"
                    aria-invalid={!!createErrors.email}
                    aria-describedby={createErrors.email ? "create-email-error" : undefined}
                  />
                  {createErrors.email && (
                    <p id="create-email-error" className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {createErrors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="create-password" className={labelClass}>Contraseña *</label>
                  <div className="relative">
                    <input
                      id="create-password"
                      type={showCreatePassword ? "text" : "password"}
                      required
                      value={form.password}
                      onChange={(e) => changeCreateField("password", e.target.value)}
                      onBlur={() => blurCreateField("password")}
                      className={`${validatedInputClass(createErrors.password)} !pr-11`}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      aria-invalid={!!createErrors.password}
                      aria-describedby={createErrors.password ? "create-password-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword((visible) => !visible)}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500/50 transition-colors"
                      aria-label={showCreatePassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-pressed={showCreatePassword}
                      title={showCreatePassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showCreatePassword ? (
                        <IconEyeOff className="w-5 h-5" />
                      ) : (
                        <IconEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {createErrors.password && (
                    <p id="create-password-error" className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {createErrors.password}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="create-telefono" className={labelClass}>Teléfono *</label>
                  <input
                    id="create-telefono"
                    type="tel"
                    required
                    value={form.telefono}
                    onChange={(e) => changeCreateField("telefono", e.target.value)}
                    onBlur={() => blurCreateField("telefono")}
                    className={validatedInputClass(createErrors.telefono)}
                    placeholder="+54 11 5555-0000"
                    autoComplete="tel"
                    inputMode="tel"
                    aria-invalid={!!createErrors.telefono}
                    aria-describedby={createErrors.telefono ? "create-telefono-error" : undefined}
                  />
                  {createErrors.telefono && (
                    <p id="create-telefono-error" className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {createErrors.telefono}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="create-dni" className={labelClass}>DNI *</label>
                  <input
                    id="create-dni"
                    type="text"
                    required
                    value={form.dni}
                    onChange={(e) => changeCreateField("dni", e.target.value)}
                    onBlur={() => blurCreateField("dni")}
                    className={validatedInputClass(createErrors.dni)}
                    placeholder="12345678"
                    inputMode="numeric"
                    maxLength={8}
                    aria-invalid={!!createErrors.dni}
                    aria-describedby={createErrors.dni ? "create-dni-error" : undefined}
                  />
                  {createErrors.dni && (
                    <p id="create-dni-error" className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {createErrors.dni}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="create-cuit" className={labelClass}>CUIT *</label>
                  <input
                    id="create-cuit"
                    type="text"
                    required
                    value={form.cuit}
                    onChange={(e) => changeCreateField("cuit", e.target.value)}
                    onBlur={() => blurCreateField("cuit")}
                    className={validatedInputClass(createErrors.cuit)}
                    placeholder="20-12345678-9"
                    inputMode="numeric"
                    maxLength={13}
                    aria-invalid={!!createErrors.cuit}
                    aria-describedby={createErrors.cuit ? "create-cuit-error" : undefined}
                  />
                  {createErrors.cuit && (
                    <p id="create-cuit-error" className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {createErrors.cuit}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="create-ubicacion" className={labelClass}>Ubicación *</label>
                  <input
                    id="create-ubicacion"
                    type="text"
                    required
                    value={form.ubicacion}
                    onChange={(e) => changeCreateField("ubicacion", e.target.value)}
                    onBlur={() => blurCreateField("ubicacion")}
                    className={validatedInputClass(createErrors.ubicacion)}
                    placeholder={form.role === "chofer" ? "Domicilio" : "-34.6037,-58.3816"}
                    aria-invalid={!!createErrors.ubicacion}
                    aria-describedby={createErrors.ubicacion ? "create-ubicacion-error" : undefined}
                  />
                  {createErrors.ubicacion && (
                    <p id="create-ubicacion-error" className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {createErrors.ubicacion}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="create-localidad" className={labelClass}>Localidad *</label>
                  <input
                    id="create-localidad"
                    type="text"
                    required
                    value={form.localidad}
                    onChange={(e) => changeCreateField("localidad", e.target.value)}
                    onBlur={() => blurCreateField("localidad")}
                    className={validatedInputClass(createErrors.localidad)}
                    placeholder="Ciudad o localidad"
                    aria-invalid={!!createErrors.localidad}
                    aria-describedby={createErrors.localidad ? "create-localidad-error" : undefined}
                  />
                  {createErrors.localidad && (
                    <p id="create-localidad-error" className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {createErrors.localidad}
                    </p>
                  )}
                </div>
              </div>

              {/* Client-specific fields */}
              {form.role === "cliente" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div>
                    <label htmlFor="create-razon-social" className={labelClass}>Razón social</label>
                    <input
                      id="create-razon-social"
                      type="text"
                      value={form.razonSocial}
                      onChange={(e) => changeCreateField("razonSocial", e.target.value)}
                      className={inputClass}
                      placeholder="Empresa SRL"
                    />
                  </div>
                  <div>
                    <label htmlFor="create-tipo-comercio" className={labelClass}>Tipo de comercio</label>
                    <input
                      id="create-tipo-comercio"
                      type="text"
                      value={form.tipoComercio}
                      onChange={(e) => changeCreateField("tipoComercio", e.target.value)}
                      className={inputClass}
                      placeholder="Panadería, kiosco, etc."
                    />
                  </div>
                  <div>
                    <label htmlFor="create-notas" className={labelClass}>Notas</label>
                    <input
                      id="create-notas"
                      type="text"
                      value={form.notas}
                      onChange={(e) => changeCreateField("notas", e.target.value)}
                      className={inputClass}
                      placeholder="Observaciones"
                    />
                  </div>
                </div>
              )}

              {/* Create message */}
              {createMsg && (
                <div
                  className={`px-4 py-3 rounded-lg border text-sm ${
                    createMsg.type === "ok"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400"
                      : "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400"
                  }`}
                >
                  {createMsg.text}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold uppercase tracking-wider rounded-lg bg-amber-500 text-zinc-950 shadow-sm shadow-amber-500/20 hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {creating ? "Creando..." : "Crear usuario"}
              </button>
            </form>
          </div>
        )}

        {/* ======== GESTIÓN DE USUARIOS ======== */}
        {tab === "gestion" && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, email o DNI..."
                className={`${inputClass} pl-10`}
              />
            </div>

            {loadingUsers ? (
              <div className="text-center py-12 text-zinc-500">Cargando usuarios...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">No se encontraron usuarios</div>
            ) : (
              <div className="border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl shadow-sm shadow-zinc-900/5 overflow-hidden">
                {filtered.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white dark:bg-zinc-900/50 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors px-6 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{user.nombre}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${
                            user.role === "chofer"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700"
                              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.role === "chofer" ? "bg-blue-500" : "bg-amber-500"}`} />
                          {user.role}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                        {user.email} {user.telefono ? `| ${user.telefono}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(user)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-amber-500 hover:text-amber-500 transition-all"
                        title="Editar"
                      >
                        <IconEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setResetModal(user);
                          setNewPassword("");
                          setResetPasswordError(undefined);
                          setShowResetPassword(false);
                        }}
                        className="w-9 h-9 rounded-lg flex items-center justify-center border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-amber-500 hover:text-amber-500 transition-all"
                        title="Restablecer contraseña"
                      >
                        <IconKey className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal(user)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-red-500 hover:text-red-500 transition-all"
                        title="Borrar usuario"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ======== EDIT MODAL ======== */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
              <h3 className="text-lg font-bold">Editar usuario</h3>
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setEditErrors({});
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                handleSaveEdit();
              }}
            >
              <div className="p-6 space-y-4">
                {editFields.map(({ key, label, type = "text", inputMode, required }) => {
                  const error = editErrors[key];
                  const inputId = `edit-${key}`;
                  const errorId = `${inputId}-error`;

                  return (
                    <div key={key}>
                      <label htmlFor={inputId} className={labelClass}>
                        {label}{required ? " *" : ""}
                      </label>
                      <input
                        id={inputId}
                        type={type}
                        inputMode={inputMode}
                        required={required}
                        value={editForm[key]}
                        onChange={(event) => changeEditField(key, event.target.value)}
                        onBlur={() => blurEditField(key)}
                        className={validatedInputClass(error)}
                        autoComplete={
                          key === "email"
                            ? "email"
                            : key === "telefono"
                              ? "tel"
                              : key === "nombre"
                                ? "name"
                                : undefined
                        }
                        maxLength={
                          key === "cuit" ? 13 : key === "dni" ? 8 : undefined
                        }
                        aria-invalid={!!error}
                        aria-describedby={error ? errorId : undefined}
                      />
                      {error && (
                        <p id={errorId} className="mt-1 text-xs text-red-500 dark:text-red-400">
                          {error}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setEditErrors({});
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-zinc-950 shadow-sm shadow-amber-500/20 hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  <IconCheck className="w-4 h-4" />
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======== MODAL PARA RESTABLECER LA CONTRASEÑA ======== */}
      {resetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
              <h3 className="text-lg font-bold">Restablecer contraseña</h3>
              <button
                type="button"
                onClick={() => {
                  setResetModal(null);
                  setNewPassword("");
                  setResetPasswordError(undefined);
                  setShowResetPassword(false);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                handleResetPassword();
              }}
            >
              <div className="p-6 space-y-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Nueva contraseña para <span className="font-semibold text-zinc-900 dark:text-white">{resetModal.nombre}</span>
                </p>
                <div>
                  <label htmlFor="reset-password" className="sr-only">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="reset-password"
                      type={showResetPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(event.target.value);
                        if (resetPasswordError) setResetPasswordError(undefined);
                      }}
                      onBlur={() => setResetPasswordError(validatePassword(newPassword))}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      className={`${validatedInputClass(resetPasswordError)} !pr-11`}
                      aria-invalid={!!resetPasswordError}
                      aria-describedby={resetPasswordError ? "reset-password-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword((visible) => !visible)}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500/50 transition-colors"
                      aria-label={showResetPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-pressed={showResetPassword}
                      title={showResetPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showResetPassword ? (
                        <IconEyeOff className="w-5 h-5" />
                      ) : (
                        <IconEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {resetPasswordError && (
                    <p id="reset-password-error" className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {resetPasswordError}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setResetModal(null);
                    setNewPassword("");
                    setResetPasswordError(undefined);
                    setShowResetPassword(false);
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-zinc-950 shadow-sm shadow-amber-500/20 hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  <IconKey className="w-4 h-4" />
                  {resetting ? "Restableciendo..." : "Restablecer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======== DELETE MODAL ======== */}
      {deleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteModal(null)}
          />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <IconTrash className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Borrar usuario</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              ¿Estás seguro de que quieres borrar al usuario <span className="font-semibold text-zinc-900 dark:text-white">{deleteModal.nombre}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
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
                onClick={handleDeleteUser}
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
