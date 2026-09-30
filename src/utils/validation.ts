const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CUIT_PATTERN = /^\d{2}-\d{8}-\d{1}$/;
const PHONE_PATTERN = /^[+0-9\s()-]{8,20}$/;
const LOCATION_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,#-]{3,}$/;

export const PASSWORD_MIN_LENGTH = 8;

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCuit(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  const prefix = digits.slice(0, 2);
  const document = digits.slice(2, 10);
  const verifier = digits.slice(10, 11);

  if (digits.length <= 2) return prefix;
  if (digits.length <= 10) return `${prefix}-${document}`;
  return `${prefix}-${document}-${verifier}`;
}

export function validateRequired(value: string, label: string) {
  return value.trim()
    ? undefined
    : `Completá el campo ${label.toLocaleLowerCase("es")}`;
}

export function validateEmail(value: string, required = true) {
  const normalized = value.trim();
  if (!normalized) return required ? "Email requerido" : undefined;
  if (!EMAIL_PATTERN.test(normalized)) return "Email inválido";
  return undefined;
}

export function validatePassword(value: string, required = true) {
  if (!value.trim()) return required ? "Contraseña requerida" : undefined;
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`;
  }
  return undefined;
}

export function validateDni(value: string, required = true) {
  const digits = onlyDigits(value);
  if (!digits) return required ? "DNI requerido" : undefined;
  if (!/^\d{8}$/.test(digits)) return "DNI: 8 dígitos";
  return undefined;
}

export function validateCuit(value: string, required = true) {
  const normalized = value.trim();
  if (!normalized) return required ? "CUIT/CUIL requerido" : undefined;
  if (!CUIT_PATTERN.test(normalized)) return "Formato: XX-XXXXXXXX-X";
  return undefined;
}

export function validatePhone(value: string, required = true) {
  const normalized = value.trim();
  if (!normalized) return required ? "Teléfono requerido" : undefined;
  if (!PHONE_PATTERN.test(normalized)) return "Teléfono inválido";
  return undefined;
}

export function validateLocation(value: string, required = true) {
  const normalized = value.trim();
  if (!normalized) return required ? "Ubicación requerida" : undefined;
  if (!LOCATION_PATTERN.test(normalized)) return "Ubicación inválida";
  return undefined;
}

export function validateHttpUrl(value: string) {
  const normalized = value.trim();
  if (!normalized) return undefined;

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Usá una URL http o https";
    }
  } catch {
    return "URL inválida";
  }

  return undefined;
}
