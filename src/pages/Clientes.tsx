import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

type Cliente = {
  id: string;
  email: string;
  role: "cliente";
  nombre: string;
  dni: string;
  cuit: string;
  telefono: string;
  ubicacion: string;
  razonSocial: string;
  tipoComercio: string;
  notas: string;
  foto?: string; // URL o Base64
};

type FormState = {
  email: string;
  password: string; // requerido al crear, opcional al editar
  nombre: string;
  dni: string;
  cuit: string;
  telefono: string;
  ubicacion: string;
  razonSocial: string;
  tipoComercio: string;
  notas: string;
  fotoUrl: string;
  fotoFile: File | null;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("No se pudo leer el archivo"));
    r.readAsDataURL(file);
  });
}

function formatCUIT(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11); // máximo 11 dígitos
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
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email inválido";

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

  // ✅ SOLO CAMBIO: CUIT con formato XX-XXXXXXXX-X
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

  if (!form.razonSocial.trim()) errors.razonSocial = "Razón social requerida";
  if (!form.tipoComercio.trim()) errors.tipoComercio = "Tipo de comercio requerido";

  if (form.fotoFile) {
    const okType = ["image/png", "image/jpeg"].includes(form.fotoFile.type);
    if (!okType) errors.fotoFile = "Solo PNG o JPG";
    const maxMB = 3;
    if (form.fotoFile.size > maxMB * 1024 * 1024) errors.fotoFile = `Máximo ${maxMB}MB`;
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
  razonSocial: "",
  tipoComercio: "",
  notas: "",
  fotoUrl: "",
  fotoFile: null,
};

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.83H5v-.92l8.06-8.06.92.92L5.92 20.08zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Clientes() {
  const nav = useNavigate();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const cantidadSeleccionados = useMemo(() => seleccionados.size, [seleccionados]);

  async function cargarClientes() {
    const data: any = await api.listClientes();

    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.users)
      ? data.users
      : Array.isArray(data?.data)
      ? data.data
      : [];

    setClientes(list);
  }

  useEffect(() => {
    cargarClientes().catch((e) => {
      console.error(e);
      localStorage.removeItem("token");
      nav("/login", { replace: true });
    });
  }, []);

  function logout() {
    localStorage.removeItem("token");
    nav("/login", { replace: true });
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSeleccion(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    // 👇 Para “enviar selección al backend” necesitás un endpoint real (no está en tu Swagger).
    // Lo correcto suele ser enviar los IDs cuando apretás “ASIGNAR CLIENTES A CHOFER”.
  }

  function loadToEdit(c: Cliente) {
    setEditingId(c.id);
    setForm({
      email: c.email,
      password: "", // no se trae password de la BD
      nombre: c.nombre,
      dni: c.dni,
      cuit: c.cuit,
      telefono: c.telefono,
      ubicacion: c.ubicacion,
      razonSocial: c.razonSocial,
      tipoComercio: c.tipoComercio,
      notas: c.notas,
      fotoUrl: c.foto?.startsWith("http") ? c.foto : "",
      fotoFile: null,
    });
    setErrors({});
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

    let fotoFinal: string | undefined = undefined;
    if (form.fotoFile) fotoFinal = await readFileAsDataURL(form.fotoFile); // Base64
    else if (form.fotoUrl.trim()) fotoFinal = form.fotoUrl.trim(); // URL

    const payload: any = {
      email: form.email.trim(),
      password: form.password, // requerido al crear
      role: "cliente",
      nombre: form.nombre.trim(),
      dni: onlyDigits(form.dni),
      cuit: form.cuit.trim(), // ✅ se manda con guiones
      telefono: form.telefono.trim(),
      ubicacion: form.ubicacion.trim(),
      razonSocial: form.razonSocial.trim(),
      tipoComercio: form.tipoComercio.trim(),
      notas: form.notas.trim(),
      foto: fotoFinal,
    };

    try {
      if (editingId) {
        // si no escribió password, no lo mandamos
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
    }
  }

  function asignarClientes() {
    // 👇 Esto es lo que tenés que mandar al backend cuando exista el endpoint de asignación
    const ids = Array.from(seleccionados);
    alert(`IDs seleccionados:\n${ids.join("\n")}`);

    // Ejemplo futuro (cuando lo tengas):
    // POST /assignments  { choferId, clientIds: ids }
  }

  return (
    <div
      className={`${
        showAdvanced ? "min-h-screen overflow-auto" : "h-screen overflow-hidden"
      } bg-white text-black font-lit`}
    >
      <div className="mx-auto max-w-6xl px-5 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Control de clientes</h1>
            <p className="mt-1 text-sm text-black/70">
              Crear, editar y seleccionar para asignar a un chofer.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="border border-black px-3 py-2 text-xs font-semibold hover:bg-black hover:text-white"
            >
              {showAdvanced ? "OCULTAR AVANZADO" : "MOSTRAR AVANZADO"}
            </button>

            <button
              onClick={logout}
              className="border border-black px-3 py-2 text-xs font-semibold hover:bg-black hover:text-white"
            >
              SALIR
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {/* FORM */}
          <div className="border border-black/20 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                {editingId ? "Editar cliente" : "Crear cliente"}
              </h2>
              {editingId ? (
                <button
                  onClick={cancelarEdicion}
                  className="border border-black px-3 py-2 text-xs font-semibold hover:bg-black hover:text-white"
                >
                  CANCELAR
                </button>
              ) : null}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <label className="font-semibold">Email *</label>
                <input
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  className="mt-1 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                  placeholder="cliente@example.com"
                />
                {errors.email ? (
                  <p className="mt-1 text-xs text-black/70">⚠ {errors.email}</p>
                ) : null}
              </div>

              <div className="col-span-2">
                <label className="font-semibold">
                  Password {editingId ? "(opcional)" : "*"}{" "}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  className="mt-1 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                  placeholder={editingId ? "dejar vacío para no cambiar" : "mínimo 8 caracteres"}
                />
                {errors.password ? (
                  <p className="mt-1 text-xs text-black/70">⚠ {errors.password}</p>
                ) : null}
              </div>

              <div className="col-span-2">
                <label className="font-semibold">Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setField("nombre", e.target.value)}
                  className="mt-1 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                  placeholder="Juan Pérez"
                />
                {errors.nombre ? (
                  <p className="mt-1 text-xs text-black/70">⚠ {errors.nombre}</p>
                ) : null}
              </div>

              <div>
                <label className="font-semibold">DNI *</label>
                <input
                  value={form.dni}
                  onChange={(e) => setField("dni", e.target.value)}
                  className="mt-1 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                  placeholder="12345678"
                  inputMode="numeric"
                />
                {errors.dni ? (
                  <p className="mt-1 text-xs text-black/70">⚠ {errors.dni}</p>
                ) : null}
              </div>

              <div>
                <label className="font-semibold">CUIT/CUIL *</label>
                <input
                  value={form.cuit}
                  onChange={(e) => setField("cuit", formatCUIT(e.target.value))} // ✅ auto-formatea
                  className="mt-1 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                  placeholder="27-12345678-9"
                  inputMode="numeric"
                />
                {errors.cuit ? (
                  <p className="mt-1 text-xs text-black/70">⚠ {errors.cuit}</p>
                ) : null}
              </div>

              <div>
                <label className="font-semibold">Teléfono *</label>
                <input
                  value={form.telefono}
                  onChange={(e) => setField("telefono", e.target.value)}
                  className="mt-1 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                  placeholder="+54 11 1234-5678"
                />
                {errors.telefono ? (
                  <p className="mt-1 text-xs text-black/70">⚠ {errors.telefono}</p>
                ) : null}
              </div>

              <div>
                <label className="font-semibold">Ubicación *</label>
                <input
                  value={form.ubicacion}
                  onChange={(e) => setField("ubicacion", e.target.value)}
                  className="mt-1 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                  placeholder="Buenos Aires, Argentina"
                />
                {errors.ubicacion ? (
                  <p className="mt-1 text-xs text-black/70">⚠ {errors.ubicacion}</p>
                ) : null}
              </div>

              {showAdvanced ? (
                <>
                  <div>
                    <label className="font-semibold">Razón social *</label>
                    <input
                      value={form.razonSocial}
                      onChange={(e) => setField("razonSocial", e.target.value)}
                      className="mt-1 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                      placeholder="Empresa S.A."
                    />
                    {errors.razonSocial ? (
                      <p className="mt-1 text-xs text-black/70">⚠ {errors.razonSocial}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="font-semibold">Tipo comercio *</label>
                    <input
                      value={form.tipoComercio}
                      onChange={(e) => setField("tipoComercio", e.target.value)}
                      className="mt-1 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                      placeholder="Mayorista"
                    />
                    {errors.tipoComercio ? (
                      <p className="mt-1 text-xs text-black/70">⚠ {errors.tipoComercio}</p>
                    ) : null}
                  </div>

                  <div className="col-span-2">
                    <label className="font-semibold">Notas</label>
                    <textarea
                      value={form.notas}
                      onChange={(e) => setField("notas", e.target.value)}
                      className="mt-1 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                      rows={2}
                      placeholder="Cliente preferencial"
                    />
                  </div>

                  <div className="col-span-2 border border-black/10 p-3">
                    <p className="text-sm font-semibold">Foto (opcional)</p>

                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs font-semibold">URL</label>
                        <input
                          value={form.fotoUrl}
                          onChange={(e) => setField("fotoUrl", e.target.value)}
                          className="mt-1 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                          placeholder="https://..."
                        />
                        {errors.fotoUrl ? (
                          <p className="mt-1 text-xs text-black/70">⚠ {errors.fotoUrl}</p>
                        ) : null}
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs font-semibold">Archivo (PNG/JPG)</label>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={(e) => setField("fotoFile", e.target.files?.[0] ?? null)}
                          className="mt-1 w-full border border-black/20 px-3 py-2"
                        />
                        {errors.fotoFile ? (
                          <p className="mt-1 text-xs text-black/70">⚠ {errors.fotoFile}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <button
              onClick={submit}
              className="mt-3 w-full border border-black bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              {editingId ? "GUARDAR CAMBIOS (BACKEND)" : "CREAR CLIENTE (BACKEND)"}
            </button>
          </div>

          {/* LISTA */}
          <div className="border border-black/20 bg-white p-4 flex flex-col">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Clientes</h2>
              <div className="border border-black/20 px-3 py-2 text-xs font-semibold">
                clientes seleccionados: <span className="font-black">{cantidadSeleccionados}</span>
              </div>
            </div>

            <div className="mt-3 flex-1 overflow-auto space-y-3 pr-1">
              {clientes.length === 0 ? (
                <div className="border border-dashed border-black/30 p-4 text-sm text-black/70">
                  Todavía no hay clientes en la DB.
                </div>
              ) : (
                clientes.map((c) => {
                  const checked = seleccionados.has(c.id);
                  return (
                    <div
                      key={c.id}
                      className={`border p-4 transition ${
                        checked ? "border-black bg-black/5" : "border-black/20 hover:border-black"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold">{c.nombre}</p>
                          <p className="text-xs text-black/70 break-all">{c.email}</p>
                          <p className="mt-1 text-xs text-black/70">{c.ubicacion}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadToEdit(c)}
                            className="border border-black px-2 py-2 hover:bg-black hover:text-white"
                            title="Editar"
                          >
                            <PencilIcon />
                          </button>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSeleccion(c.id)}
                            className="h-5 w-5"
                            title="Seleccionar"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={asignarClientes}
              disabled={cantidadSeleccionados === 0}
              className="mt-3 w-full border border-black bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-30"
            >
              ASIGNAR CLIENTES A CHOFER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
