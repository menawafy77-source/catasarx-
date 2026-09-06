/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Camera, Send, Image as ImageIcon, BookOpen, X, ScanText, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CameraView from './components/CameraView';
import ChatView from './components/ChatView';
import { extractQuestionFromImage, solveExtractedQuestion, askGemini } from './services/gemini';
import { Message, ProcessingPhase, ExtractedQuestion } from './types';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<ProcessingPhase>('idle');
  const [showCamera, setShowCamera] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isExtractingOnly, setIsExtractingOnly] = useState(false);

  // Main sending handler for either text questions or image questions
  const handleSend = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;

    const userMessageId = 'user_' + Date.now();
    const userMsg: Message = {
      id: userMessageId,
      role: 'user',
      content: text || (imageBase64 ? 'مسح السؤال واستخراجه وحله...' : ''),
      image: imageBase64,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setPendingImage(null);
    setIsLoading(true);

    try {
      if (imageBase64) {
        // Step 1: Image Recognition Module (OCR & Question Detection)
        setCurrentPhase('ocr');
        const extractedData = await extractQuestionFromImage(imageBase64);

        // Update the user message in chat so the extracted text is immediately visible
        setMessages(prev =>
          prev.map(m =>
            m.id === userMessageId ? { ...m, extractedData } : m
          )
        );

        // Step 2: Proceed to solve and explain the extracted question
        setCurrentPhase('answering');
        const solution = await solveExtractedQuestion(extractedData, imageBase64, text);

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
        // Standard text question
        setCurrentPhase('answering');
        const res = await askGemini(text);
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
      const extracted = await extractQuestionFromImage(pendingImage);
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

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100" dir="rtl">
      {/* Hidden File Input for Gallery */}
      <input
        type="file"
        id="gallery-input"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none">catasarx</h1>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                OCR المنهج المصري
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-1">
              معلم الذكاء الاصطناعي لكافة المراحل والمواد
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold items-center gap-1.5 border border-green-100">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>جاهز للتعرف والحل</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <ChatView messages={messages} isLoading={isLoading} currentPhase={currentPhase} />

        {/* Input & Upload Controller */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <div className="bg-white p-2.5 rounded-3xl shadow-xl border border-gray-200/80 flex flex-col gap-2">
              
              {/* Pending Image Preview with OCR Controls */}
              {pendingImage && (
                <div className="p-2 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-400 bg-black/5 shadow-xs shrink-0">
                      <img 
                        src={`data:image/jpeg;base64,${pendingImage}`} 
                        alt="Question Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
                        <ScanText className="w-3.5 h-3.5 text-blue-600" />
                        صورة السؤال جاهزة للتعرف
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        سيقوم النظام باستخراج النص كاملاً ثم حل المسألة وشرحها.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleExtractOnly}
                      disabled={isExtractingOnly || isLoading}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
                      title="استخراج النص في مربع الكتابة فقط"
                    >
                      {isExtractingOnly ? (
                        <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      ) : (
                        <ScanText className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span className="hidden md:inline">استخراج النص فقط</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPendingImage(null)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
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
                  onClick={() => setShowCamera(true)}
                  disabled={isLoading}
                  className="w-11 h-11 flex items-center justify-center bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                  title="تصوير السؤال بالكاميرا"
                >
                  <Camera className="w-5 h-5" />
                </button>

                {/* Gallery Upload Trigger */}
                <button 
                  type="button"
                  onClick={() => document.getElementById('gallery-input')?.click()}
                  disabled={isLoading}
                  className="w-11 h-11 flex items-center justify-center bg-orange-50 text-orange-600 rounded-2xl hover:bg-orange-100 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                  title="اختيار صورة من المعرض"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                
                {/* Question Input Field */}
                <div className="flex-1 bg-gray-50 rounded-2xl px-3.5 py-2.5 flex items-start border border-gray-200 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={pendingImage ? "أضف ملاحظة أو استفساراً مع الصورة (اختياري)..." : "اكتب سؤالك هنا أو التقط صورة من أي مادة..."}
                    className="w-full bg-transparent border-none focus:ring-0 text-gray-800 placeholder:text-gray-400 resize-none max-h-32 text-sm py-0.5 text-right"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(inputText, pendingImage || undefined);
                      }
                    }}
                  />
                </div>

                {/* Send / Solve Trigger */}
                <button 
                  type="button"
                  onClick={() => handleSend(inputText, pendingImage || undefined)}
                  disabled={isLoading || (!inputText.trim() && !pendingImage)}
                  className="w-11 h-11 flex items-center justify-center bg-blue-600 text-white rounded-2xl hover:bg-blue-700 hover:scale-105 transition-all active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:pointer-events-none shadow-md shadow-blue-200"
                  title="إرسال واستخراج الحل"
                >
                  <Send className="w-5 h-5 rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

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

      {/* Decorative ambient gradients */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-30">
        <div className="absolute top-16 right-10 w-72 h-72 bg-blue-200 rounded-full blur-[100px]" />
        <div className="absolute bottom-16 left-10 w-80 h-80 bg-orange-100 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
