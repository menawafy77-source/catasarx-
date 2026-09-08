/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Send, 
  Image as ImageIcon, 
  BookOpen, 
  X, 
  ScanText, 
  Sparkles, 
  Loader2, 
  GraduationCap, 
  Zap, 
  AlertCircle,
  CreditCard,
  Gift,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CameraView from './components/CameraView';
import ChatView from './components/ChatView';
import BaccalaureateSelector from './components/BaccalaureateSelector';
import RechargeModal from './components/RechargeModal';
import { extractQuestionFromImage, solveExtractedQuestion, askGemini } from './services/gemini';
import { Message, ProcessingPhase, ExtractedQuestion, CurriculumContext, UserCredits } from './types';
import { getDefaultCurriculumContext } from './data/baccalaureateCurriculum';
import { 
  getUserCredits, 
  deductQuestionCredit, 
  canAskQuestion,
  DEFAULT_FREE_QUOTA 
} from './services/creditsManager';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { theme, toggleTheme, isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<ProcessingPhase>('idle');
  const [showCamera, setShowCamera] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isExtractingOnly, setIsExtractingOnly] = useState(false);
  
  // Egyptian Baccalaureate Curriculum & Track State
  const [curriculumContext, setCurriculumContext] = useState<CurriculumContext>(getDefaultCurriculumContext());

  // Credits & Quota Management State
  const [userCredits, setUserCredits] = useState<UserCredits>(getUserCredits());
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [isQuotaExceededTrigger, setIsQuotaExceededTrigger] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRechargeClick = (isDepleted: boolean = false) => {
    setToastMessage('عفواً هذه الخدمة غير متاحة');
    setIsQuotaExceededTrigger(isDepleted);
    setShowRechargeModal(true);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync state on load
  useEffect(() => {
    setUserCredits(getUserCredits());
  }, []);

  // Main sending handler for either text questions or image questions
  const handleSend = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;

    // 1. Check Credit / Quota balance
    const creditCheck = canAskQuestion();
    if (!creditCheck.allowed || creditCheck.remaining <= 0) {
      handleRechargeClick(true);
      
      setMessages(prev => [
        ...prev,
        {
          id: 'bot_limit_' + Date.now(),
          role: 'assistant',
          content: '⚠️ **لقد استهلكت الـ 10 أسئلة المجانية المتاحة لتجربة caby**.\n\nلمتابعة استخراج وحل مسائل البكالوريا المصرية خطوة بخطوة، يرجى شحن الرصيد.',
          timestamp: Date.now()
        }
      ]);
      return;
    }

    // 2. Deduct credit
    const deductRes = deductQuestionCredit();
    setUserCredits(getUserCredits());

    const userMessageId = 'user_' + Date.now();
    const userMsg: Message = {
      id: userMessageId,
      role: 'user',
      content: text || (imageBase64 ? 'مسح السؤال واستخراجه وحله...' : ''),
      image: imageBase64,
      curriculumContext: { ...curriculumContext },
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setPendingImage(null);
    setIsLoading(true);

    try {
      if (imageBase64) {
        // Step 1: Image Recognition Module (OCR & Question Detection) with Baccalaureate Context
        setCurrentPhase('ocr');
        const extractedData = await extractQuestionFromImage(imageBase64, 'image/jpeg', curriculumContext);

        // Update the user message in chat so the extracted text and metadata are immediately visible
        setMessages(prev =>
          prev.map(m =>
            m.id === userMessageId ? { ...m, extractedData } : m
          )
        );

        // Step 2: Proceed to solve and explain the extracted question with Track Guidance
        setCurrentPhase('answering');
        const solution = await solveExtractedQuestion(extractedData, imageBase64, text, curriculumContext);

        setMessages(prev => [
          ...prev,
          {
            id: 'bot_' + Date.now(),
            role: 'assistant',
            content: solution || 'عذراً، لم أتمكن من إيجاد حل للسؤال.',
            timestamp: Date.now()
          }
        ]);
      } else {
        // Standard text question with Baccalaureate context
        setCurrentPhase('answering');
        const res = await askGemini(text, undefined, curriculumContext);
        setMessages(prev => [
          ...prev,
          {
            id: 'bot_' + Date.now(),
            role: 'assistant',
            content: res.text || 'عذراً، لم أتمكن من معالجة السؤال.',
            timestamp: Date.now()
          }
        ]);
      }
    } catch (error) {
      console.error('Error in processing question:', error);
      setMessages(prev => [
        ...prev,
        {
          id: 'bot_' + Date.now(),
          role: 'assistant',
          content: '⚠️ حدث خطأ أثناء الاتصال بالنظام أو استخراج نص السؤال. يرجى المحاولة مرة أخرى.',
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsLoading(false);
      setCurrentPhase('idle');
    }
  };

  // Extract text only into textarea (for review or editing)
  const handleExtractOnly = async () => {
    if (!pendingImage || isExtractingOnly) return;
    setIsExtractingOnly(true);
    try {
      const extracted = await extractQuestionFromImage(pendingImage, 'image/jpeg', curriculumContext);
      setInputText(extracted.extractedText);
    } catch (err) {
      console.error('Extraction error:', err);
    } finally {
      setIsExtractingOnly(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setPendingImage(base64);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input value so same image can be re-selected if desired
    e.target.value = '';
  };

  const isQuotaDepleted = userCredits.questionsLeft <= 0;

  return (
    <div className={`flex flex-col h-screen font-sans relative transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-b from-[#061122] via-[#050D1A] to-[#040A14] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200' 
        : 'bg-gradient-to-b from-slate-100 via-amber-50/30 to-slate-100 text-slate-900 selection:bg-amber-400/40 selection:text-amber-950'
    }`} dir="rtl">
      {/* Hidden File Input for Gallery */}
      <input
        type="file"
        id="gallery-input"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Header */}
      <header className={`px-4 py-2.5 flex items-center justify-between sticky top-0 z-40 transition-colors backdrop-blur-md border-b ${
        isDark 
          ? 'bg-[#061122]/90 border-amber-500/25 shadow-lg shadow-black/20 text-slate-100' 
          : 'bg-white/95 border-amber-500/20 shadow-sm shadow-slate-200/50 text-slate-900'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 rounded-xl flex items-center justify-center text-slate-950 shadow-md border border-amber-300/40">
            <BookOpen className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className={`text-xl font-black tracking-tight leading-none ${
                isDark ? 'text-amber-300' : 'text-amber-800'
              }`}>caby</h1>
              <span className={`px-2 py-0.5 text-[10.5px] font-bold rounded-md border ${
                isDark 
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                البكالوريا المصرية
              </span>
            </div>
            <p className={`text-[11px] font-medium mt-0.5 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              معلم الذكاء الاصطناعي للمسارات التخصصية
            </p>
          </div>
        </div>

        {/* Counter, Theme Toggle & Recharge Button Area */}
        <div className="flex items-center gap-2">
          {/* Day / Night Mode Toggle (وضع ليل / وضع نهار) */}
          <button
            type="button"
            onClick={toggleTheme}
            id="theme-toggle-btn"
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border shadow-xs hover:scale-105 active:scale-95 ${
              isDark
                ? 'bg-[#0A172E]/90 hover:bg-[#0F2244] text-amber-300 border-amber-500/30'
                : 'bg-amber-50/90 hover:bg-amber-100 text-amber-900 border-amber-300'
            }`}
            title={isDark ? 'التبديل إلى وضع النهار' : 'التبديل إلى وضع الليل'}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300 fill-amber-300/30" />
                <span className="hidden sm:inline">وضع النهار</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-800 fill-amber-800/30" />
                <span className="hidden sm:inline">وضع الليل</span>
              </>
            )}
          </button>

          {/* Questions Remaining Counter Badge */}
          <button
            type="button"
            onClick={() => {
              setIsQuotaExceededTrigger(isQuotaDepleted);
              setShowRechargeModal(true);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border shadow-xs hover:scale-105 active:scale-95 ${
              isQuotaDepleted
                ? isDark
                  ? 'bg-red-950/80 text-red-300 border-red-500/50 ring-2 ring-red-900/50 animate-pulse'
                  : 'bg-red-100 text-red-700 border-red-300 ring-2 ring-red-300 animate-pulse'
                : userCredits.questionsLeft <= 3
                ? isDark
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
                : isDark
                ? 'bg-[#0A172E]/90 text-amber-200 border-amber-500/30 hover:border-amber-400/60'
                : 'bg-amber-50 text-amber-950 border-amber-300 hover:border-amber-400'
            }`}
            title="انقر للشحن أو عرض تفاصيل الرصيد"
          >
            <Zap className={`w-3.5 h-3.5 ${isQuotaDepleted ? 'text-red-500 fill-red-500' : 'text-amber-500 fill-amber-500'}`} />
            <span>
              {isQuotaDepleted ? (
                '0/10 أسئلة (نفذ الرصيد)'
              ) : (
                `الأسئلة المتبقية: ${userCredits.questionsLeft}/${Math.max(userCredits.questionsLeft, DEFAULT_FREE_QUOTA)}`
              )}
            </span>
          </button>

          {/* Quick Recharge Button */}
          <button
            type="button"
            onClick={() => handleRechargeClick(false)}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span className="hidden sm:inline">شحن الرصيد</span>
            <span className="sm:hidden">شحن</span>
          </button>
        </div>
      </header>

      {/* Egyptian Baccalaureate Cascading Selector */}
      <BaccalaureateSelector 
        context={curriculumContext} 
        onChange={setCurriculumContext} 
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <ChatView messages={messages} isLoading={isLoading} currentPhase={currentPhase} />

        {/* Input & Upload Controller */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 pointer-events-none transition-colors ${
          isDark 
            ? 'bg-gradient-to-t from-[#040A14] via-[#061122]/90 to-transparent' 
            : 'bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent'
        }`}>
          <div className="max-w-3xl mx-auto pointer-events-auto">
            
            {/* Paywall Alert Banner when 0 questions left */}
            {isQuotaDepleted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-2.5 p-3 rounded-2xl border-2 border-amber-400 shadow-xl flex flex-wrap items-center justify-between gap-2.5 backdrop-blur-md ${
                  isDark ? 'bg-[#071326]/95 text-slate-100' : 'bg-amber-50/95 text-slate-900 shadow-amber-900/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-bold">
                    <Zap className="w-4 h-4 fill-slate-950" />
                  </div>
                  <div>
                    <p className={`text-xs font-extrabold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                      لقد استهلكت الـ 10 أسئلة المجانية!
                    </p>
                    <p className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      اشحن رصيدك عبر فودافون كاش، انستاباي، أو كود MENA لمتابعة الحلول.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRechargeClick(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/30 transition-all hover:scale-105 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                  <span>اشحن الآن لاستكمال الحلول ⚡</span>
                </button>
              </motion.div>
            )}

            <div className={`p-2.5 rounded-3xl shadow-2xl border flex flex-col gap-2 transition-colors backdrop-blur-xl ${
              isDark 
                ? 'bg-[#071326]/95 border-amber-500/30 shadow-black/40' 
                : 'bg-white/95 border-amber-500/30 shadow-slate-300/60'
            }`}>
              
              {/* Pending Image Preview with OCR Controls */}
              {pendingImage && (
                <div className={`p-2 border rounded-2xl flex items-center justify-between gap-3 ${
                  isDark 
                    ? 'bg-[#0B1A33]/90 border-amber-500/30 text-slate-100' 
                    : 'bg-amber-50/80 border-amber-300 text-slate-900'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-400 bg-black/40 shadow-xs shrink-0">
                      <img 
                        src={`data:image/jpeg;base64,${pendingImage}`} 
                        alt="Question Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                        <ScanText className="w-3.5 h-3.5 text-cyan-500" />
                        صورة السؤال جاهزة للتعرف وفق مسار: {curriculumContext.subject}
                      </p>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        سيقوم النظام باستخراج النص كاملاً ثم حل المسألة وفق مستوى ({curriculumContext.level_type === 'advanced' ? 'متقدم رفيع' : 'عام'}).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleExtractOnly}
                      disabled={isExtractingOnly || isLoading || isQuotaDepleted}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50 ${
                        isDark 
                          ? 'bg-[#0F2244] border-amber-500/30 hover:bg-[#142B55] text-amber-200' 
                          : 'bg-amber-100 border-amber-300 hover:bg-amber-200 text-amber-900'
                      }`}
                      title="استخراج النص في مربع الكتابة فقط"
                    >
                      {isExtractingOnly ? (
                        <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                      ) : (
                        <ScanText className="w-3.5 h-3.5 text-cyan-500" />
                      )}
                      <span className="hidden md:inline">استخراج النص فقط</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPendingImage(null)}
                      className={`p-1.5 rounded-full transition-colors ${
                        isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/40' : 'text-slate-500 hover:text-red-600 hover:bg-red-100'
                      }`}
                      title="إلغاء الصورة"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-end gap-2 p-1">
                {/* Camera Trigger */}
                <button 
                  type="button"
                  onClick={() => {
                    if (isQuotaDepleted) {
                      setIsQuotaExceededTrigger(true);
                      setShowRechargeModal(true);
                    } else {
                      setShowCamera(true);
                    }
                  }}
                  disabled={isLoading}
                  className={`w-11 h-11 flex items-center justify-center rounded-2xl border hover:scale-105 transition-all active:scale-95 disabled:opacity-50 ${
                    isDark 
                      ? 'bg-[#0A172E] text-amber-300 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400' 
                      : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 hover:border-amber-400'
                  }`}
                  title="تصوير السؤال بالكاميرا"
                >
                  <Camera className="w-5 h-5" />
                </button>

                {/* Gallery Upload Trigger */}
                <button 
                  type="button"
                  onClick={() => {
                    if (isQuotaDepleted) {
                      setIsQuotaExceededTrigger(true);
                      setShowRechargeModal(true);
                    } else {
                      document.getElementById('gallery-input')?.click();
                    }
                  }}
                  disabled={isLoading}
                  className={`w-11 h-11 flex items-center justify-center rounded-2xl border hover:scale-105 transition-all active:scale-95 disabled:opacity-50 ${
                    isDark 
                      ? 'bg-[#0A172E] text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400' 
                      : 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100 hover:border-sky-400'
                  }`}
                  title="اختيار صورة من المعرض"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                
                {/* Question Input Field */}
                <div className={`flex-1 rounded-2xl px-3.5 py-2.5 flex items-start border focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all ${
                  isDark ? 'bg-[#040B16]/90 border-amber-500/30' : 'bg-slate-50 border-amber-400/50'
                }`}>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      isQuotaDepleted
                        ? "لقد استهلكت الـ 10 أسئلة المجانية. اضغط على 'شحن' للمتابعة..."
                        : pendingImage
                        ? "أضف ملاحظة أو استفساراً مع الصورة (اختياري)..."
                        : `اكتب سؤالك في مادة ${curriculumContext.subject} (${curriculumContext.level_type === 'advanced' ? 'مستوى متقدم' : 'مستوى عام'}) أو التقط صورة...`
                    }
                    className={`w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 text-sm py-0.5 text-right ${
                      isDark ? 'text-slate-100 placeholder:text-slate-400' : 'text-slate-900 placeholder:text-slate-500'
                    }`}
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (isQuotaDepleted) {
                          setIsQuotaExceededTrigger(true);
                          setShowRechargeModal(true);
                        } else {
                          handleSend(inputText, pendingImage || undefined);
                        }
                      }
                    }}
                  />
                </div>

                {/* Send / Solve Trigger */}
                <button 
                  type="button"
                  onClick={() => {
                    if (isQuotaDepleted) {
                      setIsQuotaExceededTrigger(true);
                      setShowRechargeModal(true);
                    } else {
                      handleSend(inputText, pendingImage || undefined);
                    }
                  }}
                  disabled={isLoading || (!inputText.trim() && !pendingImage && !isQuotaDepleted)}
                  className={`w-11 h-11 flex items-center justify-center rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-md ${
                    isQuotaDepleted
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/20'
                      : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-amber-500/30 disabled:opacity-40 disabled:scale-100 disabled:pointer-events-none'
                  }`}
                  title={isQuotaDepleted ? "اشحن الآن لإرسال السؤال" : "إرسال واستخراج الحل"}
                >
                  {isQuotaDepleted ? (
                    <Zap className="w-5 h-5 fill-slate-950" />
                  ) : (
                    <Send className="w-5 h-5 rotate-180" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-black border border-red-400"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-white" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recharge / Paywall Modal */}
      <RechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        credits={userCredits}
        onCreditsUpdated={(newCredits) => setUserCredits(newCredits)}
        isTriggeredByQuotaExceeded={isQuotaExceededTrigger}
      />

      {/* Fullscreen Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 overflow-hidden"
          >
            <CameraView 
              onCapture={(base64) => {
                setPendingImage(base64);
                setShowCamera(false);
              }}
              onClose={() => setShowCamera(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
