import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Cliente } from "../api";
import { ThemeToggle } from "../components/ThemeToggle";

type User = Omit<Cliente, "role"> & { role: string };

// ============ ICONS ============

function IconArrowLeft({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function IconUserPlus({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function IconUsers({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconEdit({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconKey({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function IconX({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconCheck({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconSearch({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

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
  razonSocial: "",
  tipoComercio: "",
  notas: "",
};

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("crear");

  // Create user state
  const [form, setForm] = useState({ ...emptyForm });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [choferes, setChoferes] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [resetModal, setResetModal] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

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
      setFeedback({ type: "err", text: "Error cargando usuarios" });
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    try {
      await api.createCliente({ ...form });
      setCreateMsg({ type: "ok", text: `Usuario "${form.nombre}" creado exitosamente` });
      setForm({ ...emptyForm });
    } catch (err: any) {
      setCreateMsg({ type: "err", text: err.message || "Error creando usuario" });
    } finally {
      setCreating(false);
    }
  }

  function startEdit(user: User) {
    setEditingUser(user);
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
    if (!editingUser) return;
    setSaving(true);
    try {
      await api.updateUser(editingUser.id, editForm);
      setFeedback({ type: "ok", text: `"${editForm.nombre}" actualizado` });
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      setFeedback({ type: "err", text: err.message || "Error actualizando" });
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!resetModal || !newPassword) return;
    setResetting(true);
    try {
      await api.resetPassword(resetModal.id, newPassword);
      setFeedback({ type: "ok", text: `Contrasena de "${resetModal.nombre}" reseteada` });
      setResetModal(null);
      setNewPassword("");
    } catch (err: any) {
      setFeedback({ type: "err", text: err.message || "Error reseteando contrasena" });
    } finally {
      setResetting(false);
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
    { key: "crear", label: "Crear Usuario", icon: <IconUserPlus className="w-4 h-4" /> },
    { key: "gestion", label: "Gestion de Usuarios", icon: <IconUsers className="w-4 h-4" /> },
  ];

  const inputClass =
    "w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors";

  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/monitoreo")}
                className="w-10 h-10 flex items-center justify-center border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all"
              >
                <IconArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Gestion</h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  Administracion de usuarios
                </p>
              </div>
            </div>
            <ThemeToggle />
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
            className={`mb-6 px-4 py-3 border text-sm flex items-center justify-between ${
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold">Crear Usuario</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Registrar un nuevo chofer o cliente en el sistema
              </p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              {/* Role selector */}
              <div>
                <label className={labelClass}>Rol</label>
                <div className="flex gap-2">
                  {(["chofer", "cliente"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm({ ...form, role: r })}
                      className={`px-4 py-2 text-sm font-medium border transition-all ${
                        form.role === r
                          ? "bg-amber-500 border-amber-500 text-white"
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
                  <label className={labelClass}>Nombre *</label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className={inputClass}
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputClass}
                    placeholder="usuario@email.com"
                  />
                </div>
                <div>
                  <label className={labelClass}>Contrasena *</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={inputClass}
                    placeholder="Contrasena inicial"
                  />
                </div>
                <div>
                  <label className={labelClass}>Telefono</label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className={inputClass}
                    placeholder="+54 11 5555-0000"
                  />
                </div>
                <div>
                  <label className={labelClass}>DNI</label>
                  <input
                    type="text"
                    value={form.dni}
                    onChange={(e) => setForm({ ...form, dni: e.target.value })}
                    className={inputClass}
                    placeholder="12345678"
                  />
                </div>
                <div>
                  <label className={labelClass}>CUIT</label>
                  <input
                    type="text"
                    value={form.cuit}
                    onChange={(e) => setForm({ ...form, cuit: e.target.value })}
                    className={inputClass}
                    placeholder="20-12345678-9"
                  />
                </div>
              </div>

              {/* Client-specific fields */}
              {form.role === "cliente" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div>
                    <label className={labelClass}>Ubicacion</label>
                    <input
                      type="text"
                      value={form.ubicacion}
                      onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                      className={inputClass}
                      placeholder="-34.6037,-58.3816"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Razon Social</label>
                    <input
                      type="text"
                      value={form.razonSocial}
                      onChange={(e) => setForm({ ...form, razonSocial: e.target.value })}
                      className={inputClass}
                      placeholder="Empresa SRL"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tipo de Comercio</label>
                    <input
                      type="text"
                      value={form.tipoComercio}
                      onChange={(e) => setForm({ ...form, tipoComercio: e.target.value })}
                      className={inputClass}
                      placeholder="Panaderia, Kiosco, etc."
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Notas</label>
                    <input
                      type="text"
                      value={form.notas}
                      onChange={(e) => setForm({ ...form, notas: e.target.value })}
                      className={inputClass}
                      placeholder="Observaciones"
                    />
                  </div>
                </div>
              )}

              {/* Create message */}
              {createMsg && (
                <div
                  className={`px-4 py-3 border text-sm ${
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
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold uppercase tracking-wider bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {creating ? "Creando..." : "Crear Usuario"}
              </button>
            </form>
          </div>
        )}

        {/* ======== GESTION DE USUARIOS ======== */}
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
              <div className="border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
                {filtered.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white dark:bg-zinc-900 px-6 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{user.nombre}</span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            user.role === "chofer"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700"
                              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                          }`}
                        >
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
                        className="w-9 h-9 flex items-center justify-center border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-amber-500 hover:text-amber-500 transition-all"
                        title="Editar"
                      >
                        <IconEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setResetModal(user);
                          setNewPassword("");
                        }}
                        className="w-9 h-9 flex items-center justify-center border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-amber-500 hover:text-amber-500 transition-all"
                        title="Resetear contrasena"
                      >
                        <IconKey className="w-4 h-4" />
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold">Editar Usuario</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(editForm).map(([key, val]) => (
                <div key={key}>
                  <label className={labelClass}>{key}</label>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                <IconCheck className="w-4 h-4" />
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== RESET PASSWORD MODAL ======== */}
      {resetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold">Resetear Contrasena</h3>
              <button
                onClick={() => setResetModal(null)}
                className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Nueva contrasena para <span className="font-semibold text-zinc-900 dark:text-white">{resetModal.nombre}</span>
              </p>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contrasena"
                className={inputClass}
              />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setResetModal(null)}
                className="px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetting || !newPassword}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                <IconKey className="w-4 h-4" />
                {resetting ? "Reseteando..." : "Resetear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
