// src/components/AdminLayout.tsx
import { useState } from "react";
import Sidebar from "./Sidebar";
import Dashboard from "../pages/Dashboard";
import OrdersPage from "../pages/Orders";
import ProductsPage from "../pages/Products";
import MenuEditor from "../pages/MenuEditor";
import Settings from "../pages/Settings";
import Tutorials from "../pages/Tutorials";

export default function AdminLayout() {
  const [currentPage, setCurrentPage] = useState(() => 
    localStorage.getItem("lastPage") || "dashboard"
  );

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    localStorage.setItem("lastPage", page);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1 overflow-auto">
        {currentPage === "dashboard" && <Dashboard />}
        {currentPage === "orders" && <OrdersPage />}
        {currentPage === "products" && <ProductsPage />}
        {currentPage === "menu" && <MenuEditor />}
        {currentPage === "settings" && <Settings />}
        {currentPage === "tutorials" && <Tutorials />}
      </main>
    </div>
  );
}
