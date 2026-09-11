import React, { useState } from 'react';
import { X, ShieldCheck, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Footer() {
  const { isDark } = useTheme();
  const [modalContent, setModalContent] = useState<{ title: string; text: string; icon: 'privacy' | 'contact' } | null>(null);

  const handlePrivacyClick = (e: React.MouseEvent) => {
    const privacyEl = document.getElementById('privacy');
    if (privacyEl) {
      privacyEl.scrollIntoView({ behavior: 'smooth' });
    }
    const msg = 'سياسة الخصوصية: نلتزم في CATA SARX بحماية خصوصية بياناتك وملفات تعريف الارتباط وفق سياسات Google AdSense ولا نشارك بياناتك مع أي طرف ثالث.';
    setModalContent({
      title: 'سياسة الخصوصية',
      text: msg,
      icon: 'privacy'
    });
  };

  const handleContactClick = (e: React.MouseEvent) => {
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    }
    const msg = 'للتواصل والدعم الفني الرسمي لمنصة CATA SARX عبر البريد الإلكتروني: menawafy77@gmail.com';
    setModalContent({
      title: 'اتصل بنا',
      text: msg,
      icon: 'contact'
    });
  };

  return (
    <>
      <footer className={`w-full mt-6 py-4 text-center text-xs transition-colors ${
        isDark ? 'text-slate-400' : 'text-slate-600'
      }`}>
        <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>© 2026 CATA SARX. جميع الحقوق محفوظة.</p>
        <p className="mt-1 flex items-center justify-center gap-3">
          <a
            href="privacy.html"
            className={`font-medium transition-colors cursor-pointer ${
              isDark ? 'text-amber-300 hover:text-amber-200' : 'text-amber-800 hover:text-amber-950'
            }`}
          >
            سياسة الخصوصية
          </a>
          <span className={isDark ? 'text-amber-500/40' : 'text-amber-700/40'}>|</span>
          <a
            href="about.html"
            className={`font-medium transition-colors cursor-pointer ${
              isDark ? 'text-amber-300 hover:text-amber-200' : 'text-amber-800 hover:text-amber-950'
            }`}
          >
            عن المنصة
          </a>
          <span className={isDark ? 'text-amber-500/40' : 'text-amber-700/40'}>|</span>
          <a
            href="contact.html"
            className={`font-medium transition-colors cursor-pointer ${
              isDark ? 'text-amber-300 hover:text-amber-200' : 'text-amber-800 hover:text-amber-950'
            }`}
          >
            اتصل بنا
          </a>
        </p>
      </footer>

      {/* In-app fallback dialog if iframe blocks browser alert() */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={() => setModalContent(null)}>
          <div className={`rounded-2xl p-6 max-w-sm w-full shadow-2xl border text-center space-y-4 transition-colors ${
            isDark 
              ? 'bg-[#061122]/95 border-amber-500/35 text-slate-100' 
              : 'bg-white border-amber-500/30 text-slate-900 shadow-xl'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center border ${
              isDark 
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' 
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {modalContent.icon === 'privacy' ? <ShieldCheck className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
            </div>
            <h3 className={`font-bold text-lg ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>{modalContent.title}</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{modalContent.text}</p>
            <button
              onClick={() => setModalContent(null)}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl font-bold transition-colors shadow-md shadow-amber-500/20"
            >
              حسناً
            </button>
          </div>
        </div>
      )}
    </>
  );
}
