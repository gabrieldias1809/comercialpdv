"use client";

import { useEffect, useState } from "react";
import { db, Operator, OperatorRole } from "@/lib/db";
import { Trash2, UserPlus, Shield, User } from "lucide-react";

export default function AdminPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<OperatorRole>("operator");
  const [errorMsg, setErrorMsg] = useState("");

  const loadOperators = async () => {
    try {
      const ops = await db.operators.toArray();
      setOperators(ops);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadOperators();
  }, []);

  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || isNaN(Number(pin))) {
      setErrorMsg("O PIN deve conter exatamente 4 números.");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("O Nome é obrigatório.");
      return;
    }

    try {
      const existing = await db.operators.get(pin);
      if (existing) {
        setErrorMsg("Já existe um operador com este PIN.");
        return;
      }

      await db.operators.add({
        pin,
        name: name.trim(),
        role
      });

      setName("");
      setPin("");
      setRole("operator");
      setErrorMsg("");
      loadOperators();
    } catch (e) {
      console.error(e);
      setErrorMsg("Erro ao salvar operador.");
    }
  };

  const handleDelete = async (targetPin: string) => {
    const currentPin = localStorage.getItem("operatorPin");
    if (targetPin === currentPin) {
      alert("Você não pode excluir a si mesmo!");
      return;
    }

    if (confirm("Tem certeza que deseja excluir este operador?")) {
      await db.operators.delete(targetPin);
      loadOperators();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-blue-500" />
          Novo Operador
        </h2>
        
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAddOperator} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1 ml-1">Nome</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do funcionário"
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-slate-800 shadow-inner outline-none"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-500 mb-1 ml-1">PIN (4 dígitos)</label>
              <input 
                type="text" 
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 1234"
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-slate-800 shadow-inner outline-none font-mono text-center tracking-widest"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-500 mb-1 ml-1">Cargo</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value as OperatorRole)}
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-slate-800 shadow-inner outline-none appearance-none"
              >
                <option value="operator">Caixa</option>
                <option value="admin">Gerente</option>
              </select>
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white rounded-xl p-3 font-bold mt-2 active:scale-95 transition-transform"
          >
            Cadastrar
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3 ml-2">Operadores Cadastrados ({operators.length})</h2>
        <div className="flex flex-col gap-3">
          {operators.map(op => (
            <div key={op.pin} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${op.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                  {op.role === 'admin' ? <Shield size={20} /> : <User size={20} />}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{op.name}</p>
                  <p className="text-xs text-slate-400 font-mono">PIN: ****</p>
                </div>
              </div>
              
              <button 
                onClick={() => handleDelete(op.pin)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir operador"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
