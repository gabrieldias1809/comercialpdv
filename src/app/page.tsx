"use client";

import Link from "next/link";
import { Store, Download, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-center">
      <div className="w-full max-w-md flex flex-col items-center">
        
        {/* App Logo */}
        <div className="mb-6 p-5 bg-blue-600 rounded-[2rem] text-white shadow-xl shadow-blue-200">
          <Store size={56} />
        </div>
        
        <h1 className="text-4xl font-extrabold mb-4 text-slate-800 tracking-tight">
          Mercadinho PDV
        </h1>
        
        <p className="text-slate-500 mb-8 text-lg px-4">
          O sistema de frente de caixa desenhado para funcionar <strong>mesmo sem internet</strong>.
        </p>

        {/* Installation Instructions */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 w-full mb-8 text-left">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Download size={20} className="text-blue-500" /> 
            Como Instalar o Aplicativo
          </h2>
          
          <ul className="space-y-4 text-slate-600 text-sm">
            <li className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Android:</strong> Toque nos três pontos no navegador (Chrome) e escolha "Adicionar à tela inicial" ou "Instalar Aplicativo".</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>iOS (iPhone):</strong> Toque no ícone de Compartilhar no Safari e escolha "Adicionar à Tela de Início".</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Computador:</strong> Clique no ícone de download/instalação no canto direito da barra de endereços.</span>
            </li>
          </ul>
        </div>

        {/* Call to action for those who just want to access online */}
        <Link 
          href="/login" 
          className="w-full p-4 rounded-2xl font-bold text-white bg-blue-600 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-md shadow-blue-200 mb-3"
        >
          Acessar o Caixa (Operador) <ArrowRight size={20} />
        </Link>
        
        <Link 
          href="/setup" 
          className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors py-2"
        >
          Sou Dono de Loja (Conectar Aparelho)
        </Link>
      </div>
    </main>
  );
}
