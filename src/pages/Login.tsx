import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { ThemeToggle } from "../components/ThemeToggle.tsx";
import { IconEye, IconEyeOff } from "../components/icons";
import { validateEmail, validateRequired } from "../utils/validation";

type LoginErrors = {
  email?: string;
  password?: string;
};

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

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

  async function onLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const passwordRequiredError = validateRequired(password, "Contraseña");
    const nextErrors: LoginErrors = {
      email: validateEmail(email),
      password: passwordRequiredError ? "Contraseña requerida" : undefined,
    };

    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) {
      if (nextErrors.email) emailRef.current?.focus();
      else passwordRef.current?.focus();
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    setEmail(normalizedEmail);
    setErr("");
    setLoading(true);
    try {
      await api.login(normalizedEmail, password);
      nav("/clientes", { replace: true });
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-[100dvh] md:h-auto md:min-h-screen fondo-home bg-white dark:bg-zinc-950 relative overflow-hidden">
      {/* Splash blanco */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-zinc-950 transition-opacity duration-700 ${
          mostrarSplash ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <img
          src="/images/brand/arttaius-logo.png"
          alt="Arttaius"
          className="w-28 h-28 object-contain mb-5 animate-[fadeIn_0.8s_ease-out]"
        />

        <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-800 dark:border-t-zinc-200 rounded-full animate-spin mb-3" />

        <p className="text-zinc-600 dark:text-zinc-400 text-sm tracking-[0.18em] uppercase animate-pulse">
          Cargando interfaz
        </p>
      </div>

      {/* Contenido principal */}
      <div className="h-full md:h-auto md:min-h-screen flex items-center justify-center md:justify-start p-4 md:p-6 md:px-16 relative transition-colors duration-300">
        {/* Selector de tema */}
        <div
          className={`absolute top-6 right-6 z-20 transition-all duration-700 ${
            mostrarPanel ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <ThemeToggle />
        </div>

        {/* Fondo que aparece después, con deriva lenta */}
        <div
          className={`absolute inset-0 overflow-hidden transition-opacity duration-[1800ms] ease-out ${
            mostrarFondo ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-login-drift"
            style={{
              backgroundImage: "url('/images/login/background.jpg')",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60" />
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
          <div className="mb-4 md:mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-24 h-24 md:w-20 md:h-20 flex items-center justify-center">
                <img
                  src="/images/brand/arttaius-logo.png"
                  alt="Arttaius"
                  className="w-50 h-50 object-contain"
                />
              </div>

              <span className="hidden md:inline text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                ARTTAIUS
              </span>
            </div>
            <p className="hidden md:block text-zinc-500 dark:text-zinc-400 text-sm font-semibold tracking-wide">
              Gestión y panel de control
            </p>
          </div>

          {/* Card */}
          <div className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 p-5 md:p-8 relative rounded-xl shadow-sm shadow-zinc-900/5 overflow-hidden">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
                INICIAR SESIÓN
              </h1>
            </div>

            <form className="space-y-4 md:space-y-5" onSubmit={onLogin} noValidate>
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <input
                    ref={emailRef}
                    id="login-email"
                    type="email"
                    className={`w-full bg-zinc-50 dark:bg-zinc-800 border
                               text-zinc-900 dark:text-zinc-100 px-4 py-3 font-semibold rounded-lg
                               outline-none transition-all duration-200
                               hover:border-zinc-400 dark:hover:border-zinc-600
                               placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                               ${
                                 errors.email
                                   ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                   : "border-zinc-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                               }`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (err) setErr("");
                      if (errors.email) {
                        setErrors((current) => ({ ...current, email: undefined }));
                      }
                    }}
                    onBlur={() =>
                      setErrors((current) => ({
                        ...current,
                        email: validateEmail(email),
                      }))
                    }
                    placeholder="admin@empresa.com"
                    autoComplete="email"
                    inputMode="email"
                    required
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "login-email-error" : undefined}
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
                {errors.email && (
                  <p
                    id="login-email-error"
                    role="alert"
                    className="mt-1.5 text-xs text-red-500 dark:text-red-400"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className={`w-full bg-zinc-50 dark:bg-zinc-800 border
                               text-zinc-900 dark:text-zinc-100 pl-4 pr-12 py-3 rounded-lg
                               outline-none transition-all duration-200
                               hover:border-zinc-400 dark:hover:border-zinc-600
                               placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                               ${
                                 errors.password
                                   ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                   : "border-zinc-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                               }`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (err) setErr("");
                      if (errors.password) {
                        setErrors((current) => ({ ...current, password: undefined }));
                      }
                    }}
                    onBlur={() => {
                      const requiredError = validateRequired(password, "Contraseña");
                      setErrors((current) => ({
                        ...current,
                        password: requiredError ? "Contraseña requerida" : undefined,
                      }));
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "login-password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowPassword((visible) => !visible);
                      passwordRef.current?.focus();
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={showPassword}
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <IconEyeOff className="w-5 h-5" />
                    ) : (
                      <IconEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p
                    id="login-password-error"
                    role="alert"
                    className="mt-1.5 text-xs text-red-500 dark:text-red-400"
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              {err && (
                <div
                  role="alert"
                  className="flex items-center gap-2 text-red-500 dark:text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
                >
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
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-amber-500 text-zinc-950 font-semibold py-3 px-4
                           transition-all duration-200 shadow-sm shadow-amber-500/20
                           hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.99]
                           disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-amber-500 disabled:hover:shadow-none
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
            </form>
          </div>

          <div className="hidden md:block mt-6 text-center">
            <p className="text-zinc-400 dark:text-zinc-500 text-xs">
              juanarielok@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
