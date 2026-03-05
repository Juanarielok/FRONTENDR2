import type { Cliente, Remito } from "../api";

const choferes = [
  { id: "ch-1", email: "martin@demo.com", role: "chofer", nombre: "Martin Rodriguez", dni: "30456789", cuit: "20-30456789-1", telefono: "+54 11 5555-0001", ubicacion: "-34.6037,-58.3816" },
  { id: "ch-2", email: "lucas@demo.com", role: "chofer", nombre: "Lucas Fernandez", dni: "31567890", cuit: "20-31567890-2", telefono: "+54 11 5555-0002", ubicacion: "-34.5875,-58.4098" },
  { id: "ch-3", email: "carlos@demo.com", role: "chofer", nombre: "Carlos Gomez", dni: "29345678", cuit: "20-29345678-3", telefono: "+54 11 5555-0003", ubicacion: "-34.6158,-58.3733" },
  { id: "ch-4", email: "diego@demo.com", role: "chofer", nombre: "Diego Peralta", dni: "32678901", cuit: "20-32678901-4", telefono: "+54 223 555-0004", ubicacion: "-38.0055,-57.5426" },
  { id: "ch-5", email: "nicolas@demo.com", role: "chofer", nombre: "Nicolas Aguirre", dni: "33789012", cuit: "20-33789012-5", telefono: "+54 223 555-0005", ubicacion: "-37.9980,-57.5580" },
];

const clientes: Cliente[] = [
  { id: "cl-1", email: "panaderia@demo.com", role: "cliente", nombre: "Panaderia San Martin", dni: "20111222", cuit: "30-20111222-5", telefono: "+54 11 4444-1001", ubicacion: "-34.6083,-58.3712", razonSocial: "Panaderia San Martin SRL", tipoComercio: "Panaderia", notas: "Pedido semanal los lunes", status: "disponible", createdAt: "2025-11-01T10:00:00Z" },
  { id: "cl-2", email: "kiosco@demo.com", role: "cliente", nombre: "Kiosco La Esquina", dni: "20222333", cuit: "30-20222333-6", telefono: "+54 11 4444-1002", ubicacion: "-34.5950,-58.3930", razonSocial: "Kiosco La Esquina", tipoComercio: "Kiosco", notas: "", status: "asignado", createdAt: "2025-11-05T14:30:00Z" },
  { id: "cl-3", email: "almacen@demo.com", role: "cliente", nombre: "Almacen Don Pedro", dni: "20333444", cuit: "30-20333444-7", telefono: "+54 11 4444-1003", ubicacion: "-34.6200,-58.3650", razonSocial: "Almacen Don Pedro SA", tipoComercio: "Almacen", notas: "Requiere factura A", status: "visitado", createdAt: "2025-10-20T09:00:00Z" },
  { id: "cl-4", email: "restaurant@demo.com", role: "cliente", nombre: "Restaurante El Buen Sabor", dni: "20444555", cuit: "30-20444555-8", telefono: "+54 11 4444-1004", ubicacion: "-34.5800,-58.4200", razonSocial: "El Buen Sabor SRL", tipoComercio: "Restaurante", notas: "Horario de entrega: 8-10am", status: "disponible", createdAt: "2025-12-01T11:00:00Z" },
  { id: "cl-5", email: "super@demo.com", role: "cliente", nombre: "Supermercado Familiar", dni: "20555666", cuit: "30-20555666-9", telefono: "+54 11 4444-1005", ubicacion: "-34.6120,-58.4050", razonSocial: "Supermercado Familiar SA", tipoComercio: "Supermercado", notas: "Volumen alto", status: "asignado", createdAt: "2025-11-15T16:00:00Z" },
  { id: "cl-6", email: "bar@demo.com", role: "cliente", nombre: "Bar Los Amigos", dni: "20666777", cuit: "30-20666777-0", telefono: "+54 11 4444-1006", ubicacion: "-34.6300,-58.3800", razonSocial: "Bar Los Amigos", tipoComercio: "Bar", notas: "", status: "disponible", createdAt: "2025-12-10T08:00:00Z" },
  { id: "cl-7", email: "cafe@demo.com", role: "cliente", nombre: "Cafe Central", dni: "20777888", cuit: "30-20777888-1", telefono: "+54 11 4444-1007", ubicacion: "-34.6040,-58.3820", razonSocial: "Cafe Central SRL", tipoComercio: "Cafeteria", notas: "Solo efectivo", status: "visitado", createdAt: "2025-10-01T12:00:00Z" },
  { id: "cl-8", email: "verduleria@demo.com", role: "cliente", nombre: "Verduleria Fresca", dni: "20888999", cuit: "30-20888999-2", telefono: "+54 11 4444-1008", ubicacion: "-34.5970,-58.3750", razonSocial: "Verduleria Fresca", tipoComercio: "Verduleria", notas: "Entrega diaria", status: "asignado", createdAt: "2025-11-20T10:30:00Z" },
];

