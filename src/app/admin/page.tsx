"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLogin() {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'ADM-Criativa' && password === 'CriativaS2026$') {
      localStorage.setItem('criativa_admin_auth', 'true');
      router.push('/admin/dashboard');
    } else {
      setError('Credenciais inválidas. Acesso negado.');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#050505] p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF3366] opacity-5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="glass-panel p-10 w-full max-w-md z-10 relative shadow-[0_0_30px_rgba(255,51,102,0.1)] border-[#FF3366]/20">
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-20 h-20 mb-4">
            <Image src="/logos/logo-color-dark.jpg" alt="Logo" fill className="rounded-full" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Acesso Restrito</h1>
          <p className="text-sm text-gray-400 text-center mt-2">Painel de Controle Operacional</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Usuário</label>
            <input 
              type="text" 
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#FF3366]"
              placeholder="ADM-Criativa"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Senha Secreta</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#FF3366]"
              placeholder="••••••••••••"
              required
            />
          </div>

          {error && <p className="text-sm text-[#FF3366] text-center bg-[#FF3366]/10 p-2 rounded">{error}</p>}

          <button type="submit" className="w-full btn-primary mt-2">
            Autenticar
          </button>
        </form>
      </div>
    </main>
  );
}
