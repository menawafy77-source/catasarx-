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
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import 'katex/dist/katex.min.css';
import { Message, ProcessingPhase } from '../types';
import { BACCALAUREATE_TRACKS } from '../data/baccalaureateCurriculum';
import { useTheme } from '../context/ThemeContext';
import AdBanner from './AdBanner';
import Footer from './Footer';

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  currentPhase?: ProcessingPhase;
}

export default function ChatView({ messages, isLoading, currentPhase = 'idle' }: ChatViewProps) {
  const { isDark } = useTheme();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, currentPhase]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTrackName = (trackId?: string) => {
    if (!trackId) return null;
    const track = BACCALAUREATE_TRACKS[trackId as keyof typeof BACCALAUREATE_TRACKS];
    return track ? track.name : trackId;
  };

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 pb-36 scroll-smooth" dir="rtl">
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8 space-y-5">
          <div className={`backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border flex flex-col items-center max-w-xl space-y-5 transition-colors ${
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
              <h2 className={`text-2xl font-black ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>أهلاً بك في caby!</h2>
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

      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`flex gap-3 max-w-[92%] md:max-w-[85%] ${message.role === 'user' ? 'flex-row' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm shadow-md ${
              message.role === 'user' 
                ? 'bg-gradient-to-br from-amber-500 to-yellow-500 text-slate-950 font-black' 
                : isDark 
                ? 'bg-[#0A172E] text-amber-400 border border-amber-500/40' 
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              {message.role === 'user' ? <User className="w-4 h-4 stroke-[2.5]" /> : <Bot className="w-4 h-4" />}
            </div>
            
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
                        <button
                          onClick={() => handleCopy(message.extractedData?.extractedText || '', message.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors text-[11px] ${
                            isDark 
                              ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border-amber-500/30' 
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                          }`}
                          title="نسخ النص المستخرج"
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>نسخ</span>
                            </>
                          )}
                        </button>
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
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-950 font-medium'}`}>
                      {message.content}
                    </p>
                  )}
                </div>
              ) : (
                /* Assistant message container */
                <div className={`p-5 rounded-2xl rounded-tl-none shadow-2xl space-y-2 backdrop-blur-md border transition-colors ${
                  isDark 
                    ? 'bg-[#071326]/95 text-slate-100 border-amber-500/30 shadow-black/30' 
                    : 'bg-white/98 text-slate-900 border-slate-200/90 shadow-slate-200/80'
                }`}>
                  <div className="markdown-body">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Loading state with OCR vs Answering indicator */}
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start gap-3 max-w-[85%]"
        >
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 animate-pulse shadow-md ${
            isDark 
              ? 'bg-[#0A172E] text-amber-400 border-amber-500/40' 
              : 'bg-amber-100 text-amber-900 border-amber-300'
          }`}>
            <Bot className="w-4 h-4" />
          </div>
          <div className={`p-4 border rounded-2xl rounded-tl-none shadow-xl space-y-2 backdrop-blur-md ${
            isDark 
              ? 'bg-[#071326]/95 border-amber-500/30' 
              : 'bg-white/95 border-amber-400/40 shadow-slate-200'
          }`}>
            <div className={`flex items-center gap-2.5 text-xs font-bold ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
              <span>
                {currentPhase === 'ocr'
                  ? 'وحدة التعرف البصري: جاري استخراج نصوص السؤال والرموز بدقة وفق مسار البكالوريا...'
                  : 'جاري صياغة الحل النموذجي والشرح خطوة بخطوة بالمعادلات والقوانين...'}
              </span>
            </div>
            
            {/* Visual scanning line simulation */}
            <div className={`w-56 h-1.5 rounded-full overflow-hidden relative border ${
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

      {/* مساحة إعلانية داخل الموقع وأسفل واجهة الشات */}
      <div className="pt-6 border-t border-amber-500/20 max-w-4xl mx-auto w-full">
        <AdBanner />
        <Footer />
      </div>
    </div>
  );
}
