"use client";

import { useEffect, useState } from "react";
import { db, SaleTransaction, PaymentMethod } from "@/lib/db";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calculator, Banknote, Smartphone, CreditCard, RefreshCw } from "lucide-react";

type Breakdown = Record<PaymentMethod, number>;

export default function FechamentoPage() {
  const [transactions, setTransactions] = useState<SaleTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [breakdown, setBreakdown] = useState<Breakdown>({
    Dinheiro: 0,
    PIX: 0,
    Débito: 0,
    Crédito: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const txs = await db.transactions
        .where('timestamp')
        .aboveOrEqual(today)
        .toArray();

      setTransactions(txs);

      let sum = 0;
      const b: Breakdown = { Dinheiro: 0, PIX: 0, Débito: 0, Crédito: 0 };

      txs.forEach((tx) => {
        // Ensure old records from previous MVP test don't return undefined and cause NaN
        const currentTotal = tx.totalAmount || (tx as any).amount || 0;
        sum += currentTotal;
        
        if (tx.payments) {
           tx.payments.forEach(payment => {
              b[payment.method] += payment.amount || 0;
           });
        } else if ((tx as any).paymentMethod && (tx as any).amount) {
           // Fallback for old schema
           b[(tx as any).paymentMethod as PaymentMethod] += (tx as any).amount;
        }
      });

      setTotal(sum);
      setBreakdown(b);
    } catch (error) {
      console.error("Failed to load transactions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="p-4 flex flex-col max-w-md mx-auto relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Caixa de Hoje</h1>
          <p className="text-slate-500 text-sm">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <button 
          onClick={loadData}
          className="p-2 bg-white rounded-full shadow-sm text-slate-400 active:scale-95 transition-all"
        >
          <RefreshCw size={20} className={loading ? "animate-spin text-blue-500" : ""} />
        </button>
      </div>

      <div className="bg-blue-600 rounded-3xl p-6 text-white mb-6 shadow-md shadow-blue-200">
        <div className="flex items-center gap-2 text-blue-100 mb-1">
          <Calculator size={18} />
          <span className="font-medium">Total Arrecadado</span>
        </div>
        <span className="text-4xl font-bold">{formatCurrency(total)}</span>
        <div className="mt-4 pt-4 border-t border-blue-500/50 flex justify-between items-center text-sm">
          <span>Vendas do dia:</span>
          <span className="font-semibold px-2 py-1 bg-blue-700/50 rounded-lg">{transactions.length}</span>
        </div>
      </div>

      <h2 className="text-lg font-bold text-slate-800 mb-3 px-1">Resumo por Pagamento</h2>
      
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Banknote size={16} />
            <span className="text-xs font-semibold uppercase">Dinheiro</span>
          </div>
          <span className="text-lg font-bold text-slate-800">{formatCurrency(breakdown.Dinheiro)}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Smartphone size={16} />
            <span className="text-xs font-semibold uppercase">PIX</span>
          </div>
          <span className="text-lg font-bold text-slate-800">{formatCurrency(breakdown.PIX)}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <CreditCard size={16} />
            <span className="text-xs font-semibold uppercase">Débito</span>
          </div>
          <span className="text-lg font-bold text-slate-800">{formatCurrency(breakdown.Débito)}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <CreditCard size={16} />
            <span className="text-xs font-semibold uppercase">Crédito</span>
          </div>
          <span className="text-lg font-bold text-slate-800">{formatCurrency(breakdown.Crédito)}</span>
        </div>
      </div>
    </div>
  );
}
