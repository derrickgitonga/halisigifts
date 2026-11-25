import Header from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";
import CartView from "@/components/cart/CartView";

export default function CartPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="w-full flex-grow max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-md">
        <h1 className="font-display-lg text-3xl md:text-display-lg mb-8 text-black">Shopping Cart</h1>
        <CartView />
      </main>
      <Footer />
    </div>
  );
}
