// src/pages/MenuEditor.tsx
import { useState, useEffect } from "react";
import { collection, addDoc, doc, getDoc, updateDoc, getDocs, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { useProducts } from "../hooks/useProducts";
import { useAuth } from "../hooks/useAuth";
import StoreSetupModal from "../components/StoreSetupModal";
import { slugify } from "../utils/slugify";
import { 
  Palette, Image, Clock, Tag, Gift, Settings, Link as LinkIcon, 
  Trash2, Plus, Edit, Info, ShoppingBag 
} from "lucide-react";

export default function MenuEditor() {
  const { user, loading: authLoading } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [activeTab, setActiveTab] = useState<"visual" | "combos" | "promocoes">("visual");

  // Configurações Visuais
  const [bannerImage, setBannerImage] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [secondaryColor, setSecondaryColor] = useState("#3b82f6");
  const [backgroundColor, setBackgroundColor] = useState("#f9fafb");
  const [textColor, setTextColor] = useState("#111827");
  const [cardColor, setCardColor] = useState("#ffffff");

  // Combos
  const [comboName, setComboName] = useState("");
  const [comboDescription, setComboDescription] = useState("");
  const [comboPrice, setComboPrice] = useState(0);
  const [comboImage, setComboImage] = useState("");
  const [selectedItems, setSelectedItems] = useState<{ productId: string; qty: number }[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [editingCombo, setEditingCombo] = useState<string | null>(null);

  // Promoções
  const [promoTitle, setPromoTitle] = useState("");
  const [promoDescription, setPromoDescription] = useState("");
  const [promoStartDate, setPromoStartDate] = useState("");
  const [promoEndDate, setPromoEndDate] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoImage, setPromoImage] = useState("");
  const [promocoes, setPromocoes] = useState<any[]>([]);
  const [editingPromo, setEditingPromo] = useState<string | null>(null);

  const { products } = useProducts(storeId || "");

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const fetchStore = async () => {
      const storeRef = doc(db, "stores", user.uid);
      const storeDoc = await getDoc(storeRef);

      if (storeDoc.exists()) {
        const data = storeDoc.data();
        setStoreId(user.uid);
        setBannerImage(data.bannerImage || "");
        setPrimaryColor(data.primaryColor || "#2563eb");
        setSecondaryColor(data.secondaryColor || "#3b82f6");
        setBackgroundColor(data.backgroundColor || "#f9fafb");
        setTextColor(data.textColor || "#111827");
        setCardColor(data.cardColor || "#ffffff");
      } else {
        setShowSetup(true);
      }
    };

    fetchStore();
  }, [user, authLoading]);

  useEffect(() => {
    if (storeId) {
      loadCombos();
      loadPromocoes();
    }
  }, [storeId]);

  const loadCombos = async () => {
    if (!storeId) return;
    const combosSnap = await getDocs(collection(db, `stores/${storeId}/combos`));
    setCombos(combosSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const loadPromocoes = async () => {
    if (!storeId) return;
    const promosSnap = await getDocs(collection(db, `stores/${storeId}/promotions`));
    setPromocoes(promosSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleImageUpload = async (file: File, type: "banner" | "combo" | "promo") => {
    if (!storeId) return "";
    const storageRef = ref(storage, `stores/${storeId}/${type}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const saveVisualSettings = async () => {
    if (!storeId) return;
    await updateDoc(doc(db, "stores", storeId), {
      bannerImage,
      primaryColor,
      secondaryColor,
      backgroundColor,
      textColor,
      cardColor
    });
    alert("✅ Configurações visuais salvas!");
  };

  const addItemToCombo = (productId: string) => {
    const existing = selectedItems.find((i) => i.productId === productId);
    if (existing) {
      setSelectedItems(selectedItems.map((i) =>
        i.productId === productId ? { ...i, qty: i.qty + 1 } : i
      ));
    } else {
      setSelectedItems([...selectedItems, { productId, qty: 1 }]);
    }
  };

  const removeItemFromCombo = (productId: string) => {
    setSelectedItems(selectedItems.filter(i => i.productId !== productId));
  };

  const handleSaveCombo = async () => {
    if (!comboName || selectedItems.length === 0 || !storeId) {
      alert("⚠️ Preencha todos os campos obrigatórios");
      return;
    }

    const comboData = {
      name: comboName,
      description: comboDescription,
      items: selectedItems,
      price: comboPrice,
      imageUrl: comboImage
    };

    if (editingCombo) {
      await updateDoc(doc(db, `stores/${storeId}/combos`, editingCombo), comboData);
      setEditingCombo(null);
      alert("✅ Combo atualizado!");
    } else {
      await addDoc(collection(db, `stores/${storeId}/combos`), comboData);
      alert("✅ Combo criado!");
    }

    setComboName("");
    setComboDescription("");
    setComboPrice(0);
    setComboImage("");
    setSelectedItems([]);
    loadCombos();
  };

  const editCombo = (combo: any) => {
    setComboName(combo.name);
    setComboDescription(combo.description || "");
    setComboPrice(combo.price);
    setComboImage(combo.imageUrl || "");
    setSelectedItems(combo.items || []);
    setEditingCombo(combo.id);
  };

  const deleteCombo = async (id: string) => {
    if (!storeId || !confirm("❌ Deseja realmente excluir este combo?")) return;
    await deleteDoc(doc(db, `stores/${storeId}/combos`, id));
    loadCombos();
    alert("✅ Combo excluído!");
  };

  const handleSavePromo = async () => {
    if (!promoTitle || !promoDescription || !storeId) {
      alert("⚠️ Preencha todos os campos obrigatórios");
      return;
    }

    const promoData = {
      title: promoTitle,
      description: promoDescription,
      startDate: promoStartDate,
      endDate: promoEndDate,
      discount: promoDiscount,
      imageUrl: promoImage,
      active: true
    };

    if (editingPromo) {
      await updateDoc(doc(db, `stores/${storeId}/promotions`, editingPromo), promoData);
      setEditingPromo(null);
      alert("✅ Promoção atualizada!");
    } else {
      await addDoc(collection(db, `stores/${storeId}/promotions`), promoData);
      alert("✅ Promoção criada!");
    }
    
    setPromoTitle("");
    setPromoDescription("");
    setPromoStartDate("");
    setPromoEndDate("");
    setPromoDiscount(0);
    setPromoImage("");
    loadPromocoes();
  };

  const editPromo = (promo: any) => {
    setPromoTitle(promo.title);
    setPromoDescription(promo.description || "");
    setPromoStartDate(promo.startDate || "");
    setPromoEndDate(promo.endDate || "");
    setPromoDiscount(promo.discount || 0);
    setPromoImage(promo.imageUrl || "");
    setEditingPromo(promo.id);
  };

  const deletePromo = async (id: string) => {
    if (!storeId || !confirm("❌ Deseja realmente excluir esta promoção?")) return;
    await deleteDoc(doc(db, `stores/${storeId}/promotions`, id));
    loadPromocoes();
    alert("✅ Promoção excluída!");
  };

  const togglePromoActive = async (id: string, currentStatus: boolean) => {
    if (!storeId) return;
    await updateDoc(doc(db, `stores/${storeId}/promotions`, id), {
      active: !currentStatus
    });
    loadPromocoes();
  };

  if (authLoading) return <div className="p-4">Carregando autenticação...</div>;
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

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Palette className="w-8 h-8" />
          Personalização do Cardápio
        </h1>
        <p className="text-gray-600">Configure a aparência, combos e promoções da sua loja</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab("visual")}
          className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "visual"
              ? "bg-blue-600 text-white shadow-lg scale-105"
              : "bg-white text-gray-700 hover:bg-gray-50 shadow"
          }`}
        >
          <Palette className="w-5 h-5" />
          Visual
        </button>
        <button
          onClick={() => setActiveTab("combos")}
          className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "combos"
              ? "bg-blue-600 text-white shadow-lg scale-105"
              : "bg-white text-gray-700 hover:bg-gray-50 shadow"
          }`}
        >
          <Tag className="w-5 h-5" />
          Combos
        </button>
        <button
          onClick={() => setActiveTab("promocoes")}
          className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "promocoes"
              ? "bg-blue-600 text-white shadow-lg scale-105"
              : "bg-white text-gray-700 hover:bg-gray-50 shadow"
          }`}
        >
          <Gift className="w-5 h-5" />
          Promoções
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === "visual" && (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Palette className="w-6 h-6" />
            Configurações Visuais
          </h2>
          
          {/* Banner */}
          <div className="mb-8">
            <label className="block font-medium mb-2 flex items-center gap-2">
              <Image className="w-5 h-5" />
              Banner da Loja
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await handleImageUpload(file, "banner");
                  setBannerImage(url);
                }
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
            />
            {bannerImage && (
              <div className="mt-3 p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                <img src={bannerImage} className="h-32 w-full object-cover rounded-lg" alt="Banner" />
              </div>
            )}
          </div>

          {/* Cores */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Paleta de Cores
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-2">Cor Primária</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>
              
              <div>
                <label className="block font-medium mb-2">Cor Secundária</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2">Cor de Fundo</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2">Cor do Texto</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium mb-2">Cor dos Cards</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={cardColor}
                    onChange={(e) => setCardColor(e.target.value)}
                    className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                  />
                  <input
                    type="text"
                    value={cardColor}
                    onChange={(e) => setCardColor(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-6 rounded-xl border-2 border-gray-200" style={{ backgroundColor }}>
              <p className="text-sm font-medium mb-3 text-gray-600">Preview:</p>
              <div className="space-y-3">
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: cardColor, color: textColor }}
                >
                  <p className="font-bold mb-1">Card de Produto</p>
                  <p className="text-sm opacity-75">Este é um exemplo de como seus cards vão aparecer</p>
                </div>
                <button 
                  className="px-6 py-3 rounded-lg font-bold text-white shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  Botão Primário
                </button>
                <button 
                  className="px-6 py-3 rounded-lg font-bold text-white shadow-lg"
                  style={{ backgroundColor: secondaryColor }}
                >
                  Botão Secundário
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={saveVisualSettings}
            className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all transform hover:scale-[1.02]"
          >
            Salvar Configurações Visuais
          </button>
        </div>
      )}

      {activeTab === "combos" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Tag className="w-6 h-6" />
              {editingCombo ? "Editar Combo" : "Criar Combo"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Nome do Combo *</label>
                <input
                  type="text"
                  value={comboName}
                  onChange={(e) => setComboName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  placeholder="Ex: Combo Executivo"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Descrição</label>
                <textarea
                  value={comboDescription}
                  onChange={(e) => setComboDescription(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none transition"
                  rows={3}
                  placeholder="Descreva o combo..."
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Preço (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={comboPrice}
                  onChange={(e) => setComboPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Imagem do Combo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await handleImageUpload(file, "combo");
                      setComboImage(url);
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                />
                {comboImage && (
                  <div className="mt-3 p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                    <img src={comboImage} className="h-32 w-full object-cover rounded-lg" alt="Combo" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Itens do Combo ({selectedItems.length})
                </h3>
                {selectedItems.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Info className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500 text-sm">Nenhum item selecionado</p>
                    <p className="text-gray-400 text-xs mt-1">Clique nos produtos ao lado para adicionar</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {selectedItems.map((item) => {
                      const product = products.find((p) => p.id === item.productId);
                      return (
                        <div key={item.productId} className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-3">
                            {product?.imageUrl && (
                              <img src={product.imageUrl} className="w-10 h-10 rounded object-cover" alt={product.name} />
                            )}
                            <span className="font-medium">{product?.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-blue-600 bg-white px-2 py-1 rounded">x{item.qty}</span>
                            <button
                              onClick={() => removeItemFromCombo(item.productId)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveCombo}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-[1.02]"
                >
                  {editingCombo ? "Atualizar Combo" : "Salvar Combo"}
                </button>
                {editingCombo && (
                  <button
                    onClick={() => {
                      setEditingCombo(null);
                      setComboName("");
                      setComboDescription("");
                      setComboPrice(0);
                      setComboImage("");
                      setSelectedItems([]);
                    }}
                    className="px-6 bg-gray-500 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Adicionar Produtos
              </h2>
              {products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum produto cadastrado</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center p-3 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                      onClick={() => product.id && addItemToCombo(product.id)}
                    >
                      <div className="flex items-center gap-3">
                        {product.imageUrl && (
                          <img src={product.imageUrl} className="w-12 h-12 object-cover rounded-lg" alt={product.name} />
                        )}
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">R$ {product.price.toFixed(2)}</span>
                        <Plus className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Combos Cadastrados
              </h2>
              {combos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Tag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum combo cadastrado</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-auto">
                  {combos.map((combo) => (
                    <div key={combo.id} className="border-2 border-gray-200 p-4 rounded-xl hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{combo.name}</h3>
                          {combo.description && (
                            <p className="text-sm text-gray-600 mt-1">{combo.description}</p>
                          )}
                        </div>
                        <span className="text-green-600 font-bold text-lg whitespace-nowrap ml-3">
                          R$ {combo.price.toFixed(2)}
                        </span>
                      </div>
                      {combo.imageUrl && (
                        <img src={combo.imageUrl} className="w-full h-32 object-cover rounded-lg mb-3" alt={combo.name} />
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => editCombo(combo)}
                          className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg font-medium hover:bg-blue-200 flex items-center justify-center gap-2 transition"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => deleteCombo(combo.id)}
                          className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-medium hover:bg-red-200 flex items-center justify-center gap-2 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "promocoes" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Gift className="w-6 h-6" />
              {editingPromo ? "Editar Promoção" : "Criar Promoção"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Título da Promoção *</label>
                <input
                  type="text"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  placeholder="Ex: Black Friday - 50% OFF"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Descrição *</label>
                <textarea
                  value={promoDescription}
                  onChange={(e) => setPromoDescription(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none transition"
                  rows={3}
                  placeholder="Descreva os detalhes da promoção..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={promoStartDate}
                    onChange={(e) => setPromoStartDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={promoEndDate}
                    onChange={(e) => setPromoEndDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-2">Desconto (%)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={promoDiscount}
                  onChange={(e) => setPromoDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  placeholder="Ex: 50"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Imagem da Promoção</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await handleImageUpload(file, "promo");
                      setPromoImage(url);
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                />
                {promoImage && (
                  <div className="mt-3 p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                    <img src={promoImage} className="h-32 w-full object-cover rounded-lg" alt="Promoção" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSavePromo}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-[1.02]"
                >
                  {editingPromo ? "Atualizar Promoção" : "Criar Promoção"}
                </button>
                {editingPromo && (
                  <button
                    onClick={() => {
                      setEditingPromo(null);
                      setPromoTitle("");
                      setPromoDescription("");
                      setPromoStartDate("");
                      setPromoEndDate("");
                      setPromoDiscount(0);
                      setPromoImage("");
                    }}
                    className="px-6 bg-gray-500 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Promoções Ativas
            </h2>
            {promocoes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Gift className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nenhuma promoção cadastrada</p>
                <p className="text-sm mt-1">Crie sua primeira promoção ao lado</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-auto">
                {promocoes.map((promo) => (
                  <div key={promo.id} className="border-2 border-gray-200 p-4 rounded-xl hover:shadow-lg transition-all">
                    {promo.imageUrl && (
                      <img src={promo.imageUrl} className="w-full h-40 object-cover rounded-lg mb-3" alt={promo.title} />
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{promo.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{promo.description}</p>
                      </div>
                      {promo.discount > 0 && (
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold ml-2">
                          -{promo.discount}%
                        </span>
                      )}
                    </div>
                    {(promo.startDate || promo.endDate) && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <Clock className="w-4 h-4" />
                        <span>
                          {promo.startDate && `De ${new Date(promo.startDate).toLocaleDateString()}`}
                          {promo.endDate && ` até ${new Date(promo.endDate).toLocaleDateString()}`}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => togglePromoActive(promo.id, promo.active)}
                        className={`flex-1 py-2 rounded-lg font-medium transition ${
                          promo.active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {promo.active ? "✓ Ativa" : "Inativa"}
                      </button>
                      <button
                        onClick={() => editPromo(promo)}
                        className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg font-medium hover:bg-blue-200 flex items-center justify-center gap-2 transition"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => deletePromo(promo.id)}
                        className="px-4 bg-red-100 text-red-700 py-2 rounded-lg font-medium hover:bg-red-200 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}