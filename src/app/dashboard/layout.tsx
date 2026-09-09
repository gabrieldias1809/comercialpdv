"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PlusCircle, FileText, LogOut, Shield } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [opName, setOpName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedPin = localStorage.getItem("operatorPin");
    const storedName = localStorage.getItem("operatorName");
    const storedRole = localStorage.getItem("operatorRole");
    
    if (!storedPin) {
      router.push("/login");
    } else {
      setOpName(storedName || "Operador");
      setIsAdmin(storedRole === 'admin');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("operatorPin");
    localStorage.removeItem("operatorName");
    localStorage.removeItem("operatorRole");
    router.push("/login");
  };

  if (!opName) return null; // Or a loading spinner

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operador</span>
          <span className="font-bold text-slate-800 text-lg max-w-[150px] truncate">{opName}</span>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link 
              href="/admin"
              className="p-2 text-blue-500 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
              title="Painel Gerencial"
            >
              <Shield size={20} />
            </Link>
          )}
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-slate-200 fixed bottom-0 w-full flex items-center justify-around pb-safe">
        <Link 
          href="/dashboard"
          className={`flex-1 flex flex-col items-center justify-center py-3 ${pathname === '/dashboard' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <PlusCircle size={24} className="mb-1" />
          <span className="text-xs font-medium">Vender</span>
        </Link>
        <Link 
          href="/dashboard/fechamento"
          className={`flex-1 flex flex-col items-center justify-center py-3 ${pathname === '/dashboard/fechamento' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <FileText size={24} className="mb-1" />
          <span className="text-xs font-medium">Caixa</span>
        </Link>
      </nav>
    </div>
  );
}
