import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Clientes from "./pages/Clientes";

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <div className="bg-white text-black font-lit min-h-screen">
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
////////aaaaa