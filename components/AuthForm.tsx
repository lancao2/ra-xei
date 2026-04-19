'use client';

import { useState } from 'react';
import { createUser, loginUser } from '@/app/actions';
import { WalletCards, UserPlus, LogIn, ShieldCheck, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showLGPD, setShowLGPD] = useState(false);
  const [formRef, setFormRef] = useState<HTMLFormElement | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === 'register' && !showLGPD) {
        setFormRef(e.currentTarget);
        setShowLGPD(true);
        return;
    }
    
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget || formRef);
    try {
      if (mode === 'register') {
        await createUser(formData);
      } else {
        await loginUser(formData);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
      setLoading(false);
      setShowLGPD(false);
    }
  };

  const confirmLGPD = () => {
    if (formRef) {
        // Trigger actual submit
        const event = new Event('submit', { cancelable: true }) as any;
        handleSubmit({ ...event, preventDefault: () => {}, currentTarget: formRef });
    }
  };

  return (
    <div className="w-full max-w-sm glass-panel rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden shiny-border animate-in fade-in zoom-in duration-500">
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-violet-600/10 rounded-full blur-[60px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/10 backdrop-blur-md shiny-border">
          <WalletCards className="text-cyan-400 w-7 h-7" />
        </div>
        
        <h1 className="text-4xl font-black tracking-tighter mb-8 font-mono text-gradient">
          RA-XEI
        </h1>

        {/* Modern Tabs */}
        <div className="flex w-full bg-black/40 p-1 rounded-2xl mb-8 border border-white/5">
            <button 
                onClick={() => { setMode('register'); setError(null); }}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'register' ? 'bg-white/10 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
                <UserPlus className="w-3.5 h-3.5" /> Cadastro
            </button>
            <button 
                onClick={() => { setMode('login'); setError(null); }}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-white/10 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
                <LogIn className="w-3.5 h-3.5" /> Login
            </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <AnimatePresence mode="wait">
            {mode === 'register' ? (
              <motion.div 
                key="register"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label htmlFor="name" className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Seu Nome</label>
                  <input 
                    id="name" name="name" type="text" required 
                    placeholder="Ex: João da Silva"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-bold text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="pixKey" className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Chave Pix</label>
                  <input 
                    id="pixKey" name="pixKey" type="text" required 
                    placeholder="CPF, E-mail ou Aleatória"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-bold font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="city" className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Cidade do Pix</label>
                  <input 
                    id="city" name="city" type="text" required 
                    placeholder="São Paulo, RJ..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-bold text-sm"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="login"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label htmlFor="pixKey" className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Sua Chave Pix</label>
                  <input 
                    id="pixKey" name="pixKey" type="text" required 
                    placeholder="Insira sua chave cadastrada"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-bold font-mono text-sm"
                  />
                </div>
                <div className="p-4 bg-violet-600/5 rounded-2xl border border-violet-600/10 flex gap-3 items-start">
                    <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-bold">Use seu PIN de 6 dígitos para entrar com segurança.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label htmlFor="pin" className="flex justify-between items-center ml-1">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">PIN de 6 dígitos</span>
                <span className="flex items-center gap-1 text-[8px] text-emerald-400 font-bold uppercase tracking-tighter"><ShieldCheck className="w-2.5 h-2.5" /> Encriptado</span>
            </label>
            <input 
              id="pin" name="pin" type="password" required 
              inputMode="numeric"
              maxLength={6}
              minLength={6}
              placeholder="••••••"
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-3xl tracking-[12px] text-center placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all font-mono"
            />
          </div>

          {error && (
            <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-500 text-[10px] font-black text-center uppercase tracking-widest"
            >
                {error}
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50 font-black text-sm uppercase tracking-widest rounded-[1.25rem] py-4 mt-6 transition-all shadow-xl active:scale-95 flex justify-center items-center gap-3"
          >
            {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
                <>
                    {mode === 'register' ? 'Criar Conta' : 'Acessar App'}
                </>
            )}
          </button>
        </form>
      </div>

      {/* LGPD Premium Modal Overlay */}
      <AnimatePresence>
        {showLGPD && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/95 backdrop-blur-2xl p-8 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300"
            >
                <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/10 shiny-border">
                    <ShieldCheck className="text-emerald-400 w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white mb-2 italic">Segurança & LGPD</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Controle total dos seus dados</p>

                <div className="space-y-4 mb-8 text-zinc-500 text-[11px] leading-relaxed text-left max-h-[200px] overflow-y-auto pr-2 custom-scrollbar border-y border-white/5 py-6">
                    <p>Ao criar sua conta, seus dados (Nome, Pix e PIN) são protegidos com:</p>
                    <ul className="space-y-4 font-medium">
                        <li className="flex gap-3">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                            <span><strong>Criptografia Ponta-a-Ponta:</strong> Seus dados sensíveis nunca são lidos em texto puro.</span>
                        </li>
                        <li className="flex gap-3">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                            <span><strong>Direito ao Esquecimento:</strong> Exclua sua conta a qualquer momento e removeremos tudo.</span>
                        </li>
                        <li className="flex gap-3">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                            <span><strong>Zero Compartilhamento:</strong> Seus dados são usados apenas para gerar seus QR Codes.</span>
                        </li>
                    </ul>
                </div>

                <div className="w-full space-y-3">
                    <button 
                        onClick={confirmLGPD}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-widest"
                    >
                        Aceitar e Continuar
                    </button>
                    <button 
                        onClick={() => setShowLGPD(false)}
                        className="w-full bg-white/5 hover:bg-white/10 text-zinc-600 font-bold py-3 rounded-xl transition-all text-[10px] uppercase tracking-tighter"
                    >
                        Corrigir dados
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
