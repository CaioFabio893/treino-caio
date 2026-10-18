import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
let env: RulesTestEnvironment;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-hybrid-strength",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
});
afterAll(async () => {
  await env?.cleanup();
});
const payload = () => ({
  schema: 1,
  payload: '{"schema":1}',
  updatedAt: serverTimestamp(),
});
describe("isolamento do backup por usuário", () => {
  it("dono cria, lê e exclui seu próprio backup", async () => {
    const db = env.authenticatedContext("alice").firestore();
    const ref = doc(db, "users/alice/backups/latest");
    await assertSucceeds(setDoc(ref, payload()));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(deleteDoc(ref));
  });
  it("anônimo não lê nem escreve", async () => {
    const ref = doc(
      env.unauthenticatedContext().firestore(),
      "users/alice/backups/latest",
    );
    await assertFails(setDoc(ref, payload()));
    await assertFails(getDoc(ref));
  });
  it("outra conta não lê, grava ou apaga por ID conhecido", async () => {
    await setDoc(
      doc(
        env.authenticatedContext("alice").firestore(),
        "users/alice/backups/latest",
      ),
      payload(),
    );
    const ref = doc(
      env.authenticatedContext("bob").firestore(),
      "users/alice/backups/latest",
    );
    await assertFails(getDoc(ref));
    await assertFails(setDoc(ref, payload()));
    await assertFails(deleteDoc(ref));
  });
  it("rejeita campos extras, versão inválida, timestamp forjado e outro ID", async () => {
    const db = env.authenticatedContext("alice").firestore();
    const ref = doc(db, "users/alice/backups/latest");
    await assertFails(setDoc(ref, { ...payload(), admin: true }));
    await assertFails(setDoc(ref, { ...payload(), schema: 2 }));
    await assertFails(setDoc(ref, { ...payload(), updatedAt: 0 }));
    await assertFails(setDoc(doc(db, "users/alice/backups/other"), payload()));
  });
  it("rejeita payload grande e qualquer coleção fora do escopo", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(
      setDoc(doc(db, "users/alice/backups/latest"), {
        ...payload(),
        payload: "x".repeat(900001),
      }),
    );
    await assertFails(setDoc(doc(db, "roles/alice"), { admin: true }));
    await assertFails(getDoc(doc(db, "roles/alice")));
  });
});
