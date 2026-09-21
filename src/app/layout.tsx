import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Criativa Sisters | Fábrica de Impressão 3D e IA",
  description: "Da imaginação para a realidade através de Inteligência Artificial e impressão 3D de altíssima precisão. Peças exclusivas, estátuas e action figures sob demanda.",
  openGraph: {
    title: "Criativa Sisters | Impressão 3D e IA",
    description: "Sua ideia transformada em um objeto real com Inteligência Artificial e impressão 3D de altíssima resolução.",
    url: "https://criativasisters.com.br",
    siteName: "Criativa Sisters",
    images: [
      {
        url: "https://criativasisters.com.br/og-image.jpg", // Imagem fictícia para SEO
        width: 1200,
        height: 630,
        alt: "Criativa Sisters 3D Factory",
      }
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Criativa Sisters | Impressão 3D",
    description: "Transforme suas ideias em objetos físicos reais de altíssima precisão.",
    images: ["https://criativasisters.com.br/og-image.jpg"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#050505] text-white selection:bg-[#FF3366] selection:text-white relative`}>
        {/* Fundo Global Gradiente */}
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_#1a0b1c,_#050505_80%)] pointer-events-none" />
        <CartProvider>
          <Navbar />
          {children}
          <Toaster 
            theme="dark" 
            position="bottom-right" 
            toastOptions={{
              style: {
                background: 'rgba(5, 5, 5, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 51, 102, 0.2)',
                color: '#fff',
              },
            }}
          />
        </CartProvider>
      </body>
    </html>
  );
}
