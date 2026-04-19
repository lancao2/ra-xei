'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { generatePixPayload } from '@/lib/pix';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Plus, Minus, ReceiptText, Users, Eye, CheckCircle2, Share2, Loader2, RefreshCw, BarChart3, TrendingUp, ShieldCheck, History, Calculator as CalcIcon, UserCircle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBill, getBillStatus, deleteBill, deleteUserAccount, logout } from '@/app/actions';

type Tab = 'calculator' | 'history' | 'profile';

export default function DashboardClient({ user, initialBills }: { user: any, initialBills: any[] }) {
  const [activeTab, setActiveTab] = useState<Tab>('calculator');
  const [totalValue, setTotalValue] = useState<string>('');
  const [peopleCount, setPeopleCount] = useState<number>(2);
  const [copied, setCopied] = useState(false);
  
  const [billId, setBillId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState({ scanCount: 0, paidCount: 0 });
  const [bills, setBills] = useState(initialBills);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // Keyboard awareness logic
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      const offset = window.innerHeight - window.visualViewport!.height;
      setKeyboardOffset(offset > 0 ? offset : 0);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  const numericValue = parseFloat(totalValue.replace(',', '.'));
  const isValidValue = !isNaN(numericValue) && numericValue > 0;
  const valuePerPerson = isValidValue ? numericValue / peopleCount : 0;
  
  const targetParticipants = Math.max(1, peopleCount - 1);
  const targetAmountToReceive = valuePerPerson * targetParticipants;
  
  const totalPaidAmount = Math.min(stats.paidCount * valuePerPerson, targetAmountToReceive);
  const paymentPercentage = isValidValue ? (totalPaidAmount / targetAmountToReceive) * 100 : 0;

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const skipNextAutoCreate = useRef(false);

  useEffect(() => {
    if (!isValidValue) {
        setBillId(null);
        setStats({ scanCount: 0, paidCount: 0 });
        return;
    }
    if (skipNextAutoCreate.current) {
        skipNextAutoCreate.current = false;
        return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
        setIsGenerating(true);
        try {
            const bill = await createBill(numericValue, peopleCount);
            setBillId(bill.id);
            setStats({ scanCount: 0, paidCount: 0 });
            setBills(prev => [bill, ...prev]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    }, 800);
    return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [numericValue, peopleCount, isValidValue]);

  const pixPayload = useMemo(() => {
    if (!isValidValue || valuePerPerson <= 0) return '';
    return generatePixPayload(user.pixKey, user.name, user.city, valuePerPerson);
  }, [isValidValue, valuePerPerson, user]);

  const shareUrl = useMemo(() => {
     if (!billId) return '';
     return `http://192.168.1.139:3000/share/${billId}`;
  }, [billId]);

  useEffect(() => {
    if (!billId) return;
    const fetchStats = async () => {
      const data = await getBillStatus(billId);
      if (data) setStats(data);
    };
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, [billId]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
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
      }
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
  };

  const handleDeleteBill = async (id: string, e?: React.MouseEvent) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    if (deletingId !== id) {
        setDeletingId(id);
        setTimeout(() => setDeletingId(curr => curr === id ? null : curr), 3000);
        return;
    }
    try {
        const result = await deleteBill(id);
        if (result?.success) {
            setBills(prev => prev.filter(b => b.id !== id));
            if (billId === id) {
                setBillId(null);
                setTotalValue('');
            }
            setDeletingId(null);
        }
    } catch (e) {
        console.error('Delete error client:', e);
    }
  };

  const handleViewBill = (bill: any) => {
    skipNextAutoCreate.current = true;
    setTotalValue(bill.amount.toString());
    setPeopleCount(bill.peopleCount);
    setBillId(bill.id);
    setStats({ scanCount: bill.scanCount, paidCount: bill.paidCount });
    setActiveTab('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) {
        setLoading(true);
        try {
            await deleteUserAccount();
        } catch (e) {
            alert('Erro ao excluir conta.');
            setLoading(false);
            setIsDeletingAccount(false);
        }
    } else {
        setIsDeletingAccount(true);
        setTimeout(() => setIsDeletingAccount(false), 5000);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] w-full max-w-lg mx-auto bg-[#050505] relative selection:bg-violet-500/30 pb-[env(safe-area-inset-bottom)]">
      {/* Premium Sticky Header (iOS Safe Area Optimized) */}
      <header className="sticky top-0 z-50 px-6 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] flex justify-between items-center bg-black/60 backdrop-blur-2xl border-b border-white/5">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 shiny-border">
                <ReceiptText className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                  <h1 className="text-xl font-black text-white font-mono tracking-tighter leading-none">RA-XEI</h1>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Premium v2.0</p>
              </div>
          </div>
          
          <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Sessão de</p>
                  <p className="text-xs font-bold text-white leading-none">{user.name.split(' ')[0]}</p>
              </div>
              <button 
                onClick={() => logout()}
                className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white transition-all ring-1 ring-white/10 hover:bg-red-500/10 hover:text-red-400 hover:ring-red-500/20"
              >
                <LogOut className="w-5 h-5" />
              </button>
          </div>
      </header>

      <main className="flex-1 p-6 space-y-8 pb-32">

        <AnimatePresence mode="wait">
          {activeTab === 'calculator' && (
            <motion.div 
              key="calculator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Calculator Panel */}
              <div className="glass-panel rounded-[2.5rem] p-8 relative overflow-hidden shiny-border">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-violet-600/10 rounded-full blur-[80px]"></div>
                
                <div className="relative z-10 space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 ml-1">Valor Total da Conta</label>
                    <div className="relative group">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-black text-violet-500/50 italic pointer-events-none">R$</span>
                      <input 
                        type="number"
                        inputMode="decimal"
                        value={totalValue}
                        onChange={(e) => setTotalValue(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-transparent border-b-2 border-white/5 py-4 pl-14 text-7xl font-black text-white focus:outline-none focus:border-violet-500 transition-all font-mono tracking-tighter placeholder:text-zinc-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 ml-1">Dividir por</label>
                    <div className="flex items-center justify-between bg-black/40 p-3 rounded-full border border-white/5 shadow-inner">
                        <button 
                            onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                            className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-white active:scale-90 transition-all border border-white/10 hover:bg-white/10 shadow-lg"
                        >
                            <Minus className="w-8 h-8" />
                        </button>
                        <div className="flex flex-col items-center">
                            <span className="text-5xl font-black text-white font-mono leading-none">{peopleCount}</span>
                            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Pessoas</span>
                        </div>
                        <button 
                            onClick={() => setPeopleCount(peopleCount + 1)}
                            className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-white active:scale-90 transition-all border border-white/10 hover:bg-white/10 shadow-lg"
                        >
                            <Plus className="w-8 h-8" />
                        </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Result Panel */}
              <AnimatePresence>
                {isValidValue && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="glass-panel rounded-[2.5rem] p-8 flex flex-col items-center relative overflow-hidden shiny-border">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-cyan-500/5 pointer-events-none"></div>
                        
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 relative z-10">Valor Individual</p>
                        <h2 className="text-7xl font-black text-white font-mono tracking-tighter mb-8 relative z-10 text-gradient">
                            <span className="text-2xl mr-1 opacity-50 italic">R$</span>{valuePerPerson.toFixed(2).replace('.', ',')}
                        </h2>

                        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl mb-8 relative group ring-8 ring-white/5 transform transition-transform hover:rotate-1 duration-500">
                            <AnimatePresence>
                                {isGenerating && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 rounded-[2.5rem] flex flex-col items-center justify-center"
                                    >
                                        <Loader2 className="w-12 h-12 animate-spin text-zinc-900 mb-2" />
                                        <span className="text-[10px] font-black text-black uppercase tracking-widest">Calculando...</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <QRCodeSVG value={billId ? shareUrl : 'Aguardando...'} size={210} level="Q" />
                        </div>

                        <div className="w-full grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-violet-600/5 rounded-3xl border border-violet-600/10 flex flex-col items-center justify-center shadow-lg">
                                <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-1">Visualizações</span>
                                <span className="text-3xl font-black text-white font-mono">{stats.scanCount}</span>
                            </div>
                            <div className="p-4 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 flex flex-col items-center justify-center shadow-lg">
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Pagamentos</span>
                                <span className="text-3xl font-black text-white font-mono">{stats.paidCount}</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => copyToClipboard(billId ? shareUrl : '')}
                            disabled={!billId}
                            className={`w-full py-5 rounded-3xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${
                                copied 
                                ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                                : 'bg-white text-black hover:bg-zinc-200'
                            }`}
                        >
                            <Share2 className="w-6 h-6" />
                            {copied ? 'Link Copiado!' : 'Compartilhar Link'}
                        </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-end px-2">
                  <div>
                      <h2 className="text-3xl font-black text-white leading-none">Histórico</h2>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">{bills.length} registros ativos</p>
                  </div>
                  <History className="text-zinc-800 w-12 h-12 -mb-2" />
              </div>

              <div className="space-y-4">
                  {bills.map((bill) => {
                      const billValuePerPerson = bill.amount / bill.peopleCount;
                      const bTargetCount = Math.max(1, bill.peopleCount - 1);
                      const billTargetAmount = billValuePerPerson * bTargetCount;
                      const billPaidAmount = bill.paidCount * billValuePerPerson;
                      const bPercentage = Math.min((billPaidAmount / billTargetAmount) * 100, 100);

                      return (
                          <div 
                              key={bill.id}
                              className="glass-panel p-6 rounded-[2rem] border border-white/5 relative overflow-hidden active:scale-[0.97] transition-all hover:bg-white/[0.05] group"
                              onClick={() => handleViewBill(bill)}
                          >
                              <div className="flex justify-between items-center mb-5">
                                  <div className="flex items-center gap-4">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 ${bPercentage >= 100 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-violet-500/10 text-violet-400'}`}>
                                          <ReceiptText className="w-6 h-6" />
                                      </div>
                                      <div>
                                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">
                                              {new Date(bill.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                          <h4 className="text-2xl font-black text-white font-mono leading-none tracking-tighter">
                                              <span className="text-sm font-normal text-zinc-500 mr-0.5 opacity-50">R$</span>{bill.amount.toFixed(2).replace('.', ',')}
                                          </h4>
                                      </div>
                                  </div>
                                  <button 
                                      onClick={(e) => handleDeleteBill(bill.id, e)}
                                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                          deletingId === bill.id ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-zinc-700 hover:text-red-400'
                                      }`}
                                  >
                                      <Minus className="w-5 h-5" />
                                  </button>
                              </div>

                              <div className="space-y-2">
                                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-600">
                                      <span>{bill.paidCount} de {bTargetCount} Pagos</span>
                                      <span className={bPercentage >= 100 ? 'text-emerald-400' : ''}>{bPercentage.toFixed(0)}%</span>
                                  </div>
                                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                                      <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${bPercentage}%` }}
                                          className={`h-full rounded-full transition-all duration-1000 ${bPercentage >= 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-violet-600 to-cyan-500'}`}
                                      />
                                  </div>
                              </div>
                          </div>
                      );
                  })}

                  {bills.length === 0 && (
                      <div className="py-20 text-center space-y-4 opacity-30">
                          <History className="w-16 h-16 mx-auto" />
                          <p className="text-xs font-black uppercase tracking-[0.3em]">Histórico Vazio</p>
                      </div>
                  )}
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col items-center py-10 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none"></div>
                  
                  <div className="w-28 h-28 bg-white/5 rounded-[3.5rem] flex items-center justify-center mb-6 ring-1 ring-white/10 shadow-2xl relative z-10 shiny-border">
                    <UserCircle className="w-16 h-16 text-zinc-400" />
                  </div>
                  <h2 className="text-4xl font-black text-white tracking-tighter relative z-10">{user.name}</h2>
                  <div className="mt-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 relative z-10">
                    <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">{user.pixKey}</p>
                  </div>
              </div>

              <div className="space-y-10">
                  <div className="glass-panel rounded-[2rem] border border-white/5 p-8 shiny-border">
                      <div className="flex items-center gap-3 mb-8">
                          <ShieldCheck className="text-emerald-400 w-5 h-5" />
                          <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Centro de Privacidade</h4>
                      </div>
                      
                      <div className="space-y-6">
                          <div className="flex flex-col gap-2">
                              <p className="text-[10px] text-zinc-500 leading-relaxed">
                                  Suas informações são protegidas pelo protocolo <strong>Ra-xei Security</strong>, utilizando criptografia AES-256 e hashing PBKDF2.
                              </p>
                          </div>

                          <button 
                            onClick={handleDeleteAccount}
                            disabled={loading}
                            className={`w-full py-5 px-8 rounded-3xl text-xs font-black transition-all flex items-center justify-between border active:scale-95 ${
                                isDeletingAccount 
                                ? 'bg-red-500 text-white border-red-400 animate-pulse' 
                                : 'bg-red-500/5 text-red-500 border-red-500/10 hover:bg-red-500/10'
                            }`}
                          >
                            <span>{isDeletingAccount ? 'Confirmar Exclusão Definitiva?' : 'Encerrar Conta e Excluir Dados'}</span>
                            <ShieldCheck className="w-5 h-5 opacity-50" />
                          </button>
                      </div>
                  </div>
                  
                  <div className="text-center space-y-2 opacity-20">
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white">Ra-xei Limited Edition</p>
                    <p className="text-[8px] font-bold text-zinc-500">Desenvolvido com foco em UX Minimalista</p>
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modern Keyboard-Aware Bottom Navigation (iOS Safe Area Optimized) */}
      <nav 
        style={{ bottom: `${keyboardOffset}px` }}
        className="fixed left-0 right-0 z-50 bg-black/80 backdrop-blur-3xl border-t border-white/5 px-8 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-w-lg mx-auto transition-all duration-300 ease-out"
      >
          <div className="max-w-md mx-auto flex justify-between items-center">
              <NavButton 
                  active={activeTab === 'calculator'} 
                  onClick={() => setActiveTab('calculator')} 
                  icon={<CalcIcon />} 
                  label="Dividir" 
              />
              <NavButton 
                  active={activeTab === 'history'} 
                  onClick={() => setActiveTab('history')} 
                  icon={<History />} 
                  label="Histórico" 
              />
              <NavButton 
                  active={activeTab === 'profile'} 
                  onClick={() => setActiveTab('profile')} 
                  icon={<UserCircle />} 
                  label="Conta" 
              />
          </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center gap-2 transition-all group ${active ? 'scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
            <div className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center ${active ? 'bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20' : 'bg-white/5'}`}>
                {React.cloneElement(icon, { size: 22, strokeWidth: active ? 2.5 : 2 })}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-all ${active ? 'text-white' : 'opacity-0 group-hover:opacity-100'}`}>{label}</span>
        </button>
    );
}
