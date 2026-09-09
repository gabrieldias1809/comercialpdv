"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, CloudDownload, AlertCircle } from "lucide-react";
import { db } from "@/lib/db";

export default function SetupPage() {
  const [email, setEmail] = useState("demo@mercadinho.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro na autenticação da loja.");
      }

      // Store the tenant ID (storeId) locally
      localStorage.setItem("storeId", data.storeId);
      
      // Clear existing operators and sync with the cloud
      await db.operators.clear();
      if (data.operators && data.operators.length > 0) {
        await db.operators.bulkAdd(
          data.operators.map((op: any) => ({
            pin: op.pin,
            name: op.name,
            role: op.role,
            storeId: data.storeId
          }))
        );
      }

      // Redirect to the Operator PIN screen
      router.push("/login");

    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm flex flex-col">
        
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
            <CloudDownload size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Ativar Maquininha</h1>
          <p className="text-slate-500 text-center mt-2 text-sm">
            Faça login com a conta da sua loja para baixar os operadores e habilitar as vendas offline neste dispositivo.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSetup} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1 ml-1">Email da Loja</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-slate-800 shadow-inner outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1 ml-1">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-slate-800 shadow-inner outline-none"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl p-4 font-bold mt-2 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-md shadow-blue-200"
          >
            {loading ? "Sincronizando..." : "Conectar Loja"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Mercadinho PDV SaaS
        </p>
      </div>
    </main>
  );
}
