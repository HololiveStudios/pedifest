// src/components/Sidebar.tsx
import { Home, ShoppingBag, Package, Edit, Settings, BookOpen, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

type SidebarProps = {
  currentPage: string;
  onNavigate: (page: string) => void;
};

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <aside className="w-64 bg-white shadow-md flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-blue-600">OnPedido</h1>
      </div>
      <nav className="p-4 space-y-2 flex-1">
        <NavButton
          icon={<Home size={20} />}
          label="Dashboard"
          active={currentPage === "dashboard"}
          onClick={() => onNavigate("dashboard")}
        />
        <NavButton
          icon={<ShoppingBag size={20} />}
          label="Pedidos"
          active={currentPage === "orders"}
          onClick={() => onNavigate("orders")}
        />
        <NavButton
          icon={<Package size={20} />}
          label="Produtos"
          active={currentPage === "products"}
          onClick={() => onNavigate("products")}
        />
        <NavButton
          icon={<Edit size={20} />}
          label="Editor de Menu"
          active={currentPage === "menu"}
          onClick={() => onNavigate("menu")}
        />
        <NavButton
          icon={<Settings size={20} />}
          label="Configurações"
          active={currentPage === "settings"}
          onClick={() => onNavigate("settings")}
        />
        <NavButton
          icon={<BookOpen size={20} />}
          label="Tutoriais"
          active={currentPage === "tutorials"}
          onClick={() => onNavigate("tutorials")}
        />
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

type NavButtonProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
};

function NavButton({ icon, label, active, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
        active
          ? "bg-blue-50 text-blue-600 font-medium"
          : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}