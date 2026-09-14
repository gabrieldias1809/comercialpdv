"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { db, SaleTransaction, PaymentMethod, CashEvent } from "@/lib/db";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calculator, Banknote, Smartphone, CreditCard, RefreshCw, Lock, Delete } from "lucide-react";

type Breakdown = Record<PaymentMethod, number>;

export default function FechamentoPage() {
  const [transactions, setTransactions] = useState<SaleTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [initialCash, setInitialCash] = useState(0);
  const [bleedTotal, setBleedTotal] = useState(0);
  const [isClosed, setIsClosed] = useState(false);

  const [breakdown, setBreakdown] = useState<Breakdown>({
    Dinheiro: 0,
    PIX: 0,
    Débito: 0,
    Crédito: 0,
  });
  const [loading, setLoading] = useState(true);

  // Closing state
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [countedCashStr, setCountedCashStr] = useState("0");

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      // Parse the selected date
      // We use the local timezone by splitting the YYYY-MM-DD
      const [year, month, day] = selectedDate.split('-').map(Number);
      
      const startOfDay = new Date(year, month - 1, day);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(year, month - 1, day);
      endOfDay.setHours(23, 59, 59, 999);

      const txs = await db.transactions
        .where('timestamp')
        .between(startOfDay, endOfDay, true, true)
        .toArray();

      setTransactions(txs);

      let sum = 0;
      const b: Breakdown = { Dinheiro: 0, PIX: 0, Débito: 0, Crédito: 0 };

      txs.forEach((tx) => {
        const currentTotal = tx.totalAmount || (tx as any).amount || 0;
        sum += currentTotal;
        
        if (tx.payments) {
           tx.payments.forEach(payment => {
              b[payment.method] += payment.amount || 0;
           });
        } else if ((tx as any).paymentMethod && (tx as any).amount) {
           b[(tx as any).paymentMethod as PaymentMethod] += (tx as any).amount;
        }
      });

      setTotal(sum);
      setBreakdown(b);

      const events = await db.cashEvents
        .where('timestamp')
        .between(startOfDay, endOfDay, true, true)
        .sortBy('timestamp');

      let openSum = 0;
      let bleedSum = 0;
      let closed = false;

      events.forEach(ev => {
        if (ev.type === 'OPEN') openSum += ev.amount;
        if (ev.type === 'BLEED') bleedSum += ev.amount;
        if (ev.type === 'CLOSE') closed = true;
      });

      setInitialCash(openSum);
      setBleedTotal(bleedSum);
      setIsClosed(closed);

    } catch (error) {
      console.error("Failed to load transactions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]); // Re-run when date changes

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const expectedCash = initialCash + breakdown.Dinheiro - bleedTotal;
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const handleKeyPress = (num: string) => {
    setCountedCashStr(prev => {
      if (prev === "0") return num;
      if (prev.length >= 8) return prev;
      return prev + num;
    });
  };

  const handleDelete = () => {
    setCountedCashStr(prev => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
  };

  const handleCloseRegister = async () => {
    const amount = parseInt(countedCashStr) / 100;
    const operatorPin = localStorage.getItem("operatorPin") || "0000";
    const storeId = localStorage.getItem("storeId") || "demo-store";

    await db.cashEvents.add({
      id: uuidv4(),
      storeId,
      operatorPin,
      type: 'CLOSE',
      amount,
      note: `Fechamento. Esperado: ${expectedCash}`,
      timestamp: new Date(),
      synced: false
    });

    setIsClosed(true);
    setShowCloseModal(false);
  };

  if (showCloseModal) {
    return (
      <div className="p-4 flex flex-col h-full max-w-md mx-auto relative bg-slate-50 min-h-[calc(100vh-140px)] justify-center">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Fechar Caixa</h2>
          <p className="text-slate-500 text-sm mb-6">Conte as notas na gaveta e digite o valor real encontrado.</p>
          
          <div className="bg-slate-50 rounded-2xl p-4 w-full mb-6 border border-slate-100 text-center">
            <span className="text-4xl font-bold text-slate-800 tracking-tight">
              {formatCurrency(parseInt(countedCashStr) / 100)}
            </span>
          </div>

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

          <div className="flex gap-3 w-full">
            <button 
              onClick={() => setShowCloseModal(false)}
              className="flex-1 p-4 bg-slate-200 text-slate-700 rounded-2xl font-bold active:scale-95 transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleCloseRegister}
              className="flex-1 p-4 bg-blue-600 text-white rounded-2xl font-bold active:scale-95 transition-all shadow-md shadow-blue-200"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col max-w-md mx-auto relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Fechamento</h1>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-slate-500 text-sm bg-slate-100 px-3 py-1.5 rounded-lg border-none outline-none font-medium cursor-pointer"
          />
        </div>
        <button 
          onClick={loadData}
          className="p-2 bg-white rounded-full shadow-sm text-slate-400 active:scale-95 transition-all mt-1"
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

      <h2 className="text-lg font-bold text-slate-800 mb-3 px-1">Fluxo de Gaveta</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
        <div className="flex justify-between items-center py-2 border-b border-slate-50 text-sm">
          <span className="text-slate-500">Fundo de Caixa (Abertura)</span>
          <span className="font-semibold text-slate-800">{formatCurrency(initialCash)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-50 text-sm">
          <span className="text-slate-500">Vendas em Dinheiro</span>
          <span className="font-semibold text-emerald-600">+{formatCurrency(breakdown.Dinheiro)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-50 text-sm">
          <span className="text-slate-500">Sangrias (Retiradas)</span>
          <span className="font-semibold text-red-500">-{formatCurrency(bleedTotal)}</span>
        </div>
        <div className="flex justify-between items-center pt-3 mt-1 text-base">
          <span className="font-bold text-slate-800">Saldo Esperado em Gaveta</span>
          <span className="font-bold text-blue-600">{formatCurrency(expectedCash)}</span>
        </div>
      </div>

      {isToday && !isClosed && (
        <button 
          onClick={() => setShowCloseModal(true)}
          className="w-full bg-slate-800 text-white p-4 rounded-2xl font-bold text-lg mb-4 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Lock size={20} /> Fechar Caixa do Dia
        </button>
      )}
      
      {isClosed && (
        <div className="w-full bg-emerald-100 text-emerald-800 p-4 rounded-2xl font-bold text-center mb-4 flex items-center justify-center gap-2">
          <Lock size={20} /> Caixa Fechado
        </div>
      )}

    </div>
  );
}
