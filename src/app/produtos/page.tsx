"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/contexts/CartContext";
import { ShoppingBag, ArrowLeft, X, Package, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function ProdutosPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: cData } = await supabase.from("categories").select("*").order("name");
      if (cData) setCategories(cData);

      const { data: pData } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (pData) setProducts(pData);
    }
    fetchData();
  }, []);

  const filteredProducts = selectedCategory 
    ? products.filter(p => p.category === selectedCategory) 
    : products;

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 px-6 pb-24">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white flex items-center gap-2 mb-8 transition-colors">
          <ArrowLeft size={16} /> Voltar para o Início
        </button>

        <h1 className="text-4xl md:text-6xl font-bold mb-4 font-syncopate tracking-tight uppercase">Loja <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF3366] to-[#8A2BE2]">Criativa</span></h1>
        <p className="text-gray-400 max-w-2xl mb-12 text-lg">Navegue por nossa coleção completa de estátuas, action figures e impressões 3D premium exclusivas.</p>

        {/* Filtros */}
        <div className="mb-12 flex flex-wrap gap-3">
          <button 
            onClick={() => setSelectedCategory(null)} 
            className={`px-6 py-3 rounded-full text-sm font-semibold transition-all ${!selectedCategory ? 'bg-[#FF3366] text-white shadow-[0_0_15px_rgba(255,51,102,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            Todas as Peças
          </button>
          {categories.map(c => (
            <button 
              key={c.id} 
              onClick={() => setSelectedCategory(c.name)} 
              className={`px-6 py-3 rounded-full text-sm font-semibold transition-all ${selectedCategory === c.name ? 'bg-[#FF3366] text-white shadow-[0_0_15px_rgba(255,51,102,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Grid de Produtos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredProducts.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-12">Nenhum produto encontrado nesta categoria.</p>
          ) : (
            filteredProducts.map((prod, i) => (
              <motion.div 
                key={prod.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                onClick={() => setQuickViewProduct(prod)}
                className="glass-panel group overflow-hidden border-white/5 hover:border-[#FF3366]/60 hover:shadow-[0_0_40px_rgba(255,51,102,0.25)] transition-all duration-300 cursor-pointer flex flex-col"
              >
                <div className="h-64 bg-transparent flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-white font-bold flex items-center gap-2"><ShoppingBag size={16}/> Comprar</span>
                  </div>
                  {prod.image_url ? (
                    <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <Package size={48} className="text-white/10" />
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#121212] to-[#090909]">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">{prod.category || 'Geral'}</span>
                    <h3 className="font-bold text-lg leading-tight mt-1 mb-2 text-white">{prod.name}</h3>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <span className="text-[#FF3366] font-bold text-xl">R$ {prod.price}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-panel max-w-4xl w-full flex flex-col md:flex-row overflow-hidden relative border-white/10 shadow-[0_0_50px_rgba(255,51,102,0.15)]"
          >
            <button onClick={() => setQuickViewProduct(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 bg-black/50 p-2 rounded-full backdrop-blur-md">
              <X size={20} />
            </button>
            
            <div className="w-full md:w-1/2 bg-[#050505] relative min-h-[300px] flex items-center justify-center">
              {quickViewProduct.video_url ? (
                 <video src={quickViewProduct.video_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : quickViewProduct.image_url ? (
                 <img src={quickViewProduct.image_url} alt={quickViewProduct.name} className="w-full h-full object-cover" />
              ) : (
                 <div className="text-gray-600 flex flex-col items-center"><Package size={48} /><p className="mt-2 text-sm">Sem Mídia</p></div>
              )}
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-transparent to-transparent opacity-80" />
            </div>

            <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-gradient-to-bl from-[#121212] to-[#090909]">
              <span className="text-xs font-bold tracking-widest text-[#FF3366] uppercase mb-2">{quickViewProduct.category || 'Exclusivo'}</span>
              <h3 className="text-3xl font-syncopate font-bold mb-2">{quickViewProduct.name}</h3>
              <p className="text-3xl text-white font-light mb-6">R$ {quickViewProduct.price}</p>
              
              <div className="prose prose-invert prose-sm mb-8 text-gray-300">
                <p>{quickViewProduct.description || 'Uma obra de arte única criada através da mais avançada tecnologia 3D.'}</p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    addToCart({ id: quickViewProduct.id, name: quickViewProduct.name, price: Number(quickViewProduct.price), image_url: quickViewProduct.image_url, quantity: 1, type: 'product' });
                    setQuickViewProduct(null);
                    router.push('/carrinho');
                  }}
                  className="btn-primary flex-1 py-4 flex justify-center items-center gap-2 text-lg"
                >
                  <ShoppingBag size={20} />
                  Comprar Agora
                </button>
              </div>
              <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-1"><ShieldCheck size={14}/> Compra 100% Segura</p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
