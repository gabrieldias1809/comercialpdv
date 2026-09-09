"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { db, PaymentMethod, SaleItem, SalePayment } from "@/lib/db";
import { Banknote, CreditCard, Smartphone, CheckCircle2, Delete, Plus, ShoppingCart, Trash2, ArrowRight, X } from "lucide-react";

export default function DashboardPage() {
  const [amountStr, setAmountStr] = useState("0");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Modals state
  const [showReview, setShowReview] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Payment state
  const [payments, setPayments] = useState<SalePayment[]>([]);
  const [payAmountStr, setPayAmountStr] = useState("0");

  // Format utility
  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Add Item to Cart
  const displayAmount = formatCurrency(parseInt(amountStr) / 100);
  
  const handleKeyPressItem = (num: string) => {
    setAmountStr(prev => {
      if (prev === "0") return num;
      if (prev.length >= 8) return prev;
      return prev + num;
    });
  };

  const handleDeleteItem = () => {
    setAmountStr(prev => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
  };

  const addItem = () => {
    const val = parseInt(amountStr) / 100;
    if (val <= 0 || !description.trim()) return;
    setItems(prev => [...prev, {
      id: uuidv4(),
      description: description.trim(),
      amount: val
    }]);
    setAmountStr("0");
    setDescription("");
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const totalAmount = items.reduce((acc, curr) => acc + curr.amount, 0);

  // Payment Logic
  const displayPayAmount = formatCurrency(parseInt(payAmountStr) / 100);
  const totalPaid = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const remaining = totalAmount - totalPaid;

  const handleKeyPressPay = (num: string) => {
    setPayAmountStr(prev => {
      if (prev === "0") return num;
      if (prev.length >= 8) return prev;
      return prev + num;
    });
  };

  const handleDeletePay = () => {
    setPayAmountStr(prev => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
  };

  const addPayment = async (method: PaymentMethod) => {
    let val = parseInt(payAmountStr) / 100;
    if (val <= 0) val = remaining; // Se estiver zerado, tenta pagar o total restante (atalho útil)
    if (val > remaining) val = remaining; // Não permite troco no sistema por enquanto, ajusta ao limite
    
    const newPayment = { id: uuidv4(), method, amount: val };
    const newPaymentsList = [...payments, newPayment];
    
    setPayments(newPaymentsList);
    setPayAmountStr("0");

    const newTotalPaid = newPaymentsList.reduce((acc, curr) => acc + curr.amount, 0);

    // Se atingiu o total, finaliza a venda automaticamente
    if (newTotalPaid >= totalAmount) {
      await finalizeSale(newPaymentsList);
    }
  };

  const finalizeSale = async (finalPayments: SalePayment[]) => {
    const operatorPin = localStorage.getItem("operatorPin") || "0000";
    const storeId = localStorage.getItem("storeId") || "demo-store";

    try {
      await db.transactions.add({
        id: uuidv4(),
        storeId,
        items,
        payments: finalPayments,
        totalAmount,
        operatorPin,
        timestamp: new Date(),
        synced: false,
      });

      // Cleanup & Show Success
      setShowPayment(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        setItems([]);
        setPayments([]);
        setShowSuccess(false);
      }, 1500);

    } catch (error) {
      console.error("Failed to save transaction:", error);
      alert("Erro ao salvar a venda.");
    }
  };

  // -------------------------------------------------------------
  // RENDER: Modal de Revisão
  // -------------------------------------------------------------
  if (showReview) {
    return (
      <div className="p-4 flex flex-col h-full max-w-md mx-auto relative bg-slate-50 min-h-[calc(100vh-140px)]">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Revisão da Venda</h2>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 mb-4 flex-1 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
              <span className="text-slate-700">{item.description}</span>
              <span className="font-semibold text-slate-800">{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
        
        <div className="bg-blue-600 rounded-3xl p-6 text-white mb-6">
          <p className="text-blue-200 text-sm mb-1">Total da Venda</p>
          <p className="text-4xl font-bold">{formatCurrency(totalAmount)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button 
            onClick={() => setShowReview(false)}
            className="p-4 rounded-2xl font-bold text-slate-600 bg-slate-200 active:scale-95 transition-all"
          >
            Corrigir Itens
          </button>
          <button 
            onClick={() => {
              setShowReview(false);
              setShowPayment(true);
              setPayAmountStr((Math.round(totalAmount * 100)).toString()); // Preenche com o total por padrão
            }}
            className="p-4 rounded-2xl font-bold text-white bg-blue-600 active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            Pagar <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Modal de Pagamento Misto
  // -------------------------------------------------------------
  if (showPayment) {
    return (
      <div className="p-4 flex flex-col h-full max-w-md mx-auto relative bg-slate-50 min-h-[calc(100vh-140px)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Pagamento</h2>
          <button onClick={() => { setShowPayment(false); setShowReview(true); }} className="p-2 bg-slate-200 rounded-full text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 mb-4">
           <div className="flex justify-between items-center mb-2">
             <span className="text-slate-500">Total a Pagar</span>
             <span className="font-bold">{formatCurrency(totalAmount)}</span>
           </div>
           {payments.length > 0 && (
             <div className="border-t border-slate-100 mt-2 pt-2">
               <span className="text-slate-500 text-sm block mb-1">Já pago:</span>
               {payments.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-sm mb-1">
                    <span className="text-emerald-600">{p.method}</span>
                    <span className="font-semibold">{formatCurrency(p.amount)}</span>
                  </div>
               ))}
             </div>
           )}
           <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 bg-slate-50 p-2 rounded-xl">
             <span className="text-red-500 font-semibold">Falta Pagar</span>
             <span className="text-xl font-bold text-red-600">{formatCurrency(remaining)}</span>
           </div>
        </div>

        {/* Amount Display */}
        <div className="bg-white rounded-3xl shadow-sm p-4 mb-4 flex items-center justify-center border border-slate-100">
          <span className="text-4xl font-bold text-slate-800 tracking-tight">{displayPayAmount}</span>
        </div>

        {/* Virtual Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-4 px-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button key={num} onClick={() => handleKeyPressPay(num.toString())} className="h-12 rounded-2xl bg-white shadow-sm text-xl font-semibold text-slate-800 active:bg-slate-100 active:scale-95 transition-all">
              {num}
            </button>
          ))}
          <button onClick={() => handleKeyPressPay("00")} className="h-12 rounded-2xl bg-white shadow-sm text-lg font-semibold text-slate-800 active:bg-slate-100 active:scale-95 transition-all">
            00
          </button>
          <button onClick={() => handleKeyPressPay("0")} className="h-12 rounded-2xl bg-white shadow-sm text-xl font-semibold text-slate-800 active:bg-slate-100 active:scale-95 transition-all">
            0
          </button>
          <button onClick={handleDeletePay} className="h-12 rounded-2xl bg-slate-200 text-slate-600 active:bg-slate-300 active:scale-95 transition-all flex items-center justify-center">
            <Delete size={20} />
          </button>
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <button onClick={() => addPayment("Dinheiro")} className="flex flex-col items-center justify-center p-3 bg-emerald-100 text-emerald-700 rounded-2xl active:scale-95 transition-all h-20">
            <Banknote size={24} className="mb-1" />
            <span className="font-semibold text-sm">Dinheiro</span>
          </button>
          <button onClick={() => addPayment("PIX")} className="flex flex-col items-center justify-center p-3 bg-teal-100 text-teal-700 rounded-2xl active:scale-95 transition-all h-20">
            <Smartphone size={24} className="mb-1" />
            <span className="font-semibold text-sm">PIX</span>
          </button>
          <button onClick={() => addPayment("Débito")} className="flex flex-col items-center justify-center p-3 bg-blue-100 text-blue-700 rounded-2xl active:scale-95 transition-all h-20">
            <CreditCard size={24} className="mb-1" />
            <span className="font-semibold text-sm">Débito</span>
          </button>
          <button onClick={() => addPayment("Crédito")} className="flex flex-col items-center justify-center p-3 bg-indigo-100 text-indigo-700 rounded-2xl active:scale-95 transition-all h-20">
            <CreditCard size={24} className="mb-1" />
            <span className="font-semibold text-sm">Crédito</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Tela Inicial (Carrinho de Produtos)
  // -------------------------------------------------------------
  return (
    <div className="p-4 flex flex-col h-full max-w-md mx-auto relative min-h-[calc(100vh-140px)]">
      {/* Success Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 z-50 bg-green-500 rounded-3xl flex flex-col items-center justify-center text-white animate-in fade-in zoom-in duration-300">
          <CheckCircle2 size={80} className="mb-4" />
          <h2 className="text-3xl font-bold">Venda Finalizada!</h2>
        </div>
      )}

      {/* Cart Area */}
      <div className="flex-1 bg-white rounded-3xl p-4 shadow-sm border border-slate-100 mb-4 flex flex-col">
        <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold border-b border-slate-100 pb-2">
          <ShoppingCart size={20} />
          <span>Carrinho ({items.length})</span>
        </div>
        
        <div className="flex-1 overflow-y-auto mb-3 min-h-[80px] max-h-[150px]">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Nenhum item adicionado
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 group border-b border-slate-50 last:border-0">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">{item.description}</span>
                  <span className="text-xs font-bold text-blue-600">{formatCurrency(item.amount)}</span>
                </div>
                <button onClick={() => removeItem(item.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg active:scale-95">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
        
        {/* Input current item */}
        <div className="mt-auto border-t border-slate-200 pt-3">
           <input 
            type="text" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nome do produto (Obrigatório)"
            className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm text-slate-800 shadow-inner mb-2 outline-none"
          />
          <div className="flex gap-2">
            <div className="bg-slate-50 rounded-xl p-3 flex-1 flex items-center justify-center shadow-inner">
              <span className="text-2xl font-bold text-slate-800">{displayAmount}</span>
            </div>
            <button 
              onClick={addItem}
              disabled={amountStr === "0" || !description.trim()}
              className="bg-emerald-500 text-white p-3 rounded-xl shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Virtual Numpad */}
      <div className="grid grid-cols-3 gap-2 mb-4 px-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button key={num} onClick={() => handleKeyPressItem(num.toString())} className="h-12 rounded-2xl bg-white shadow-sm text-xl font-semibold text-slate-800 active:bg-slate-100 active:scale-95 transition-all">
            {num}
          </button>
        ))}
        <button onClick={() => handleKeyPressItem("00")} className="h-12 rounded-2xl bg-white shadow-sm text-lg font-semibold text-slate-800 active:bg-slate-100 active:scale-95 transition-all">
          00
        </button>
        <button onClick={() => handleKeyPressItem("0")} className="h-12 rounded-2xl bg-white shadow-sm text-xl font-semibold text-slate-800 active:bg-slate-100 active:scale-95 transition-all">
          0
        </button>
        <button onClick={handleDeleteItem} className="h-12 rounded-2xl bg-slate-200 text-slate-600 active:bg-slate-300 active:scale-95 transition-all flex items-center justify-center">
          <Delete size={20} />
        </button>
      </div>

      {/* Checkout Button */}
      <button 
        onClick={() => setShowReview(true)}
        disabled={items.length === 0}
        className="w-full bg-blue-600 text-white rounded-2xl p-4 font-bold text-lg active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex justify-between items-center shadow-md shadow-blue-200 mt-auto"
      >
        <span>Revisar e Pagar</span>
        <span>{formatCurrency(totalAmount)}</span>
      </button>
    </div>
  );
}
