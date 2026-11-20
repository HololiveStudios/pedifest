// src/hooks/useCombos.ts
import { useEffect, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Combo } from "../types/types";

export function useCombos(storeId: string) {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!storeId) return;

    const q = query(collection(db, `stores/${storeId}/combos`));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Combo));
        setCombos(arr);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [storeId]);

  return { combos, loading, error };
}