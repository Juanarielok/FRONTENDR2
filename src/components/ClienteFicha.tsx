// Ficha del cliente con edición en línea, compartida entre el detalle y la pantalla principal.
import { useState } from "react";
import { api } from "../api";
import type { Cliente } from "../api";
import { IconPencil, IconTrash, IconCheck, IconX } from "./icons";
import {
  formatCuit,
  onlyDigits,
  validateCuit,
  validateDni,
  validateEmail,
  validateLocation,
  validatePhone,
  validateRequired,
} from "../utils/validation";

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
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-500/30",
    label: "Visitado",
  },
};

function getStatusLabel(status?: string) {
  if (!status) return "-";
  return statusConfig[status as keyof typeof statusConfig]?.label || status;
}

type ClienteFichaProps = {
  cliente: Cliente;
  /** Comienza directamente en modo edición (p. ej., al editar desde la pantalla principal). */
  startInEdit?: boolean;
  /** Llamado con el cliente actualizado tras guardar con éxito. */
  onSaved?: (cliente: Cliente) => void;
  /** Llamado al cancelar la edición (además de volver a modo lectura). */
  onCancelEdit?: () => void;
  /** Si se provee, muestra el botón Borrar en modo lectura. */
  onDelete?: () => void;
  deleting?: boolean;
};

