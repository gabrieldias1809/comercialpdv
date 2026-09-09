"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("operatorRole");
    if (role !== "admin") {
      router.push("/dashboard"); // Redirect non-admins to dashboard
    } else {
      setIsAdmin(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("operatorPin");
    localStorage.removeItem("operatorRole");
    localStorage.removeItem("operatorName");
    router.push("/login");
  };

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-slate-900 shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10 text-white">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Painel</span>
          <span className="font-bold text-lg">Administrador</span>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard"
            className="p-2 text-slate-300 hover:text-white transition-colors rounded-full hover:bg-slate-800"
            title="Ir para o Caixa"
          >
            <LayoutDashboard size={20} />
          </Link>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-300 hover:text-red-400 transition-colors rounded-full hover:bg-slate-800"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
