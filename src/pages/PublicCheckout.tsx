// src/pages/PublicCheckout.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  ShoppingCart, Trash2, Plus, Minus, Store, Bike, Clock, 
  Star, TrendingUp, Zap, Gift, Award, ChevronRight, X,
  MapPin, Phone, Calendar, Sparkles, Package, DollarSign, User, CheckCircle2, FileText
} from "lucide-react";

export default function PublicCheckout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<"delivery" | "retirada">("delivery");
  const [metodoPagamento, setMetodoPagamento] = useState<"pagar_agora" | "pagar_retirada">("pagar_retirada");
  const [observacoes, setObservacoes] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todos");

  useEffect(() => {
    if (slug) loadStore();
  }, [slug]);

  async function loadStore() {
    setLoading(true);
    try {
      const storesRef = collection(db, "stores");
      const q = query(storesRef, where("slug", "==", slug));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const storeDoc = snap.docs[0];
        const storeId = storeDoc.id;
        const storeData = storeDoc.data();

        const productsSnap = await getDocs(collection(db, `stores/${storeId}/products`));
        const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const promotionsSnap = await getDocs(collection(db, `stores/${storeId}/promotions`));
        const promotions = promotionsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.active);

        const combosSnap = await getDocs(collection(db, `stores/${storeId}/combos`));
        const combos = combosSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        setData({
          ...storeData,
          storeId,
          produtos: products,
          promocoes: promotions,
          combos: combos
        });
      } else {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }

  function addToCart(p: any) {
    const exists = cart.find(i => i.id === p.id);
    if (exists) {
      setCart(cart.map(i => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i)));
    } else {
      setCart([...cart, { ...p, qty: 1 }]);
    }
  }

  function removeFromCart(id: string) {
    const item = cart.find(i => i.id === id);
    if (item && item.qty > 1) {
      setCart(cart.map(i => (i.id === id ? { ...i, qty: i.qty - 1 } : i)));
    } else {
      setCart(cart.filter(i => i.id !== id));
    }
  }

  function clearItemFromCart(id: string) {
    setCart(cart.filter(i => i.id !== id));
  }

  function total() {
    return cart.reduce((s, i) => s + i.price * i.qty, 0);
  }

  async function submit() {
    if (!data || !nomeCliente || !telefone) {
      alert("Preencha nome e telefone");
      return;
    }
    if (tipoEntrega === "delivery" && !endereco) {
      alert("Preencha o endereço para entrega");
      return;
    }

    try {
      const orderData = {
        customer: {
          name: nomeCliente,
          phone: telefone,
          address: tipoEntrega === "delivery" ? endereco : null
        },
        items: cart.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
          extras: i.extras || []
        })),
        subtotal: total(),
        discount: 0,
        total: total(),
        type: tipoEntrega,
        payment: {
          method: metodoPagamento,
          status: metodoPagamento === "pagar_agora" ? "paid" : "pending"
        },
        observations: observacoes,
        status: "new",
        orderNumber: Math.floor(Math.random() * 9000) + 1000,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, `stores/${data.storeId}/orders`), orderData);

      setCart([]);
      navigate(`/${slug}/pedido/${docRef.id}`);
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      alert("Erro ao enviar pedido. Tente novamente.");
    }
  }

  const categorias = ["todos", ...new Set(data?.produtos?.flatMap((p: any) => p.categories || []))];
  const produtosFiltrados = categoriaFiltro === "todos" 
    ? data?.produtos 
    : data?.produtos?.filter((p: any) => p.categories?.includes(categoriaFiltro));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">Carregando cardápio...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-6xl mb-4">😔</div>
          <div className="text-2xl font-bold text-gray-800 mb-2">Loja não encontrada</div>
          <div className="text-gray-600">Verifique o endereço e tente novamente</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* HEADER FIXO - PRIMACY EFFECT (Primeira Posição) */}
      <div className="bg-white shadow-lg sticky top-0 z-40 border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {data.logo ? (
                <img src={data.logo} className="h-16 w-16 object-contain rounded-full shadow-xl border-4 border-blue-100" alt={data.name} />
              ) : (
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-xl">
                  {data.name?.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-2">
                  {data.name}
                  <Award className="w-6 h-6 text-yellow-500" />
                </h1>
                <div className="flex items-center gap-4 text-sm mt-1">
                  <div className="flex items-center gap-1 text-green-600 font-bold">
                    <Clock className="w-4 h-4" />
                    <span>Aberto agora</span>
                  </div>
                  {data.averagePreparationTime && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Zap className="w-4 h-4" />
                      <span>{data.averagePreparationTime}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* BOTÃO CARRINHO - ANCHORING EFFECT */}
            <button
              onClick={() => setShowCart(true)}
              className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all"
            >
              <ShoppingCart className="w-7 h-7" />
              {cart.length > 0 && (
                <>
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-black w-8 h-8 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                    {cart.reduce((s, i) => s + i.qty, 0)}
                  </span>
                  <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                    R$ {total().toFixed(2)}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* BANNER/CAPA - ABOVE THE FOLD */}
        {data.bannerImage && (
          <div className="mb-8 rounded-3xl overflow-hidden shadow-2xl relative">
            <img src={data.bannerImage} className="w-full h-64 md:h-96 object-cover" alt="Banner" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
              <div className="text-white">
                <h2 className="text-4xl font-black mb-2">{data.description || "Bem-vindo!"}</h2>
                <div className="flex items-center gap-4">
                  {data.phone && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                      <Phone className="w-4 h-4" />
                      <span className="font-bold">{data.phone}</span>
                    </div>
                  )}
                  {data.address && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                      <MapPin className="w-4 h-4" />
                      <span className="font-bold">{data.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROMOÇÕES - TOP PLACEMENT (Efeito Primazia) */}
        {data.promocoes?.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 rounded-3xl p-1 shadow-2xl animate-pulse">
              <div className="bg-white rounded-3xl p-6">
                <h2 className="text-3xl font-black mb-4 flex items-center gap-3 text-gray-800">
                  <Gift className="w-8 h-8 text-red-500" />
                  🔥 Promoções Imperdíveis!
                  <Sparkles className="w-8 h-8 text-yellow-500" />
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {data.promocoes.map((promo: any) => (
                    <div key={promo.id} className="relative bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-4 border-yellow-300 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all overflow-hidden">
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-4 py-2 rounded-full font-black text-lg shadow-lg rotate-12">
                        -{promo.discount}%
                      </div>
                      {promo.imageUrl && (
                        <img src={promo.imageUrl} className="w-full h-32 object-cover rounded-xl mb-4" alt={promo.title} />
                      )}
                      <div className="font-black text-2xl text-gray-800 mb-2">{promo.title}</div>
                      <div className="text-gray-700 font-medium">{promo.description}</div>
                      {(promo.startDate || promo.endDate) && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-orange-700 font-bold">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {promo.endDate && `Válido até ${new Date(promo.endDate).toLocaleDateString()}`}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMBOS EM DESTAQUE - CHOICE ARCHITECTURE */}
        {data.combos?.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl p-1 shadow-2xl">
              <div className="bg-white rounded-3xl p-6">
                <h2 className="text-3xl font-black mb-4 flex items-center gap-3 text-gray-800">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  💰 Combos Especiais - Mais por Menos!
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {data.combos.map((combo: any) => (
                    <div key={combo.id} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl overflow-hidden border-4 border-green-300 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
                      {combo.imageUrl && (
                        <img src={combo.imageUrl} className="w-full h-48 object-cover" alt={combo.name} />
                      )}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-black text-xl text-gray-800">{combo.name}</h3>
                          <div className="bg-green-500 text-white px-3 py-1 rounded-full font-black text-sm">
                            COMBO
                          </div>
                        </div>
                        {combo.description && (
                          <p className="text-gray-700 mb-4 text-sm">{combo.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="text-3xl font-black text-green-600">
                            R$ {combo.price.toFixed(2)}
                          </div>
                          <button
                            onClick={() => addToCart({ ...combo, isCombo: true })}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full font-black hover:shadow-xl transform hover:scale-110 transition-all flex items-center gap-2"
                          >
                            <Plus className="w-5 h-5" />
                            Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FILTROS DE CATEGORIA - HEATMAP ATTENTION */}
        {categorias.length > 1 && (
          <div className="mb-6 sticky top-24 z-30 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categorias.map((cat: any) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaFiltro(cat)}
                  className={`px-6 py-3 rounded-full font-black whitespace-nowrap transition-all transform ${
                    categoriaFiltro === cat
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl scale-110"
                      : "bg-white text-gray-700 hover:bg-gray-100 shadow-lg hover:scale-105"
                  }`}
                >
                  {cat === "todos" ? "🍽️ Todos" : cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GRID DE PRODUTOS - Z-PATTERN LAYOUT */}
        <div className="mb-8">
          <h2 className="text-3xl font-black mb-6 flex items-center gap-3 text-gray-800">
            <Star className="w-8 h-8 text-yellow-500" />
            Nosso Cardápio
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-24">
            {produtosFiltrados?.map((p: any, idx: number) => (
              <div 
                key={p.id} 
                className={`bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-3xl transform hover:-translate-y-2 transition-all border-2 border-gray-100 hover:border-blue-300 ${
                  idx === 0 ? 'md:col-span-2 md:row-span-2' : '' // PRIMEIRO ITEM EM DESTAQUE - PRIMACY EFFECT
                }`}
              >
                <div className="relative">
                  {p.imageUrl ? (
                    <img 
                      src={p.imageUrl} 
                      className={`w-full object-cover ${idx === 0 ? 'h-96' : 'h-48'}`}
                      alt={p.name}
                    />
                  ) : (
                    <div className={`w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ${idx === 0 ? 'h-96' : 'h-48'}`}>
                      <Store className={`text-gray-400 ${idx === 0 ? 'w-32 h-32' : 'w-16 h-16'}`} />
                    </div>
                  )}
                  {p.available === false && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <span className="text-white font-black text-xl">Indisponível</span>
                    </div>
                  )}
                  {idx === 0 && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full font-black shadow-2xl flex items-center gap-2 animate-bounce">
                      <Star className="w-5 h-5" />
                      DESTAQUE
                    </div>
                  )}
                </div>
                <div className={`p-4 ${idx === 0 ? 'p-6' : ''}`}>
                  <h3 className={`font-black text-gray-800 mb-2 line-clamp-2 ${idx === 0 ? 'text-2xl' : 'text-lg'}`}>
                    {p.name}
                  </h3>
                  {p.description && (
                    <p className={`text-gray-600 mb-3 line-clamp-2 ${idx === 0 ? 'text-base' : 'text-sm'}`}>
                      {p.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`font-black text-green-600 ${idx === 0 ? 'text-4xl' : 'text-2xl'}`}>
                      R$ {Number(p.price).toFixed(2)}
                    </span>
                    <button
                      onClick={() => addToCart(p)}
                      disabled={p.available === false}
                      className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-black hover:shadow-2xl transform hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                        idx === 0 ? 'px-8 py-4 text-lg' : 'px-4 py-2'
                      }`}
                    >
                      <Plus className={idx === 0 ? 'w-6 h-6' : 'w-5 h-5'} />
                      {idx === 0 && 'Adicionar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DO CARRINHO - HIERARQUIA DE ATENÇÃO */}
      {showCart && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fadeIn">
          <div className="bg-white w-full md:max-w-3xl md:rounded-3xl rounded-t-3xl max-h-[95vh] overflow-y-auto shadow-2xl animate-slideUp">
            {/* HEADER DO CARRINHO - PRIMACY PLACEMENT */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 md:rounded-t-3xl rounded-t-3xl shadow-xl z-10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-3xl font-black flex items-center gap-3">
                  <ShoppingCart className="w-8 h-8" />
                  Meu Carrinho
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
                >
                  <X className="w-8 h-8" strokeWidth={3} />
                </button>
              </div>
              <div className="flex items-center gap-4 text-blue-100">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  <span className="font-bold">{cart.reduce((s, i) => s + i.qty, 0)} itens</span>
                </div>
                <div className="h-4 w-px bg-blue-300"></div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="font-bold">R$ {total().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart className="w-32 h-32 text-gray-300 mx-auto mb-6" />
                  <p className="text-2xl text-gray-500 font-black mb-2">Carrinho Vazio</p>
                  <p className="text-gray-400 mb-6">Adicione produtos deliciosos para continuar</p>
                  <button
                    onClick={() => setShowCart(false)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-black hover:shadow-xl transform hover:scale-105 transition-all"
                  >
                    Ver Cardápio
                  </button>
                </div>
              ) : (
                <>
                  {/* ITENS DO CARRINHO */}
                  <div className="space-y-4 mb-8">
                    {cart.map((i, idx) => (
                      <div 
                        key={i.id} 
                        className={`flex items-center gap-4 bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-2xl shadow-lg border-2 border-gray-200 hover:border-blue-300 transition-all ${
                          idx === 0 ? 'ring-4 ring-yellow-300 scale-105' : '' // PRIMEIRO ITEM - ANCHORING EFFECT
                        }`}
                      >
                        {i.imageUrl && (
                          <img src={i.imageUrl} className="w-20 h-20 object-cover rounded-xl shadow-md" alt={i.name} />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-lg text-gray-800 truncate">{i.name}</h4>
                          <p className="text-sm text-gray-600 font-bold">R$ {i.price.toFixed(2)} cada</p>
                          {i.isCombo && (
                            <span className="inline-block bg-green-100 text-green-700 text-xs font-black px-2 py-1 rounded-full mt-1">
                              COMBO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 bg-white rounded-full shadow-lg p-2">
                          <button
                            onClick={() => removeFromCart(i.id)}
                            className="w-10 h-10 bg-red-100 text-red-600 rounded-full hover:bg-red-200 flex items-center justify-center font-black transition-all transform hover:scale-110"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <span className="w-10 text-center font-black text-xl text-gray-800">{i.qty}</span>
                          <button
                            onClick={() => addToCart(i)}
                            className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 flex items-center justify-center font-black transition-all transform hover:scale-110"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-2xl text-green-600">
                            R$ {(i.price * i.qty).toFixed(2)}
                          </div>
                          <button
                            onClick={() => clearItemFromCart(i.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1 mt-1 hover:underline"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* TOTAL COM DESTAQUE - ANCHORING EFFECT */}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-2xl mb-8">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-green-100 font-bold mb-2 text-lg">Valor Total</div>
                        <div className="text-6xl font-black tracking-tight">
                          R$ {total().toFixed(2)}
                        </div>
                      </div>
                      <DollarSign className="w-24 h-24 text-white/30" strokeWidth={3} />
                    </div>
                  </div>

                  {/* TIPO DE ENTREGA - CHOICE ARCHITECTURE */}
                  <div className="mb-8">
                    <label className="block font-black text-gray-800 mb-4 text-xl flex items-center gap-2">
                      <Bike className="w-6 h-6" />
                      Como deseja receber?
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setTipoEntrega("delivery")}
                        className={`p-6 rounded-2xl font-black text-lg transition-all transform ${
                          tipoEntrega === "delivery"
                            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl scale-105 ring-4 ring-blue-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-lg hover:scale-105"
                        }`}
                      >
                        <Bike className="w-12 h-12 mx-auto mb-3" />
                        Delivery
                        {tipoEntrega === "delivery" && (
                          <div className="mt-2 text-sm text-blue-100">✓ Selecionado</div>
                        )}
                      </button>
                      <button
                        onClick={() => setTipoEntrega("retirada")}
                        className={`p-6 rounded-2xl font-black text-lg transition-all transform ${
                          tipoEntrega === "retirada"
                            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl scale-105 ring-4 ring-blue-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-lg hover:scale-105"
                        }`}
                      >
                        <Store className="w-12 h-12 mx-auto mb-3" />
                        Retirada
                        {tipoEntrega === "retirada" && (
                          <div className="mt-2 text-sm text-blue-100">✓ Selecionado</div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* MÉTODO DE PAGAMENTO */}
                  <div className="mb-8">
                    <label className="block font-black text-gray-800 mb-4 text-xl flex items-center gap-2">
                      <DollarSign className="w-6 h-6" />
                      Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setMetodoPagamento("pagar_agora")}
                        className={`p-6 rounded-2xl font-black transition-all transform ${
                          metodoPagamento === "pagar_agora"
                            ? "bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-2xl scale-105 ring-4 ring-green-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-lg hover:scale-105"
                        }`}
                      >
                        <div className="text-4xl mb-3">💳</div>
                        <div className="text-lg">Pagar Agora</div>
                        {metodoPagamento === "pagar_agora" && (
                          <div className="mt-2 text-sm text-green-100">✓ Selecionado</div>
                        )}
                      </button>
                      <button
                        onClick={() => setMetodoPagamento("pagar_retirada")}
                        className={`p-6 rounded-2xl font-black transition-all transform ${
                          metodoPagamento === "pagar_retirada"
                            ? "bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-2xl scale-105 ring-4 ring-green-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-lg hover:scale-105"
                        }`}
                      >
                        <div className="text-4xl mb-3">💵</div>
                        <div className="text-lg">
                          Pagar na {tipoEntrega === "delivery" ? "Entrega" : "Retirada"}
                        </div>
                        {metodoPagamento === "pagar_retirada" && (
                          <div className="mt-2 text-sm text-green-100">✓ Selecionado</div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* FORMULÁRIO - F-PATTERN LAYOUT */}
                  <div className="space-y-4 mb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200">
                      <h3 className="font-black text-xl text-gray-800 mb-4 flex items-center gap-2">
                        <User className="w-6 h-6 text-blue-600" />
                        Seus Dados
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block font-bold text-gray-700 mb-2 text-sm">Nome Completo *</label>
                          <input
                            className="w-full border-2 border-gray-300 p-4 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition font-medium text-lg"
                            placeholder="Digite seu nome"
                            value={nomeCliente}
                            onChange={e => setNomeCliente(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-2 text-sm">Telefone/WhatsApp *</label>
                          <input
                            className="w-full border-2 border-gray-300 p-4 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition font-medium text-lg"
                            placeholder="(00) 00000-0000"
                            type="tel"
                            value={telefone}
                            onChange={e => setTelefone(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {tipoEntrega === "delivery" && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-200">
                        <h3 className="font-black text-xl text-gray-800 mb-4 flex items-center gap-2">
                          <MapPin className="w-6 h-6 text-purple-600" />
                          Endereço de Entrega
                        </h3>
                        <div>
                          <label className="block font-bold text-gray-700 mb-2 text-sm">Endereço Completo *</label>
                          <input
                            className="w-full border-2 border-gray-300 p-4 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition font-medium text-lg"
                            placeholder="Rua, número, bairro, complemento..."
                            value={endereco}
                            onChange={e => setEndereco(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl border-2 border-amber-200">
                      <h3 className="font-black text-xl text-gray-800 mb-4 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-amber-600" />
                        Observações (Opcional)
                      </h3>
                      <textarea
                        className="w-full border-2 border-gray-300 p-4 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 focus:outline-none transition resize-none font-medium"
                        placeholder="Ex: sem cebola, ponto da carne, troco para..."
                        value={observacoes}
                        onChange={e => setObservacoes(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* CTA FINAL - PRIMACY + ANCHORING */}
                  <div className="space-y-4">
                    <button
                      onClick={submit}
                      className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white py-6 rounded-2xl text-2xl font-black shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                      <CheckCircle2 className="w-8 h-8" />
                      <span>Finalizar Pedido</span>
                      <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                    </button>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200 text-center">
                      <div className="font-black text-3xl text-green-600 mb-1">
                        R$ {total().toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 font-bold">
                        {cart.reduce((s, i) => s + i.qty, 0)} {cart.reduce((s, i) => s + i.qty, 0) === 1 ? 'item' : 'itens'} • {tipoEntrega === "delivery" ? "Delivery" : "Retirada"}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOTÃO FLUTUANTE DO CARRINHO - SEMPRE VISÍVEL */}
      {cart.length > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all z-40 animate-bounce"
        >
          <div className="relative">
            <ShoppingCart className="w-8 h-8" />
            <span className="absolute -top-3 -right-3 bg-red-500 text-white text-sm font-black w-8 h-8 rounded-full flex items-center justify-center">
              {cart.reduce((s, i) => s + i.qty, 0)}
            </span>
          </div>
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-black px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
            R$ {total().toFixed(2)}
          </div>
        </button>
      )}
    </div>
  );
}