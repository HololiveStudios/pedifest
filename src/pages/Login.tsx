import { useState, useEffect} from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
  if (user) {
    navigate("/admin"); // ou a rota que você usa no app interno
  }
}, [user, navigate]);

  const ensureStoreExists = async (userId: string, userName: string) => {
    const storeRef = doc(db, "stores", userId);
    const storeDoc = await getDoc(storeRef);
    if (!storeDoc.exists()) {
      await setDoc(storeRef, {
        name: userName || "Minha Loja",
        ownerId: userId,
        createdAt: new Date().toISOString(),
        isActive: true,
      });
    }
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { storeId: userId }, { merge: true });
    return userId;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!storeName.trim()) {
          setError("Digite o nome da sua loja");
          return;
        }

        // Verifica se já existe loja com mesmo nome
        const nameQuery = query(
          collection(db, "stores"),
          where("name", "==", storeName.trim())
        );
        const nameSnap = await getDocs(nameQuery);
        if (!nameSnap.empty) {
          setError("Já existe uma loja com esse nome");
          return;
        }

        // Verifica se já existe usuário com mesmo e-mail
        const userQuery = query(
          collection(db, "users"),
          where("email", "==", email.trim())
        );
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          setError("Esse e-mail já está cadastrado");
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const storeId = await ensureStoreExists(
          userCredential.user.uid,
          storeName
        );

        await setDoc(
          doc(db, "users", userCredential.user.uid),
          {
            email,
            storeId,
          },
          { merge: true }
        );

        localStorage.setItem("storeId", storeId);
      } else {
        // Login: bloqueia se não existir no Firestore
        const emailQuery = query(
          collection(db, "users"),
          where("email", "==", email.trim())
        );
        const userSnap = await getDocs(emailQuery);
        if (userSnap.empty) {
          setError("Usuário não encontrado no sistema");
          return;
        }

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        if (!userDoc.exists()) {
          setError("Usuário sem registro no Firestore");
          return;
        }

        const storeId = userDoc.data()?.storeId;
        if (!storeId) {
          setError("Loja vinculada não encontrada");
          return;
        }

        localStorage.setItem("storeId", storeId);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isSignUp && !storeName.trim()) {
      setError("Digite o nome da sua loja antes de continuar com o Google");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      if (isSignUp) {
        const nameQuery = query(
          collection(db, "stores"),
          where("name", "==", storeName.trim())
        );
        const nameSnap = await getDocs(nameQuery);
        if (!nameSnap.empty) {
          setError("Já existe uma loja com esse nome");
          return;
        }

        const userQuery = query(
          collection(db, "users"),
          where("email", "==", result.user.email)
        );
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          setError("Esse e-mail já está cadastrado");
          return;
        }

        const storeId = await ensureStoreExists(
          result.user.uid,
          storeName || result.user.displayName || "Minha Loja"
        );
        await setDoc(
          doc(db, "users", result.user.uid),
          { email: result.user.email, storeId },
          { merge: true }
        );
        localStorage.setItem("storeId", storeId);
      } else {
        const emailQuery = query(
          collection(db, "users"),
          where("email", "==", result.user.email)
        );
        const userSnap = await getDocs(emailQuery);
        if (userSnap.empty) {
          setError("Usuário não encontrado no sistema");
          return;
        }

        const storeId = userSnap.docs[0].data().storeId;
        localStorage.setItem("storeId", storeId);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          OnPedido
        </h1>
        <p className="text-center text-gray-600 mb-6">
          {isSignUp ? "Crie sua conta e sua loja" : "Faça login na sua conta"}
        </p>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Nome da sua loja"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50"
          >
            {loading ? "Carregando..." : isSignUp ? "Cadastrar" : "Entrar"}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border border-gray-300 py-3 rounded-lg hover:bg-gray-50 font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5"
            />
            {isSignUp ? "Cadastrar com Google" : "Entrar com Google"}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setStoreName("");
            }}
            className="text-blue-600 hover:underline text-sm"
          >
            {isSignUp
              ? "Já tem conta? Faça login"
              : "Não tem conta? Cadastre-se"}
          </button>
        </div>
      </div>
    </div>
  );
}
