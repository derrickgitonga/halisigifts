"use client";

import { useState } from "react";

interface MpesaTillCardProps {
  amount?: number;
  className?: string;
}

export default function MpesaTillCard({ amount, className = "" }: MpesaTillCardProps) {
  const [copied, setCopied] = useState(false);
  const tillNumber = "8223592";
  const businessName = "TIME CREW VENTURES";

  const handleCopy = () => {
    navigator.clipboard.writeText(tillNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-[#00A859]/30 bg-gradient-to-b from-[#F0FDF4] via-white to-[#F0FDF4] p-5 sm:p-6 shadow-sm transition-all ${className}`}
    >
      {/* Top Brand Bar */}
      <div className="flex items-center justify-between border-b border-[#00A859]/20 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00A859] text-white font-bold shadow-sm">
            <span className="text-lg">M</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#008744]">
                Lipa Na M-Pesa
              </span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00A859]" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase">Buy Goods</span>
            </div>
            <p className="text-xs font-semibold text-gray-800">Till Number</p>
          </div>
        </div>

        <span className="inline-flex items-center rounded-full bg-[#00A859]/10 px-2.5 py-1 text-[11px] font-bold text-[#008744]">
          Instant Verification
        </span>
      </div>

      {/* Till Display Area */}
      <div className="my-5 rounded-xl bg-white border border-[#00A859]/20 p-4 text-center shadow-inner">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
          Buy Goods & Services Till
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-wider text-[#008744]">
            {tillNumber}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy Till Number"
            className="flex items-center gap-1 rounded-lg bg-[#00A859] hover:bg-[#008744] text-white px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 shadow-sm"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-center gap-1.5">
          <span className="text-xs text-gray-500">Store / Business Name:</span>
          <span className="text-xs font-bold text-gray-900 tracking-wide uppercase">
            {businessName}
          </span>
        </div>

        {typeof amount === "number" && amount > 0 && (
          <div className="mt-2 text-xs text-[#008744] font-semibold">
            Amount: KES {amount.toLocaleString()}
          </div>
        )}
      </div>

      {/* Step by Step Guide */}
      <div className="space-y-1.5 text-[12px] text-gray-600 bg-[#F4FBF7] rounded-lg p-3 border border-[#00A859]/15">
        <p className="font-semibold text-gray-800 text-xs mb-1">How to pay:</p>
        <ol className="list-decimal list-inside space-y-1 leading-relaxed">
          <li>
            Go to <strong>M-Pesa</strong> &rarr; Select <strong>Lipa na M-Pesa</strong>
          </li>
          <li>
            Select <strong>Buy Goods and Services</strong>
          </li>
          <li>
            Enter Till: <strong className="text-[#008744] font-mono">{tillNumber}</strong>
          </li>
          <li>
            Confirm Name: <strong>{businessName}</strong>
          </li>
          <li>Enter Amount and your M-Pesa PIN</li>
        </ol>
      </div>
    </div>
  );
}
