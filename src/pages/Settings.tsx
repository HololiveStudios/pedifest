// src/pages/Settings.tsx
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Save, MapPin, Phone, Mail, Clock, DollarSign, CreditCard, Banknote, Smartphone, Image as ImageIcon, Building2, Globe, Instagram, Facebook, MessageCircle } from "lucide-react";
import { slugify } from "../utils/slugify";

interface StoreSettings {
  name: string;
  slug: string;
  description: string;
  category: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  addressComplement: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  logo: string;
  coverImage: string;
  website: string;
  instagram: string;
  facebook: string;
  openingHours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  taxRate: number;
  deliveryFee: number;
  minOrderValue: number;
  maxDeliveryDistance: number;
  freeDeliveryMinValue: number;
  acceptCash: boolean;
  acceptCard: boolean;
  acceptPix: boolean;
  pixKey: string;
  enableScheduledOrders: boolean;
  enableTableOrders: boolean;
  enableTakeaway: boolean;
  enableDelivery: boolean;
  averagePreparationTime: string;
  notifications: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
}

export default function Settings() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [settings, setSettings] = useState<StoreSettings>({
    name: "",
    slug: "",
    description: "",
    category: "restaurant",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    addressComplement: "",
    city: "",
    state: "",
    zipCode: "",
    latitude: 0,
    longitude: 0,
    logo: "",
    coverImage: "",
    website: "",
    instagram: "",
    facebook: "",
    openingHours: {
      monday: { open: "09:00", close: "18:00", closed: false },
      tuesday: { open: "09:00", close: "18:00", closed: false },
      wednesday: { open: "09:00", close: "18:00", closed: false },
      thursday: { open: "09:00", close: "18:00", closed: false },
      friday: { open: "09:00", close: "18:00", closed: false },
      saturday: { open: "09:00", close: "14:00", closed: false },
      sunday: { open: "00:00", close: "00:00", closed: true },
    },
    taxRate: 0,
    deliveryFee: 0,
    minOrderValue: 0,
    maxDeliveryDistance: 5,
    freeDeliveryMinValue: 0,
    acceptCash: true,
    acceptCard: true,
    acceptPix: true,
    pixKey: "",
    enableScheduledOrders: false,
    enableTableOrders: false,
    enableTakeaway: true,
    enableDelivery: true,
    averagePreparationTime: "30-45 min",
    notifications: {
      email: true,
      sms: false,
      whatsapp: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "location" | "hours" | "payment" | "delivery" | "notifications">("info");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setLoading(false);
      const id = user.uid;
      setStoreId(id);
      const ref = doc(db, "stores", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as Partial<StoreSettings>;
        setSettings((prev) => ({ ...prev, ...data }));
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (settings.name) {
      setSettings(prev => ({ ...prev, slug: slugify(settings.name) }));
    }
  }, [settings.name]);

  const handleImageUpload = async (file: File, type: "logo" | "cover") => {
    if (!storeId) return "";
    const storageRef = ref(storage, `stores/${storeId}/${type}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSave = async () => {
    if (!storeId) return alert("Loja não identificada.");
    await setDoc(doc(db, "stores", storeId), settings, { merge: true });
    alert("✅ Configurações salvas com sucesso!");
  };

  if (loading) return <div className="p-6">Carregando...</div>;

  const publicLink = settings.slug ? `${window.location.origin}/${settings.slug}` : "";
  const dayNames: { [key: string]: string } = {
    monday: "Segunda",
    tuesday: "Terça",
    wednesday: "Quarta",
    thursday: "Quinta",
    friday: "Sexta",
    saturday: "Sábado",
    sunday: "Domingo"
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          Configurações da Loja
        </h1>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105 font-medium"
        >
          <Save size={20} />
          Salvar Tudo
        </button>
      </div>

      {publicLink && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">Link Público da Loja:</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={publicLink} target="_blank" className="flex-1 text-blue-600 underline truncate font-medium">{publicLink}</a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicLink);
                alert("🔗 Link copiado!");
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
            >
              Copiar
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "info", label: "Informações", icon: Building2 },
          { id: "location", label: "Localização", icon: MapPin },
          { id: "hours", label: "Horários", icon: Clock },
          { id: "payment", label: "Pagamento", icon: DollarSign },
          { id: "delivery", label: "Entrega", icon: Smartphone },
          { id: "notifications", label: "Notificações", icon: MessageCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 shadow"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {/* Informações Básicas */}
        {activeTab === "info" && (
          <section className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Informações da Empresa
            </h2>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome da Loja *</label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                    placeholder="Ex: Pizzaria do João"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Categoria</label>
                  <select
                    value={settings.category}
                    onChange={(e) => setSettings({ ...settings, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  >
                    <option value="restaurant">Restaurante</option>
                    <option value="fastfood">Fast Food</option>
                    <option value="pizzeria">Pizzaria</option>
                    <option value="bakery">Padaria</option>
                    <option value="cafe">Café</option>
                    <option value="market">Mercado</option>
                    <option value="pharmacy">Farmácia</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none transition"
                  rows={4}
                  placeholder="Conte sobre sua loja, especialidades, diferenciais..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Logo da Loja
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleImageUpload(file, "logo");
                        setSettings({ ...settings, logo: url });
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  />
                  {settings.logo && (
                    <img src={settings.logo} className="mt-3 h-24 w-24 object-contain border-2 border-gray-200 rounded-lg p-2" alt="Logo" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Imagem de Capa
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleImageUpload(file, "cover");
                        setSettings({ ...settings, coverImage: url });
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  />
                  {settings.coverImage && (
                    <img src={settings.coverImage} className="mt-3 h-24 w-full object-cover border-2 border-gray-200 rounded-lg" alt="Capa" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={settings.whatsapp}
                    onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                    placeholder="contato@loja.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={settings.website}
                    onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                    placeholder="https://seusite.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={settings.instagram}
                    onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                    placeholder="@sualoja"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={settings.facebook}
                    onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                    placeholder="facebook.com/sualoja"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Localização */}
        {activeTab === "location" && (
          <section className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              Localização
            </h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Endereço Completo</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  placeholder="Rua, número"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Complemento</label>
                <input
                  type="text"
                  value={settings.addressComplement}
                  onChange={(e) => setSettings({ ...settings, addressComplement: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  placeholder="Apartamento, sala, etc"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cidade</label>
                  <input
                    type="text"
                    value={settings.city}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Estado</label>
                  <input
                    type="text"
                    value={settings.state}
                    onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                    maxLength={2}
                    placeholder="UF"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CEP</label>
                  <input
                    type="text"
                    value={settings.zipCode}
                    onChange={(e) => setSettings({ ...settings, zipCode: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                    placeholder="00000-000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Latitude (GPS)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={settings.latitude}
                    onChange={(e) => setSettings({ ...settings, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                    placeholder="-23.550520"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Longitude (GPS)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={settings.longitude}
                    onChange={(e) => setSettings({ ...settings, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                    placeholder="-46.633308"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Horários */}
        {activeTab === "hours" && (
          <section className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Horários de Funcionamento
            </h2>
            <div className="space-y-3">
              {Object.entries(settings.openingHours).map(([day, hours]) => (
                <div key={day} className="grid grid-cols-4 gap-4 items-center p-3 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition">
                  <span className="font-medium">{dayNames[day]}</span>
                  <input
                    type="time"
                    value={hours.open}
                    disabled={hours.closed}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        openingHours: {
                          ...settings.openingHours,
                          [day]: { ...hours, open: e.target.value },
                        },
                      })
                    }
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <input
                    type="time"
                    value={hours.close}
                    disabled={hours.closed}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        openingHours: {
                          ...settings.openingHours,
                          [day]: { ...hours, close: e.target.value },
                        },
                      })
                    }
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hours.closed}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          openingHours: {
                            ...settings.openingHours,
                            [day]: { ...hours, closed: e.target.checked },
                          },
                        })
                      }
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span className="text-sm">Fechado</span>
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Tempo Médio de Preparo</label>
              <input
                type="text"
                value={settings.averagePreparationTime}
                onChange={(e) => setSettings({ ...settings, averagePreparationTime: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                placeholder="Ex: 30-45 min"
              />
            </div>
          </section>
        )}

        {/* Pagamento */}
        {activeTab === "payment" && (
          <section className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Métodos de Pagamento e Taxas
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4">Formas de Pagamento Aceitas</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={settings.acceptCash}
                      onChange={(e) => setSettings({ ...settings, acceptCash: e.target.checked })}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <Banknote className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Dinheiro</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={settings.acceptCard}
                      onChange={(e) => setSettings({ ...settings, acceptCard: e.target.checked })}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Cartão (Débito/Crédito)</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={settings.acceptPix}
                      onChange={(e) => setSettings({ ...settings, acceptPix: e.target.checked })}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <Smartphone className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">PIX</span>
                  </label>
                </div>
              </div>

              {settings.acceptPix && (
                <div>
                  <label className="block text-sm font-medium mb-2">Chave PIX</label>
                  <input
                    type="text"
                    value={settings.pixKey}
                    onChange={(e) => setSettings({ ...settings, pixKey: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                    placeholder="email@exemplo.com ou CPF/CNPJ ou telefone"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Taxa de Serviço (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.taxRate}
                    onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Valor Mínimo do Pedido (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.minOrderValue}
                    onChange={(e) => setSettings({ ...settings, minOrderValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Entrega */}
        {activeTab === "delivery" && (
          <section className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Smartphone className="w-6 h-6" />
              Opções de Entrega e Atendimento
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4">Modalidades Disponíveis</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={settings.enableDelivery}
                      onChange={(e) => setSettings({ ...settings, enableDelivery: e.target.checked })}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span className="font-medium">Delivery (Entrega)</span>
                  </label>
<label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={settings.enableTakeaway}
                      onChange={(e) => setSettings({ ...settings, enableTakeaway: e.target.checked })}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span className="font-medium">Retirada no Local</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={settings.enableTableOrders}
                      onChange={(e) => setSettings({ ...settings, enableTableOrders: e.target.checked })}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span className="font-medium">Pedidos na Mesa (QR Code)</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={settings.enableScheduledOrders}
                      onChange={(e) => setSettings({ ...settings, enableScheduledOrders: e.target.checked })}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span className="font-medium">Pedidos Agendados</span>
                  </label>
                </div>
              </div>

              {settings.enableDelivery && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <div>
                    <label className="block text-sm font-medium mb-2">Taxa de Entrega (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.deliveryFee}
                      onChange={(e) => setSettings({ ...settings, deliveryFee: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Distância Máxima (km)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={settings.maxDeliveryDistance}
                      onChange={(e) => setSettings({ ...settings, maxDeliveryDistance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Grátis Acima de (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.freeDeliveryMinValue}
                      onChange={(e) => setSettings({ ...settings, freeDeliveryMinValue: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                      placeholder="0 = sempre cobra"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Notificações */}
        {activeTab === "notifications" && (
          <section className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              Notificações de Pedidos
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">Escolha como deseja ser notificado quando receber novos pedidos:</p>
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    notifications: { ...settings.notifications, email: e.target.checked }
                  })}
                  className="w-5 h-5 cursor-pointer"
                />
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="font-medium block">Email</span>
                  <span className="text-sm text-gray-500">Receber notificações por email</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={settings.notifications.whatsapp}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    notifications: { ...settings.notifications, whatsapp: e.target.checked }
                  })}
                  className="w-5 h-5 cursor-pointer"
                />
                <MessageCircle className="w-5 h-5 text-green-600" />
                <div>
                  <span className="font-medium block">WhatsApp</span>
                  <span className="text-sm text-gray-500">Receber notificações via WhatsApp</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={settings.notifications.sms}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    notifications: { ...settings.notifications, sms: e.target.checked }
                  })}
                  className="w-5 h-5 cursor-pointer"
                />
                <Phone className="w-5 h-5 text-orange-600" />
                <div>
                  <span className="font-medium block">SMS</span>
                  <span className="text-sm text-gray-500">Receber notificações por mensagem de texto</span>
                </div>
              </label>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}