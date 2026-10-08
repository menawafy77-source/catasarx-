import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Crown,
  Loader2,
  Lock,
  LogOut,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LogIn,
  UserPlus
} from 'lucide-react';
import { 
  saveRegisteredUser, 
  loginWithPhoneAndPassword, 
  ADMIN_EMAIL, 
  UserAccount, 
  clearStoredCurrentUser,
  checkUserPhone,
  getEgyptianOperator
} from '../lib/firebase';
import { GRADES_LIST } from '../data/baccalaureateCurriculum';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserRegistered: (user: UserAccount) => void;
  currentUser: UserAccount | null;
  onOpenAdminDashboard?: () => void;
  isMandatory?: boolean;
  onLogout?: () => void;
}

export const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  onUserRegistered,
  currentUser,
  onOpenAdminDashboard,
  isMandatory = false,
  onLogout
}) => {
  // Mode: 'signup' for new accounts, 'login' for logging in with phone & password from another device
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');

  // Signup fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('3rd_secondary');

  // Login fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setEmail(currentUser.email || '');
      setPassword(currentUser.password || '');
      if (currentUser.grade) {
        setGrade(currentUser.grade);
      }
    }
  }, [currentUser]);

  if (!isOpen) return null;

  // Handle New Account Creation
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanName || !cleanPhone || !cleanEmail || !cleanPass) {
      setErrorMessage('يرجى ملء جميع الحقول المطلوبة (الاسم ثلاثي، رقم الهاتف، البريد، كلمة السر)');
      return;
    }

    // Verify name has at least 3 parts as requested: "الاسم ثلاثي"
    const nameParts = cleanName.split(/\s+/);
    if (nameParts.length < 3) {
      setErrorMessage('يرجى كتابة الاسم ثلاثي بالكامل (مثال: أحمد محمد علي)');
      return;
    }

    // التحقق البرمجي الدقيق من صحة رقم الموبايل المصري
    if (!checkUserPhone(cleanPhone)) {
      setErrorMessage('يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015');
      return;
    }

    if (cleanPass.length < 4) {
      setErrorMessage('يرجى اختيار كلمة سر مكونة من 4 أحرف أو أرقام على الأقل');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const user = await saveRegisteredUser({
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        password: cleanPass,
        grade
      });

      const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      if (isAdmin) {
        setSuccessMessage('مرحباً بحساب المشرف العام! تم تفعيل رصيد أسئلة غير محدود (∞) وفتح صلاحيات الإدارة.');
      } else {
        setSuccessMessage(`أهلاً بك يا ${user.name}! تم إنشاء حسابك وحفظ كلمة السر بنجاح. يمكنك الدخول بها من أي جهاز برقم الهاتف.`);
      }

      onUserRegistered(user);

      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1600);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Login From Another Device
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = loginPhone.trim();
    const cleanPass = loginPassword.trim();

    if (!cleanPhone || !cleanPass) {
      setErrorMessage('يرجى إدخال رقم الهاتف وكلمة السر لتسجيل الدخول.');
      return;
    }

    // إذا كان المدخل رقم هاتف (أرقام فقط)، نتحقق من صحة الرقم المصري
    if (/^[0-9]+$/.test(cleanPhone) && !checkUserPhone(cleanPhone)) {
      setErrorMessage('يرجى إدخال رقم موبايل مصري صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015)');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const user = await loginWithPhoneAndPassword(cleanPhone, cleanPass);

      const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      if (isAdmin) {
        setSuccessMessage('مرحباً بالمشرف العام! تم تسجيل الدخول بنجاح وتفعيل كافة الصلاحيات.');
      } else {
        setSuccessMessage(`مرحباً بعودتك يا ${user.name}! تم تسجيل الدخول بنجاح واستعادة رصيدك وبياناتك.`);
      }

      onUserRegistered(user);

      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'فشل تسجيل الدخول. يرجى التأكد من رقم الهاتف وكلمة السر.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoutClick = () => {
    clearStoredCurrentUser();
    setName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setLoginPhone('');
    setLoginPassword('');
    if (onLogout) {
      onLogout();
    }
  };

  const isAdminUser = currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto" 
      dir="rtl"
      onClick={(e) => {
        if (!isMandatory && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-gradient-to-b from-[#09172E] to-[#040A14] text-white rounded-3xl border border-amber-500/40 shadow-2xl p-5 sm:p-7 relative overflow-hidden my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decoration */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button or Mandatory Badge */}
        {!isMandatory ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 rounded-full transition-all cursor-pointer z-10"
            title="إغلاق النافذة"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-xs z-10">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>تسجيل إجباري</span>
          </div>
        )}

        {/* Header Icon & Title */}
        <div className="text-center space-y-2 mb-5">
          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 border border-amber-300/40">
            {isAdminUser ? (
              <Crown className="w-7 h-7 stroke-[2.5]" />
            ) : isMandatory ? (
              <Lock className="w-7 h-7 stroke-[2.5]" />
            ) : (
              <User className="w-7 h-7 stroke-[2.5]" />
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-amber-300">
            {currentUser 
              ? 'الملف الشخصي والحساب' 
              : authMode === 'signup' 
              ? 'إنشاء حساب جديد بكلمة سر' 
              : 'تسجيل الدخول من جهاز آخر'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {currentUser 
              ? 'أنت مسجل حالياً في منصة shomi. بياناتك ورصيدك محفوظة سحابياً.'
              : authMode === 'signup'
              ? 'سجل بياناتك واسمك ثلاثي وكلمة سر للدخول بها لاحقاً من أي جهاز برقم الهاتف.'
              : 'أدخل رقم هاتفك المسجل وكلمة السر لتسجيل الدخول واسترجاع رصيدك فوراً.'
            }
          </p>
        </div>

        {/* Current user card if logged in */}
        {currentUser && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">الاسم المسجل:</span>
              <span className="font-bold text-amber-200">{currentUser.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">رقم الهاتف:</span>
              <span className="font-mono text-xs text-slate-300">{currentUser.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">البريد الإلكتروني:</span>
              <span className="font-mono text-xs text-slate-300">{currentUser.email}</span>
            </div>
            {currentUser.grade && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">الصف الدراسي:</span>
                <span className="text-xs font-bold text-cyan-300">
                  {GRADES_LIST.find(g => g.id === currentUser.grade)?.name || currentUser.grade}
                </span>
              </div>
            )}
            {currentUser.password && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">كلمة السر المحفوظة:</span>
                <span className="font-mono text-xs text-amber-300">•••••••• ({currentUser.password})</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-amber-500/20">
              <span className="text-xs text-slate-400">الرصيد المتاح:</span>
              <span className="font-black text-emerald-400">
                {currentUser.isUnlimited ? '∞ أسئلة غير محدودة (مشرف)' : `${currentUser.questionsLeft ?? 10} أسئلة`}
              </span>
            </div>

            <div className="pt-2 flex items-center gap-2">
              {isAdminUser && onOpenAdminDashboard && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminDashboard();
                  }}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  <Crown className="w-4 h-4 fill-slate-950" />
                  <span>لوحة تحكم المشرف</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleLogoutClick}
                className="py-2 px-3 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="تسجيل الخروج والتبديل لحساب آخر"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab switch between Signup and Login (if not logged in) */}
        {!currentUser && (
          <div className="flex items-center p-1 bg-[#0B1A33] rounded-2xl border border-amber-500/20 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>إنشاء حساب جديد</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>تسجيل الدخول (جهاز آخر)</span>
            </button>
          </div>
        )}

        {/* Success Alert */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2"
            >
              <X className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Signup Form */}
        {!currentUser && authMode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>الاسم ثلاثي بالكامل</span>
                </span>
                <span className="text-[10px] text-amber-400/90 font-medium">مطلوب 3 أسماء (مثال: محمد أحمد علي)</span>
              </label>
              <input
                type="text"
                id="fullName"
                placeholder="أحمد محمد علي"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F2244]/80 border border-amber-500/30 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="input-group">
                <label htmlFor="signupPhone" className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>رقم الموبايل:</span>
                  </span>
                  {phone.length === 11 && checkUserPhone(phone) && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      ✓ {getEgyptianOperator(phone)}
                    </span>
                  )}
                </label>
                <input
                  type="tel"
                  id="signupPhone"
                  placeholder="010XXXXXXXX"
                  maxLength={11}
                  required
                  value={phone}
                  onChange={(e) => {
                    // منع كتابة الحروف أو الرموز فوراً وتحديد الحد الأقصى بـ 11 رقم
                    const clean = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                    setPhone(clean);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0F2244]/80 border text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all font-mono ${
                    phone.length === 11
                      ? checkUserPhone(phone)
                        ? 'border-emerald-500/60 focus:border-emerald-400 focus:ring-emerald-500/30'
                        : 'border-red-500/60 focus:border-red-400 focus:ring-red-500/30'
                      : 'border-amber-500/30 focus:border-amber-400 focus:ring-amber-500/30'
                  }`}
                />
                {/* إظهار رسالة تنبيه أو خطأ تحت حقل الإدخال */}
                {phone.length === 11 && !checkUserPhone(phone) && (
                  <span id="phoneError" style={{ color: '#ef4444', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    يرجى إدخال رقم موبايل مصري صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015)
                  </span>
                )}
                {phone.length > 0 && phone.length < 11 && (
                  <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    متبقي {11 - phone.length} أرقام (11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015)
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>البريد الإلكتروني</span>
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="student@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F2244]/80 border border-amber-500/30 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>كلمة السر (لتسجيل الدخول من جهاز آخر)</span>
                </span>
                <span className="text-[10px] text-slate-400">تصل للمشرف للحفظ والتأمين</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="أدخل كلمة سر قوية وسهلة التذكر"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-[#0F2244]/80 border border-amber-500/30 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                  title={showPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Grade Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>الصف الدراسي</span>
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F2244]/80 border border-amber-500/30 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30 transition-all cursor-pointer font-bold"
              >
                {GRADES_LIST.map((g) => (
                  <option key={g.id} value={g.id} className="bg-[#09172E] text-white">
                    {g.name} - {g.subtitle}
                  </option>
                ))}
              </select>
            </div>

            {email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && (
              <p className="text-[11px] text-amber-300 font-bold flex items-center gap-1 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>تم التعرف على بريد المشرف! سيتم تفعيل أسئلة غير محدودة وصلاحية الإدارة تلقائياً.</span>
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>جاري إنشاء الحساب وإرسال البيانات...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>إنشاء الحساب وتفعيله الآن 🚀</span>
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                }}
                className="text-xs text-amber-300 hover:underline cursor-pointer"
              >
                لديك حساب بالفعل وتريد تسجيل الدخول من هذا الجهاز؟ اضغط هنا
              </button>
            </div>
          </form>
        )}

        {/* Login Form (From Another Device) */}
        {!currentUser && authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs flex items-center gap-2">
              <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>سجل دخولك برقم هاتفك المسجل وكلمة السر لاستعادة رصيدك والأسئلة السابقة فوراً.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>رقم الهاتف (أو البريد الإلكتروني)</span>
                </span>
                {loginPhone.length === 11 && checkUserPhone(loginPhone) && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    ✓ {getEgyptianOperator(loginPhone)}
                  </span>
                )}
              </label>
              <input
                type="text"
                id="loginPhone"
                placeholder="أدخل رقم الموبايل 010XXXXXXXX أو البريد"
                required
                value={loginPhone}
                onChange={(e) => {
                  const val = e.target.value;
                  // إذا بدأ بأرقام، ننظفها فوراً بحد أقصى 11 رقم
                  if (/^[0-9]+$/.test(val)) {
                    setLoginPhone(val.replace(/[^0-9]/g, '').slice(0, 11));
                  } else {
                    setLoginPhone(val);
                  }
                  if (errorMessage) setErrorMessage(null);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0F2244]/80 border text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all font-mono ${
                  /^[0-9]+$/.test(loginPhone) && loginPhone.length === 11
                    ? checkUserPhone(loginPhone)
                      ? 'border-emerald-500/60 focus:border-emerald-400 focus:ring-emerald-500/30'
                      : 'border-red-500/60 focus:border-red-400 focus:ring-red-500/30'
                    : 'border-amber-500/30 focus:border-amber-400 focus:ring-amber-500/30'
                }`}
              />
              {/^[0-9]+$/.test(loginPhone) && loginPhone.length === 11 && !checkUserPhone(loginPhone) && (
                <span style={{ color: '#ef4444', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  يرجى إدخال رقم موبايل مصري صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015)
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>كلمة السر</span>
                </span>
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  id="loginPassword"
                  placeholder="أدخل كلمة السر الخاصة بحسابك"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-[#0F2244]/80 border border-amber-500/30 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                  title={showLoginPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>جاري التحقق وتسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول واستعادة الحساب 🔑</span>
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                }}
                className="text-xs text-amber-300 hover:underline cursor-pointer"
              >
                مستخدم جديد ليس لديك حساب؟ أنشئ حسابك الآن
              </button>
            </div>
          </form>
        )}

        {/* Security badge note */}
        <div className="mt-5 pt-3 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>يتم حفظ وتأمين وتحديث البيانات في قاعدة بيانات Firebase Firestore</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupModal;

