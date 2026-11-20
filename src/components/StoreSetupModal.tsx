import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface Props {
  userId: string;
  onClose: () => void;
  onStoreCreated: (storeId: string) => void;
}

export default function StoreSetupModal({ userId, onClose, onStoreCreated }: Props) {
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateStore = async () => {
    if (!storeName.trim()) {
      setError("Digite o nome da loja");
      return;
    }

    try {
      setLoading(true);
      const storeId = userId; // ID da loja = ID do usuário

      await setDoc(doc(db, "stores", storeId), {
        name: storeName.trim(),
        ownerId: userId,
        createdAt: new Date().toISOString(),
        isActive: true,
      });

      await setDoc(doc(db, "users", userId), { storeId }, { merge: true });
      localStorage.setItem("storeId", storeId);
      onStoreCreated(storeId);
      onClose();
    } catch (err: any) {
      setError("Erro ao criar loja: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">Configurar Loja</h2>
        <p className="text-gray-600 text-center mb-4">
          Digite o nome da sua loja para finalizar o cadastro.
        </p>
        <input
          type="text"
          placeholder="Nome da loja"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <button
          onClick={handleCreateStore}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
