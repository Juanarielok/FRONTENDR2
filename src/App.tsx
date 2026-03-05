import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Clientes from "./pages/Clientes";
import ClienteDetalle from "./pages/ClienteDetalle";
import Monitoreo from "./pages/Monitoreo";
import Admin from "./pages/Admin";

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === "true";

function RequireAuth({ children }: { children: React.ReactElement }) {
  if (DEV_BYPASS) return children;
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const token = DEV_BYPASS || localStorage.getItem("token");

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={token ? "/clientes" : "/login"} replace />}
      />
      <Route path="/login" element={<Login />} />
      <Route
        path="/clientes"
        element={
          <RequireAuth>
            <Clientes />
          </RequireAuth>
        }
      />
      <Route
        path="/clientes/:id"
        element={
          <RequireAuth>
            <ClienteDetalle />
          </RequireAuth>
        }
      />
      <Route
        path="/monitoreo"
        element={
          <RequireAuth>
            <Monitoreo />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <Admin />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}