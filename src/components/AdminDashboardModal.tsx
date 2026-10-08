import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, 
  Users, 
  Search, 
  RefreshCw, 
  Download, 
  X, 
  ShieldAlert, 
  Check, 
  Phone, 
  Mail, 
  Calendar, 
  Infinity as InfinityIcon,
  Sparkles,
  ArrowUpDown,
  ExternalLink,
  Lock,
  UserCheck,
  Activity,
  KeyRound,
  Zap,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Copy,
  GraduationCap
} from 'lucide-react';
import { 
  fetchAllUsersFromFirestore, 
  fetchActivityLogsFromFirestore,
  ADMIN_EMAIL, 
  UserAccount, 
  ActivityLog,
  saveRegisteredUser 
} from '../lib/firebase';
import { GRADES_LIST } from '../data/baccalaureateCurriculum';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onAdminLogin: (user: UserAccount) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAdminLogin
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'activity'>('users');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState<'all' | 'signup' | 'login' | 'recharge'>('all');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  
  // Admin login credentials prompt if not logged in as admin
  const [adminEmailInput, setAdminEmailInput] = useState(ADMIN_EMAIL);
  const [adminNameInput, setAdminNameInput] = useState('المشرف العام');
  const [adminPhoneInput, setAdminPhoneInput] = useState('01283569077');
  const [adminPasswordInput, setAdminPasswordInput] = useState('admin1234');
  const [loginError, setLoginError] = useState<string | null>(null);

  const isAdmin = currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, logsData] = await Promise.all([
        fetchAllUsersFromFirestore(),
        fetchActivityLogsFromFirestore()
      ]);
      setUsers(usersData);
      setActivityLogs(logsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadData();
    }
  }, [isOpen, isAdmin]);

  if (!isOpen) return null;

  const handleAdminSelfLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmailInput.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setLoginError(`هذا البريد ليس بريد المشرف المعتمد (${ADMIN_EMAIL})`);
      return;
    }

    try {
      const user = await saveRegisteredUser({
        name: adminNameInput.trim() || 'المشرف العام',
        phone: adminPhoneInput.trim() || '01283569077',
        email: ADMIN_EMAIL,
        password: adminPasswordInput.trim() || 'admin1234'
      });
      onAdminLogin(user);
      setLoginError(null);
      loadData();
    } catch (err) {
      setLoginError('تعذر تسجيل الدخول للمشرف');
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(`تم نسخ ${label} للحافظة!`);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.password && u.password.includes(q))
    );
  });

  const filteredLogs = activityLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = (
      (log.userName && log.userName.toLowerCase().includes(q)) ||
      (log.userPhone && log.userPhone.includes(q)) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q)) ||
      (log.password && log.password.toLowerCase().includes(q))
    );
    const matchesType = activityFilter === 'all' || log.type === activityFilter;
    return matchesQuery && matchesType;
  });

  const exportUsersToCSV = () => {
    if (!users.length) return;
    const headers = ['الاسم ثلاثي', 'رقم الهاتف', 'البريد الإلكتروني', 'كلمة السر', 'الصف الدراسي', 'تاريخ التسجيل', 'الرتبة', 'الرصيد'];
    const rows = users.map(u => [
      `"${u.name}"`,
      `"${u.phone}"`,
      `"${u.email}"`,
      `"${u.password || 'غير محددة'}"`,
      `"${GRADES_LIST.find(g => g.id === u.grade)?.name || u.grade || 'الصف الثالث'}"`,
      `"${new Date(u.createdAt).toLocaleString('ar-EG')}"`,
      `"${u.role === 'admin' ? 'مشرف' : 'طالب'}"`,
      `"${u.isUnlimited ? 'غير محدود' : u.questionsLeft ?? 10}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shomi-students-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setCopySuccess('تم تصدير ملف بيانات الطلاب بنجاح!');
    setTimeout(() => setCopySuccess(null), 2500);
  };

  const exportLogsToCSV = () => {
    if (!activityLogs.length) return;
    const headers = ['نوع العملية', 'اسم المستخدم', 'رقم الهاتف', 'البريد', 'كلمة السر', 'التفاصيل', 'التوقيت'];
    const rows = activityLogs.map(l => [
      `"${l.type}"`,
      `"${l.userName}"`,
      `"${l.userPhone}"`,
      `"${l.userEmail}"`,
      `"${l.password || '—'}"`,
      `"${l.details}"`,
      `"${new Date(l.timestamp).toLocaleString('ar-EG')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shomi-activities-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setCopySuccess('تم تصدير سجل الإشعارات بنجاح!');
    setTimeout(() => setCopySuccess(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-6xl bg-[#071326] text-white rounded-3xl border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 bg-gradient-to-r from-[#09172E] via-[#0D2140] to-[#09172E] border-b border-amber-500/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 rounded-xl flex items-center justify-center text-slate-950 shadow-md border border-amber-300/40">
              <Crown className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-amber-300">لوحة تحكم المشرف (Admin Dashboard)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  حصري للمالك
                </span>
              </div>
              <p className="text-xs text-slate-400">
                متابعة بيانات الطلاب، كلمات السر، عمليات الشحن، وسجل الإشعارات الحية في الوقت الفعلي
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Access Check: Only admin email allowed */}
        {!isAdmin ? (
          <div className="p-6 sm:p-10 text-center space-y-6 max-w-md mx-auto my-auto">
            <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 border border-red-500/30">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-red-300">هذه اللوحة خاصة بالمشرف فقط</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                لا يمكن فتح لوحة التحكم إلا بحساب المشرف الشخصي المرتبط بالبريد:
                <br />
                <span className="font-mono font-bold text-amber-300 dir-ltr inline-block mt-1">{ADMIN_EMAIL}</span>
              </p>
            </div>

            {/* Quick Admin Auth Form */}
            <form onSubmit={handleAdminSelfLogin} className="space-y-3 text-right bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="text-xs font-bold text-slate-300 mb-1">تسجيل الدخول كمالك للمنصة:</div>
              <div>
                <input
                  type="email"
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  placeholder={ADMIN_EMAIL}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-amber-500/30 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="كلمة السر"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-amber-500/30 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
              {loginError && (
                <div className="text-xs text-red-400 font-bold">{loginError}</div>
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer transition-all"
              >
                <Crown className="w-4 h-4 fill-slate-950" />
                <span>الدخول إلى لوحة المشرف بالبريد الشخصي</span>
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[#0C1E38] border border-amber-500/25 flex items-center gap-3 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/30">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">إجمالي الطلاب المسجلين</div>
                  <div className="text-2xl font-black text-amber-300">{users.length}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0C1E38] border border-cyan-500/25 flex items-center gap-3 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">سجل الإشعارات والأحداث</div>
                  <div className="text-2xl font-black text-cyan-300">{activityLogs.length}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0C1E38] border border-emerald-500/25 flex items-center gap-3 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                  <InfinityIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">رصيد حسابك الشخصي</div>
                  <div className="text-2xl font-black text-emerald-300">غير محدود (∞)</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0C1E38] border border-purple-500/25 flex items-center gap-3 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 border border-purple-500/30">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">المشرف المعتمد</div>
                  <div className="text-xs font-mono font-bold text-purple-300 truncate max-w-[150px]">{ADMIN_EMAIL}</div>
                </div>
              </div>
            </div>

            {/* Main Tabs: Users List vs Live Activity Stream */}
            <div className="flex items-center gap-2 p-1.5 bg-[#0B1A33] rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>جدول الطلاب والمستخدمين ({users.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'activity'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>سجل الإشعارات والأحداث الحية ({activityLogs.length})</span>
                {activityLogs.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            </div>

            {/* Actions Bar: Search, Filters, Refresh, Export */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B1A33] p-3 rounded-2xl border border-slate-800">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={activeTab === 'users' ? 'ابحث بالاسم، برقم الهاتف، أو كلمة السر...' : 'ابحث في سجل العمليات، بالاسم، الهاتف، أو كلمة السر...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {activeTab === 'activity' && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-bold">تصفية:</span>
                  <select
                    value={activityFilter}
                    onChange={(e: any) => setActivityFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-cyan-300 focus:outline-none cursor-pointer"
                  >
                    <option value="all">كل الأنشطة</option>
                    <option value="signup">تسجيل جديد</option>
                    <option value="login">تسجيل دخول</option>
                    <option value="recharge">شحن رصيد</option>
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadData}
                  disabled={isLoading}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
                  <span>تحديث فوري</span>
                </button>

                <button
                  type="button"
                  onClick={activeTab === 'users' ? exportUsersToCSV : exportLogsToCSV}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير CSV</span>
                </button>
              </div>
            </div>

            {/* Notification alert */}
            {copySuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{copySuccess}</span>
              </div>
            )}

            {/* TAB 1: Users Data Table */}
            {activeTab === 'users' && (
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#0B1A33] text-slate-300 border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3 font-bold">#</th>
                        <th className="py-3 px-3 font-bold">الاسم ثلاثي بالكامل</th>
                        <th className="py-3 px-3 font-bold">رقم الهاتف</th>
                        <th className="py-3 px-3 font-bold">كلمة السر</th>
                        <th className="py-3 px-3 font-bold">الصف الدراسي</th>
                        <th className="py-3 px-3 font-bold">البريد الإلكتروني</th>
                        <th className="py-3 px-3 font-bold">تاريخ التسجيل</th>
                        <th className="py-3 px-3 font-bold">الرصيد المتاح</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {isLoading ? (
                        <tr>
                          <td colSpan={8} className="text-center py-10 text-slate-400">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                            <span>جاري تحميل بيانات المستخدمين من Firebase...</span>
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-10 text-slate-400">
                            لا يوجد مستخدمون مسجلون يطابقون البحث حالياً.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user, idx) => {
                          const isUserAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                          const userKey = user.id || String(idx);
                          const isPassRevealed = revealedPasswords[userKey];
                          const gradeName = GRADES_LIST.find(g => g.id === user.grade)?.name || user.grade || 'الصف الثالث';

                          return (
                            <tr 
                              key={user.id || idx}
                              className={`hover:bg-slate-800/40 transition-colors ${
                                isUserAdmin ? 'bg-amber-500/5' : ''
                              }`}
                            >
                              <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-3 px-3 font-bold text-white flex items-center gap-1.5">
                                {isUserAdmin && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                                <span>{user.name}</span>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-300">
                                <div className="flex items-center gap-1.5">
                                  <a 
                                    href={`https://wa.me/20${user.phone.replace(/^0+/, '')}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="hover:text-emerald-400 hover:underline inline-flex items-center gap-1"
                                    title="مراسلة عبر واتساب"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-400" />
                                    <span>{user.phone}</span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(user.phone, 'رقم الهاتف')}
                                    className="text-slate-500 hover:text-white"
                                    title="نسخ رقم الهاتف"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-mono">
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                                    user.password ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-500'
                                  }`}>
                                    {user.password 
                                      ? (isPassRevealed ? user.password : '••••••••') 
                                      : 'بدون كلمة سر'}
                                  </span>
                                  {user.password && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility(userKey)}
                                        className="text-slate-400 hover:text-amber-300"
                                        title={isPassRevealed ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
                                      >
                                        {isPassRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(user.password!, 'كلمة السر')}
                                        className="text-slate-400 hover:text-amber-300"
                                        title="نسخ كلمة السر"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-cyan-300 font-bold">
                                <span className="px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-[11px]">
                                  {gradeName}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">{user.email}</td>
                              <td className="py-3 px-3 text-slate-400 text-[11px]">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'غير محدد'}
                              </td>
                              <td className="py-3 px-3 font-black">
                                {isUserAdmin ? (
                                  <span className="text-emerald-400 flex items-center gap-1">
                                    <InfinityIcon className="w-3.5 h-3.5" />
                                    <span>غير محدود</span>
                                  </span>
                                ) : (
                                  <span className="text-amber-300">
                                    {user.questionsLeft ?? 10} أسئلة
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Live Activity Stream & Real-time Notifications */}
            {activeTab === 'activity' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-[#0C1E38] to-cyan-950/60 border border-cyan-500/30 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-black text-cyan-300">بث مباشر للأحداث:</span>
                    <span className="text-slate-300">كل عملية شحن، تسجيل حساب جديد، أو تسجيل دخول بكلمة السر تُسجل فورياً هنا.</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-200 font-mono text-[11px]">
                    {filteredLogs.length} حدث مسجل
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/40">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-[#0B1A33] text-slate-300 border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-3 font-bold">نوع العملية</th>
                          <th className="py-3 px-3 font-bold">اسم الطالب</th>
                          <th className="py-3 px-3 font-bold">رقم الهاتف</th>
                          <th className="py-3 px-3 font-bold">كلمة السر المسجلة / المدخلة</th>
                          <th className="py-3 px-3 font-bold">الصف الدراسي</th>
                          <th className="py-3 px-3 font-bold">تفاصيل العملية</th>
                          <th className="py-3 px-3 font-bold">التوقيت الدقيق</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {isLoading ? (
                          <tr>
                            <td colSpan={7} className="text-center py-10 text-slate-400">
                              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                              <span>جاري تحميل سجل الأحداث من Firebase...</span>
                            </td>
                          </tr>
                        ) : filteredLogs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-10 text-slate-400">
                              لا توجد أنشطة مسجلة بعد في هذا الفلتر.
                            </td>
                          </tr>
                        ) : (
                          filteredLogs.map((log, idx) => {
                            const isSignup = log.type === 'signup';
                            const isLogin = log.type === 'login';
                            const isRecharge = log.type === 'recharge';
                            const gradeName = GRADES_LIST.find(g => g.id === log.grade)?.name || log.grade || '—';

                            return (
                              <tr key={log.id || idx} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-3 px-3">
                                  {isSignup && (
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-fit">
                                      <UserPlus className="w-3 h-3" />
                                      <span>تسجيل حساب جديد</span>
                                    </span>
                                  )}
                                  {isLogin && (
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1 w-fit">
                                      <LogIn className="w-3 h-3" />
                                      <span>تسجيل دخول من جهاز</span>
                                    </span>
                                  )}
                                  {isRecharge && (
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 w-fit">
                                      <Zap className="w-3 h-3 fill-amber-300" />
                                      <span>عملية شحن رصيد</span>
                                    </span>
                                  )}
                                  {!isSignup && !isLogin && !isRecharge && (
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                      {log.type}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 font-bold text-white">
                                  <span>{log.userName}</span>
                                </td>
                                <td className="py-3 px-3 font-mono text-slate-300">
                                  <div className="flex items-center gap-1.5">
                                    <a 
                                      href={`https://wa.me/20${log.userPhone.replace(/^0+/, '')}`} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="hover:text-emerald-400 hover:underline inline-flex items-center gap-1"
                                      title="مراسلة عبر واتساب"
                                    >
                                      <span>{log.userPhone}</span>
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(log.userPhone, 'رقم الهاتف')}
                                      className="text-slate-500 hover:text-white"
                                      title="نسخ رقم الهاتف"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3 px-3 font-mono">
                                  {log.password ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[11px]">
                                        {log.password}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(log.password!, 'كلمة السر')}
                                        className="text-slate-400 hover:text-amber-300"
                                        title="نسخ كلمة السر"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-slate-500">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-cyan-300 font-bold text-[11px]">
                                  {gradeName}
                                </td>
                                <td className="py-3 px-3 text-slate-200 font-medium max-w-xs leading-snug">
                                  {log.details}
                                </td>
                                <td className="py-3 px-3 text-slate-400 font-mono text-[10.5px]">
                                  {log.timestamp ? new Date(log.timestamp).toLocaleString('ar-EG', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  }) : 'الآن'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminDashboardModal;
