import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore/lite";
import { decode } from "./store";
import type { AppState } from "../domain/model";
const env = import.meta.env;
export const cloudConfigured = Boolean(
  env.VITE_FIREBASE_API_KEY &&
  env.VITE_FIREBASE_PROJECT_ID &&
  env.VITE_FIREBASE_AUTH_DOMAIN &&
  env.VITE_FIREBASE_APP_ID,
);
const app = cloudConfigured
  ? initializeApp({
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    })
  : null;
export const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
export async function login(email: string, password: string) {
  if (!auth) throw new Error("Firebase não configurado.");
  await signInWithEmailAndPassword(auth, email, password);
}
export async function logout() {
  if (auth) await signOut(auth);
}
export async function backup(state: AppState) {
  if (!auth?.currentUser || !db)
    throw new Error("Entre na sua conta primeiro.");
  const payload = JSON.stringify(state);
  decode(payload);
  await setDoc(doc(db, "users", auth.currentUser.uid, "backups", "latest"), {
    schema: 1,
    payload,
    updatedAt: serverTimestamp(),
  });
}
export async function restore() {
  if (!auth?.currentUser || !db)
    throw new Error("Entre na sua conta primeiro.");
  const snap = await getDoc(
    doc(db, "users", auth.currentUser.uid, "backups", "latest"),
  );
  if (!snap.exists()) throw new Error("Esta conta ainda não tem backup.");
  return decode(snap.data().payload);
}
