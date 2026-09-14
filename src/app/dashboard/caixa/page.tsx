"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { ShieldAlert, Delete, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CaixaSangriaPage() {
  const [amountStr, setAmountStr] = useState("0");
  const [note, setNote] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleKeyPress = (num: string) => {
    setAmountStr(prev => {
      if (prev === "0") return num;
      if (prev.length >= 8) return prev;
      return prev + num;
    });
  };

  const handleDelete = () => {
    setAmountStr(prev => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
  };

  const displayAmount = formatCurrency(parseInt(amountStr) / 100);

  const handleSangria = async () => {
    const val = parseInt(amountStr) / 100;
    if (val <= 0) return;

    const operatorPin = localStorage.getItem("operatorPin") || "0000";
    const storeId = localStorage.getItem("storeId") || "demo-store";

    await db.cashEvents.add({
      id: uuidv4(),
      storeId,
      operatorPin,
      type: 'BLEED',
      amount: val,
      note: note.trim() || 'Sangria de Caixa',
      timestamp: new Date(),
      synced: false
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="p-4 flex flex-col max-w-md mx-auto relative min-h-[calc(100vh-140px)]">
      {showSuccess && (
        <div className="absolute inset-0 z-50 bg-green-500 rounded-3xl flex flex-col items-center justify-center text-white animate-in fade-in zoom-in duration-300">
          <CheckCircle2 size={80} className="mb-4" />
          <h2 className="text-3xl font-bold">Sangria Registrada!</h2>
        </div>
      )}

      <div className="flex flex-col items-center mb-6 mt-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Sangria de Caixa</h1>
        <p className="text-slate-500 text-sm text-center mt-2 px-4">
          Registre aqui as retiradas de dinheiro da gaveta para evitar acúmulos de notas.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center flex-1">
        
        <input 
          type="text" 
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Motivo (Opcional - Ex: Malote)"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 mb-4 outline-none focus:border-blue-400"
        />

        <div className="bg-slate-50 rounded-2xl p-4 w-full mb-6 border border-slate-100 text-center">
          <span className="text-4xl font-bold text-slate-800 tracking-tight">
            {displayAmount}
          </span>
        </div>

        {/* Virtual Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-6 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button key={num} onClick={() => handleKeyPress(num.toString())} className="h-12 rounded-2xl bg-white shadow-sm border border-slate-100 text-xl font-semibold text-slate-800 active:bg-slate-100 active:scale-95 transition-all">
              {num}
            </button>
          ))}
          <button onClick={() => handleKeyPress("00")} className="h-12 rounded-2xl bg-white shadow-sm border border-slate-100 text-lg font-semibold text-slate-800 active:bg-slate-100 active:scale-95 transition-all">
            00
          </button>
          <button onClick={() => handleKeyPress("0")} className="h-12 rounded-2xl bg-white shadow-sm border border-slate-100 text-xl font-semibold text-slate-800 active:bg-slate-100 active:scale-95 transition-all">
            0
          </button>
          <button onClick={handleDelete} className="h-12 rounded-2xl bg-slate-200 text-slate-600 active:bg-slate-300 active:scale-95 transition-all flex items-center justify-center">
            <Delete size={20} />
          </button>
        </div>

        <button 
          onClick={handleSangria}
          disabled={amountStr === "0"}
          className="w-full p-4 mt-auto bg-red-500 text-white rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-md shadow-red-200 disabled:opacity-50 disabled:active:scale-100"
        >
          Registrar Retirada
        </button>
      </div>
    </div>
  );
}
