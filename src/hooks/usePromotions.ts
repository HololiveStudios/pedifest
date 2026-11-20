// src/hooks/usePromotions.ts
import { useEffect, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Promotion } from "../types/types";

export function usePromotions(storeId: string) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!storeId) return;

    const q = query(collection(db, `stores/${storeId}/promotions`));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Promotion));
        setPromotions(arr);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [storeId]);

  return { promotions, loading, error };
}