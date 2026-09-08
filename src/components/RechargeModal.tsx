import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  CreditCard, 
  Smartphone, 
  Gift, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  QrCode,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RechargePlan, UserCredits } from '../types';
import { 
  RECHARGE_PLANS, 
  redeemPromoCode, 
  applyRechargePayment,
  getUserCredits 
} from '../services/creditsManager';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits: UserCredits;
  onCreditsUpdated: (newCredits: UserCredits) => void;
  isTriggeredByQuotaExceeded?: boolean;
}

export default function RechargeModal({
  isOpen,
  onClose,
  credits,
  onCreditsUpdated,
  isTriggeredByQuotaExceeded = false
}: RechargeModalProps) {
  const [activeTab, setActiveTab] = useState<'packages' | 'voucher'>('packages');
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSubmittingPromo, setIsSubmittingPromo] = useState(false);
  const [unavailableNotice, setUnavailableNotice] = useState<string | null>(null);

  // Payment checkout state
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(RECHARGE_PLANS[1]);
  const [paymentMethod, setPaymentMethod] = useState<'vodafone_cash' | 'instapay' | 'fawry'>('vodafone_cash');
  const [senderPhone, setSenderPhone] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);

  if (!isOpen) return null;

  const handleRedeem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promoCode.trim()) return;

    setIsSubmittingPromo(true);
    setPromoResult(null);

    setTimeout(() => {
      const result = redeemPromoCode(promoCode);
      setIsSubmittingPromo(false);
      setPromoResult(result);

      if (result.success) {
        onCreditsUpdated(getUserCredits());
        setPromoCode('');
      }
    }, 350);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setUnavailableNotice('عفواً هذه الخدمة غير متاحة');
  };

  const handleCopyWallet = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#061122]/98 rounded-3xl max-w-2xl w-full shadow-2xl border border-amber-500/35 overflow-hidden my-auto flex flex-col max-h-[92vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#071428] via-[#0D2447] to-[#071428] text-white p-5 sm:p-6 relative border-b border-amber-500/30">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors text-white"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-inner">
              <Zap className="w-6 h-6 fill-amber-300" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-amber-300">شحن رصيد الأسئلة</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                تطبيق caby التعليمي - المناهج المصرية والبكالوريا الجديدة
              </p>
            </div>
          </div>

          {/* Quota Exceeded Alert Badge */}
          {isTriggeredByQuotaExceeded && (
            <div className="mt-4 p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>لقد استهلكت جميع الأسئلة المجانية (10/10). يرجى شحن الرصيد للمتابعة.</span>
            </div>
          )}

          {/* Current balance card */}
          <div className="mt-4 bg-[#040B16]/80 backdrop-blur-md rounded-2xl p-3 border border-amber-500/25 flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-300">رصيدك الحالي المتبقي:</span>
              <span className="font-extrabold text-amber-300 text-base sm:text-lg bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                {credits.questionsLeft} {credits.questionsLeft === 1 ? 'سؤال' : 'أسئلة'}
              </span>
            </div>
            <div className="text-[11px] text-cyan-300">
              إجمالي الأسئلة المحلولة: {credits.totalQuestionsAsked}
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-amber-500/20 bg-[#040B16]/90 p-2 gap-2 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'packages'
                ? 'bg-[#0D2040] text-amber-300 shadow-md border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0A172E]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>باقات الشحن والدفع (فودافون كاش / انستاباي / فوري)</span>
          </button>

          <button
            onClick={() => setActiveTab('voucher')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'voucher'
                ? 'bg-[#0D2040] text-amber-300 shadow-md border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0A172E]'
            }`}
          >
            <Gift className="w-4 h-4 text-amber-400" />
            <span>شحن كود / كارت تعليمي (MENA Code)</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'packages' ? (
            <div className="space-y-5">
              {/* Step 1: Select Plan */}
              <div>
                <label className="text-xs font-bold text-amber-300 block mb-2.5">
                  1. اختر باقة الأسئلة المناسبة لك:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {RECHARGE_PLANS.map((plan) => {
                    const isSelected = selectedPlan?.id === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-400 bg-[#0C1E3C] shadow-lg ring-2 ring-amber-400/20'
                            : 'border-amber-500/20 bg-[#081528] hover:border-amber-500/40'
                        }`}
                      >
                        {plan.badge && (
                          <div className={`absolute -top-2.5 right-3 text-[10px] font-extrabold px-2 py-0.5 rounded-full text-slate-950 shadow-2xs ${
                            plan.popular ? 'bg-amber-400' : 'bg-cyan-400'
                          }`}>
                            {plan.badge}
                          </div>
                        )}

                        <div>
                          <div className="flex items-baseline justify-between mt-1">
                            <h3 className="font-bold text-slate-100 text-sm">{plan.name}</h3>
                          </div>
                          
                          <div className="my-2 text-center py-2 bg-[#040B16] rounded-xl border border-amber-500/20">
                            <span className="text-2xl font-black text-amber-300">{plan.priceEGP}</span>
                            <span className="text-xs font-bold text-slate-400 mr-1">جنيه مصري</span>
                            <div className="text-xs font-semibold text-emerald-400 mt-0.5">
                              ({plan.questionsCount} سؤال دراسي)
                            </div>
                          </div>

                          <ul className="space-y-1 text-[11px] text-slate-300 mb-2">
                            {plan.features.map((feat, i) => (
                              <li key={i} className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-2 border-t border-amber-500/20 flex items-center justify-center">
                          <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-slate-400'}`}>
                            {isSelected ? '✓ الباقة المحددة' : 'اختر الباقة'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Payment Method in Egypt */}
              {selectedPlan && (
                <div className="bg-[#081528] p-4 rounded-2xl border border-amber-500/25 space-y-4">
                  <label className="text-xs font-bold text-amber-300 block">
                    2. اختر وسيلة الدفع المتاحة في مصر:
                  </label>

                  <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('vodafone_cash')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'vodafone_cash'
                          ? 'bg-red-700 text-white border-red-500 shadow-md'
                          : 'bg-[#040B16] text-slate-300 border-amber-500/20 hover:bg-[#0D2040]'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-red-400" />
                      <span>فودافون كاش / المحافظ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('instapay')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'instapay'
                          ? 'bg-purple-800 text-white border-purple-500 shadow-md'
                          : 'bg-[#040B16] text-slate-300 border-amber-500/20 hover:bg-[#0D2040]'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span>انستاباي (InstaPay)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('fawry')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'fawry'
                          ? 'bg-amber-600 text-slate-950 font-black border-amber-400 shadow-md'
                          : 'bg-[#040B16] text-slate-300 border-amber-500/20 hover:bg-[#0D2040]'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <span>فوري باي / ميزة</span>
                    </button>
                  </div>

                  {/* Payment Instructions Box */}
                  <div className="bg-[#040B16] p-3.5 rounded-xl border border-amber-500/25 text-xs space-y-2.5">
                    {paymentMethod === 'vodafone_cash' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-slate-200 font-medium">
                          <span>حول المبلغ ({selectedPlan.priceEGP} ج.م) لرقم فودافون كاش:</span>
                          <button
                            type="button"
                            onClick={() => handleCopyWallet('01012345678')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/80 text-red-300 text-[11px] font-bold border border-red-500/40 hover:bg-red-900/60"
                          >
                            {copiedNumber ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>01012345678</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          بعد التحويل، أدخل رقم المحفظة المحوَّل منها واضغط تأكيد الشحن وسيتم تفعيل الأسئلة فوراً.
                        </p>
                      </div>
                    )}

                    {paymentMethod === 'instapay' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-slate-200 font-medium">
                          <span>عنوان الدفع عبر InstaPay:</span>
                          <button
                            type="button"
                            onClick={() => handleCopyWallet('caby@instapay')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/80 text-purple-300 text-[11px] font-bold border border-purple-500/40 hover:bg-purple-900/60"
                          >
                            {copiedNumber ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>caby@instapay</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          حول مبلغ {selectedPlan.priceEGP} ج.م مع كتابة اسمك في الملاحظات، ثم اضغط تفعيل.
                        </p>
                      </div>
                    )}

                    {paymentMethod === 'fawry' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-slate-200 font-medium">
                          <span>كود الخدمة لدى فوري (Fawry Pay):</span>
                          <span className="font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                            78821
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          ادفع الكود في أي فرع أو تطبيق فوري، أو استخدم بطاقة ميزة الوطنية.
                        </p>
                      </div>
                    )}

                    <form onSubmit={handleConfirmPayment} className="pt-2 border-t border-amber-500/20 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={senderPhone}
                          onChange={(e) => setSenderPhone(e.target.value)}
                          placeholder="رقم المحفظة أو المرجع (اختياري)..."
                          className="flex-1 bg-[#071326] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-right text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                        />
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                        >
                          <Zap className="w-3.5 h-3.5 fill-slate-950" />
                          <span>شحن</span>
                        </button>
                      </div>

                      {unavailableNotice && (
                        <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>{unavailableNotice}</span>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Voucher / Promo Codes Tab */
            <div className="space-y-5">
              <div className="bg-[#081528] border border-amber-500/30 rounded-2xl p-4 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span>شحن كود تعليمي مباشر (MENA)</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11.5px]">
                  أدخل كود الشحن (يبدأ بـ MENA ويليه الرمز المكون من 4 أرقام وفق الشروط المعتمدة) لإضافة 20 سؤالاً فوراً إلى رصيدك.
                </p>

                <form onSubmit={handleRedeem} className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="اكتب الكود هنا (مثال: MENA3589)..."
                      className="flex-1 bg-[#040B16] border border-amber-500/40 rounded-xl px-3 py-2.5 text-xs text-right font-mono tracking-wider text-amber-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingPromo}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 shrink-0"
                    >
                      {isSubmittingPromo ? 'جاري الفحص...' : 'شحن'}
                    </button>
                  </div>

                  {promoResult && (
                    <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 font-medium ${
                      promoResult.success
                        ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                        : 'bg-red-950/80 border-red-500/40 text-red-300'
                    }`}>
                      {promoResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span>{promoResult.message}</span>
                    </div>
                  )}
                </form>
              </div>

              {/* Transaction history */}
              {credits.history.length > 0 && (
                <div className="pt-3 border-t border-amber-500/20">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1 mb-2">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    سجل العمليات والشحن السابق:
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {credits.history.map((h, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] bg-[#040B16] border border-amber-500/20 p-2 rounded-lg text-slate-200">
                        <span>{h.description}</span>
                        <span className="font-bold text-emerald-400 dir-ltr">+{h.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#040B16] border-t border-amber-500/20 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>معاملات آمنة ومشفرة 100% - المناهج المصرية</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#0D2040] hover:bg-[#122B55] border border-amber-500/30 text-slate-200 font-semibold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
}
