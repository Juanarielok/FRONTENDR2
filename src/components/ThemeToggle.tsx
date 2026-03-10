import { useTheme } from "../hooks/useTheme.ts";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
   <button
  onClick={toggleTheme}
  className="relative w-10 h-10 flex items-center justify-center
             bg-transparent border-0 shadow-none
             text-zinc-600 dark:text-zinc-400
             hover:bg-transparent dark:hover:bg-transparent
             hover:text-zinc-900 dark:hover:text-white
             focus:outline-none focus:ring-0
             transition-all duration-200"
  title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
  aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
>
  <svg
    viewBox="0 0 24 24"
    className={`w-5 h-5 absolute transition-all duration-300 ${
      theme === "dark"
        ? "opacity-100 rotate-0 scale-100"
        : "opacity-0 rotate-90 scale-0"
    }`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>

  <svg
    viewBox="0 0 24 24"
    className={`w-5 h-5 absolute transition-all duration-300 ${
      theme === "light"
        ? "opacity-100 rotate-0 scale-100"
        : "opacity-0 -rotate-90 scale-0"
    }`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
</button>
  );
}