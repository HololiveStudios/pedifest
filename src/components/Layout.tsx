// src/components/Layout.tsx
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Home, ShoppingBag, Package, Edit, Settings, BookOpen, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">OnPedido</h1>
        </div>
        <nav className="p-4 space-y-2">
          <NavLink to="/dashboard" icon={<Home size={20} />} label="Dashboard" />
          <NavLink to="/orders" icon={<ShoppingBag size={20} />} label="Pedidos" />
          <NavLink to="/products" icon={<Package size={20} />} label="Produtos" />
          <NavLink to="/menu" icon={<Edit size={20} />} label="Editor de Menu" />
          <NavLink to="/settings" icon={<Settings size={20} />} label="Configurações" />
          <NavLink to="/tutorials" icon={<BookOpen size={20} />} label="Tutoriais" />
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 rounded-lg transition text-gray-700 hover:text-blue-600"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}