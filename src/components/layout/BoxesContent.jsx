import { createContext, useState, useRef, useEffect, useContext } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ToastContext } from "../../context/ToastContext";

export const BoxesContext = createContext();

export function BoxesProvider({ children }) {
  const [boxes, setBoxes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const counterRef            = useRef(1);
  const { addToast }          = useContext(ToastContext);

  // ── Wait for auth, then load devices ──────────────────────
  useEffect(() => {
    let unsub = () => {};

    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setBoxes([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "devices"),
        where("userId", "==", user.uid)
      );

      unsub = onSnapshot(
        q,
        (snapshot) => {
          const devices = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setBoxes(devices);
          setLoading(false);
          counterRef.current = devices.length + 1;
        },
        (error) => {
          console.error("Firestore error:", error);
          setLoading(false);
          addToast({ message: "❌ Failed to load devices", type: "error" });
        }
      );
    });

    return () => {
      authUnsub();
      unsub();
    };
  }, []);

  // ── Add device ────────────────────────────────────────────
  const addBox = async (deviceData) => {
    try {
      await addDoc(collection(db, "devices"), {
        ...deviceData,
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error adding device:", error);
      addToast({ message: "❌ Failed to add device", type: "error" });
    }
  };

  // ── Remove device ─────────────────────────────────────────
  const removeBox = async (id) => {
    try {
      await deleteDoc(doc(db, "devices", id));
    } catch (error) {
      console.error("Error removing device:", error);
      addToast({ message: "❌ Failed to remove device", type: "error" });
    }
  };

  // ── Update thresholds ─────────────────────────────────────
  const updateThresholds = async (id, thresholds) => {
    try {
      await updateDoc(doc(db, "devices", id), { thresholds });
    } catch (error) {
      console.error("Error updating thresholds:", error);
      addToast({ message: "❌ Failed to save thresholds", type: "error" });
    }
  };

  // ── Update axis ranges ────────────────────────────────────
  const updateAxisRanges = async (id, axisRanges) => {
    try {
      await updateDoc(doc(db, "devices", id), { axisRanges });
    } catch (error) {
      console.error("Error updating axis ranges:", error);
      addToast({ message: "❌ Failed to save chart axes", type: "error" });
    }
  };

  // ── Update card size ──────────────────────────────────────
  const updateCardSize = async (id, cardSize) => {
    try {
      await updateDoc(doc(db, "devices", id), { cardSize });
    } catch (error) {
      console.error("Error updating card size:", error);
      addToast({ message: "❌ Failed to save card size", type: "error" });
    }
  };

  // ── Update name ───────────────────────────────────────────
  const updateName = async (id, name) => {
    try {
      await updateDoc(doc(db, "devices", id), { name });
    } catch (error) {
      console.error("Error updating name:", error);
      addToast({ message: "❌ Failed to rename device", type: "error" });
    }
  };

  return (
    <BoxesContext.Provider
      value={{
        boxes,
        loading,
        addBox,
        removeBox,
        updateThresholds,
        updateAxisRanges,
        updateCardSize,
        updateName,
      }}
    >
      {children}
    </BoxesContext.Provider>
  );
}