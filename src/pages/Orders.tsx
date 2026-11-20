import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { useOrders } from "../hooks/useOrders";
import OrderDetail from "../components/OrderDetail";
import StoreSetupModal from "../components/StoreSetupModal";
import type { Order } from "../types/types";
import {
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  AlertCircle,
  DollarSign,
  ShoppingBag,
  Truck,
  ChefHat
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  new: { label: "Novos", icon: Clock, color: "blue", bgColor: "from-blue-500 to-blue-600" },
  preparing: { label: "Em Preparo", icon: ChefHat, color: "yellow", bgColor: "from-yellow-500 to-orange-500" },
  ready: { label: "Prontos", icon: CheckCircle, color: "green", bgColor: "from-green-500 to-emerald-500" },
  out_for_delivery: { label: "Saiu para Entrega", icon: Truck, color: "purple", bgColor: "from-purple-500 to-indigo-500" },
  delivered: { label: "Entregues", icon: CheckCircle, color: "gray", bgColor: "from-gray-500 to-gray-600" },
  cancelled: { label: "Cancelados", icon: XCircle, color: "red", bgColor: "from-red-500 to-pink-500" }
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const localStoreId = localStorage.getItem("storeId");
    if (localStoreId) {
      setStoreId(localStoreId);
      return;
    }

    const fetchStore = async () => {
      try {
        const storeRef = doc(db, "stores", user.uid);
        const storeDoc = await getDoc(storeRef);

        if (storeDoc.exists()) {
          setStoreId(user.uid);
          localStorage.setItem("storeId", user.uid);
        } else {
          setShowSetup(true);
        }
      } catch (error) {
        console.error("Erro ao buscar loja:", error);
      }
    };

    fetchStore();
  }, [user, authLoading]);

  const { orders, loading, error } = useOrders(storeId || "");

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filter === "all" || order.status === filter;
    const matchesSearch = searchTerm === "" || 
      order.orderNumber?.toString().includes(searchTerm) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.phone?.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: orders.length,
    new: orders.filter(o => o.status === "new").length,
    preparing: orders.filter(o => o.status === "preparing").length,
    ready: orders.filter(o => o.status === "ready").length,
    revenue: orders.filter(o => o.status === "delivered").reduce((sum, o) => sum + (o.total || 0), 0)
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">Carregando autenticação...</div>
        </div>
      </div>
    );
  }

  if (!user) return <div className="p-4">Você precisa estar logado</div>;
  if (!storeId && !showSetup) return <div className="p-4">Carregando loja...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {showSetup && (
        <StoreSetupModal
          userId={user.uid}
          onClose={() => setShowSetup(false)}
          onStoreCreated={(id) => setStoreId(id)}
        />
      )}

      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-800 flex items-center gap-3 mb-2">
          <ShoppingBag className="w-10 h-10 text-blue-600" />
          Pedidos
        </h1>
        <p className="text-gray-600">Gerencie todos os pedidos da sua loja em tempo real</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-100 font-medium mb-1">Total</div>
              <div className="text-4xl font-black">{stats.total}</div>
            </div>
            <Package className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-amber-100 font-medium mb-1">Novos</div>
              <div className="text-4xl font-black">{stats.new}</div>
            </div>
            <Clock className="w-12 h-12 text-amber-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-yellow-100 font-medium mb-1">Preparando</div>
              <div className="text-4xl font-black">{stats.preparing}</div>
            </div>
            <ChefHat className="w-12 h-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-100 font-medium mb-1">Prontos</div>
              <div className="text-4xl font-black">{stats.ready}</div>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-purple-100 font-medium mb-1">Receita</div>
              <div className="text-2xl font-black">R$ {stats.revenue.toFixed(2)}</div>
            </div>
            <DollarSign className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-gray-100">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por número, cliente ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition appearance-none cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="new">Novos</option>
              <option value="preparing">Em Preparo</option>
              <option value="ready">Prontos</option>
              <option value="out_for_delivery">Saiu para Entrega</option>
              <option value="delivered">Entregues</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">Carregando pedidos...</div>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <div className="text-xl font-bold text-red-600 mb-2">Erro ao carregar pedidos</div>
          <div className="text-gray-600">{error.message}</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-600 mb-2">Nenhum pedido encontrado</h3>
          <p className="text-gray-500">
            {searchTerm || filter !== "all"
              ? "Tente ajustar os filtros de busca"
              : "Os pedidos aparecerão aqui quando forem realizados"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
            const StatusIcon = statusConfig.icon;
            
            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all border-2 border-gray-100 cursor-pointer"
              >
                <div className={`h-2 bg-gradient-to-r ${statusConfig.bgColor}`}></div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${statusConfig.bgColor} flex items-center justify-center shadow-lg`}>
                        <span className="text-2xl font-black text-white">
                          #{order.orderNumber}
                        </span>
                      </div>
                      <div>
                        <div className="font-black text-xl text-gray-800">
                          {order.customer?.name || "Cliente"}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4" />
                          {order.createdAt?.toDate?.()
                            ? new Date(order.createdAt.toDate()).toLocaleString("pt-BR")
                            : "Data não disponível"}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold bg-gradient-to-r ${statusConfig.bgColor} shadow-lg mb-2`}>
                        <StatusIcon className="w-5 h-5" />
                        {statusConfig.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {order.type === "delivery" ? "🚚 Delivery" : "🏪 Retirada"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Package className="w-5 h-5" />
                      <span className="font-medium">
                        {order.items?.length || 0} {order.items?.length === 1 ? "item" : "itens"}
                      </span>
                    </div>
                    <div className="text-3xl font-black text-green-600">
                      R$ {order.total?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}