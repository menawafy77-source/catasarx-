import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  MessageCircle, 
  Send, 
  Image as ImageIcon, 
  Loader2, 
  Smartphone,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { generateShareCardImage, dataUrlToFile } from '../utils/imageCardGenerator';
import { formatQuestionAndSolutionForCopy, copyFormattedTextToClipboard } from '../utils/mathTextFormatter';

export interface ShareSolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionText: string;
  solutionText: string;
  subject?: string;
  trackName?: string;
  grade?: string;
}

export default function ShareSolutionModal({
  isOpen,
  onClose,
  questionText,
  solutionText,
  subject = 'البكالوريا',
  trackName = 'التعليم الثانوي',
  grade = 'الثانوية العامة'
}: ShareSolutionModalProps) {
  const { isDark } = useTheme();
  const [aspectRatio, setAspectRatio] = useState<'landscape' | 'square'>('landscape');
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState<'all' | 'question' | 'solution' | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // Generate card image whenever parameters or aspect ratio change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsGenerating(true);

    generateShareCardImage({
      questionText,
      solutionText,
      subject,
      trackName,
      grade,
      aspectRatio
    })
      .then(imgUrl => {
        if (isMounted) {
          setCardImage(imgUrl);
          setIsGenerating(false);
        }
      })
      .catch(err => {
        console.error('Failed to generate share card image:', err);
        if (isMounted) {
          setIsGenerating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, questionText, solutionText, subject, trackName, grade, aspectRatio]);

  if (!isOpen) return null;

  // Format full text for copying/sharing with crystal clear math symbols and BiDi stabilization
  const getFullShareText = () => {
    const cleanQ = formatQuestionAndSolutionForCopy(questionText);
    const cleanS = formatQuestionAndSolutionForCopy(solutionText);
    const siteUrl = 'https://shomi-edu.vercel.app/';
    return `📌 *سؤال في ${subject} (${trackName})*:\n${cleanQ}\n\n✨ *الحل النموذجي المعتمد والشرح*:\n${cleanS}\n\n🎓 _تم الحل عبر منصة شومي للذكاء الاصطناعي ومناهج البكالوريا_\n🔗 *رابط المنصة:* ${siteUrl}`;
  };

  const handleCopyText = async (target: 'all' | 'question' | 'solution' = 'all') => {
    let textToCopy = '';
    let successMsg = '';

    if (target === 'question') {
      textToCopy = formatQuestionAndSolutionForCopy(questionText);
      successMsg = 'تم نسخ نص السؤال برموز ومعادلات واضحة بدون أي لخبطة!';
    } else if (target === 'solution') {
      textToCopy = formatQuestionAndSolutionForCopy(solutionText);
      successMsg = 'تم نسخ نص الحل النموذجي بالرموز الصحيحة!';
    } else {
      textToCopy = getFullShareText();
      successMsg = 'تم نسخ نص السؤال والحل النموذجي معاً!';
    }

    await copyFormattedTextToClipboard(textToCopy);
    setCopiedTarget(target);
    setShareSuccess(successMsg);
    setTimeout(() => {
      setCopiedTarget(null);
      setShareSuccess(null);
    }, 2500);
  };

  const handleDownloadImage = () => {
    if (!cardImage) return;
    const a = document.createElement('a');
    a.href = cardImage;
    a.download = `shomi-solution-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShareSuccess('تم حفظ بطاقة صورة الحل بجهازك بنجاح!');
    setTimeout(() => setShareSuccess(null), 2500);
  };

  const handleNativeShareImage = async () => {
    if (!cardImage) return;

    try {
      const file = await dataUrlToFile(cardImage, `shomi-solution-${Date.now()}.png`);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `حل سؤال ${subject} - منصة شومي`,
          text: `حل نموذجي لسؤال في مادة ${subject}:\n${questionText.slice(0, 100)}...`,
          files: [file]
        });
        setShareSuccess('تمت مشاركة بطاقة الحل بنجاح!');
        setTimeout(() => setShareSuccess(null), 2500);
        return;
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Native image share failed or cancelled:', err);
      }
    }

    // Fallback to native text share if file sharing is not supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: `حل سؤال ${subject} - منصة شومي`,
          text: getFullShareText(),
          url: 'https://shomi-edu.vercel.app/'
        });
        setShareSuccess('تمت المشاركة بنجاح!');
        setTimeout(() => setShareSuccess(null), 2500);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopyText();
        }
      }
    } else {
      handleCopyText();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getFullShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTelegramShare = () => {
    const text = encodeURIComponent(getFullShareText());
    window.open(`https://t.me/share/url?url=${encodeURIComponent('https://shomi-edu.vercel.app/')}&text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className={`w-full max-w-2xl rounded-3xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden ${
          isDark 
            ? 'bg-[#061122] border-amber-500/30 text-slate-100 shadow-black/80' 
            : 'bg-white border-amber-500/30 text-slate-900 shadow-xl'
        }`}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 flex items-center justify-between border-b shrink-0 ${
          isDark ? 'bg-[#08172e] border-amber-500/20' : 'bg-amber-500/10 border-amber-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md font-bold">
              <Share2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg sm:text-xl font-black ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                  مشاركة الحل النموذجي
                </h2>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {subject}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                شارك الشرح كنص منسق أو كبطاقة صورة مصممة لمواقع التواصل الاجتماعي.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-all ${
              isDark 
                ? 'bg-[#0A172E] text-slate-400 hover:text-slate-100 hover:bg-[#0F2244] border-amber-500/20' 
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border-slate-300'
            }`}
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast alert */}
        <AnimatePresence>
          {shareSuccess && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-600 text-white text-xs sm:text-sm font-bold px-4 py-2.5 flex items-center justify-center gap-2 shadow-md shrink-0"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{shareSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Format Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <ImageIcon className="w-4 h-4 text-amber-500" />
                <span>شكل بطاقة الصورة المصغرة:</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAspectRatio('landscape')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    aspectRatio === 'landscape'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : isDark
                      ? 'bg-[#0A172E] text-slate-300 border-amber-500/20'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>أفقي (1200×630)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('square')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    aspectRatio === 'square'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : isDark
                      ? 'bg-[#0A172E] text-slate-300 border-amber-500/20'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>مربع (1080×1080)</span>
                </button>
              </div>
            </div>

            {/* Live Image Preview Card */}
            <div className={`relative rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-xl bg-black/40 flex items-center justify-center ${
              aspectRatio === 'square' ? 'aspect-square max-h-72 sm:max-h-80 mx-auto' : 'aspect-[1.9/1] max-h-64 sm:max-h-72 w-full'
            }`}>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center gap-2 p-6 text-amber-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-bold">جاري تجهيز بطاقة الصورة الاحترافية...</span>
                </div>
              ) : cardImage ? (
                <img 
                  src={cardImage} 
                  alt="بطاقة حل السؤال للمشاركة" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-400 text-xs">تعذر توليد المعاينة</div>
              )}
            </div>
          </div>

          {/* Social Direct Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Download Image Button */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGenerating || !cardImage}
              className={`p-3 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1.5 border transition-all shadow-sm ${
                isDark 
                  ? 'bg-gradient-to-b from-amber-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              <Download className="w-5 h-5 text-amber-500" />
              <span>تحميل الصورة (PNG)</span>
            </button>

            {/* Native Share (Social / Files) */}
            <button
              type="button"
              onClick={handleNativeShareImage}
              disabled={isGenerating || !cardImage}
              className={`p-3 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1.5 border transition-all shadow-sm ${
                isDark 
                  ? 'bg-gradient-to-b from-cyan-500/20 to-cyan-500/10 hover:from-cyan-500/30 hover:to-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                  : 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300'
              }`}
            >
              <Share2 className="w-5 h-5 text-cyan-500" />
              <span>مشاركة كملف صورة</span>
            </button>

            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className={`p-3 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1.5 border transition-all shadow-sm ${
                isDark 
                  ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-500/40' 
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}
            >
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              <span>واتساب (WhatsApp)</span>
            </button>

            {/* Telegram */}
            <button
              type="button"
              onClick={handleTelegramShare}
              className={`p-3 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1.5 border transition-all shadow-sm ${
                isDark 
                  ? 'bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border-sky-500/40' 
                  : 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300'
              }`}
            >
              <Send className="w-5 h-5 text-sky-400" />
              <span>تيليجرام (Telegram)</span>
            </button>
          </div>

          {/* Copy Text Options */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#071326] border-amber-500/20' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                خيارات نسخ النص برموز رياضية منسقة:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopyText('all')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                  title="نسخ السؤال والحل معاً"
                >
                  {copiedTarget === 'all' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>تم النسخ معاً ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>السؤال + الحل</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText('question')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 border transition-all active:scale-95 ${
                    isDark 
                      ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border-amber-500/30' 
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                  }`}
                  title="نسخ نص السؤال فقط بالرموز الصحيحة"
                >
                  {copiedTarget === 'question' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تم نسخ السؤال ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>السؤال فقط</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText('solution')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 border transition-all active:scale-95 ${
                    isDark 
                      ? 'bg-[#0A172E] hover:bg-[#0F2244] text-slate-300 border-amber-500/20' 
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                  }`}
                  title="نسخ نص الحل النموذجي فقط"
                >
                  {copiedTarget === 'solution' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>تم نسخ الحل ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>الحل فقط</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              جميع النصوص يتم نسخها برموز رياضية واضحة (Unicode) مع حماية محاذاة المعادلات حتى لا تنقلب الأقواس أو الرموز عند اللصق في واتساب أو وورد.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-3.5 sm:p-4 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#08172e] border-amber-500/20 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <span className="text-xs flex items-center gap-1.5 text-amber-500 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>جاهزة للمشاركة على المجموعات التعليمية ومنصات التواصل</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-600 transition-all"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
}
