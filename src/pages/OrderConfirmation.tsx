// src/pages/OrderConfirmation.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  CheckCircle2, Clock, MapPin, Phone, User, Package, 
  DollarSign, FileText, Bike, Store, ArrowLeft, Share2,
  MessageCircle, Copy, CreditCard, Banknote, Smartphone
} from "lucide-react";

export default function OrderConfirmation() {
  const { slug, orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadOrderData();
  }, [slug, orderId]);

  async function loadOrderData() {
    setLoading(true);
    try {
      // Buscar loja pelo slug
      const storesSnap = await getDocs(
        query(collection(db, "stores"), where("slug", "==", slug))
      );
      
      if (storesSnap.empty) {
        setLoading(false);
        return;
      }

      const storeDoc = storesSnap.docs[0];
      const storeId = storeDoc.id;
      const storeData = storeDoc.data();
      setStore({ id: storeId, ...storeData });

      // Buscar pedido
      const orderDoc = await getDoc(doc(db, `stores/${storeId}/orders`, orderId!));
      if (orderDoc.exists()) {
        setOrder({ id: orderDoc.id, ...orderDoc.data() });
      }
    } catch (error) {
      console.error("Erro ao carregar pedido:", error);
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
    const message = `Olá! Fiz o pedido #${order.orderNumber} e gostaria de confirmar.`;
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

  const getStatusInfo = () => {
    switch (order.status) {
      case "new":
        return {
          label: "Pedido Recebido",
          color: "blue",
          icon: Clock,
          message: "Seu pedido foi recebido e está sendo preparado"
        };
      case "preparing":
        return {
          label: "Em Preparação",
          color: "yellow",
          icon: Package,
          message: "Estamos preparando seu pedido com carinho"
        };
      case "ready":
        return {
          label: "Pronto para Retirada",
          color: "green",
          icon: CheckCircle2,
          message: "Seu pedido está pronto!"
        };
      case "delivering":
        return {
          label: "Saiu para Entrega",
          color: "purple",
          icon: Bike,
          message: "Seu pedido está a caminho"
        };
      case "completed":
        return {
          label: "Entregue",
          color: "green",
          icon: CheckCircle2,
          message: "Pedido concluído com sucesso!"
        };
      default:
        return {
          label: "Processando",
          color: "gray",
          icon: Clock,
          message: "Processando seu pedido"
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const paymentIcons: any = {
    pix: Smartphone,
    card: CreditCard,
    cash: Banknote
  };

  const PaymentIcon = paymentIcons[order.payment?.method] || DollarSign;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* SEÇÃO 1: CONFIRMAÇÃO VISUAL (Efeito Primazia) */}
      <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white py-12 px-4 shadow-2xl">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 animate-bounce">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle2 className="w-16 h-16 text-green-500" strokeWidth={3} />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-4 drop-shadow-lg">
            Pedido Confirmado! 🎉
          </h1>
          
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 mb-6 border-2 border-white/30 shadow-xl">
            <div className="text-sm font-medium mb-2 text-green-100">Número do Pedido</div>
            <div className="text-6xl font-black tracking-wider mb-2">
              #{order.orderNumber}
            </div>
            <div className="text-lg text-green-100">
              {new Date(order.createdAt?.toDate?.() || new Date()).toLocaleString("pt-BR")}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={sendWhatsApp}
              className="flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Falar no WhatsApp
            </button>
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

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* SEÇÃO 2: STATUS DO PEDIDO (Hierarquia de Atenção) */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-100">
          <div className={`bg-gradient-to-r from-${statusInfo.color}-500 to-${statusInfo.color}-600 p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                  <StatusIcon className="w-10 h-10" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-2xl font-black mb-1">{statusInfo.label}</div>
                  <div className="text-white/90">{statusInfo.message}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline de Status */}
          <div className="p-6">
            <div className="relative">
              <div className="absolute left-6 top-8 bottom-8 w-1 bg-gradient-to-b from-blue-200 to-gray-200"></div>
              
              <div className="space-y-6">
                {[
                  { status: "new", label: "Pedido Recebido", active: true },
                  { status: "preparing", label: "Em Preparação", active: ["preparing", "ready", "delivering", "completed"].includes(order.status) },
                  { status: "ready", label: order.type === "delivery" ? "Saiu para Entrega" : "Pronto para Retirada", active: ["ready", "delivering", "completed"].includes(order.status) },
                  { status: "completed", label: "Concluído", active: order.status === "completed" }
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-4 relative z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-lg transition-all ${
                      step.active 
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white scale-110" 
                        : "bg-gray-200 text-gray-400"
                    }`}>
                      {step.active ? "✓" : idx + 1}
                    </div>
                    <div className={`font-bold text-lg ${step.active ? "text-gray-800" : "text-gray-400"}`}>
                      {step.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: INFORMAÇÕES DO CLIENTE (F-Pattern Layout) */}
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
                  <div className="font-bold text-gray-800">{order.customer.name}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <div className="text-sm text-gray-600 font-medium">Telefone</div>
                  <div className="font-bold text-gray-800">{order.customer.phone}</div>
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
                  <div className="font-bold text-gray-800">{order.customer.address}</div>
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

        {/* SEÇÃO 4: ITENS DO PEDIDO (Anchoring Effect) */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
          <h3 className="text-2xl font-black mb-6 flex items-center gap-2 text-gray-800">
            <Package className="w-7 h-7 text-blue-600" />
            Itens do Pedido
          </h3>
          
          <div className="space-y-3 mb-6">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-black text-blue-600 text-lg">
                  {item.qty}x
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg text-gray-800">{item.name}</div>
                  <div className="text-sm text-gray-600">R$ {item.price.toFixed(2)} cada</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-green-600">
                    R$ {(item.price * item.qty).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total com Destaque (Ancoragem Visual) */}
          <div className="border-t-4 border-dashed border-gray-300 pt-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-green-100 font-medium mb-1">Valor Total</div>
                  <div className="text-5xl font-black tracking-tight">
                    R$ {order.total.toFixed(2)}
                  </div>
                </div>
                <DollarSign className="w-20 h-20 text-white/30" strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 5: PAGAMENTO E OBSERVAÇÕES */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-gray-800">
              <PaymentIcon className="w-6 h-6 text-blue-600" />
              Pagamento
            </h3>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100">
              <div className="text-sm text-purple-700 font-medium mb-1">Forma de Pagamento</div>
              <div className="font-black text-lg text-gray-800">
                {order.payment?.method === "pagar_agora" ? "Pago Online" : "Pagar na Entrega/Retirada"}
              </div>
              <div className={`mt-3 inline-block px-4 py-2 rounded-full text-sm font-bold ${
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
                <div className="text-gray-700 font-medium">{order.observations}</div>
              </div>
            </div>
          )}
        </div>

        {/* CTA FINAL (Choice Architecture) */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl text-center">
          <h3 className="text-3xl font-black mb-3">Obrigado pela preferência! 💙</h3>
          <p className="text-blue-100 mb-6 text-lg">
            Você receberá atualizações sobre seu pedido {store.whatsapp && "via WhatsApp"}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate(`/${slug}`)}
              className="flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-black text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Fazer Novo Pedido
            </button>
            <button
              onClick={sendWhatsApp}
              className="flex items-center gap-2 bg-green-500 text-white px-8 py-4 rounded-xl font-black text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Contato WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}