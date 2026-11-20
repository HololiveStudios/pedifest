// src/pages/ProductsPage.tsx
import { useEffect, useState } from "react";
import { 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  Timestamp, 
  getDocs 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import type { Product } from "../types/types";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  Save, 
  X, 
  Search,
  Filter,
  Package,
  DollarSign,
  Tag,
  Eye,
  EyeOff,
  TrendingUp,
  Camera
} from "lucide-react";

const CACHE_KEY = "cached_products";
const CACHE_TTL = 10 * 60 * 1000;

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    available: true,
    categories: [],
    imageUrl: ""
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const localStoreId = localStorage.getItem("storeId");
    if (localStoreId) {
      setStoreId(localStoreId);
      loadProducts(localStoreId);
      return;
    }

    const loadStoreAndProducts = async () => {
      try {
        const storeRef = doc(db, "stores", user.uid);
        const storeDoc = await getDoc(storeRef);
        if (storeDoc.exists()) {
          setStoreId(user.uid);
          localStorage.setItem("storeId", user.uid);
          await loadProducts(user.uid);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Erro ao carregar loja:", err);
        setLoading(false);
      }
    };

    loadStoreAndProducts();
  }, [user, authLoading]);

  useEffect(() => {
    let result = products;

    if (searchTerm) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter(p => p.categories?.includes(categoryFilter));
    }

    setFilteredProducts(result);
  }, [products, searchTerm, categoryFilter]);

  const loadProducts = async (id: string) => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        setProducts(data);
        setFilteredProducts(data);
        setLoading(false);
        return;
      }
    }

    try {
      const querySnap = await getDocs(collection(db, `stores/${id}/products`));
      const list: Product[] = [];
      querySnap.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Product));
      setProducts(list);
      setFilteredProducts(list);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: list, timestamp: Date.now() }));
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile || !storeId) return "";
    
    setUploading(true);
    try {
      const storageRef = ref(storage, `stores/${storeId}/products/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      return "";
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;

    try {
      let imageUrl = formData.imageUrl || "";
      
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const productData = {
        ...formData,
        imageUrl,
        updatedAt: Timestamp.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, `stores/${storeId}/products`, editingId), productData);
        const updatedProducts = products.map(p => 
          p.id === editingId ? { ...p, ...productData } : p
        );
        setProducts(updatedProducts);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: updatedProducts, timestamp: Date.now() }));
        alert("✅ Produto atualizado com sucesso!");
      } else {
        const newProductData = {
          ...productData,
          createdAt: Timestamp.now(),
        };
        
        const docRef = await addDoc(collection(db, `stores/${storeId}/products`), newProductData);
        const newProduct: Product = { ...newProductData, id: docRef.id } as Product;
        const updatedProducts = [...products, newProduct];
        setProducts(updatedProducts);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: updatedProducts, timestamp: Date.now() }));
        alert("✅ Produto criado com sucesso!");
      }

      resetForm();
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      alert("❌ Erro ao salvar produto");
    }
  };

  const handleEdit = (product: Product) => {
    setFormData(product);
    setEditingId(product.id!);
    setImagePreview(product.imageUrl || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!storeId || !confirm("❌ Deseja realmente excluir este produto?")) return;

    try {
      await deleteDoc(doc(db, `stores/${storeId}/products`, id));
      const updatedProducts = products.filter(p => p.id !== id);
      setProducts(updatedProducts);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: updatedProducts, timestamp: Date.now() }));
      alert("✅ Produto excluído com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
      alert("❌ Erro ao excluir produto");
    }
  };

  const toggleAvailability = async (product: Product) => {
    if (!storeId || !product.id) return;

    try {
      const newAvailability = !product.available;
      await updateDoc(doc(db, `stores/${storeId}/products`, product.id), {
        available: newAvailability,
        updatedAt: Timestamp.now()
      });

      const updatedProducts = products.map(p =>
        p.id === product.id ? { ...p, available: newAvailability } : p
      );
      setProducts(updatedProducts);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: updatedProducts, timestamp: Date.now() }));
    } catch (err) {
      console.error("Erro ao atualizar disponibilidade:", err);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", price: 0, available: true, categories: [], imageUrl: "" });
    setEditingId(null);
    setShowForm(false);
    setImageFile(null);
    setImagePreview("");
  };

  const allCategories = ["all", ...new Set(products.flatMap(p => p.categories || []))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">Carregando produtos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-800 flex items-center gap-3">
            <Package className="w-10 h-10 text-blue-600" />
            Produtos
          </h1>
          <p className="text-gray-600 mt-2">Gerencie o cardápio da sua loja</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? "Cancelar" : "Novo Produto"}
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-100 font-medium mb-1">Total</div>
              <div className="text-4xl font-black">{products.length}</div>
            </div>
            <Package className="w-12 h-12 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-100 font-medium mb-1">Disponíveis</div>
              <div className="text-4xl font-black">{products.filter(p => p.available).length}</div>
            </div>
            <Eye className="w-12 h-12 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-red-100 font-medium mb-1">Indisponíveis</div>
              <div className="text-4xl font-black">{products.filter(p => !p.available).length}</div>
            </div>
            <EyeOff className="w-12 h-12 text-red-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-purple-100 font-medium mb-1">Categorias</div>
              <div className="text-4xl font-black">{allCategories.length - 1}</div>
            </div>
            <Tag className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border-2 border-gray-100">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-gray-800">
            {editingId ? <Edit className="w-7 h-7 text-blue-600" /> : <Plus className="w-7 h-7 text-green-600" />}
            {editingId ? "Editar Produto" : "Novo Produto"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold text-gray-700 mb-2">Nome do Produto *</label>
                <input
                  type="text"
                  placeholder="Ex: Pizza Margherita"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-2">Preço (R$) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-2">Descrição</label>
              <textarea
                placeholder="Descreva seu produto..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition resize-none"
                rows={4}
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-2">Categorias</label>
              <input
                type="text"
                placeholder="Ex: Pizzas, Bebidas (separadas por vírgula)"
                value={formData.categories?.join(", ")}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  categories: e.target.value.split(",").map(c => c.trim()).filter(Boolean)
                })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Imagem do Produto
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  {imagePreview ? (
                    <img src={imagePreview} className="max-h-64 mx-auto rounded-lg mb-4" alt="Preview" />
                  ) : (
                    <div className="text-gray-400 mb-4">
                      <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                      <p className="font-medium">Clique para adicionar uma imagem</p>
                    </div>
                  )}
                  <div className="bg-blue-100 text-blue-700 px-6 py-3 rounded-lg inline-block font-bold hover:bg-blue-200 transition">
                    {imagePreview ? "Trocar Imagem" : "Escolher Imagem"}
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                className="w-6 h-6 cursor-pointer"
                id="available"
              />
              <label htmlFor="available" className="font-bold text-gray-700 cursor-pointer">
                Produto disponível para venda
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-black text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Save className="w-6 h-6" />
                    {editingId ? "Atualizar Produto" : "Salvar Produto"}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-8 bg-gray-500 text-white py-4 rounded-xl font-black hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-gray-100">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition appearance-none cursor-pointer"
            >
              {allCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "Todas as Categorias" : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-600 mb-2">Nenhum produto encontrado</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || categoryFilter !== "all" 
              ? "Tente ajustar os filtros de busca" 
              : "Comece adicionando seu primeiro produto"}
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Adicionar Produto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all border-2 border-gray-100"
            >
              <div className="relative">
                {product.imageUrl ? (
                  <img src={product.imageUrl} className="w-full h-56 object-cover" alt={product.name} />
                ) : (
                  <div className="w-full h-56 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <ImageIcon className="w-20 h-20 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => toggleAvailability(product)}
                    className={`p-3 rounded-full shadow-xl backdrop-blur-sm transition-all transform hover:scale-110 ${
                      product.available 
                        ? "bg-green-500/90 text-white" 
                        : "bg-red-500/90 text-white"
                    }`}
                  >
                    {product.available ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-black text-xl text-gray-800 flex-1">{product.name}</h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-black ${
                    product.available 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700"
                  }`}>
                    {product.available ? "Disponível" : "Indisponível"}
                  </div>
                </div>

                {product.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                )}

                {product.categories && product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                  <div className="text-3xl font-black text-green-600">
                    R$ {product.price.toFixed(2)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="bg-blue-100 text-blue-700 p-3 rounded-xl hover:bg-blue-200 transition transform hover:scale-110"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id!)}
                      className="bg-red-100 text-red-700 p-3 rounded-xl hover:bg-red-200 transition transform hover:scale-110"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}