"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, AlertCircle, Database } from "lucide-react";

export default function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSetupMode, setIsSetupMode] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const endpoint = isSetupMode ? "/api/superadmin/setup" : "/api/superadmin/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro na autenticação.");
      }

      // If setup was successful, now login
      if (isSetupMode) {
        setIsSetupMode(false);
        setPassword("");
        alert("Conta de Super Admin criada! Agora faça o login.");
        return;
      }

      router.push("/superadmin/dashboard");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900">
      <div className="w-full max-w-sm flex flex-col">
        
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 p-4 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
            {isSetupMode ? <Database size={40} /> : <ShieldCheck size={40} />}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isSetupMode ? "Setup Inicial SaaS" : "Portal do Fundador"}
          </h1>
          <p className="text-slate-400 text-center mt-2 text-sm">
            {isSetupMode 
              ? "Crie sua credencial mestre para gerenciar a plataforma."
              : "Área restrita ao administrador da plataforma SaaS."}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-3xl shadow-xl flex flex-col gap-4 border border-slate-700">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1 ml-1">E-mail Administrativo</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1 ml-1">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 text-white rounded-xl p-4 font-bold mt-2 hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
          >
            {loading ? "Processando..." : (isSetupMode ? "Criar Conta Mestre" : "Acessar Plataforma")}
          </button>
        </form>

        <button 
          onClick={() => setIsSetupMode(!isSetupMode)}
          className="text-center text-xs text-slate-500 mt-6 hover:text-slate-300 transition-colors"
        >
          {isSetupMode ? "Já tenho conta, fazer login" : "Primeiro acesso? Configurar plataforma"}
        </button>
      </div>
    </main>
  );
}
