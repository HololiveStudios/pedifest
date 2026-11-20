// src/pages/OrderTracking.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, collection, query, where, getDocs, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Package, 
  DollarSign, 
  FileText, 
  Bike, 
  Store, 
  ArrowLeft, 
  Share2,
  MessageCircle, 
  Copy, 
  CreditCard, 
  Banknote, 
  Smartphone,
  ChefHat,
  Truck,
  Home,
  AlertCircle
} from "lucide-react";

const STATUS_CONFIG: Record<string, { 
  label: string; 
  icon: any; 
  color: string; 
  bgColor: string;
  message: string;
}> = {
  new: {
    label: "Pedido Recebido",
    icon: Clock,
    color: "blue",
    bgColor: "from-blue-500 to-blue-600",
    message: "Seu pedido foi recebido e está sendo processado"
  },
  preparing: {
    label: "Em Preparação",
    icon: ChefHat,
    color: "yellow",
    bgColor: "from-yellow-500 to-orange-500",
    message: "Estamos preparando seu pedido com carinho"
  },
  ready: {
    label: "Pronto",
    icon: CheckCircle2,
    color: "green",
    bgColor: "from-green-500 to-emerald-500",
    message: "Seu pedido está pronto!"
  },
  out_for_delivery: {
    label: "Saiu para Entrega",
    icon: Truck,
    color: "purple",
    bgColor: "from-purple-500 to-indigo-500",
    message: "Seu pedido está a caminho"
  },
  delivered: {
    label: "Entregue",
    icon: CheckCircle2,
    color: "green",
    bgColor: "from-green-600 to-emerald-600",
    message: "Pedido concluído com sucesso!"
  },
  cancelled: {
    label: "Cancelado",
    icon: AlertCircle,
    color: "red",
    bgColor: "from-red-500 to-pink-500",
    message: "Pedido cancelado"
  }
};

