import React, { useState, useRef } from 'react';
import { 
  X, 
  Zap, 
  CreditCard, 
  Smartphone, 
  Gift, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Sparkles, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Copy, 
  Check,
  PhoneCall,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RechargePlan, UserCredits } from '../types';
import { 
  RECHARGE_PLANS, 
  redeemPromoCode, 
  applyRechargePayment,
  getUserCredits 
} from '../services/creditsManager';
import { 
  logActivityToAdmin, 
  getStoredCurrentUser,
  checkUserPhone,
  getEgyptianOperator,
  updateUserCreditsInFirestore
} from '../lib/firebase';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits: UserCredits;
  onCreditsUpdated: (newCredits: UserCredits) => void;
  isTriggeredByQuotaExceeded?: boolean;
}

type WalletType = 'vodafone_cash' | 'orange_cash' | 'etisalat_cash' | 'instapay';

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

  // Selected package
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(RECHARGE_PLANS[1]);
  
  // Egyptian Wallet Payment states
  const [paymentMethod, setPaymentMethod] = useState<WalletType>('vodafone_cash');
  const walletNumber = '01283569077';
  const instapayAddress = 'غير متوفر حاليا';
  
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedInstapay, setCopiedInstapay] = useState(false);
  const [senderPhone, setSenderPhone] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    planName: string;
    questionsAdded: number;
    newTotal: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCopyWallet = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCopyInstapay = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedInstapay(true);
    setTimeout(() => setCopiedInstapay(false), 2000);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('يرجى اختيار صورة صحيحة لإيصال التحويل (PNG أو JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
      setReceiptFileName(file.name);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptImage(null);
    setReceiptFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate USSD dial code for Egyptian wallets
  const getUssdCode = (wallet: WalletType, price: number): string => {
    switch (wallet) {
      case 'vodafone_cash':
        return `*9*7*${walletNumber}*${price}%23`;
      case 'orange_cash':
        return `*115*1*${walletNumber}*${price}%23`;
      case 'etisalat_cash':
        return `*777*1*${walletNumber}*${price}%23`;
      default:
        return `tel:${walletNumber}`;
    }
  };

  const getMethodTitle = (method: WalletType): string => {
    switch (method) {
      case 'vodafone_cash': return 'فودافون كاش';
      case 'orange_cash': return 'أورانج كاش';
      case 'etisalat_cash': return 'اتصالات كاش / WE Pay';
      case 'instapay': return 'انستاباي (InstaPay)';
    }
  };

  // Confirming payment & activating package
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    const cleanPhone = senderPhone.trim().replace(/\s+/g, '');

    if (!cleanPhone && !receiptImage) {
      setErrorMessage('يرجى إدخال رقم الموبايل الذي حوّلت منه أو رفع صورة إيصال التحويل لتفعيل الرصيد فوراً.');
      return;
    }

    if (cleanPhone && !checkUserPhone(cleanPhone)) {
      setErrorMessage('يرجى كتابة رقم موبايل مصري صحيح مكون من 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015.');
      return;
    }

    setIsConfirming(true);
    setErrorMessage(null);

    setTimeout(() => {
      const updatedCredits = applyRechargePayment(
        selectedPlan,
        getMethodTitle(paymentMethod),
        cleanPhone || (receiptFileName ? `إيصال: ${receiptFileName}` : 'إيصال مرفق')
      );

      // Report recharge to admin real-time stream with explicit price and package details
      const currentUser = getStoredCurrentUser();
      logActivityToAdmin({
        type: 'recharge',
        userName: currentUser?.name || cleanPhone || 'طالب',
        userPhone: currentUser?.phone || cleanPhone || '',
        userEmail: currentUser?.email || '',
        password: currentUser?.password,
        grade: currentUser?.grade,
        amount: selectedPlan.questionsCount,
        priceEGP: selectedPlan.priceEGP,
        packageName: selectedPlan.name,
        paymentMethod: getMethodTitle(paymentMethod),
        details: `عملية شحن باقة: ${selectedPlan.name} بمبلغ ${selectedPlan.priceEGP} ج.م (+${selectedPlan.questionsCount} سؤال) عبر ${getMethodTitle(paymentMethod)} (الرقم المحول: ${cleanPhone || 'إيصال مرفق'})`
      });

      // مزامنة رصيد الأسئلة وعملية الشحن فورياً في Firestore للمستخدم
      if (currentUser?.phone || currentUser?.email || currentUser?.id) {
        updateUserCreditsInFirestore(
          { phone: currentUser.phone, email: currentUser.email, id: currentUser.id },
          updatedCredits.questionsLeft,
          {
            rechargeEGP: selectedPlan.priceEGP,
            rechargeQuestions: selectedPlan.questionsCount,
            packageName: selectedPlan.name
          }
        );
      }

      setIsConfirming(false);
      onCreditsUpdated(updatedCredits);
      setPaymentSuccess({
        planName: selectedPlan.name,
        questionsAdded: selectedPlan.questionsCount,
        newTotal: updatedCredits.questionsLeft
      });
    }, 650);
  };

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
        const currentUser = getStoredCurrentUser();
        const updatedCredits = getUserCredits();
        logActivityToAdmin({
          type: 'recharge',
          userName: currentUser?.name || 'طالب',
          userPhone: currentUser?.phone || '',
          userEmail: currentUser?.email || '',
          password: currentUser?.password,
          grade: currentUser?.grade,
          amount: 20,
          priceEGP: 0,
          packageName: 'كوبون هدية ترويجي (+20 سؤال)',
          paymentMethod: 'كود خصم',
          details: `شحن وتفعيل كوبون ترويجي: ${promoCode} (+20 سؤال مجاني)`
        });

        if (currentUser?.phone || currentUser?.email || currentUser?.id) {
          updateUserCreditsInFirestore(
            { phone: currentUser.phone, email: currentUser.email, id: currentUser.id },
            updatedCredits.questionsLeft,
            {
              rechargeEGP: 0,
              rechargeQuestions: 20,
              packageName: `كوبون: ${promoCode}`
            }
          );
        }

        onCreditsUpdated(updatedCredits);
        setPromoCode('');
      }
    }, 350);
  };

  const handleResetSuccess = () => {
    setPaymentSuccess(null);
    setSenderPhone('');
    setReceiptImage(null);
    setReceiptFileName(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto" dir="rtl">
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
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
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
                تطبيق shomi التعليمي - فودافون كاش / أورانج / اتصالات / InstaPay
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
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'packages'
                ? 'bg-[#0D2040] text-amber-300 shadow-md border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0A172E]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>باقات الشحن والمحافظ (كاش / InstaPay)</span>
          </button>

          <button
            onClick={() => setActiveTab('voucher')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'voucher'
                ? 'bg-[#0D2040] text-amber-300 shadow-md border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0A172E]'
            }`}
          >
            <Gift className="w-4 h-4 text-amber-400" />
            <span>كود تعليمي مباشر (MENA Code)</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
          {paymentSuccess ? (
            /* Celebration & Success Screen */
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 text-center space-y-4 bg-gradient-to-b from-[#08203d] to-[#040b16] rounded-2xl border-2 border-emerald-500/50"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-black text-emerald-300">تم تأكيد التحويل وتفعيل الرصيد بنجاح!</h3>
                <p className="text-sm text-slate-300 mt-1">
                  تم شحن <strong className="text-amber-300">{paymentSuccess.planName}</strong> وإضافة <strong className="text-emerald-400">+{paymentSuccess.questionsAdded} سؤالاً</strong> إلى رصيدك فوراً.
                </p>
              </div>

              <div className="inline-block bg-[#020712] px-6 py-3 rounded-xl border border-amber-500/30 text-slate-200 text-sm">
                رصيدك الإجمالي الآن: <span className="text-2xl font-black text-amber-300 mr-2">{paymentSuccess.newTotal} سؤال</span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetSuccess}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  ابدأ المذاكرة وحل الأسئلة الآن ←
                </button>
              </div>
            </motion.div>
          ) : activeTab === 'packages' ? (
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
                    2. اختر محفظتك أو وسيلة الدفع (مصر):
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('vodafone_cash')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'vodafone_cash'
                          ? 'bg-red-900/90 text-white border-red-500 shadow-md ring-2 ring-red-500/30'
                          : 'bg-[#040B16] text-slate-300 border-amber-500/20 hover:bg-[#0D2040]'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-red-400" />
                      <span>فودافون كاش</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('orange_cash')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'orange_cash'
                          ? 'bg-amber-900/90 text-white border-amber-500 shadow-md ring-2 ring-amber-500/30'
                          : 'bg-[#040B16] text-slate-300 border-amber-500/20 hover:bg-[#0D2040]'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-amber-400" />
                      <span>أورانج كاش</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('etisalat_cash')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'etisalat_cash'
                          ? 'bg-emerald-900/90 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                          : 'bg-[#040B16] text-slate-300 border-amber-500/20 hover:bg-[#0D2040]'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>اتصالات كاش / WE</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('instapay')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer relative ${
                        paymentMethod === 'instapay'
                          ? 'bg-purple-900/90 text-white border-purple-500 shadow-md ring-2 ring-purple-500/30'
                          : 'bg-[#040B16] text-slate-300 border-amber-500/20 hover:bg-[#0D2040]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                          غير متوفر حالياً
                        </span>
                      </div>
                      <span>InstaPay إنستاباي</span>
                    </button>
                  </div>

                  {/* Step 3: Interactive Payment Box (Links, USSD dial, copy buttons) */}
                  <div className="bg-[#040B16] p-4 rounded-xl border border-amber-500/30 text-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
                      <div className="text-slate-200">
                        المبلغ المطلوب تحويله: <strong className="text-amber-300 text-sm font-black">{selectedPlan.priceEGP} جنيه مصري</strong>
                      </div>
                      
                      {/* Copy wallet number button */}
                      <button
                        type="button"
                        onClick={() => handleCopyWallet(walletNumber)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer self-start sm:self-auto ${
                          copiedNumber
                            ? 'bg-emerald-600 text-white border border-emerald-400'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        }`}
                        title="انقر لنسخ رقم المحفظة"
                      >
                        {copiedNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedNumber ? 'تم نسخ الرقم بنجاح ✓' : `نسخ رقم التحويل (${walletNumber})`}</span>
                      </button>
                    </div>

                    {/* Dynamic Action Buttons based on selected wallet */}
                    {paymentMethod === 'vodafone_cash' && (
                      <div className="space-y-2">
                        <p className="text-[11.5px] text-slate-300 leading-relaxed">
                          يمكنك التحويل كودياً بنقرة واحدة من الموبايل أو الاتصال بالرقم، أو فتح تطبيق فودافون كاش:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Quick USSD Dial link */}
                          <a
                            href={`tel:${getUssdCode('vodafone_cash', selectedPlan.priceEGP)}`}
                            className="p-2.5 rounded-xl bg-red-950/80 hover:bg-red-900/90 text-red-200 border border-red-500/40 flex items-center justify-center gap-2 font-bold transition-all"
                          >
                            <PhoneCall className="w-4 h-4 text-red-400" />
                            <span>إدفع الآن بكود فودافون كاش (*9*7*)</span>
                          </a>

                          {/* Direct Call link */}
                          <a
                            href={`tel:${walletNumber}`}
                            className="p-2.5 rounded-xl bg-[#091830] hover:bg-[#0D2448] text-slate-200 border border-amber-500/30 flex items-center justify-center gap-2 font-bold transition-all"
                          >
                            <PhoneCall className="w-4 h-4 text-amber-400" />
                            <span>تحويل فودافون كاش ({walletNumber})</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'orange_cash' && (
                      <div className="space-y-2">
                        <p className="text-[11.5px] text-slate-300 leading-relaxed">
                          اضغط على الرابط لتحويل المبلغ عبر كود أورانج كاش أو الاتصال المباشر برقم المحفظة:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <a
                            href={`tel:${getUssdCode('orange_cash', selectedPlan.priceEGP)}`}
                            className="p-2.5 rounded-xl bg-amber-950/80 hover:bg-amber-900/90 text-amber-200 border border-amber-500/40 flex items-center justify-center gap-2 font-bold transition-all"
                          >
                            <PhoneCall className="w-4 h-4 text-amber-400" />
                            <span>إدفع الآن بكود أورانج كاش (*115*)</span>
                          </a>

                          <a
                            href={`tel:${walletNumber}`}
                            className="p-2.5 rounded-xl bg-[#091830] hover:bg-[#0D2448] text-slate-200 border border-amber-500/30 flex items-center justify-center gap-2 font-bold transition-all"
                          >
                            <PhoneCall className="w-4 h-4 text-amber-400" />
                            <span>تحويل أورانج كاش ({walletNumber})</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'etisalat_cash' && (
                      <div className="space-y-2">
                        <p className="text-[11.5px] text-slate-300 leading-relaxed">
                          اضغط على الرابط لتحويل المبلغ عبر كود اتصالات كاش أو الاتصال المباشر برقم المحفظة:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <a
                            href={`tel:${getUssdCode('etisalat_cash', selectedPlan.priceEGP)}`}
                            className="p-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-200 border border-emerald-500/40 flex items-center justify-center gap-2 font-bold transition-all"
                          >
                            <PhoneCall className="w-4 h-4 text-emerald-400" />
                            <span>إدفع الآن بكود اتصالات كاش (*777*)</span>
                          </a>

                          <a
                            href={`tel:${walletNumber}`}
                            className="p-2.5 rounded-xl bg-[#091830] hover:bg-[#0D2448] text-slate-200 border border-amber-500/30 flex items-center justify-center gap-2 font-bold transition-all"
                          >
                            <PhoneCall className="w-4 h-4 text-emerald-400" />
                            <span>تحويل اتصالات كاش ({walletNumber})</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'instapay' && (
                      <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2.5">
                        <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>خدمة انستا باي (InstaPay): غير متوفر حالياً</span>
                        </div>
                        <p className="text-[11.5px] text-slate-300 leading-relaxed">
                          خدمة إنستاباي غير متوفرة في الوقت الحالي. يُرجى استخدام إحدى المحافظ الإلكترونية (فودافون كاش، أورانج كاش، اتصالات كاش / WE) للتحويل إلى الرقم الموحد:
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#071326] border border-amber-500/30">
                          <div className="flex items-center gap-2 text-amber-200 font-bold font-mono text-sm" dir="ltr">
                            <Smartphone className="w-4 h-4 text-emerald-400" />
                            <span>{walletNumber}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyWallet(walletNumber)}
                              className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition-all"
                            >
                              {copiedNumber ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedNumber ? 'تم نسخ الرقم ✓' : 'نسخ الرقم'}</span>
                            </button>
                            <a
                              href={`tel:${walletNumber}`}
                              className="px-3 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[11px] flex items-center gap-1 transition-all"
                            >
                              <PhoneCall className="w-3 h-3 text-amber-400" />
                              <span>اتصال / تحويل</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Confirming Transfer & Instant Activation */}
                    <form onSubmit={handleConfirmPayment} className="pt-3 border-t border-amber-500/20 space-y-3">
                      <div className="text-amber-300 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>3. تفعيل الخدمة فوراً بعد التحويل:</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        اكتب رقم المحفظة أو الموبايل الذي حوَّلت منه، أو ارفع صورة إيصال التحويل (Screenshot) وسيتم تفعيل الباقة وإضافة الأسئلة فوراً.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center justify-between">
                            <span>رقم الموبايل المحوَّل منه:</span>
                            {senderPhone.length === 11 && checkUserPhone(senderPhone) && (
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded border border-emerald-500/30">
                                ✓ {getEgyptianOperator(senderPhone)}
                              </span>
                            )}
                          </label>
                          <input
                            type="tel"
                            maxLength={11}
                            value={senderPhone}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                              setSenderPhone(clean);
                              setErrorMessage(null);
                            }}
                            placeholder="010XXXXXXXX"
                            className="w-full bg-[#071326] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-right text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-300 block mb-1">
                            أو صورة إيصال التحويل (اختياري):
                          </label>
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleReceiptUpload}
                            className="hidden"
                            id="receipt-file-input"
                          />
                          {!receiptImage ? (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full py-2 px-3 rounded-xl bg-[#091830] hover:bg-[#0D2244] border border-amber-500/30 text-slate-300 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5 text-amber-400" />
                              <span>رفع صورة الإيصال (Screenshot)</span>
                            </button>
                          ) : (
                            <div className="flex items-center justify-between p-1.5 px-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs">
                              <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                                <ImageIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="truncate">{receiptFileName || 'تم إرفاق الإيصال'}</span>
                              </div>
                              <button
                                type="button"
                                onClick={handleRemoveReceipt}
                                className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                                title="حذف الصورة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {errorMessage && (
                        <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isConfirming}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Zap className="w-4 h-4 fill-slate-950" />
                        <span>{isConfirming ? 'جاري التحقق وتفعيل الرصيد...' : `تأكيد التحويل وتفعيل باقة (${selectedPlan.name}) فوراً`}</span>
                      </button>
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
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 shrink-0 cursor-pointer"
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
            <span>معاملات آمنة ومشفرة 100% - فودافون / أورانج / اتصالات كاش / InstaPay</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#0D2040] hover:bg-[#122B55] border border-amber-500/30 text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
}
