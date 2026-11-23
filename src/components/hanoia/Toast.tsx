"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function Toast() {
  const { toastMessage } = useCart();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className="bg-black text-white px-5 py-3.5 rounded-xs shadow-2xl border border-neutral-700 flex items-center space-x-3 text-xs tracking-wider">
        <CheckCircle2 className="w-4 h-4 text-[#C5A880] shrink-0" />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
