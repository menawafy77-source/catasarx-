import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { User, Bot, Sparkles, ScanText, Copy, Check, BookOpen, GraduationCap, Shapes, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import 'katex/dist/katex.min.css';
import { Message, ProcessingPhase } from '../types';

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  currentPhase?: ProcessingPhase;
}

export default function ChatView({ messages, isLoading, currentPhase = 'idle' }: ChatViewProps) {
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

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 pb-36 scroll-smooth" dir="rtl">
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-5">
          <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 shadow-sm">
            <Sparkles className="w-10 h-10" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h2 className="text-2xl font-bold text-gray-800">أهلاً بك في catasarx!</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              معلمك الذكي للمناهج المصرية. التقط صورة لأي سؤال من الكتاب أو الامتحان، وسيقوم النظام باستخراج النص فورياً وحله خطوة بخطوة.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full max-w-md text-xs font-medium text-gray-600 pt-2">
            <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-xs flex items-center gap-2">
              <ScanText className="w-4 h-4 text-blue-600 shrink-0" />
              <span>استخراج نصوص الأسئلة والمعادلات</span>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-xs flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>جميع المراحل: ابتدائي، إعدادي، ثانوي</span>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-xs flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>شرح رياضيات، علوم، لغات، وعربي</span>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-xs flex items-center gap-2">
              <Shapes className="w-4 h-4 text-amber-600 shrink-0" />
              <span>فهم المسائل الهندسية والرسومات</span>
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
          <div className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${message.role === 'user' ? 'flex-row' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-orange-100 text-orange-700 border border-orange-200'
            }`}>
              {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            <div className="space-y-3 w-full">
              {/* User message container */}
              {message.role === 'user' ? (
                <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-sm space-y-3">
                  {message.image && (
                    <div className="relative rounded-xl overflow-hidden border border-blue-400/40 bg-black/10">
                      <img 
                        src={`data:image/jpeg;base64,${message.image}`} 
                        alt="Question Scan" 
                        className="max-h-72 w-full object-contain rounded-lg"
                      />
                    </div>
                  )}

                  {/* Extracted Text Box from Image Recognition Module */}
                  {message.extractedData && (
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-white border border-white/20 text-sm space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-white/15 text-xs font-semibold">
                        <div className="flex items-center gap-1.5 text-blue-100">
                          <ScanText className="w-4 h-4 text-blue-200" />
                          <span>نص السؤال المستخرج (OCR):</span>
                        </div>
                        <button
                          onClick={() => handleCopy(message.extractedData?.extractedText || '', message.id)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 transition-colors text-[11px]"
                          title="نسخ النص المستخرج"
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check className="w-3 h-3 text-green-300" />
                              <span>تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>نسخ</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Extracted question text with math support */}
                      <div className="text-white/95 text-xs md:text-sm font-medium leading-relaxed markdown-body !text-white">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {message.extractedData.extractedText}
                        </ReactMarkdown>
                      </div>

                      {/* Detected Subject & Grade Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                        {message.extractedData.subject && message.extractedData.subject !== 'عام' && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/50 text-white font-medium">
                            المادة: {message.extractedData.subject}
                          </span>
                        )}
                        {message.extractedData.grade && message.extractedData.grade !== 'غير محدد' && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/50 text-white font-medium">
                            {message.extractedData.grade}
                          </span>
                        )}
                        {message.extractedData.hasDiagram && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/60 text-white font-medium flex items-center gap-1">
                            <Shapes className="w-3 h-3" />
                            يحتوي على رسم/شكل هندسي
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {message.content && message.content !== 'مسح السؤال وحله...' && (
                    <p className="text-sm text-blue-50 leading-relaxed">{message.content}</p>
                  )}
                </div>
              ) : (
                /* Assistant message container */
                <div className="bg-white text-gray-800 border border-gray-100 p-5 rounded-2xl rounded-tl-none shadow-xs">
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
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 animate-pulse">
            <Bot className="w-4 h-4" />
          </div>
          <div className="p-4 bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-xs space-y-2">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-700">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span>
                {currentPhase === 'ocr'
                  ? 'وحدة التعرف البصري: جاري قراءة السؤال واستخراج النص بدقة...'
                  : 'جاري صياغة الإجابة النموذجية والشرح خطوة بخطوة...'}
              </span>
            </div>
            
            {/* Visual scanning line simulation */}
            <div className="w-56 h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
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
    </div>
  );
}