export function ClienteFicha({
  cliente,
  startInEdit = false,
  onSaved,
  onCancelEdit,
  onDelete,
  deleting = false,
}: ClienteFichaProps) {
  const [editando, setEditando] = useState(startInEdit);
  const [formEdit, setFormEdit] = useState<Record<string, string>>(() =>
    startInEdit ? buildForm(cliente) : {}
  );
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  function buildForm(c: Cliente): Record<string, string> {
    return {
      nombre: c.nombre || "",
      razonSocial: c.razonSocial || "",
      email: c.email || "",
      telefono: c.telefono || "",
      dni: c.dni || "",
      cuit: c.cuit || "",
      localidad: (c as any).localidad || "",
      ubicacion: c.ubicacion || "",
      tipoComercio: c.tipoComercio || "",
      notas: c.notas || "",
      status: c.status || "disponible",
    };
  }

  function startEdit() {
    setFormEdit(buildForm(cliente));
    setEditError(null);
    setEditando(true);
  }

  function cancelEdit() {
    setEditando(false);
    setEditError(null);
    onCancelEdit?.();
  }

  function setEditField(key: string, value: string) {
    const nextValue =
      key === "cuit"
        ? formatCuit(value)
        : key === "dni"
          ? onlyDigits(value).slice(0, 8)
          : value;
    setFormEdit((prev) => ({ ...prev, [key]: nextValue }));
  }

  // Solo se validan los campos modificados, para no bloquear fichas con datos antiguos
  function validateEdit(): string | undefined {
    const original = buildForm(cliente);
    const validators: Record<string, (value: string) => string | undefined> = {
      nombre: (v) => validateRequired(v, "Nombre"),
      email: (v) => validateEmail(v),
      telefono: (v) => validatePhone(v),
      dni: (v) => validateDni(v),
      cuit: (v) => {
        const error = validateCuit(v);
        return error?.startsWith("Formato") ? `CUIT inválido. ${error}` : error;
      },
      ubicacion: (v) => validateLocation(v),
      localidad: (v) => validateRequired(v, "Localidad"),
    };
    for (const [key, validator] of Object.entries(validators)) {
      const value = formEdit[key] ?? "";
      if (value.trim() === original[key].trim()) continue;
      const error = validator(value);
      if (error) return error;
    }
    return undefined;
  }

  async function saveEdit() {
    const validationError = validateEdit();
    if (validationError) {
      setEditError(validationError);
      return;
    }

    setSavingEdit(true);
    setEditError(null);
    try {
      const payload: Record<string, string> = {};
      for (const [key, value] of Object.entries(formEdit)) {
        payload[key] = value.trim();
      }
      if (payload.status === (cliente.status || "disponible")) delete payload.status;
      const updated: any = await api.updateUser(cliente.id, payload);
      const user = (updated.user ?? updated) as Cliente;
      setEditando(false);
      onSaved?.(user);
    } catch (e: any) {
      console.error("Error al guardar el cliente:", e);
      setEditError(e?.message || "Error al guardar los cambios");
    } finally {
      setSavingEdit(false);
    }
  }

  const status = cliente.status || "disponible";
  const statusStyle =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.disponible;

  // [etiqueta, valor, clave editable (null = solo lectura)]
  const filasCliente: [string, string, string | null][] = [
    ["Nombre", cliente.nombre || "-", "nombre"],
    ["Razón social", cliente.razonSocial || "-", "razonSocial"],
    ["Estado", getStatusLabel(cliente.status), "status"],
    ["Email", cliente.email || "-", "email"],
    ["Teléfono", cliente.telefono || "-", "telefono"],
    ["DNI", cliente.dni || "-", "dni"],
    ["CUIT/CUIL", cliente.cuit || "-", "cuit"],
    ["Localidad", (cliente as any).localidad || "-", "localidad"],
    ["Ubicación", cliente.ubicacion || "-", "ubicacion"],
    ["Tipo de comercio", cliente.tipoComercio || "-", "tipoComercio"],
    ["Usuario", (cliente as any).usuario || "-", null],
    ["Código de área", (cliente as any).codigoArea || "-", null],
    ["Notas", cliente.notas || "-", "notas"],
  ];

  return (
    <div className="rounded-xl overflow-hidden bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm shadow-zinc-900/5">
      <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {(cliente as any).foto ? (
              <img
                src={(cliente as any).foto}
                alt={cliente.nombre}
                className="w-full h-full object-cover"
              />
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
            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
              {cliente.razonSocial}
            </p>
            <div className="mt-2">
              <span
                className={`inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                {statusStyle.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <table
            className="w-full border-collapse table-fixed"
            style={{ fontSize: "12px", lineHeight: "14px" }}
          >
            <tbody>
              {filasCliente.map(([label, value, fieldKey], index) => {
                const rowColor =
                  index % 2 === 0
                    ? "bg-white dark:bg-zinc-900/30"
                    : "bg-zinc-50/70 dark:bg-zinc-900/50";
                const enEdicion = editando && fieldKey !== null;
                const inputClass =
                  "w-full rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-[12px] text-zinc-900 dark:text-white outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";

                return (
                  <tr
                    key={label}
                    className={`${enEdicion ? "" : "h-11 sm:h-9"} border-b border-zinc-200 dark:border-zinc-800 ${rowColor}`}
                  >
                    <td className="align-middle h-11 sm:h-9 px-2 py-0 w-[34%] border-r border-zinc-200 dark:border-zinc-800 font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400 whitespace-normal break-words">
                      {label}
                    </td>
                    <td
                      className={`align-middle h-11 sm:h-9 px-2 ${enEdicion ? "py-1" : "py-0"} w-[66%] whitespace-normal break-words ${
                        label === "Estado"
                          ? `${statusStyle.bg} ${statusStyle.text} font-semibold uppercase`
                          : "text-zinc-900 dark:text-white"
                      }`}
                    >
                      {enEdicion && fieldKey ? (
                        fieldKey === "notas" ? (
                          <textarea
                            value={formEdit[fieldKey] ?? ""}
                            onChange={(e) => setEditField(fieldKey, e.target.value)}
                            rows={2}
                            className={`${inputClass} resize-none`}
                          />
                        ) : fieldKey === "status" ? (
                          <select
                            value={formEdit.status ?? "disponible"}
                            onChange={(e) => setEditField("status", e.target.value)}
                            className={inputClass}
                          >
                            <option value="disponible">Disponible</option>
                            {/* "Asignado" solo se obtiene asignando un chofer */}
                            {status === "asignado" && <option value="asignado">Asignado</option>}
                            <option value="visitado">Visitado</option>
                          </select>
                        ) : (
                          <input
                            type={fieldKey === "email" ? "email" : "text"}
                            value={formEdit[fieldKey] ?? ""}
                            onChange={(e) => setEditField(fieldKey, e.target.value)}
                            placeholder={
                              fieldKey === "localidad"
                                ? "Localidad, provincia, país"
                                : undefined
                            }
                            className={inputClass}
                          />
                        )
                      ) : (
                        value
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 sm:p-6 border-t border-zinc-200 dark:border-zinc-800">
        {editando && editError && (
          <p className="mb-3 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
            <span>⚠</span> {editError}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          {editando ? (
            <>
              <button
                type="button"
                onClick={saveEdit}
                disabled={savingEdit}
                className="min-h-11 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
                         bg-amber-500 text-zinc-950 font-semibold shadow-sm shadow-amber-500/20
                         hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.99] transition-all
                         disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <IconCheck className="w-4 h-4" />
                {savingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={savingEdit}
                className="min-h-11 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold transition-colors
                         bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400
                         hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconX className="w-4 h-4" />
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={startEdit}
                className="min-h-11 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
                         bg-amber-500 text-zinc-950 font-semibold shadow-sm shadow-amber-500/20
                         hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.99] transition-all"
              >
                <IconPencil className="w-4 h-4" />
                Editar cliente
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                  className="min-h-11 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold transition-colors
                           bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400
                           hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IconTrash className="w-4 h-4" />
                  {deleting ? "Borrando..." : "Borrar"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
