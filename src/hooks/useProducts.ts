// src/hooks/useProducts.ts
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Product } from "../types/types";

export function useProducts(storeId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!storeId) return;

    const q = query(
      collection(db, `stores/${storeId}/products`),
      orderBy("name")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
        setProducts(arr);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [storeId]);

  return { products, loading, error };
}