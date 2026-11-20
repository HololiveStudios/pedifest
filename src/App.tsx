// src/App.tsx (atualização)
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import AdminLayout from "./components/AdminLayout";
import PublicCheckout from "./pages/PublicCheckout";
import OrderTracking from "./pages/OrderTracking";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/*" element={<ProtectedAdmin />} />
        <Route path="/:slug" element={<PublicCheckout />} />
        <Route path="/:slug/pedido/:orderId" element={<OrderTracking />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </QueryClientProvider>
  );
}

function ProtectedAdmin() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <AdminLayout />;
}