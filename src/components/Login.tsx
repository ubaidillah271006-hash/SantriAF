import { useState, FormEvent } from "react";
import { motion } from "motion/react";
import { LogIn, Shield, Users } from "lucide-react";
import { cn } from "../lib/utils";

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Admin Putra check
    if (identifier === "pengurusafputra") {
      onLogin({ username: "Pengurus Putra", role: "admin", adminType: "putra" });
      return;
    }

    // Admin Putri check
    if (identifier === "pengurusafputri") {
      onLogin({ username: "Pengurus Putri", role: "admin", adminType: "putri" });
      return;
    }

    // Guardian check
    const allSantri = JSON.parse(localStorage.getItem("santri_data") || "[]");
    const found = allSantri.find((s: any) => s.noWa === identifier);

    if (found) {
      onLogin({ username: identifier, role: "guardian", linkedWa: identifier });
    } else {
      setError("Nomor WA atau Password Admin tidak terdaftar");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl"
      >
        <div className="bg-emerald-900 p-8 text-white text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl font-black text-emerald-900">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SantriAf</h1>
          <p className="text-emerald-100/60 text-sm font-medium">Sistem Informasi Manajemen Pesantren</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-500 border border-rose-100 font-medium italic">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 leading-none">
                Nomor WhatsApp Wali
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-medium text-slate-700"
                placeholder="Masukkan Nomor"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-600/20"
          >
            <LogIn size={20} />
            Masuk
          </button>
        </form>
      </motion.div>
    </div>
  );
}
