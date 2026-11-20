// src/pages/Dashboard.tsx
import { useOrders } from "../hooks/useOrders";
import { DollarSign, ShoppingCart, TrendingUp, Clock } from "lucide-react";

export default function Dashboard() {
  const storeId = "STORE_ID_EXAMPLE";
  const { orders } = useOrders(storeId);

  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => o.createdAt && new Date(o.createdAt.toDate()).toDateString() === today
  );

  const revenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const avgTicket = todayOrders.length > 0 ? revenue / todayOrders.length : 0;

  const ordersByChannel = todayOrders.reduce((acc, o) => {
    const channel = o.channel || "web";
    acc[channel] = (acc[channel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<ShoppingCart className="text-blue-600" />}
          label="Pedidos Hoje"
          value={todayOrders.length.toString()}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<DollarSign className="text-green-600" />}
          label="Receita Hoje"
          value={`R$ ${revenue.toFixed(2)}`}
          bg="bg-green-50"
        />
        <StatCard
          icon={<TrendingUp className="text-purple-600" />}
          label="Ticket Médio"
          value={`R$ ${avgTicket.toFixed(2)}`}
          bg="bg-purple-50"
        />
        <StatCard
          icon={<Clock className="text-orange-600" />}
          label="Em Preparação"
          value={orders.filter((o) => o.status === "preparing").length.toString()}
          bg="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Pedidos por Canal</h2>
          <div className="space-y-3">
            {Object.entries(ordersByChannel).map(([channel, count]) => (
              <div key={channel} className="flex justify-between items-center">
                <span className="capitalize">{channel}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Últimos Pedidos</h2>
          <div className="space-y-2">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium">#{order.orderNumber}</div>
                  <div className="text-sm text-gray-600">{order.customer?.name || "Cliente"}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">R$ {order.total.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">{order.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className={`${bg} p-6 rounded-lg shadow`}>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white rounded-full">{icon}</div>
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}