const remitos: Remito[] = [
  {
    id: "rem-1", clienteId: "cl-1", choferId: "ch-1", fecha: "2026-03-01T09:30:00Z",
    productos: [
      { nombre: "Harina 000 x 50kg", cantidad: 5, precio: 12000, subtotal: 60000 },
      { nombre: "Levadura x 500g", cantidad: 10, precio: 2500, subtotal: 25000 },
    ],
    subtotal: 85000, iva: 17850, total: 102850, notas: "Entrega en puerta lateral",
    chofer: { id: "ch-1", nombre: "Martin Rodriguez" },
  },
  {
    id: "rem-2", clienteId: "cl-2", choferId: "ch-1", fecha: "2026-03-01T11:00:00Z",
    productos: [
      { nombre: "Galletitas x 12u", cantidad: 20, precio: 1800, subtotal: 36000 },
      { nombre: "Gaseosa 2.25L x 6u", cantidad: 10, precio: 4500, subtotal: 45000 },
      { nombre: "Snacks surtidos x 24u", cantidad: 5, precio: 8000, subtotal: 40000 },
    ],
    subtotal: 121000, iva: 25410, total: 146410,
    chofer: { id: "ch-1", nombre: "Martin Rodriguez" },
  },
  {
    id: "rem-3", clienteId: "cl-3", choferId: "ch-2", fecha: "2026-02-28T14:00:00Z",
    productos: [
      { nombre: "Aceite girasol x 12u", cantidad: 8, precio: 6000, subtotal: 48000 },
      { nombre: "Arroz x 10kg", cantidad: 6, precio: 5500, subtotal: 33000 },
    ],
    subtotal: 81000, iva: 17010, total: 98010, notas: "Factura A",
    chofer: { id: "ch-2", nombre: "Lucas Fernandez" },
  },
  {
    id: "rem-4", clienteId: "cl-4", choferId: "ch-3", fecha: "2026-03-02T08:15:00Z",
    productos: [
      { nombre: "Carne vacuna x kg", cantidad: 30, precio: 8500, subtotal: 255000 },
      { nombre: "Pollo entero x kg", cantidad: 15, precio: 4200, subtotal: 63000 },
      { nombre: "Verduras surtidas x kg", cantidad: 20, precio: 2000, subtotal: 40000 },
    ],
    subtotal: 358000, iva: 75180, total: 433180,
    chofer: { id: "ch-3", nombre: "Carlos Gomez" },
  },
  {
    id: "rem-5", clienteId: "cl-5", choferId: "ch-2", fecha: "2026-03-03T10:00:00Z",
    productos: [
      { nombre: "Leche entera x 12u", cantidad: 15, precio: 3600, subtotal: 54000 },
      { nombre: "Yogur x 24u", cantidad: 10, precio: 5000, subtotal: 50000 },
      { nombre: "Queso cremoso x kg", cantidad: 8, precio: 7500, subtotal: 60000 },
    ],
    subtotal: 164000, iva: 34440, total: 198440,
    chofer: { id: "ch-2", nombre: "Lucas Fernandez" },
  },
];

const choferAssignments: Record<string, string[]> = {
  "ch-1": ["cl-1", "cl-2", "cl-7"],       // Martin: Panaderia, Kiosco, Cafe Central
  "ch-2": ["cl-3", "cl-5", "cl-8"],       // Lucas: Almacen, Supermercado, Verduleria
  "ch-3": ["cl-4", "cl-6"],               // Carlos: Restaurante, Bar
  "ch-4": [],                              // Diego: Mar del Plata (no CABA clients)
  "ch-5": [],                              // Nicolas: Mar del Plata
};

