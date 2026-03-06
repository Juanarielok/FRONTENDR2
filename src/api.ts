import { mockApi } from "./mocks/mockData";

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === "true";
const API_URL = "https://backend-redaceite-digitalocean-9nmhi.ondigitalocean.app";

function getToken() {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("CORS o backend caído");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  return await res.json();
}

export type Cliente = {
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
  foto?: string;
  status?: "disponible" | "asignado" | "visitado";
  createdAt?: string;
  updatedAt?: string;
};

export type Producto = {
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
};

export type Remito = {
  id: string;
  clienteId: string;
  choferId: string;
  fecha: string;
  productos: Producto[];
  subtotal: number;
  iva: number;
  total: number;
  notas?: string;
  chofer?: {
    id: string;
    nombre: string;
  };
};

export type LiveLocation = {
  choferId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  timestamp: string;
  updatedAt: string;
  stale: boolean;
  chofer: { id: string; nombre: string };
};

const realApi = {
  login(email: string, password: string) {
    return request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then((data) => {
      localStorage.setItem("token", data.token);
      return data;
    });
  },

  listClientes() {
    return request<{ count: number; users: Cliente[] }>("/users/role/cliente", {
      method: "GET",
    });
  },

  getCliente(id: string) {
    return request<{ user: Cliente }>(`/users/search?search=${id}`, {
      method: "GET",
    });
  },

  createCliente(payload: any) {
    return request<{ message: string; user: Cliente }>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateUser(id: string, payload: any) {
    return request<{ message: string; user: Cliente }>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // Remitos
  getRemitosByCliente(clienteId: string) {
    return request<{ count: number; remitos: Remito[] }>(`/remitos/cliente/${clienteId}`, {
      method: "GET",
    });
  },

  getRemito(id: string) {
    return request<{ remito: Remito }>(`/remitos/${id}`, {
      method: "GET",
    });
  },

  // Assignments
  assignClients(choferId: string, clientIds: string[]) {
    return request<{ message: string; count: number }>("/assignments", {
      method: "POST",
      body: JSON.stringify({ choferId, clientIds }),
    });
  },

  listChoferes() {
    return request<{ count: number; users: any[] }>("/users/role/chofer", {
      method: "GET",
    });
  },

  // Reset client status
  resetClientStatus(id: string) {
    return request<{ message: string }>(`/users/${id}/reset-status`, {
      method: "PATCH",
    });
  },

  // Monitoreo - Jornadas activas
  getJornadasActivas() {
    return request<{
      count: number;
      choferesActivos: {
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
      }[];
    }>("/jornadas/activas", {
      method: "GET",
    });
  },

  // Monitoreo - Historial de jornadas de un chofer
  getHistorialChofer(choferId: string, limite?: number) {
    const params = limite ? `?limite=${limite}` : "";
    return request<{
      chofer: { id: string; nombre: string };
      resumen: {
        totalJornadas: number;
        jornadasCompletadas: number;
        tiempoTotal: { minutos: number; formato: string };
      };
      jornadas: {
        id: string;
        checkIn: string;
        checkOut: string | null;
        ubicacionCheckIn: string;
        ubicacionCheckOut: string | null;
        notas: string;
        duracion: { minutos: number; formato: string } | null;
      }[];
    }>(`/jornadas/chofer/${choferId}${params}`, {
      method: "GET",
    });
  },

  // Obtener todos los remitos (para monitoreo)
  getAllRemitos() {
    return request<{ count: number; remitos: Remito[] }>("/remitos/me", {
      method: "GET",
    }).catch(() => ({ count: 0, remitos: [] })); // Fallback si no hay acceso
  },

  // Assignments
  getAllAssignments() {
    return request<{ assignments: Record<string, string[]> }>("/assignments", {
      method: "GET",
    });
  },

  // Reset password
  resetPassword(id: string, newPassword: string) {
    return request<{ message: string }>(`/users/${id}/reset-password`, {
      method: "PUT",
      body: JSON.stringify({ newPassword }),
    });
  },

  // Live locations
  getLiveLocations() {
    return request<{
      count: number;
      locations: LiveLocation[];
    }>("/locations/?active=true", { method: "GET" });
  },
};

export const api = DEV_BYPASS ? mockApi : realApi;