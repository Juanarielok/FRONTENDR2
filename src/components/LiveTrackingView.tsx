import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "../api";
import type { LiveLocation, Cliente } from "../api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const POLL_INTERVAL = 60000;

const truckSvg = (color: string, heading: number) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <g transform="rotate(${heading}, 24, 24)">
      <g transform="translate(8, 6)">
        <!-- Truck body -->
        <rect x="4" y="10" width="24" height="18" rx="3" fill="${color}" stroke="#18181b" stroke-width="1.5"/>
        <!-- Cabin -->
        <rect x="8" y="2" width="16" height="12" rx="3" fill="${color}" stroke="#18181b" stroke-width="1.5"/>
        <!-- Windshield -->
        <rect x="10" y="4" width="12" height="6" rx="1.5" fill="#e4e4e7" stroke="#18181b" stroke-width="0.75" opacity="0.9"/>
        <!-- Headlights -->
        <circle cx="11" cy="3" r="1.5" fill="#fbbf24"/>
        <circle cx="21" cy="3" r="1.5" fill="#fbbf24"/>
        <!-- Wheels -->
        <circle cx="10" cy="30" r="3.5" fill="#27272a" stroke="#18181b" stroke-width="1"/>
        <circle cx="10" cy="30" r="1.5" fill="#52525b"/>
        <circle cx="22" cy="30" r="3.5" fill="#27272a" stroke="#18181b" stroke-width="1"/>
        <circle cx="22" cy="30" r="1.5" fill="#52525b"/>
        <!-- Cargo lines -->
        <line x1="8" y1="16" x2="24" y2="16" stroke="#18181b" stroke-width="0.5" opacity="0.3"/>
        <line x1="8" y1="20" x2="24" y2="20" stroke="#18181b" stroke-width="0.5" opacity="0.3"/>
      </g>
    </g>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const TRUCK_COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"];