const now = new Date();
const jornadasActivas = [
  {
    id: "j-1",
    chofer: { id: "ch-1", nombre: "Martin Rodriguez", telefono: "+54 11 5555-0001" },
    checkIn: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    ubicacionCheckIn: "-34.6037,-58.3816",
    tiempoTranscurrido: { minutos: 180, formato: "3h 0m" },
  },
  {
    id: "j-2",
    chofer: { id: "ch-2", nombre: "Lucas Fernandez", telefono: "+54 11 5555-0002" },
    checkIn: new Date(now.getTime() - 5.5 * 60 * 60 * 1000).toISOString(),
    ubicacionCheckIn: "-34.5875,-58.4098",
    tiempoTranscurrido: { minutos: 330, formato: "5h 30m" },
  },
  {
    id: "j-3",
    chofer: { id: "ch-4", nombre: "Diego Peralta", telefono: "+54 223 555-0004" },
    checkIn: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    ubicacionCheckIn: "-38.0055,-57.5426",
    tiempoTranscurrido: { minutos: 120, formato: "2h 0m" },
  },
];

// Simulated live routes for active choferes
const choferRoutes: Record<string, [number, number][]> = {
  "ch-1": [ // Martin - CABA route: Microcentro → San Telmo → Puerto Madero loop
    [-34.6037, -58.3816], [-34.6050, -58.3800], [-34.6070, -58.3780],
    [-34.6100, -58.3750], [-34.6130, -58.3730], [-34.6158, -58.3733],
    [-34.6140, -58.3700], [-34.6100, -58.3690], [-34.6060, -58.3700],
    [-34.6040, -58.3720], [-34.6037, -58.3760], [-34.6037, -58.3816],
  ],
  "ch-2": [ // Lucas - CABA route: Palermo → Recoleta → Belgrano loop
    [-34.5875, -58.4098], [-34.5860, -58.4050], [-34.5840, -58.4000],
    [-34.5870, -58.3970], [-34.5920, -58.3940], [-34.5950, -58.3930],
    [-34.5900, -58.3960], [-34.5830, -58.4020], [-34.5780, -58.4100],
    [-34.5730, -58.4200], [-34.5700, -58.4300], [-34.5750, -58.4200],
    [-34.5800, -58.4150], [-34.5875, -58.4098],
  ],
  "ch-4": [ // Diego - Mar del Plata route: Centro → Puerto → La Perla loop
    [-38.0055, -57.5426], [-38.0080, -57.5400], [-38.0120, -57.5370],
    [-38.0180, -57.5320], [-38.0230, -57.5290], [-38.0280, -57.5290],
    [-38.0230, -57.5270], [-38.0180, -57.5260], [-38.0150, -57.5250],
    [-38.0100, -57.5300], [-38.0070, -57.5370], [-38.0055, -57.5426],
  ],
};

const routeProgress: Record<string, number> = {};

function getLivePositions() {
  const positions = [];
  for (const jornada of jornadasActivas) {
    const choferId = jornada.chofer.id;
    const route = choferRoutes[choferId];
    if (!route) continue;

    if (!(choferId in routeProgress)) routeProgress[choferId] = Math.random() * route.length;
    routeProgress[choferId] = (routeProgress[choferId] + 0.3 + Math.random() * 0.2) % route.length;

    const idx = Math.floor(routeProgress[choferId]);
    const frac = routeProgress[choferId] - idx;
    const from = route[idx];
    const to = route[(idx + 1) % route.length];
    const lat = from[0] + (to[0] - from[0]) * frac;
    const lng = from[1] + (to[1] - from[1]) * frac;

    positions.push({
      choferId,
      nombre: jornada.chofer.nombre,
      lat,
      lng,
      speed: Math.round(20 + Math.random() * 40),
      heading: Math.round(Math.atan2(to[1] - from[1], to[0] - from[0]) * 180 / Math.PI),
      timestamp: new Date().toISOString(),
    });
  }
  return positions;
}

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

