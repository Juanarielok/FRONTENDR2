import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onLogin() {
    setErr("");
    try {
      await api.login(email, password); // guarda token en localStorage (según tu api.ts)
      nav("/clientes", { replace: true });
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-black/20 p-6">
        <h1 className="text-2xl font-semibold">Login Admin</h1>
        <p className="mt-1 text-sm text-black/70">
          Entrá para crear clientes y asignarlos a chofer.
        </p>

        <div className="mt-5 space-y-3">
          <div>
            <label className="text-sm font-semibold">Email</label>
            <input
              className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Password</label>
            <input
              className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {err ? <p className="text-sm text-black/70">⚠ {err}</p> : null}

          <button
            onClick={onLogin}
            className="w-full border border-black bg-black px-4 py-2 text-white font-semibold"
          >
            ENTRAR
          </button>
        </div>
      </div>
    </div>
  );
}
