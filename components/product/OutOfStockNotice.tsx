"use client";

import Link from "next/link";

const STORE_WHATSAPP = "254729596165";

interface OutOfStockNoticeProps {
  message: string;
  /** Pre-filled WhatsApp message so the shop knows what the shopper wanted */
  whatsappText: string;
  /** Client-side reset (shop grid filters) */
  onClear?: () => void;
  clearLabel?: string;
  /** Link alternative for server pages */
  browseHref?: string;
}

export default function OutOfStockNotice({
  message,
  whatsappText,
  onClear,
  clearLabel = "Clear filters",
  browseHref,
}: OutOfStockNoticeProps) {
  const waUrl = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="border border-dashed border-black/15 bg-white/60 px-6 py-14 md:py-16 text-center">
      <span className="material-symbols-outlined text-[40px] text-black/25" aria-hidden>
        inventory_2
      </span>
      <span className="mt-3 inline-block bg-black text-white text-[10px] font-semibold uppercase tracking-[0.18em] px-3 py-1">
        Out of stock
      </span>
      <p className="font-heading text-lg md:text-xl text-black mt-4">Currently out of stock</p>
      <p className="text-sm text-black/60 mt-2 max-w-md mx-auto leading-relaxed">{message}</p>

      <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold px-6 py-2.5 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
            <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 01-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 01-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 012.76 6.67c0 5.2-4.23 9.43-9.44 9.43zm8.03-17.46A11.27 11.27 0 0012.04.75C5.8.75.72 5.83.72 12.07c0 2 .52 3.94 1.51 5.65L.62 23.25l5.66-1.48a11.3 11.3 0 005.75 1.47h.01c6.24 0 11.32-5.08 11.32-11.32 0-3.02-1.18-5.86-3.29-7.88z" />
          </svg>
          Ask about restock on WhatsApp
        </a>
        {onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-black/15 hover:border-black text-black text-xs font-semibold px-6 py-2.5 transition-colors"
          >
            {clearLabel}
          </button>
        ) : (
          browseHref && (
            <Link
              href={browseHref}
              className="rounded-full border border-black/15 hover:border-black text-black text-xs font-semibold px-6 py-2.5 transition-colors"
            >
              Browse all products
            </Link>
          )
        )}
      </div>
    </div>
  );
}
