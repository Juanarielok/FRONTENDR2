import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { ThemeToggle } from "../components/ThemeToggle.tsx";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    setErr("");
    setLoading(true);
    try {
      await api.login(email, password);
      nav("/clientes", { replace: true });
    } catch (e: any) {
      setErr(String(e?.message || "Error de conexión"));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && email && password) {
      onLogin();
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 100px,
              currentColor 100px,
              currentColor 101px
            ), repeating-linear-gradient(
              0deg,
              transparent,
              transparent 100px,
              currentColor 100px,
              currentColor 101px
            )`,
          }}
        />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 blur-[100px]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/5 blur-[120px]" />

      <div className="w-full max-w-md relative">
        {/* Logo/Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-500 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 text-zinc-950"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              LOGÍSTICA
            </span>
          </div>
          <p className="text-zinc-500 text-sm tracking-wide">
            Sistema de gestión de entregas
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 p-8 relative shadow-lg dark:shadow-none">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-500" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-500" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500" />

          <div className="mb-6">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1">
              Iniciar sesión
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Accedé al panel de administración
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 
                           text-zinc-900 dark:text-white px-4 py-3 
                           outline-none transition-all duration-200
                           focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20
                           placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="admin@empresa.com"
                  autoComplete="email"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 
                           text-zinc-900 dark:text-white px-4 py-3 
                           outline-none transition-all duration-200
                           focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20
                           placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
              </div>
            </div>

            {err && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{err}</span>
              </div>
            )}

            <button
              onClick={onLogin}
              disabled={loading || !email || !password}
              className="w-full bg-amber-500 text-zinc-950 font-semibold py-3 px-4
                       transition-all duration-200 
                       hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-500 disabled:hover:shadow-none
                       flex items-center justify-center gap-2"
            >
              {loading ? (
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
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>INGRESANDO...</span>
                </>
              ) : (
                <>
                  <span>INGRESAR</span>
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-zinc-400 dark:text-zinc-600 text-xs">
            © 2025 Sistema de Logística. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}