function getTruckIcon(index: number, heading: number) {
  const color = TRUCK_COLORS[index % TRUCK_COLORS.length];
  return L.icon({
    iconUrl: truckSvg(color, heading),
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
}

const STATUS_COLORS: Record<string, { fill: string; border: string; label: string }> = {
  disponible: { fill: "#a1a1aa", border: "#71717a", label: "Disponible" },
  asignado: { fill: "#f59e0b", border: "#d97706", label: "Asignado" },
  visitado: { fill: "#10b981", border: "#059669", label: "Visitado" },
};

function getClientIcon(status?: string) {
  const { fill, border } = STATUS_COLORS[status || "disponible"] || STATUS_COLORS.disponible;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="${fill}" stroke="${border}" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
    <circle cx="14" cy="14" r="3" fill="${border}"/>
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

type Props = {
  clientes?: Cliente[];
};

export function LiveTrackingView({ clientes = [] }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const choferIndexRef = useRef<Map<string, number>>(new Map());
  const clientMarkersRef = useRef<L.Marker[]>([]);
  const hasFittedBounds = useRef(false);
  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showClients, setShowClients] = useState(true);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});

  // Load assignments
  useEffect(() => {
    api.getAllAssignments().then((res) => setAssignments(res.assignments)).catch(() => {});
  }, []);

  function zoomToChofer(choferId: string) {
    if (!mapRef.current) return;
    const marker = markersRef.current.get(choferId);
    if (!marker) return;

    const clientIds = assignments[choferId] || [];
    const assignedClients = clientes.filter((c) => clientIds.includes(c.id));

    if (assignedClients.length === 0) {
      // No assigned clients — just zoom to truck
      mapRef.current.setView(marker.getLatLng(), 18, { animate: true });
      marker.openPopup();
      return;
    }

    // Build bounds from truck + assigned clients
    const points: [number, number][] = [[marker.getLatLng().lat, marker.getLatLng().lng]];
    assignedClients.forEach((c) => {
      if (!c.ubicacion) return;
      const parts = c.ubicacion.split(",").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        points.push([parts[0], parts[1]]);
      }
    });

    const bounds = L.latLngBounds(points);
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [80, 80], maxZoom: 18, animate: true });
    }
    marker.openPopup();
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-34.6037, -58.3816],
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const isDark = document.documentElement.classList.contains("dark");
    L.tileLayer(
      isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Theme observer
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!mapRef.current) return;
      const isDark = document.documentElement.classList.contains("dark");
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) mapRef.current!.removeLayer(layer);
      });
      L.tileLayer(
        isDark
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }
      ).addTo(mapRef.current);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await api.getLiveLocations();
      setLocations(res.locations);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar ubicaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for live locations
  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchLocations]);

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const currentMarkers = markersRef.current;
    const activeIds = new Set<string>();

    locations.forEach((loc) => {
      activeIds.add(loc.choferId);

      if (!choferIndexRef.current.has(loc.choferId)) {
        choferIndexRef.current.set(loc.choferId, choferIndexRef.current.size);
      }
      const idx = choferIndexRef.current.get(loc.choferId)!;
      const heading = loc.heading ?? 0;

      const popupContent = `
        <div style="font-family: system-ui; font-size: 13px; line-height: 1.5; min-width: 160px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${loc.chofer.nombre}</div>
          <div style="color: #71717a;">Velocidad: <strong style="color: #18181b;">${loc.speed != null ? loc.speed + " km/h" : "—"}</strong></div>
          <div style="color: #71717a;">Actualizado: <strong style="color: #18181b;">${new Date(loc.timestamp).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</strong></div>
          ${loc.stale ? '<div style="color: #ef4444; margin-top: 4px; font-weight: 500;">Sin señal</div>' : '<div style="color: #10b981; margin-top: 4px; font-weight: 500;">En linea</div>'}
        </div>
      `;

      if (currentMarkers.has(loc.choferId)) {
        const marker = currentMarkers.get(loc.choferId)!;
        marker.setLatLng([loc.latitude, loc.longitude]);
        marker.setIcon(getTruckIcon(idx, heading));
        marker.getPopup()?.setContent(popupContent);
      } else {
        const marker = L.marker([loc.latitude, loc.longitude], {
          icon: getTruckIcon(idx, heading),
        })
          .addTo(map)
          .bindPopup(popupContent)
          .on("click", () => {
            zoomToChofer(loc.choferId);
          });
        currentMarkers.set(loc.choferId, marker);
      }
    });

    // Remove markers for choferes no longer active
    currentMarkers.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        map.removeLayer(marker);
        currentMarkers.delete(id);
      }
    });

  }, [locations]);

  // Fit bounds on first load — wait for both trucks and clients
  useEffect(() => {
    if (!mapRef.current || hasFittedBounds.current) return;
    if (locations.length === 0) return;

    const points: [number, number][] = locations.map((l) => [l.latitude, l.longitude]);
    clientes.forEach((c) => {
      if (!c.ubicacion) return;
      const parts = c.ubicacion.split(",").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        points.push([parts[0], parts[1]]);
      }
    });

    const bounds = L.latLngBounds(points);
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      hasFittedBounds.current = true;
    }
  }, [locations, clientes]);

  // Client markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remove old client markers
    clientMarkersRef.current.forEach((m) => map.removeLayer(m));
    clientMarkersRef.current = [];

    if (!showClients || clientes.length === 0) return;

    clientes.forEach((cliente) => {
      if (!cliente.ubicacion) return;
      const parts = cliente.ubicacion.split(",").map(Number);
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return;

      const status = cliente.status || "disponible";
      const { label } = STATUS_COLORS[status] || STATUS_COLORS.disponible;

      const marker = L.marker([parts[0], parts[1]], {
        icon: getClientIcon(status),
        zIndexOffset: -100,
      })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: system-ui; font-size: 13px; line-height: 1.5; min-width: 140px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${cliente.nombre}</div>
            <div style="color: #71717a;">${cliente.tipoComercio || "Cliente"}</div>
            <div style="margin-top: 4px; font-weight: 500; color: ${STATUS_COLORS[status]?.border || "#71717a"};">${label}</div>
          </div>
        `);
      clientMarkersRef.current.push(marker);
    });
  }, [clientes, showClients]);

  function getAllBounds() {
    const points: [number, number][] = locations.map((l) => [l.latitude, l.longitude]);
    if (showClients) {
      clientes.forEach((c) => {
        if (!c.ubicacion) return;
        const parts = c.ubicacion.split(",").map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          points.push([parts[0], parts[1]]);
        }
      });
    }
    return points.length > 0 ? L.latLngBounds(points) : null;
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {locations.length} chofer{locations.length !== 1 ? "es" : ""} activo{locations.length !== 1 ? "s" : ""}
              </span>
            </div>
            {locations.length > 0 && (
              <div className="flex items-center gap-3 ml-4">
                {locations.map((loc, i) => {
                  const idx = choferIndexRef.current.get(loc.choferId) ?? i;
                  return (
                    <button
                      key={loc.choferId}
                      onClick={() => zoomToChofer(loc.choferId)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <span
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: TRUCK_COLORS[idx % TRUCK_COLORS.length] }}
                      />
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {loc.chofer.nombre.split(" ")[0]}
                      </span>
                      {loc.speed != null && (
                        <span className="text-[10px] text-zinc-400">{loc.speed} km/h</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!mapRef.current) return;
                const bounds = getAllBounds();
                if (bounds && bounds.isValid()) {
                  mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true });
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
              Vista entera
            </button>
            {clientes.length > 0 && (
              <button
                onClick={() => setShowClients((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border transition-colors ${
                  showClients
                    ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30"
                    : "text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Clientes
              </button>
            )}
            <span className="text-[10px] text-zinc-400">
              {POLL_INTERVAL / 1000}s
            </span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Map */}
      <div className="card overflow-hidden relative" style={{ height: "550px" }}>
        <div ref={mapContainerRef} className="w-full h-full" />
        {locations.length === 0 && !loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/80 dark:bg-zinc-900/80">
            <div className="text-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-zinc-400 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No hay choferes activos en este momento
              </p>
            </div>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/80 dark:bg-zinc-900/80">
            <svg className="animate-spin h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
