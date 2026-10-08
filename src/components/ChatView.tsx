import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  User, 
  Bot, 
  Sparkles, 
  ScanText, 
  Copy, 
  Check, 
  BookOpen, 
  GraduationCap, 
  Shapes, 
  Loader2,
  Layers,
  Award,
  Tag,
  History,
  Share2,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import 'katex/dist/katex.min.css';
import { Message, ProcessingPhase } from '../types';
import { BACCALAUREATE_TRACKS } from '../data/baccalaureateCurriculum';
import { useTheme } from '../context/ThemeContext';
import AdBanner from './AdBanner';
import Footer from './Footer';
import ShareSolutionModal from './ShareSolutionModal';
import { copyFormattedTextToClipboard, formatQuestionAndSolutionForCopy } from '../utils/mathTextFormatter';

export const SABY_AVATAR_SRC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><linearGradient id='sabyBg' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23fbbf24'/><stop offset='100%' stop-color='%23d97706'/></linearGradient><linearGradient id='robotFace' x1='0%' y1='0%' x2='0%' y2='100%'><stop offset='0%' stop-color='%23ffffff'/><stop offset='100%' stop-color='%23f1f5f9'/></linearGradient></defs><circle cx='100' cy='100' r='95' fill='url(%23sabyBg)'/><circle cx='100' cy='100' r='88' fill='none' stroke='%23ffffff' stroke-width='3' opacity='0.4'/><g><rect x='38' y='115' width='10' height='20' rx='4' fill='%23cbd5e1'/><rect x='152' y='115' width='10' height='20' rx='4' fill='%23cbd5e1'/><rect x='45' y='85' width='110' height='80' rx='28' fill='url(%23robotFace)' stroke='%23e2e8f0' stroke-width='2'/><rect x='58' y='100' width='84' height='42' rx='16' fill='%230f172a'/><g fill='%2338bdf8'><circle cx='80' cy='121' r='10'/><circle cx='83' cy='118' r='3' fill='%23ffffff'/><circle cx='120' cy='121' r='10'/><circle cx='123' cy='118' r='3' fill='%23ffffff'/></g><path d='M 88 148 Q 100 157 112 148' stroke='%23d97706' stroke-width='3.5' stroke-linecap='round' fill='none'/><circle cx='68' cy='133' r='5' fill='%23f43f5e' opacity='0.25'/><circle cx='132' cy='133' r='5' fill='%23f43f5e' opacity='0.25'/></g><g><path d='M 70 86 C 70 76, 130 76, 130 86 Z' fill='%230f172a'/><path d='M 100 50 L 158 68 L 100 84 L 42 68 Z' fill='%231e293b'/><path d='M 140 73 L 142 95' stroke='%23f59e0b' stroke-width='3' stroke-linecap='round'/><circle cx='142' cy='98' r='4' fill='%23f59e0b'/></g></svg>";

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  currentPhase?: ProcessingPhase;
  highlightedMessageId?: string | null;
  onOpenHistory?: () => void;
}

