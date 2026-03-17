import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { ThemeToggle } from "../components/ThemeToggle.tsx";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [mostrarSplash, setMostrarSplash] = useState(
  !sessionStorage.getItem("loginSplashMostrado")
);
const [mostrarPanel, setMostrarPanel] = useState(
  !!sessionStorage.getItem("loginSplashMostrado")
);
const [mostrarFondo, setMostrarFondo] = useState(
  !!sessionStorage.getItem("loginSplashMostrado")
);

useEffect(() => {
  if (sessionStorage.getItem("loginSplashMostrado")) return;

  const tiempo1 = setTimeout(() => {
    setMostrarSplash(false);
    setMostrarPanel(true);
    sessionStorage.setItem("loginSplashMostrado", "true");
  }, 1800);

  const tiempo2 = setTimeout(() => {
    setMostrarFondo(true);
  }, 2800);

  return () => {
    clearTimeout(tiempo1);
    clearTimeout(tiempo2);
  };
}, []);

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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Splash blanco */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-700 ${
          mostrarSplash ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <img
          src="/ARRTAIUS1.png"
          alt="Arttaius"
          className="w-28 h-28 object-contain mb-5 animate-[fadeIn_0.8s_ease-out]"
        />

        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin mb-3" />

        <p className="text-zinc-600 text-sm tracking-[0.18em] uppercase animate-pulse">
          Cargando interfaz
        </p>
      </div>

      {/* Contenido principal */}
      <div className="min-h-screen flex items-center justify-start p-6 md:px-16 relative transition-colors duration-300">
        {/* Theme Toggle */}
        <div
          className={`absolute top-6 right-6 z-20 transition-all duration-700 ${
            mostrarPanel ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <ThemeToggle />
        </div>

        {/* Fondo que aparece después */}
        <div
          className={`absolute inset-0 transition-opacity duration-[1800ms] ease-out ${
            mostrarFondo ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/bgu7.jpg')",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-white/70 " />
        </div>

        {/* Luces decorativas */}
        <div
          className={`absolute top-0 left-0 w-64 h-64 bg-amber-500/10 blur-[100px] transition-opacity duration-[1800ms] ${
            mostrarFondo ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute bottom-0 right-0 w-96 h-96 bg-amber-500/5 blur-[120px] transition-opacity duration-[1800ms] ${
            mostrarFondo ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`w-full max-w-md relative z-10 transition-all duration-1000 ${
            mostrarPanel ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Logo/Brand */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-20 h-20 flex items-center justify-center">
                <img
                  src="/ARRTAIUS1.png"
                  alt="Arttaius"
                  className="w-50 h-50 object-contain"
                />
              </div>

              <span className="text-5xl font-bold text-zinc-900  tracking-tight">
                ARTTAIUS
              </span>
            </div>
            <p className="text-zinc-500 text-sm font-semibold tracking-wide">
              Gestion y panel de control
            </p>
          </div>

          {/* Card */}
          <div className="bg-white/80  backdrop-blur-sm border border-zinc-200  p-8 relative shadow-lg">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-zinc-500  mb-1">
                INICIAR SESION
              </h1>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-500  uppercase tracking-wider mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    className="w-full bg-zinc-50 border border-zinc-300  
                               text-zinc-900  px-4 py-3  font-semibold
                               outline-none transition-all duration-200
                               focus:border-[#9e9e9e] 
                               placeholder:text-zinc-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="admin@empresa.com"
                    autoComplete="email"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 ">
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
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type="password"
                    className="w-full bg-zinc-50 -950 border border-[#9e9e9e] 
                               text-zinc-900  px-4 py-3 
                               outline-none transition-all duration-200
                               focus:border-[#9e9e9e] 
                               placeholder:text-zinc-400 "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 ">
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
                className="w-full bg-[#ececec] text-zinc-950 font-semibold py-3 px-4
                           transition-all duration-200 
                           hover:bg-[#e0e0e0] hover:shadow-lg hover:shadow-[#979797]
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#e9e9e9] disabled:hover:shadow-none
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

          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-xs">
              juanarielok@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}