export const mockApi = {
  async login(_email: string, _password: string) {
    await delay();
    const data = { token: "mock-token-dev", user: { id: "admin-1", email: "admin@demo.com", role: "admin", nombre: "Admin Demo" } };
    localStorage.setItem("token", data.token);
    return data;
  },

  async listClientes() {
    await delay();
    return { count: clientes.length, users: clientes };
  },

  async getCliente(id: string) {
    await delay();
    const user = clientes.find((c) => c.id === id) || clientes[0];
    return { user };
  },

  async createCliente(payload: any) {
    await delay();
    const newCliente: Cliente = {
      id: `cl-${Date.now()}`,
      email: payload.email || "",
      role: "cliente",
      nombre: payload.nombre || "",
      dni: payload.dni || "",
      cuit: payload.cuit || "",
      telefono: payload.telefono || "",
      ubicacion: payload.ubicacion || "",
      razonSocial: payload.razonSocial || "",
      tipoComercio: payload.tipoComercio || "",
      notas: payload.notas || "",
      status: "disponible",
      createdAt: new Date().toISOString(),
    };
    clientes.push(newCliente);
    return { message: "Cliente creado", user: newCliente };
  },

  async updateUser(id: string, payload: any) {
    await delay();
    const idx = clientes.findIndex((c) => c.id === id);
    if (idx >= 0) Object.assign(clientes[idx], payload);
    return { message: "Usuario actualizado", user: idx >= 0 ? clientes[idx] : clientes[0] };
  },

  async getRemitosByCliente(clienteId: string) {
    await delay();
    const filtered = remitos.filter((r) => r.clienteId === clienteId);
    return { count: filtered.length, remitos: filtered };
  },

  async getRemito(id: string) {
    await delay();
    const remito = remitos.find((r) => r.id === id) || remitos[0];
    return { remito };
  },

  async assignClients(_choferId: string, clientIds: string[]) {
    await delay();
    for (const cid of clientIds) {
      const c = clientes.find((cl) => cl.id === cid);
      if (c) c.status = "asignado";
    }
    return { message: "Clientes asignados", count: clientIds.length };
  },

  async listChoferes() {
    await delay();
    return { count: choferes.length, users: choferes };
  },

  async resetClientStatus(id: string) {
    await delay();
    const c = clientes.find((cl) => cl.id === id);
    if (c) c.status = "disponible";
    return { message: "Status reseteado" };
  },

  async getJornadasActivas() {
    await delay();
    return { count: jornadasActivas.length, choferesActivos: jornadasActivas };
  },

  async getHistorialChofer(choferId: string, _limite?: number) {
    await delay();
    const chofer = choferes.find((c) => c.id === choferId) || choferes[0];
    return {
      chofer: { id: chofer.id, nombre: chofer.nombre },
      resumen: {
        totalJornadas: 12,
        jornadasCompletadas: 10,
        tiempoTotal: { minutos: 4800, formato: "80h 0m" },
      },
      jornadas: [
        { id: "j-h1", checkIn: "2026-03-04T08:00:00Z", checkOut: "2026-03-04T16:30:00Z", ubicacionCheckIn: "-34.6037,-58.3816", ubicacionCheckOut: "-34.6037,-58.3816", notas: "Ruta norte completada", duracion: { minutos: 510, formato: "8h 30m" } },
        { id: "j-h2", checkIn: "2026-03-03T07:45:00Z", checkOut: "2026-03-03T15:00:00Z", ubicacionCheckIn: "-34.5875,-58.4098", ubicacionCheckOut: "-34.5875,-58.4098", notas: "", duracion: { minutos: 435, formato: "7h 15m" } },
        { id: "j-h3", checkIn: "2026-03-02T08:15:00Z", checkOut: "2026-03-02T17:00:00Z", ubicacionCheckIn: "-34.6158,-58.3733", ubicacionCheckOut: "-34.6158,-58.3733", notas: "Retraso por lluvia", duracion: { minutos: 525, formato: "8h 45m" } },
        { id: "j-h4", checkIn: "2026-03-01T08:00:00Z", checkOut: "2026-03-01T14:30:00Z", ubicacionCheckIn: "-34.6037,-58.3816", ubicacionCheckOut: "-34.6037,-58.3816", notas: "", duracion: { minutos: 390, formato: "6h 30m" } },
        { id: "j-h5", checkIn: "2026-02-28T09:00:00Z", checkOut: null, ubicacionCheckIn: "-34.6200,-58.3650", ubicacionCheckOut: null, notas: "Jornada incompleta", duracion: null },
      ],
    };
  },

  async getAllRemitos() {
    await delay();
    return { count: remitos.length, remitos };
  },

  async getAssignmentsByChofer(choferId: string) {
    await delay();
    const clientIds = choferAssignments[choferId] || [];
    return { choferId, clientIds };
  },

  async resetPassword(_id: string, _newPassword: string) {
    await delay();
    return { message: "Contrasena reseteada" };
  },

  async getAllAssignments() {
    await delay();
    return { assignments: choferAssignments };
  },

  async getLiveLocations() {
    await delay(200);
    const positions = getLivePositions();
    return {
      count: positions.length,
      locations: positions.map((p) => ({
        choferId: p.choferId,
        latitude: p.lat,
        longitude: p.lng,
        speed: p.speed,
        heading: p.heading,
        timestamp: p.timestamp,
        updatedAt: p.timestamp,
        stale: false,
        chofer: { id: p.choferId, nombre: p.nombre },
      })),
    };
  },
};
