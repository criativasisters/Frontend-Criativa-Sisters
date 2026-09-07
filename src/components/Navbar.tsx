"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Bell, User, Heart, X, LogIn, Menu } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Escutar mudanças de login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        alert('Cadastro realizado! (Se necessário, verifique o email)');
        setShowAuthModal(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setShowAuthModal(false);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logos/logo-3d-metallic.jpg" alt="Logo" width={32} height={32} className="rounded-full" />
          <span className="font-bold text-lg hidden md:block">Criativa Sisters</span>
        </Link>

        <div className="flex items-center gap-6">
          <button className="text-gray-400 hover:text-[#FF3366] transition relative">
            <Bell size={22} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF3366] rounded-full"></span>
          </button>
          
          <Link href="/carrinho" className="text-gray-400 hover:text-[#E0829D] transition relative">
            <ShoppingCart size={22} />
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/conta" className="text-gray-400 hover:text-white transition">
                <Heart size={22} />
              </Link>
              <Link href="/conta" className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 hover:bg-white/10 transition">
                <User size={18} />
                <span className="text-sm font-medium hidden md:block">{user.user_metadata?.full_name?.split(' ')[0] || 'Minha Conta'}</span>
              </Link>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 btn-primary px-5 py-2 text-sm shadow-[0_0_15px_rgba(255,51,102,0.3)]"
            >
              <LogIn size={18} /> Entrar
            </button>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md p-8 relative border-[#FF3366]/30 shadow-[0_0_50px_rgba(255,51,102,0.1)]">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-center">
              {authMode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua Conta'}
            </h2>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Nome Completo</label>
                  <input required type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-[#121212] border border-white/10 p-3 rounded text-white focus:border-[#FF3366] transition outline-none" />
                </div>
              )}
              <div>
                <label className="text-sm text-gray-400 block mb-1">E-mail</label>
                <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-[#121212] border border-white/10 p-3 rounded text-white focus:border-[#FF3366] transition outline-none" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Senha</label>
                <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-[#121212] border border-white/10 p-3 rounded text-white focus:border-[#FF3366] transition outline-none" />
              </div>
              
              <button type="submit" disabled={loading} className="w-full btn-primary py-3 mt-2 disabled:opacity-50">
                {loading ? 'Processando...' : (authMode === 'login' ? 'Entrar' : 'Cadastrar')}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              {authMode === 'login' ? (
                <p>Não tem conta? <button onClick={() => setAuthMode('register')} className="text-[#FF3366] font-bold">Cadastre-se</button></p>
              ) : (
                <p>Já tem conta? <button onClick={() => setAuthMode('login')} className="text-[#FF3366] font-bold">Faça login</button></p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