export default function ChatView({ 
  messages, 
  isLoading, 
  currentPhase = 'idle',
  highlightedMessageId = null,
  onOpenHistory
}: ChatViewProps) {
  const { isDark } = useTheme();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeShareData, setActiveShareData] = useState<{
    questionText: string;
    solutionText: string;
    subject?: string;
    trackName?: string;
    grade?: string;
  } | null>(null);

  React.useEffect(() => {
    if (scrollRef.current && !highlightedMessageId) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, currentPhase, highlightedMessageId]);

  const handleCopy = async (text: string, id: string, asRawLatex = false) => {
    if (asRawLatex) {
      await navigator.clipboard.writeText(text);
    } else {
      await copyFormattedTextToClipboard(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getTrackName = (trackId?: string) => {
    if (!trackId) return null;
    const track = BACCALAUREATE_TRACKS[trackId as keyof typeof BACCALAUREATE_TRACKS];
    return track ? track.name : trackId;
  };

  const handleOpenShare = (message: Message, messageIndex: number) => {
    // Find preceding user question
    const userMsg = messages.slice(0, messageIndex).reverse().find(m => m.role === 'user');
    const questionText = userMsg?.extractedData?.extractedText 
      || userMsg?.content 
      || 'سؤال في المنهج الدراسي';
    
    const subject = userMsg?.extractedData?.subject 
      || userMsg?.curriculumContext?.subject 
      || 'البكالوريا';

    const trackRaw = userMsg?.extractedData?.track || userMsg?.curriculumContext?.track;
    const trackName = getTrackName(trackRaw) || 'التعليم الثانوي';

    const grade = userMsg?.extractedData?.grade 
      || userMsg?.curriculumContext?.grade 
      || 'الثانوية العامة';

    setActiveShareData({
      questionText,
      solutionText: message.content,
      subject,
      trackName,
      grade
    });
  };

  // Dedicated Share handler requested by user:
  // Creates a simplified/prepared version of the solution + question, copies it to clipboard with site link, and supports native share
  const handleShareSolution = async (message: Message, messageIndex: number) => {
    const userMsg = messages.slice(0, messageIndex).reverse().find(m => m.role === 'user');
    const rawQuestion = userMsg?.extractedData?.extractedText 
      || (userMsg?.content && userMsg.content !== 'مسح السؤال واستخراجه وحله...' ? userMsg.content : '');

    // Set share URL explicitly to https://shomi-edu.vercel.app/ as requested
    const siteUrl = 'https://shomi-edu.vercel.app/';

    const formattedSolution = formatQuestionAndSolutionForCopy(message.content);

    let shareText = '';
    if (rawQuestion) {
      const formattedQ = formatQuestionAndSolutionForCopy(rawQuestion);
      shareText = `📌 *السؤال:*\n${formattedQ}\n\n✨ *الحل النموذجي المعتمد (منصة شومي للثانوية والبكالوريا):*\n${formattedSolution}\n\n🔗 *جرب المنصة الآن وتأكد من إجاباتك فوراً:*\n${siteUrl}`;
    } else {
      shareText = `✨ *الحل النموذجي المعتمد (منصة شومي للثانوية والبكالوريا):*\n${formattedSolution}\n\n🔗 *جرب المنصة الآن وتأكد من إجاباتك فوراً:*\n${siteUrl}`;
    }

    await copyFormattedTextToClipboard(shareText, true);
    setCopiedId(message.id + '_share');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'حل نموذجي - منصة شومي التعليمية',
          text: shareText,
          url: siteUrl
        });
      } catch (err: any) {
        // User cancelled native share, clipboard copy is already active
      }
    }

    setTimeout(() => {
      setCopiedId(null);
    }, 2800);
  };

  const questionCount = messages.filter(m => m.role === 'user').length;

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-6 pb-64 md:pb-72 scroll-smooth w-full max-w-6xl mx-auto" dir="rtl">
      {/* Top Banner when chat contains restored history */}
      {messages.length > 0 && (
        <div className={`p-2.5 px-4 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs backdrop-blur-md transition-all shadow-xs ${
          isDark 
            ? 'bg-[#071326]/80 border-amber-500/25 text-slate-200' 
            : 'bg-amber-50/90 border-amber-300 text-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-bold">
              سجل الأسئلة محفوظ ومتاح دائماً ({questionCount} {questionCount === 1 ? 'سؤال' : 'أسئلة'})
            </span>
          </div>

          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className={`font-black text-xs px-3 py-1 rounded-xl transition-all border flex items-center gap-1.5 shadow-xs ${
                isDark 
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40' 
                  : 'bg-amber-200/80 hover:bg-amber-300 text-amber-950 border-amber-400'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>مراجعة الحلول السابقة</span>
            </button>
          )}
        </div>
      )}
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8 space-y-5">
          <div className={`backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border flex flex-col items-center max-w-3xl sm:max-w-4xl w-full space-y-5 transition-colors ${
            isDark 
              ? 'bg-[#061122]/90 border-amber-500/30 shadow-black/40' 
              : 'bg-white/95 border-amber-500/25 shadow-slate-300/60'
          }`}>
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 rounded-2xl flex items-center justify-center text-slate-950 shadow-md border border-amber-300/40">
              <Sparkles className="w-8 h-8 fill-slate-950" />
            </div>
            <div className="space-y-2">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs mb-1 border ${
                isDark 
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                <span>نظام البكالوريا المصرية الجديد (المسارات التخصصية)</span>
              </div>
              <h2 className={`text-2xl font-black ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>أهلاً بك في shomi!</h2>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                معلمك الذكي المتخصص في مسارات البكالوريا المصرية والمناهج الدراسية. التقط صورة لسؤالك بالكاميرا أو اخترها من المعرض، وسيقوم النظام باستخراج النص كاملاً وحله مع الشرح خطوة بخطوة بالمعادلات والرموز الدقيقة.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full text-xs font-medium pt-2">
              <div className={`p-3 rounded-2xl border shadow-md flex flex-col items-center text-center gap-1.5 ${
                isDark ? 'bg-[#0A172E]/90 border-amber-500/20' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className={`font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>مسار الطب وعلوم الحياة</span>
                <span className={`text-[10.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>أحياء وكيمياء متقدمة</span>
              </div>
              <div className={`p-3 rounded-2xl border shadow-md flex flex-col items-center text-center gap-1.5 ${
                isDark ? 'bg-[#0A172E]/90 border-amber-500/20' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className={`font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>مسار الهندسة والحاسب</span>
                <span className={`text-[10.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>رياضيات، فيزياء، وبرمجة</span>
              </div>
              <div className={`p-3 rounded-2xl border shadow-md flex flex-col items-center text-center gap-1.5 ${
                isDark ? 'bg-[#0A172E]/90 border-amber-500/20' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>مسار الأعمال</span>
                <span className={`text-[10.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>اقتصاد متقدم ومحاسبة</span>
              </div>
              <div className={`p-3 rounded-2xl border shadow-md flex flex-col items-center text-center gap-1.5 ${
                isDark ? 'bg-[#0A172E]/90 border-amber-500/20' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className={`font-bold ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>مسار الآداب والفنون</span>
                <span className={`text-[10.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>جغرافيا متقدمة وإحصاء</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          id={`msg_${message.id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} transition-all duration-300 rounded-2xl ${
            highlightedMessageId === message.id 
              ? 'ring-4 ring-amber-400 p-1.5 shadow-2xl bg-amber-400/10' 
              : ''
          }`}
        >
          <div className={`flex gap-3 w-full ${
            message.role === 'user' 
              ? 'max-w-[92%] sm:max-w-[85%]' 
              : 'max-w-full w-full'
          } ${message.role === 'user' ? 'flex-row' : 'flex-row'}`}>
            {message.role === 'user' ? (
              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm shadow-md bg-gradient-to-br from-amber-500 to-yellow-500 text-slate-950 font-black">
                <User className="w-4 h-4 stroke-[2.5]" />
              </div>
            ) : (
              <div className="relative shrink-0 pt-0.5">
                <img 
                  src={SABY_AVATAR_SRC} 
                  className="saby-avatar w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-md ring-1 ring-amber-400/60 object-contain bg-amber-500/10 p-0.5" 
                  alt="سابي" 
                />
              </div>
            )}
            
            <div className="space-y-3 w-full">
              {/* User message container */}
              {message.role === 'user' ? (
                <div className={`p-4 rounded-2xl rounded-tr-none shadow-xl border space-y-3 ${
                  isDark 
                    ? 'bg-[#0B1E3F]/95 text-slate-100 border-amber-500/30' 
                    : 'bg-amber-500 text-slate-950 border-amber-400 font-medium'
                }`}>
                  {message.image && (
                    <div className="relative rounded-xl overflow-hidden border-2 border-amber-400/60 bg-black/40 shadow-xs">
                      <img 
                        src={`data:image/jpeg;base64,${message.image}`} 
                        alt="Question Scan" 
                        className="max-h-72 w-full object-contain rounded-lg"
                      />
                    </div>
                  )}

                  {/* Extracted Text Box from Image Recognition Module */}
                  {message.extractedData && (
                    <div className={`rounded-xl p-3.5 border text-sm space-y-2.5 backdrop-blur-md ${
                      isDark 
                        ? 'bg-[#050D1A]/80 text-slate-100 border-amber-500/25' 
                        : 'bg-white/95 text-slate-900 border-amber-600/30 shadow-xs'
                    }`}>
                      <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/20 text-xs font-semibold">
                        <div className={`flex items-center gap-1.5 font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                          <ScanText className="w-4 h-4 text-cyan-500" />
                          <span>نص السؤال المستخرج بنظام البكالوريا (OCR):</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopy(message.extractedData?.extractedText || '', message.id + '_ocr')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all text-[11px] font-bold ${
                              isDark 
                                ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border-amber-500/30' 
                                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                            }`}
                            title="نسخ نص السؤال برموز ومعادلات رياضية واضحة ومنسقة للواتساب والملاحظات بدون أي لخبطة"
                          >
                            {copiedId === message.id + '_ocr' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>تم النسخ بالرموز الصحيحة!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>نسخ منسق</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(message.extractedData?.extractedText || '', message.id + '_latex', true)}
                            className={`px-1.5 py-1 rounded-lg border transition-all text-[10px] font-mono font-bold ${
                              isDark 
                                ? 'bg-[#0A172E] text-slate-400 hover:text-amber-300 border-amber-500/20' 
                                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-300'
                            }`}
                            title="نسخ ككود LaTeX أصلي"
                          >
                            {copiedId === message.id + '_latex' ? 'تم نسخ LaTeX!' : 'LaTeX'}
                          </button>
                        </div>
                      </div>

                      {/* Extracted question text with LaTeX math support */}
                      <div className={`text-xs md:text-sm font-medium leading-relaxed markdown-body ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {message.extractedData.extractedText}
                        </ReactMarkdown>
                      </div>

                      {/* Track, Grade, Subject, and Level Schema Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-amber-500/20 text-[11px]">
                        {message.extractedData.track && (
                          <span className={`px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${
                            isDark 
                              ? 'bg-[#0A172E] text-amber-300 border-amber-500/30' 
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}>
                            <Layers className="w-3 h-3 text-cyan-500" />
                            {getTrackName(message.extractedData.track)}
                          </span>
                        )}
                        {message.extractedData.subject && message.extractedData.subject !== 'عام' && (
                          <span className={`px-2 py-0.5 rounded-full border font-medium ${
                            isDark 
                              ? 'bg-[#0A172E] text-cyan-200 border-cyan-500/30' 
                              : 'bg-sky-50 text-sky-900 border-sky-300'
                          }`}>
                            المادة: {message.extractedData.subject}
                          </span>
                        )}
                        {message.extractedData.level_type && (
                          <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                            message.extractedData.level_type === 'advanced'
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-xs'
                              : isDark 
                              ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-500/30' 
                              : 'bg-sky-100 text-sky-900 border border-sky-300'
                          }`}>
                            {message.extractedData.level_type === 'advanced' ? 'مستوى متقدم (رفيع)' : 'مستوى عام'}
                          </span>
                        )}
                        {message.extractedData.grade && message.extractedData.grade !== 'غير محدد' && (
                          <span className={`px-2 py-0.5 rounded-full border font-medium ${
                            isDark 
                              ? 'bg-[#0A172E] text-slate-300 border-amber-500/20' 
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}>
                            {message.extractedData.grade}
                          </span>
                        )}
                        {message.extractedData.topic && message.extractedData.topic !== 'عام' && (
                          <span className={`px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${
                            isDark 
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' 
                              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          }`}>
                            <Tag className="w-3 h-3" />
                            {message.extractedData.topic}
                          </span>
                        )}
                        {message.extractedData.hasDiagram && (
                          <span className={`px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${
                            isDark 
                              ? 'bg-amber-950/60 text-amber-300 border-amber-500/30' 
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}>
                            <Shapes className="w-3 h-3" />
                            رسم توضيحي/هندسي
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {message.content && message.content !== 'مسح السؤال واستخراجه وحله...' && (
                    <div className={`rounded-xl p-3.5 border text-sm space-y-2 backdrop-blur-md ${
                      isDark 
                        ? 'bg-[#050D1A]/80 text-slate-100 border-amber-500/25' 
                        : 'bg-white/95 text-slate-900 border-amber-600/30 shadow-xs'
                    }`}>
                      <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/20 text-xs font-semibold">
                        <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                          نص السؤال:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopy(message.content, message.id + '_user_q')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all text-[11px] font-bold ${
                              isDark 
                                ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border-amber-500/30' 
                                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                            }`}
                            title="نسخ نص السؤال برموز ومعادلات رياضية واضحة ومنسقة للواتساب والملاحظات بدون أي لخبطة"
                          >
                            {copiedId === message.id + '_user_q' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>تم النسخ بالرموز الصحيحة!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>نسخ نص السؤال</span>
                              </>
                            )}
                          </button>
                          {(message.content.includes('$') || message.content.includes('\\')) && (
                            <button
                              type="button"
                              onClick={() => handleCopy(message.content, message.id + '_user_latex', true)}
                              className={`px-1.5 py-1 rounded-lg border transition-all text-[10px] font-mono font-bold ${
                                isDark 
                                  ? 'bg-[#0A172E] text-slate-400 hover:text-amber-300 border-amber-500/20' 
                                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-300'
                              }`}
                              title="نسخ نص السؤال ككود LaTeX أصلي"
                            >
                              {copiedId === message.id + '_user_latex' ? 'تم نسخ LaTeX!' : 'LaTeX'}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className={`text-xs md:text-sm font-medium leading-relaxed markdown-body ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Assistant message container */
                <div className={`p-4 sm:p-5 rounded-2xl rounded-tl-none shadow-2xl space-y-3 backdrop-blur-md border transition-colors ${
                  isDark 
                    ? 'bg-[#071326]/95 text-slate-100 border-amber-500/30 shadow-black/30' 
                    : 'bg-white/98 text-slate-900 border-slate-200/90 shadow-slate-200/80'
                }`}>
                  {/* Assistant Header Actions Bar: Brand Tag & Share/Copy Buttons */}
                  <div className="flex items-center justify-between pb-2 border-b border-amber-500/15 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-500">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11.5px] sm:text-xs">الحل النموذجي المعتمد</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                      {/* Copy solution button */}
                      <button
                        type="button"
                        onClick={() => handleCopy(message.content, message.id + '_sol')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          isDark 
                            ? 'bg-[#0A172E] hover:bg-[#0F2244] text-slate-300 hover:text-white border-amber-500/20' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                        title="نسخ الحل النموذجي برموز رياضية واضحة بدون أي تشوه"
                      >
                        {copiedId === message.id + '_sol' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500">تم النسخ!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>نسخ الحل</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(message.content, message.id + '_latex', true)}
                        className={`px-1.5 py-1 rounded-lg border transition-all text-[10px] font-mono font-bold cursor-pointer ${
                          isDark 
                            ? 'bg-[#0A172E] text-slate-400 hover:text-amber-300 border-amber-500/20' 
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-300'
                        }`}
                        title="نسخ كود LaTeX الأصلي"
                      >
                        {copiedId === message.id + '_latex' ? 'LaTeX!' : 'LaTeX'}
                      </button>

                      {/* Prominent Share button requested in user prompt 4: copies formatted solution with site link */}
                      <button
                        type="button"
                        onClick={() => handleShareSolution(message, index)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        title="مشاركة الحل: إنشاء نسخة نصية مهيأة ومبسطة ونسخها للحافظة مع رابط المنصة"
                      >
                        {copiedId === message.id + '_share' ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>تم نسخ الحل والرابط!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>مشاركة</span>
                          </>
                        )}
                      </button>

                      {/* Share as Image Card modal trigger */}
                      <button
                        type="button"
                        onClick={() => handleOpenShare(message, index)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          isDark 
                            ? 'bg-[#0A172E] hover:bg-[#0F2244] text-amber-300 border-amber-500/20' 
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                        }`}
                        title="مشاركة الحل كبطاقة صورة مصغرة لمواقع التواصل الاجتماعي"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden sm:inline">بطاقة صورة</span>
                      </button>
                    </div>
                  </div>

                  {/* Markdown Solution Body */}
                  <div className="markdown-body">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>

                  {/* Bottom Footer Action Bar */}
                  <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-amber-500/15 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                      <span>شرح موثق وفق معايير مناهج الثانوية والبكالوريا الحديثة</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenShare(message, index)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all ${
                        isDark 
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30' 
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                      title="توليد بطاقة صورة مصغرة ومشاركتها لمواقع التواصل"
                    >
                      <ImageIcon className="w-3 h-3 text-amber-500" />
                      <span>مشاركة كبطاقة صورة</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Loading state with Saby avatar appearing next to the answer while answering, disappearing completely when done */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            key="saby-answering-indicator"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9, transition: { duration: 0.25 } }}
            className="flex justify-start items-start gap-3 sm:gap-4 max-w-[95%] sm:max-w-[85%]"
          >
            {/* Saby Mascot Avatar (يظهر جنب الإجابة وهو بيجاوب ويختفي تماماً بعد انتهاء الإجابة) */}
            <motion.div 
              animate={{ 
                y: [0, -5, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2.2, 
                ease: 'easeInOut' 
              }}
              className="relative shrink-0 pt-0.5"
            >
              <img 
                src={SABY_AVATAR_SRC} 
                className="saby-avatar w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shadow-xl ring-2 ring-amber-400 drop-shadow-md object-contain bg-amber-500/10 p-0.5" 
                alt="سابي" 
              />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-white dark:border-slate-900"></span>
              </span>
            </motion.div>

            <div className={`p-4 sm:p-5 border rounded-2xl rounded-tr-none shadow-xl space-y-3 backdrop-blur-md flex-1 ${
              isDark 
                ? 'bg-[#071326]/95 border-amber-500/35 shadow-black/40' 
                : 'bg-white/95 border-amber-400/50 shadow-slate-200'
            }`}>
              <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                <span className="text-xs text-slate-400 font-medium">
                  {currentPhase === 'ocr' ? 'جاري استخراج نصوص السؤال والرموز...' : 'جاري صياغة الحل النموذجي خطوة بخطوة...'}
                </span>
                <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
              </div>

              <div className={`flex items-center gap-2.5 text-xs sm:text-sm font-bold leading-relaxed ${isDark ? 'text-amber-300' : 'text-amber-950'}`}>
                <span>
                  {currentPhase === 'ocr'
                    ? 'وحدة التعرف البصري: جاري استخراج نصوص السؤال والرموز بدقة وفق مسار البكالوريا...'
                    : 'جاري صياغة الحل النموذجي والشرح خطوة بخطوة بالمعادلات والقوانين...'}
                </span>
              </div>
              
              {/* Visual scanning line simulation */}
              <div className={`w-full max-w-xs h-1.5 rounded-full overflow-hidden relative border ${
                isDark ? 'bg-[#040A14] border-amber-500/20' : 'bg-slate-200 border-amber-300/40'
              }`}>
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-full shadow-xs"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.2,
                    ease: 'easeInOut',
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مساحة إعلانية داخل الموقع وأسفل واجهة الشات */}
      <div className="pt-6 border-t border-amber-500/20 max-w-4xl mx-auto w-full">
        <AdBanner />
        <Footer />
      </div>

      {/* نافذة مشاركة الحل كصورة مصغرة أو كنص منسق */}
      {activeShareData && (
        <ShareSolutionModal
          isOpen={!!activeShareData}
          onClose={() => setActiveShareData(null)}
          questionText={activeShareData.questionText}
          solutionText={activeShareData.solutionText}
          subject={activeShareData.subject}
          trackName={activeShareData.trackName}
          grade={activeShareData.grade}
        />
      )}
    </div>
  );
}
