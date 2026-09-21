'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Star, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';

interface QuickViewModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { addToCart } = useCart();

  if (!isOpen || !product) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(255,51,102,0.15)] flex flex-col md:flex-row max-h-[90vh]"
        >
          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-[#FF3366] text-white rounded-full backdrop-blur-md transition-colors"
          >
            <X size={20} />
          </button>

          {/* Imagem / Galeria */}
          <div className="w-full md:w-1/2 bg-[#050505] relative min-h-[300px] md:min-h-full flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF3366]/5 to-[#8A2BE2]/5" />
            <div className="relative w-full aspect-square max-w-[400px]">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"
                />
              ) : (
                <div className="w-full h-full bg-white/5 rounded-2xl flex items-center justify-center">
                  <span className="text-white/20">Sem Imagem</span>
                </div>
              )}
            </div>
            
            {/* Badges Flutuantes */}
            <div className="absolute top-6 left-6 flex flex-col gap-2">
              <span className="bg-[#FF3366]/20 text-[#FF3366] border border-[#FF3366]/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                Pronta Entrega
              </span>
              <span className="bg-[#8A2BE2]/20 text-[#8A2BE2] border border-[#8A2BE2]/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1 w-max">
                <Star size={12} fill="currentColor" /> Premium
              </span>
            </div>
          </div>

          {/* Informações */}
          <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-between overflow-y-auto">
            <div>
              <p className="text-[#E0829D] text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8A2BE2]"></span>
                {product.categories?.name || 'Colecionável'}
              </p>
              <h2 className="text-3xl font-black text-white mb-4 leading-tight">{product.name}</h2>
              
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF3366] to-[#E0829D]">
                  R$ {product.price.toString().replace('.', ',')}
                </p>
                {product.promotional_price && (
                  <p className="text-lg text-gray-500 line-through">
                    R$ {product.promotional_price.toString().replace('.', ',')}
                  </p>
                )}
              </div>

              <div className="prose prose-invert prose-sm mb-8 text-gray-400">
                <p>{product.description || 'Uma obra de arte em impressão 3D de altíssima resolução, perfeita para decorar seu setup ou enriquecer sua coleção. Produzido com filamento ecológico premium.'}</p>
              </div>

              {/* Características */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-start gap-3">
                  <ShieldCheck className="text-[#FF3366] shrink-0" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Qualidade</h4>
                    <p className="text-xs text-gray-500">Resolução 8k</p>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-start gap-3">
                  <Star className="text-[#8A2BE2] shrink-0" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Material</h4>
                    <p className="text-xs text-gray-500">PLA Silk/Matte</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-6 border-t border-white/5">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  addToCart({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image_url: product.image_url,
                    quantity: 1,
                    type: 'product'
                  });
                  onClose();
                }}
                className="w-full btn-primary flex items-center justify-center gap-3 py-4 text-lg font-bold shadow-[0_0_30px_rgba(255,51,102,0.3)]"
              >
                <ShoppingBag size={22} />
                Adicionar ao Carrinho
              </motion.button>
              <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-2">
                <ShieldCheck size={14} /> Compra 100% Segura e Garantida
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
