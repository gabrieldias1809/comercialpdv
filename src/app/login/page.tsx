"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Delete } from "lucide-react";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const router = useRouter();

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      // Auto login when 4 digits are entered
      if (newPin.length === 4) {
        login(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const login = (operatorPin: string) => {
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("operatorPin", operatorPin);
      // Add a tiny delay for visual feedback before redirecting
      setTimeout(() => {
        router.push("/dashboard");
      }, 200);
    }
  };

  const renderDot = (index: number) => {
    const isFilled = index < pin.length;
    return (
      <div
        key={index}
        className={`w-4 h-4 rounded-full mx-2 transition-all duration-300 ${
          isFilled ? "bg-blue-600 scale-110" : "bg-slate-300"
        }`}
      />
    );
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="mb-8 p-4 bg-blue-100 rounded-full text-blue-600">
          <Store size={48} />
        </div>
        
        <h1 className="text-2xl font-bold mb-2 text-slate-800">Acesso ao Caixa</h1>
        <p className="text-slate-500 mb-8 text-center">Digite o PIN de 4 dígitos para iniciar as vendas</p>
        
        {/* PIN Indicators */}
        <div className="flex mb-12 h-8 items-center justify-center">
          {[0, 1, 2, 3].map(renderDot)}
        </div>

        {/* Virtual Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full px-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="h-16 rounded-2xl bg-white shadow-sm text-2xl font-semibold text-slate-800 active:bg-blue-50 active:scale-95 transition-all flex items-center justify-center border border-slate-100"
            >
              {num}
            </button>
          ))}
          <div className="h-16"></div> {/* Empty space for bottom left */}
          <button
            onClick={() => handleKeyPress("0")}
            className="h-16 rounded-2xl bg-white shadow-sm text-2xl font-semibold text-slate-800 active:bg-blue-50 active:scale-95 transition-all flex items-center justify-center border border-slate-100"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-slate-100 text-slate-600 active:bg-slate-200 active:scale-95 transition-all flex items-center justify-center"
          >
            <Delete size={24} />
          </button>
        </div>
      </div>
    </main>
  );
}
