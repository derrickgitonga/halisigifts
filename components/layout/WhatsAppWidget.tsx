"use client";

export default function WhatsAppWidget() {
  const phoneNumber = "254729596165";
  const defaultMessage = encodeURIComponent(
    "Hello Halisi Gifts Shop, I would like to inquire about your timepieces and gifts."
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${defaultMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp with Halisi Gifts Shop"
      style={{ bottom: "calc(1.25rem + var(--sticky-bar-h, 0px) + env(safe-area-inset-bottom, 0px))" }}
      className="fixed right-4 sm:right-6 z-50 flex items-center gap-2 bg-[#25D366] text-white px-3.5 py-3 sm:px-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 group hover:bg-[#20bd5a]"
    >
      <svg
        className="w-6 h-6 fill-current"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.016 4.015-1.099zm11.238-7.904c.307.153.498.249.563.356.064.108.064.623-.15 1.229-.214.607-.757 1.157-1.42 1.341-.662.183-1.405.074-2.883-.51-1.478-.584-2.73-1.636-3.83-2.737-1.1-1.101-2.153-2.353-2.737-3.831-.584-1.478-.693-2.221-.51-2.883.184-.663.734-1.206 1.341-1.42.606-.214 1.121-.214 1.229-.15.107.065.203.256.356.563.153.307.562 1.374.611 1.478.049.104.064.225.008.356-.056.131-.118.214-.241.356s-.25.236-.356.356c-.106.121-.225.251-.097.472.128.221.569.939 1.222 1.592.839.839 1.547 1.258 1.768 1.386.221.128.351.109.472-.017.12-.126.518-.601.656-.807.138-.206.275-.172.463-.103z" />
      </svg>
      <span className="font-label-md text-sm font-semibold hidden sm:inline">
        Chat with us
      </span>
    </a>
  );
}
