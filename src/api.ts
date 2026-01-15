const API_URL = import.meta.env.VITE_API_URL as string;

function getToken() {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  return (await res.json()) as T;
}

export const api = {
  login(email: string, password: string) {
    return request<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then((data) => {
      localStorage.setItem("token", (data as any).token);
      return data;
    });
  },

  listClientes() {
    return request<any[]>(`/users/role/cliente`, { method: "GET" });
  },

  createCliente(payload: any) {
    return request<{ message: string; user: any }>(`/users`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateUser(id: string, payload: any) {
    return request<any>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};
