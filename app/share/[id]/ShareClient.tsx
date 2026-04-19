'use client';

import { useState, useMemo, useEffect } from 'react';
import { generatePixPayload } from '@/lib/pix';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, CheckCircle, Wallet, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { markAsPaid, incrementScanCount } from '@/app/actions';

export default function ShareClient({ bill }: { bill: any }) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Impedir múltiplas contagens de scan
    try {
        const hasViewed = localStorage.getItem(`viewed_${bill.id}`);
        if (!hasViewed) {
          incrementScanCount(bill.id);
          localStorage.setItem(`viewed_${bill.id}`, 'true');
        }

        const hasPaid = localStorage.getItem(`paid_${bill.id}`);
        if (hasPaid) {
          setConfirmed(true);
        }
    } catch (e) {
        console.error("LocalStorage não disponível", e);
    }
  }, [bill.id]);

  const valuePerPerson = bill.amount / (bill.peopleCount || 1);
  const ownerName = bill.user?.name || "Usuário";
  const firstName = ownerName.split(' ')[0];
  
  const pixPayload = useMemo(() => {
    return generatePixPayload(
      bill.user?.pixKey || '', 
      ownerName, 
      bill.user?.city || '', 
      valuePerPerson
    );
  }, [bill, valuePerPerson, ownerName]);

  const copyToClipboard = () => {
    if (!pixPayload) return;

    // Tenta usar a API moderna primeiro
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(pixPayload).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => fallbackCopy(pixPayload));
    } else {
      // Fallback para contextos não-seguros (HTTP/IP local)
      fallbackCopy(pixPayload);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Garante que o textarea não seja visível mas seja selecionável
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        alert("Não foi possível copiar automaticamente. Por favor, selecione o texto manualmente.");
      }
    } catch (err) {
      console.error('Fallback copy failed', err);
      alert("Erro ao copiar. Tente novamente.");
    }
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      await markAsPaid(bill.id);
      localStorage.setItem(`paid_${bill.id}`, 'true');
      setConfirmed(true);
    } catch (e) {
      alert("Erro ao confirmar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <div className="text-white font-bold">Carregando...</div>;

  return (
    <div className="w-full max-w-sm glass-panel rounded-[2.5rem] p-8 relative overflow-hidden shiny-border animate-in fade-in zoom-in duration-500 shadow-2xl">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      <AnimatePresence mode="wait">
        {!confirmed ? (
          <motion.div 
            key="payer-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 shadow-xl border border-white/10 backdrop-blur-md shiny-border">
              <Wallet className="text-cyan-400 w-8 h-8" />
            </div>

            <div className="text-center mb-10 space-y-1">
                <h1 className="text-xl font-black text-white leading-none tracking-tight">
                    Pagamento para <span className="text-gradient decoration-4 italic">{firstName}</span>
                </h1>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                    Dividido em {bill.peopleCount} pessoas.
                </p>
            </div>

            <div className="w-full bg-black/40 rounded-[2rem] p-8 border border-white/5 mb-10 text-center shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-3 relative z-10">Sua parte do Ra-xei</p>
              <h2 className="text-6xl font-black text-white font-mono tracking-tighter relative z-10 text-gradient">
                <span className="text-2xl mr-1 opacity-50 italic">R$</span>{valuePerPerson.toFixed(2).replace('.', ',')}
              </h2>
            </div>

            <div className="bg-white p-5 rounded-[2.5rem] shadow-2xl mb-10 ring-8 ring-white/5 self-center transform transition-transform hover:rotate-2 duration-500">
              <QRCodeSVG value={pixPayload} size={200} level="Q" />
            </div>

            <div className="w-full space-y-4">
              <button 
                onClick={copyToClipboard}
                className={`w-full py-5 px-6 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg border ${
                  copied 
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20' 
                    : 'bg-white/5 text-white hover:bg-white/10 border-white/10'
                }`}
              >
                <Copy className="w-5 h-5 opacity-70" />
                {copied ? 'Pix Copiado!' : 'Copiar Pix Copia e Cola'}
              </button>

              <button 
                onClick={handleConfirmPayment}
                disabled={loading}
                className="w-full bg-white text-black font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group text-xs uppercase tracking-widest"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <span>Confirmar Pagamento</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 flex flex-col items-center text-center py-6"
          >
            <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-emerald-500/10 shadow-[0_0_50px_rgba(16,185,129,0.1)] shiny-border">
              <CheckCircle className="text-emerald-400 w-12 h-12" />
            </div>
            
            <h2 className="text-3xl font-black text-white mb-3 italic">Pago com sucesso!</h2>
            <p className="text-zinc-500 text-xs font-bold leading-relaxed px-8 mb-12 uppercase tracking-tight">
                Avisamos ao <span className="text-white">{firstName}</span> que você já realizou o Ra-xei.
            </p>

            <div className="w-full pt-10 border-t border-white/5 space-y-8">
                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500">Sua vez de cobrar?</p>
                    <p className="text-[11px] text-zinc-600 font-medium px-4">Divida contas com seus amigos em segundos, sem taxas e com rastreio em tempo real.</p>
                </div>
                
                <a 
                    href="/"
                    className="w-full bg-white text-black font-black py-5 rounded-2xl transition-all hover:bg-zinc-200 active:scale-95 flex items-center justify-center gap-3 shadow-2xl text-[11px] uppercase tracking-widest"
                >
                    <Wallet className="w-5 h-5" />
                    Criar meu Ra-xei Grátis
                </a>
                
                <div className="flex justify-center gap-6 opacity-30">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black text-white">0%</span>
                        <span className="text-[7px] font-bold uppercase tracking-tighter">Taxas</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-white" />
                        <span className="text-[7px] font-bold uppercase tracking-tighter">Seguro</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black text-white">PIX</span>
                        <span className="text-[7px] font-bold uppercase tracking-tighter">Direto</span>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
