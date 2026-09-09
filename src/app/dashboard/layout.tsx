"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PlusCircle, FileText, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pin, setPin] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const storedPin = localStorage.getItem("operatorPin");
    if (!storedPin) {
      router.push("/");
    } else {
      setPin(storedPin);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("operatorPin");
    router.push("/");
  };

  if (!pin) return null; // Or a loading spinner

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operador</span>
          <span className="font-bold text-slate-800 text-lg">#{pin}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
        >
          <LogOut size={20} />
        </button>
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
