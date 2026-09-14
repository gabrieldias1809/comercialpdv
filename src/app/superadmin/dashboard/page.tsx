"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Users, DollarSign, Plus, X, Search, Activity, ShieldCheck } from "lucide-react";

export default function SuperAdminDashboard() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoreData, setNewStoreData] = useState({ name: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch("/api/superadmin/stores");
      if (res.status === 401) {
        router.push("/superadmin/login");
        return;
      }
      const data = await res.json();
      if (data.stores) {
        setStores(data.stores);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/superadmin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStoreData)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setShowCreateModal(false);
      setNewStoreData({ name: "", email: "", password: "" });
      fetchStores(); // Refresh list
    } catch (error: any) {
      alert(error.message || "Erro ao criar loja");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
    </div>;
  }

  const totalClients = stores.length;
  const totalVolume = stores.reduce((acc, s) => acc + s.totalVolume, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SaaS Admin Panel</h1>
              <p className="text-slate-400 text-sm">Gerenciamento da Plataforma Mercadinho PDV</p>
            </div>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors self-start md:self-auto"
          >
            <Plus size={20} />
            Novo Cliente (Loja)
          </button>
        </header>

        {/* Overview KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex flex-col">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
              <Store size={20} />
              <span className="font-medium">Lojas Ativas</span>
            </div>
            <span className="text-4xl font-bold text-white">{totalClients}</span>
          </div>
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex flex-col">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
              <DollarSign size={20} />
              <span className="font-medium">Volume Transacionado (Geral)</span>
            </div>
            <span className="text-4xl font-bold text-emerald-400">{formatCurrency(totalVolume)}</span>
          </div>
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex flex-col justify-center items-center">
            <Activity size={32} className="text-blue-400 mb-2" />
            <span className="font-medium text-slate-300">Sistema Operacional</span>
          </div>
        </div>

        {/* Client List */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Clientes Cadastrados</h2>
            <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 flex items-center gap-2 w-64">
              <Search size={16} className="text-slate-400" />
              <input type="text" placeholder="Buscar loja..." className="bg-transparent border-none text-sm text-white w-full outline-none" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-sm">
                  <th className="p-4 font-medium">Nome da Loja</th>
                  <th className="p-4 font-medium">E-mail (Setup)</th>
                  <th className="p-4 font-medium text-center">Operadores</th>
                  <th className="p-4 font-medium text-center">Nº Transações</th>
                  <th className="p-4 font-medium text-right">Faturamento Total</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.id} className="border-t border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="p-4 font-medium text-white">{store.name}</td>
                    <td className="p-4 text-slate-400">{store.email}</td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-900 text-slate-300 px-3 py-1 rounded-full text-xs border border-slate-700">
                        {store.operatorsCount}
                      </span>
                    </td>
                    <td className="p-4 text-center text-slate-300">{store.transactionsCount}</td>
                    <td className="p-4 text-right font-bold text-emerald-400">{formatCurrency(store.totalVolume)}</td>
                  </tr>
                ))}
                {stores.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Nenhum cliente cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={24} />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-6">Cadastrar Novo Cliente</h2>
            
            <form onSubmit={handleCreateStore} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1 ml-1">Nome da Loja</label>
                <input 
                  type="text" 
                  required
                  value={newStoreData.name}
                  onChange={e => setNewStoreData({...newStoreData, name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-emerald-500"
                  placeholder="Ex: Padaria do Zé"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1 ml-1">E-mail de Setup (Login Mestre do Cliente)</label>
                <input 
                  type="email" 
                  required
                  value={newStoreData.email}
                  onChange={e => setNewStoreData({...newStoreData, email: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-emerald-500"
                  placeholder="padaria@ze.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1 ml-1">Senha (Login Mestre do Cliente)</label>
                <input 
                  type="password" 
                  required
                  value={newStoreData.password}
                  onChange={e => setNewStoreData({...newStoreData, password: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-emerald-500"
                  placeholder="Senha forte"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl mt-2">
                <p className="text-xs text-blue-300">
                  O cliente usará este e-mail e senha no aplicativo para conectar o caixa dele à nuvem. Depois ele poderá criar os próprios PINs de funcionários.
                </p>
              </div>

              <button 
                type="submit"
                disabled={creating}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold p-4 rounded-xl mt-4 transition-colors disabled:opacity-50"
              >
                {creating ? "Cadastrando..." : "Confirmar Cadastro"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