export default function OrderTracking() {
  const { slug, orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) loadStoreAndOrder();
  }, [slug, orderId]);

  useEffect(() => {
    if (!storeId || !orderId) return;

    const unsub = onSnapshot(
      doc(db, `stores/${storeId}/orders`, orderId),
      (snap) => {
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao carregar pedido:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [storeId, orderId]);

  async function loadStoreAndOrder() {
    setLoading(true);
    try {
      const storesRef = collection(db, "stores");
      const q = query(storesRef, where("slug", "==", slug));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const storeDoc = snap.docs[0];
        const id = storeDoc.id;
        const storeData = storeDoc.data();
        
        setStoreId(id);
        setStore({ id, ...storeData });

        if (orderId) {
          const orderDoc = await getDoc(doc(db, `stores/${id}/orders`, orderId));
          if (orderDoc.exists()) {
            setOrder({ id: orderDoc.id, ...orderDoc.data() });
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  const shareOrder = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: `Pedido #${order.orderNumber}`,
        text: `Acompanhe meu pedido na ${store.name}`,
        url
      });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sendWhatsApp = () => {
    const phone = store.whatsapp || store.phone;
    if (!phone) return;
    const message = `Olá! Gostaria de informações sobre o pedido #${order.orderNumber}`;
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">Carregando pedido...</div>
        </div>
      </div>
    );
  }

  if (!order || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="text-6xl mb-4">😔</div>
          <div className="text-2xl font-bold text-gray-800 mb-2">Pedido não encontrado</div>
          <div className="text-gray-600 mb-6">Verifique o link e tente novamente</div>
          <button
            onClick={() => navigate(`/${slug}`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Voltar para a loja
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
  const StatusIcon = statusInfo.icon;

  const statusSteps = ["new", "preparing", "ready"];
  if (order.type === "delivery") {
    statusSteps.push("out_for_delivery");
  }
  statusSteps.push("delivered");
  const currentIndex = statusSteps.indexOf(order.status);

  const getPaymentMethodInfo = () => {
    const method = order.payment?.method;
    if (method === "pagar_agora") return { icon: CreditCard, text: "Pago Online", color: "green" };
    if (method === "pagar_retirada") return { icon: Banknote, text: `Pagar na ${order.type === "delivery" ? "Entrega" : "Retirada"}`, color: "yellow" };
    return { icon: DollarSign, text: "Não informado", color: "gray" };
  };

  const paymentInfo = getPaymentMethodInfo();
  const PaymentIcon = paymentInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* HEADER COM STATUS PRINCIPAL */}
      <div className={`bg-gradient-to-r ${statusInfo.bgColor} text-white py-12 px-4 shadow-2xl`}>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(`/${slug}`)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para a loja
          </button>

          <div className="text-center">
            <div className="mb-6 animate-bounce">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <StatusIcon className={`w-16 h-16 text-${statusInfo.color}-500`} strokeWidth={3} />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black mb-4 drop-shadow-lg">
              {statusInfo.label}
            </h1>
            
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 mb-6 border-2 border-white/30 shadow-xl max-w-xl mx-auto">
              <div className="text-sm font-medium mb-2 text-white/80">Número do Pedido</div>
              <div className="text-6xl font-black tracking-wider mb-2">
                #{order.orderNumber}
              </div>
              <div className="text-lg text-white/90">
                {order.createdAt?.toDate?.() 
                  ? new Date(order.createdAt.toDate()).toLocaleString("pt-BR")
                  : "Data não disponível"}
              </div>
            </div>

            <p className="text-xl text-white/90 mb-6">{statusInfo.message}</p>

            <div className="flex flex-wrap gap-3 justify-center">
              {(store.whatsapp || store.phone) && (
                <button
                  onClick={sendWhatsApp}
                  className="flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  Falar no WhatsApp
                </button>
              )}
              <button
                onClick={shareOrder}
                className="flex items-center gap-2 bg-white/20 backdrop-blur text-white border-2 border-white/40 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-white/30 transition-all"
              >
                {copied ? <Copy className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                {copied ? "Link Copiado!" : "Compartilhar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* TIMELINE DE STATUS */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-100">
          <div className="p-6">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-gray-800">
              <Clock className="w-7 h-7 text-blue-600" />
              Acompanhe seu Pedido
            </h2>
            
            <div className="relative">
              <div className="absolute left-6 top-8 bottom-8 w-1 bg-gradient-to-b from-blue-200 to-gray-200"></div>
              
              <div className="space-y-6">
                {statusSteps.map((step, idx) => {
                  const stepConfig = STATUS_CONFIG[step];
                  const StepIcon = stepConfig.icon;
                  const isActive = idx <= currentIndex;
                  const isCurrent = idx === currentIndex;
                  
                  return (
                    <div key={step} className="flex items-center gap-4 relative z-10">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-lg transition-all ${
                        isActive 
                          ? `bg-gradient-to-br ${stepConfig.bgColor} text-white scale-110` 
                          : "bg-gray-200 text-gray-400"
                      }`}>
                        {isActive ? <StepIcon className="w-7 h-7" /> : idx + 1}
                      </div>
                      <div className={`font-bold text-lg ${isCurrent ? "text-gray-800 scale-105" : isActive ? "text-gray-700" : "text-gray-400"}`}>
                        {stepConfig.label}
                      </div>
                      {isCurrent && (
                        <div className="ml-auto">
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                            Atual
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* INFORMAÇÕES DO CLIENTE E ENTREGA */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-gray-800">
              <User className="w-6 h-6 text-blue-600" />
              Seus Dados
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <User className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <div className="text-sm text-gray-600 font-medium">Nome</div>
                  <div className="font-bold text-gray-800">{order.customer?.name || "Não informado"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <div className="text-sm text-gray-600 font-medium">Telefone</div>
                  <div className="font-bold text-gray-800">{order.customer?.phone || "Não informado"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-gray-800">
              {order.type === "delivery" ? (
                <>
                  <Bike className="w-6 h-6 text-blue-600" />
                  Entrega
                </>
              ) : (
                <>
                  <Store className="w-6 h-6 text-blue-600" />
                  Retirada
                </>
              )}
            </h3>
            {order.type === "delivery" ? (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <div className="text-sm text-blue-700 font-medium">Endereço de Entrega</div>
                  <div className="font-bold text-gray-800">{order.customer?.address || "Não informado"}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl">
                  <Store className="w-5 h-5 text-amber-600 mt-1" />
                  <div>
                    <div className="text-sm text-amber-700 font-medium">Retirar em</div>
                    <div className="font-bold text-gray-800">{store.name}</div>
                  </div>
                </div>
                {store.address && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-gray-600 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600 font-medium">Endereço</div>
                      <div className="font-bold text-gray-800">{store.address}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ITENS DO PEDIDO */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
          <h3 className="text-2xl font-black mb-6 flex items-center gap-2 text-gray-800">
            <Package className="w-7 h-7 text-blue-600" />
            Itens do Pedido
          </h3>
          
          <div className="space-y-3 mb-6">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-black text-blue-600 text-lg">
                  {item.qty}x
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg text-gray-800">{item.name}</div>
                  <div className="text-sm text-gray-600">R$ {item.price.toFixed(2)} cada</div>
                  {item.extras?.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">+ {item.extras.join(", ")}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-green-600">
                    R$ {(item.price * item.qty).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RESUMO FINANCEIRO */}
          <div className="border-t-4 border-dashed border-gray-300 pt-6 space-y-3">
            <div className="flex justify-between text-lg">
              <span className="text-gray-700 font-medium">Subtotal</span>
              <span className="font-bold text-gray-800">R$ {order.subtotal?.toFixed(2) || "0.00"}</span>
            </div>
            
            {order.discount > 0 && (
              <div className="flex justify-between text-lg text-red-600">
                <span className="font-medium">Desconto</span>
                <span className="font-bold">- R$ {order.discount.toFixed(2)}</span>
              </div>
            )}

            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-2xl mt-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-green-100 font-medium mb-1">Valor Total</div>
                  <div className="text-5xl font-black tracking-tight">
                    R$ {order.total?.toFixed(2) || "0.00"}
                  </div>
                </div>
                <DollarSign className="w-20 h-20 text-white/30" strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        {/* PAGAMENTO E OBSERVAÇÕES */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-gray-800">
              <PaymentIcon className="w-6 h-6 text-blue-600" />
              Pagamento
            </h3>
            <div className={`p-4 bg-gradient-to-r from-${paymentInfo.color}-50 to-${paymentInfo.color}-100 rounded-xl border-2 border-${paymentInfo.color}-200`}>
              <div className={`text-sm text-${paymentInfo.color}-700 font-medium mb-1`}>Forma de Pagamento</div>
              <div className="font-black text-lg text-gray-800 mb-3">
                {paymentInfo.text}
              </div>
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                order.payment?.status === "paid" 
                  ? "bg-green-100 text-green-700" 
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {order.payment?.status === "paid" ? "✓ Pagamento Confirmado" : "⏳ Pagamento Pendente"}
              </div>
            </div>
          </div>

          {order.observations && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
              <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-gray-800">
                <FileText className="w-6 h-6 text-blue-600" />
                Observações
              </h3>
              <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-100">
                <div className="text-gray-700 font-medium italic">{order.observations}</div>
              </div>
            </div>
          )}
        </div>

        {/* CTA FINAL */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl text-center">
          <h3 className="text-3xl font-black mb-3">Obrigado pela preferência! 💙</h3>
          <p className="text-blue-100 mb-6 text-lg">
            Acompanhe as atualizações do seu pedido nesta página
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate(`/${slug}`)}
              className="flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-black text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
            >
              <Home className="w-5 h-5" />
              Fazer Novo Pedido
            </button>
            {(store.whatsapp || store.phone) && (
              <button
                onClick={sendWhatsApp}
                className="flex items-center gap-2 bg-green-500 text-white px-8 py-4 rounded-xl font-black text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                Contato WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}