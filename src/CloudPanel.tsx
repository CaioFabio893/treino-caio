import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Cloud, LogOut } from "lucide-react";
import {
  auth,
  backup,
  cloudConfigured,
  login,
  logout,
  restore,
} from "./data/cloud";
import { commit } from "./data/store";
import type { AppState } from "./domain/model";
export default function CloudPanel({
  state,
  run,
}: {
  state: AppState;
  run: (action: () => void | Promise<void>, success?: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(auth?.currentUser?.email ?? "");
  const [replace, setReplace] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (auth) return onAuthStateChanged(auth, (u) => setUser(u?.email ?? ""));
  }, []);
  return (
    <section className="card">
      <div className="section-title">
        <h3>Backup privado na nuvem</h3>
        <Cloud size={22} />
      </div>
      <p>
        Opcional: cópia manual por conta Firebase. Não há sincronização
        automática, mesclagem entre aparelhos ou confirmação de envio enquanto
        estiver offline.
      </p>
      {!cloudConfigured ? (
        <div className="notice">
          Firebase ainda não configurado. O app funciona localmente. Instruções
          em README.md e .env.example.
        </div>
      ) : user ? (
        <>
          <p>
            Conta: <strong>{user}</strong>. Os dados locais continuam neste
            navegador ao sair da conta; use apenas seu próprio aparelho.
          </p>
          <div className="button-row">
            <button
              className="button primary"
              disabled={saving || !navigator.onLine}
              onClick={() => {
                setSaving(true);
                void run(async () => {
                  await backup(state);
                }, "Backup confirmado pelo servidor.").finally(() =>
                  setSaving(false),
                );
              }}
            >
              {saving ? "Enviando…" : "Substituir backup desta conta"}
            </button>
            <button
              className="button secondary"
              onClick={() =>
                void run(
                  logout,
                  "Conta desconectada; dados locais preservados.",
                )
              }
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
          <label className="check-line">
            <input
              type="checkbox"
              checked={replace}
              onChange={(e) => setReplace(e.target.checked)}
            />
            Já exportei uma cópia. Quero substituir este aparelho pelo backup da
            conta.
          </label>
          <button
            className="button secondary"
            disabled={!replace || saving || !navigator.onLine}
            onClick={() =>
              void run(async () => {
                const remote = await restore();
                await commit(() => remote);
                setReplace(false);
              }, "Backup da conta restaurado no aparelho.")
            }
          >
            Restaurar da nuvem
          </button>
        </>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              await login(email, password);
              setPassword("");
            }, "Conta conectada. Nenhum dado foi enviado automaticamente.");
          }}
        >
          <div className="form-grid">
            <label className="field">
              <span>E-mail da conta existente</span>
              <input
                required
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Senha</span>
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>
          <button className="button secondary" type="submit">
            Entrar no Firebase
          </button>
          <p className="subtle">
            A conta precisa ser criada pelo responsável no Firebase
            Authentication. Não são criadas contas ou permissões
            automaticamente.
          </p>
        </form>
      )}
    </section>
  );
}
