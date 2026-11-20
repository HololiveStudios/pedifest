import type { Order } from "../types/types";
import { X, User, MapPin, CreditCard, Clock, Package, Phone, FileText, Bike, Store, ChefHat, Truck, CheckCircle, XCircle } from "lucide-react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useState, useEffect } from "react";

type OrderDetailProps = {
  order: Order;
  onClose: () => void;
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  new: { label: "Novo", icon: Clock, color: "blue", bgColor: "from-blue-500 to-blue-600" },
  preparing: { label: "Em Preparo", icon: ChefHat, color: "yellow", bgColor: "from-yellow-500 to-orange-500" },
  ready: { label: "Pronto", icon: CheckCircle, color: "green", bgColor: "from-green-500 to-emerald-500" },
  out_for_delivery: { label: "Saiu para Entrega", icon: Truck, color: "purple", bgColor: "from-purple-500 to-indigo-500" },
  delivered: { label: "Entregue", icon: CheckCircle, color: "gray", bgColor: "from-gray-600 to-gray-700" },
  cancelled: { label: "Cancelado", icon: XCircle, color: "red", bgColor: "from-red-500 to-pink-500" }
};

export default function OrderDetail({ order, onClose }: OrderDetailProps) {
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(order.status);

  useEffect(() => {
    setCurrentStatus(order.status);
  }, [order.status]);

  const updateStatus = async (newStatus: string) => {
    if (!order?.id || updating) return;
    
    const storeId = order.storeId || localStorage.getItem("storeId");
    if (!storeId) {
      console.error("storeId não encontrado");
      alert("Erro: ID da loja não encontrado");
      return;
    }
    
    try {
      setUpdating(true);
      setCurrentStatus(newStatus);
      
      await updateDoc(doc(db, `stores/${storeId}/orders`, order.id), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status do pedido: " + (error as any).message);
      setCurrentStatus(order.status);
    } finally {
      setUpdating(false);
    }
  };

  const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.new;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl">
        <div className={`sticky top-0 bg-gradient-to-r ${statusConfig.bgColor} text-white p-6 flex justify-between items-center z-10 shadow-lg`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <StatusIcon className="w-10 h-10" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-3xl font-black">Pedido #{order?.orderNumber ?? "N/A"}</h2>
              <div className="text-sm text-white/80 font-medium mt-1">{statusConfig.label}</div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-white/20 rounded-xl transition-all transform hover:scale-110"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border-2 border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-black text-lg text-gray-800">Cliente</h3>
              </div>
              <div className="space-y-2">
                <div className="font-bold text-gray-800">{order.customer?.name || "Não informado"}</div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{order.customer?.phone || "Não informado"}</span>
                </div>
              </div>
            </div>

            <div className={`bg-gradient-to-br ${order.type === "delivery" ? "from-purple-50 to-pink-50 border-purple-100" : "from-amber-50 to-orange-50 border-amber-100"} p-5 rounded-2xl border-2`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${order.type === "delivery" ? "bg-purple-500" : "bg-amber-500"} rounded-xl flex items-center justify-center`}>
                  {order.type === "delivery" ? <Bike className="w-6 h-6 text-white" /> : <Store className="w-6 h-6 text-white" />}
                </div>
                <h3 className="font-black text-lg text-gray-800">
                  {order.type === "delivery" ? "Entrega" : "Retirada"}
                </h3>
              </div>
              {order.customer?.address ? (
                <div className="flex items-start gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                  <span className="text-sm font-medium">{order.customer.address}</span>
                </div>
              ) : (
                <div className="text-sm text-gray-600">Retirar na loja</div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border-2 border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-black text-lg text-gray-800">Pagamento</h3>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-gray-800 capitalize">
                  {order.payment?.method === "pagar_agora" ? "Pago Online" : 
                   order.payment?.method === "pagar_retirada" ? `Pagar na ${order.type === "delivery" ? "Entrega" : "Retirada"}` :
                   "Não definido"}
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  order.payment?.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  {order.payment?.status === "paid" ? "✓ Pago" : "⏳ Pendente"}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-5 rounded-2xl border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-black text-lg text-gray-800">Horário</h3>
              </div>
              <div className="text-sm font-bold text-gray-700">
                {order.createdAt?.toDate?.() 
                  ? new Date(order.createdAt.toDate()).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : "Não disponível"}
              </div>
            </div>
          </div>

          {order.observations && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-2xl border-2 border-amber-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-black text-lg text-gray-800">Observações</h3>
              </div>
              <p className="text-gray-700 font-medium italic">{order.observations}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Package className="w-6 h-6" />
                Itens do Pedido
              </h3>
            </div>
            
            <div className="p-4 space-y-3">
              {order.items?.length ? (
                order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-gray-100">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg">
                      {item.qty}x
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-800">{item.name}</div>
                      <div className="text-sm text-gray-600">R$ {item.price.toFixed(2)} cada</div>
                      {item.extras?.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1 font-medium">
                          + {item.extras.map((e: any) => e.name || e).join(", ")}
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-black text-green-600">
                      R$ {(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">Nenhum item registrado</div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
            <div className="space-y-3">
              <div className="flex justify-between text-lg text-gray-700">
                <span className="font-medium">Subtotal</span>
                <span className="font-bold">R$ {order.subtotal?.toFixed(2) ?? "0.00"}</span>
              </div>
              {order.discount && order.discount > 0 && (
                <div className="flex justify-between text-lg text-red-600">
                  <span className="font-medium">Desconto</span>
                  <span className="font-bold">- R$ {order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t-2 border-dashed border-green-300 pt-3 flex justify-between items-center">
                <span className="text-2xl font-black text-gray-800">Total</span>
                <span className="text-4xl font-black text-green-600">
                  R$ {order.total?.toFixed(2) ?? "0.00"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
            <h3 className="font-black text-lg mb-4 text-gray-800">Atualizar Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {currentStatus === "new" && (
                <button
                  onClick={() => updateStatus("preparing")}
                  disabled={updating}
                  className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <ChefHat className="w-5 h-5" />
                      Preparar
                    </>
                  )}
                </button>
              )}
              {currentStatus === "preparing" && (
                <button
                  onClick={() => updateStatus("ready")}
                  disabled={updating}
                  className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Pronto
                    </>
                  )}
                </button>
              )}
              {currentStatus === "ready" && order.type === "delivery" && (
                <button
                  onClick={() => updateStatus("out_for_delivery")}
                  disabled={updating}
                  className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Truck className="w-5 h-5" />
                      Saiu
                    </>
                  )}
                </button>
              )}
              {(currentStatus === "ready" || currentStatus === "out_for_delivery") && (
                <button
                  onClick={() => updateStatus("delivered")}
                  disabled={updating}
                  className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Finalizar
                    </>
                  )}
                </button>
              )}
              {currentStatus !== "cancelled" && currentStatus !== "delivered" && (
                <button
                  onClick={() => updateStatus("cancelled")}
                  disabled={updating}
                  className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Cancelar
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}