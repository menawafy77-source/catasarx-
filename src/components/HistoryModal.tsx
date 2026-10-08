import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  X, 
  History, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Sparkles, 
  Layers, 
  ArrowLeft,
  Tag,
  AlertTriangle,
  Image as ImageIcon,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message } from '../types';
import { extractQuestionPairs, QuestionHistoryItem } from '../services/historyManager';
import { useTheme } from '../context/ThemeContext';
import { BACCALAUREATE_TRACKS } from '../data/baccalaureateCurriculum';
import ShareSolutionModal from './ShareSolutionModal';
import { copyFormattedTextToClipboard } from '../utils/mathTextFormatter';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSelectQuestion: (userMessageId: string) => void;
  onDeleteQuestion: (userMsgId: string, botMsgId?: string) => void;
  onClearAll: () => void;
}

export default function HistoryModal({
  isOpen,
  onClose,
  messages,
  onSelectQuestion,
  onDeleteQuestion,
  onClearAll
}: HistoryModalProps) {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeShareData, setActiveShareData] = useState<{
    questionText: string;
    solutionText: string;
    subject?: string;
    trackName?: string;
    grade?: string;
  } | null>(null);

  const historyItems = useMemo(() => {
    return extractQuestionPairs(messages);
  }, [messages]);

  // Extract unique subjects for filter tabs
  const subjects = useMemo(() => {
    const set = new Set<string>();
    historyItems.forEach(item => {
      const subj = item.extractedData?.subject || item.curriculumContext?.subject;
      if (subj && subj !== 'عام') {
        set.add(subj);
      }
    });
    return Array.from(set);
  }, [historyItems]);

  // Filtered list based on search and subject
  const filteredItems = useMemo(() => {
    return historyItems.filter(item => {
      const subj = item.extractedData?.subject || item.curriculumContext?.subject || '';
      const matchesSubject = selectedSubject === 'all' || subj === selectedSubject;
      
      const q = searchTerm.trim().toLowerCase();
      if (!q) return matchesSubject;

      const inQuestion = item.questionText.toLowerCase().includes(q);
      const inSolution = item.solutionText ? item.solutionText.toLowerCase().includes(q) : false;
      const inTopic = item.extractedData?.topic ? item.extractedData.topic.toLowerCase().includes(q) : false;

      return matchesSubject && (inQuestion || inSolution || inTopic);
    });
  }, [historyItems, searchTerm, selectedSubject]);

  const handleCopy = async (text: string, id: string, e: React.MouseEvent, asRawLatex = false) => {
    e.stopPropagation();
    if (asRawLatex) {
      await navigator.clipboard.writeText(text);
    } else {
      await copyFormattedTextToClipboard(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('ar-EG', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch {
      return '';
    }
  };

  const getTrackName = (trackId?: string) => {
    if (!trackId) return null;
    const track = BACCALAUREATE_TRACKS[trackId as keyof typeof BACCALAUREATE_TRACKS];
    return track ? track.name : trackId;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className={`w-full max-w-3xl rounded-3xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
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
              <History className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg sm:text-xl font-black ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                  سجل الأسئلة والمراجعة
                </h2>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {historyItems.length} {historyItems.length === 1 ? 'سؤال محفوظ' : 'أسئلة محفوظة'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                محفوظ تلقائياً في المتصفح لمراجعة الحلول والشروحات في أي وقت.
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
            title="إغلاق السجل"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        {historyItems.length > 0 && (
          <div className={`p-3.5 border-b space-y-2.5 shrink-0 ${
            isDark ? 'bg-[#071326] border-amber-500/15' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${
                isDark ? 'bg-[#050D1A] border-amber-500/25 focus-within:border-amber-400' : 'bg-white border-slate-300 focus-within:border-amber-500'
              }`}>
                <Search className="w-4 h-4 text-amber-500 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث في نص السؤال، الشرح، أو القانون..."
                  className="w-full bg-transparent border-none outline-hidden text-xs sm:text-sm placeholder:text-slate-400"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-200 text-xs">
                    مسح
                  </button>
                )}
              </div>

              {/* Clear History Button Trigger */}
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                  isDark 
                    ? 'bg-red-950/40 hover:bg-red-900/50 text-red-300 border-red-500/30' 
                    : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                }`}
                title="مسح كل الأسئلة المحفوظة"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">مسح السجل</span>
              </button>
            </div>

            {/* Subject Filters */}
            {subjects.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedSubject('all')}
                  className={`px-3 py-1 rounded-lg font-bold border transition-all shrink-0 ${
                    selectedSubject === 'all'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                      : isDark
                      ? 'bg-[#0A172E] text-slate-300 border-amber-500/20 hover:border-amber-400/50'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-amber-400'
                  }`}
                >
                  جميع المواد ({historyItems.length})
                </button>
                {subjects.map(subj => {
                  const count = historyItems.filter(i => (i.extractedData?.subject || i.curriculumContext?.subject) === subj).length;
                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setSelectedSubject(subj)}
                      className={`px-3 py-1 rounded-lg font-bold border transition-all shrink-0 ${
                        selectedSubject === subj
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                          : isDark
                          ? 'bg-[#0A172E] text-slate-300 border-amber-500/20 hover:border-amber-400/50'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-amber-400'
                      }`}
                    >
                      {subj} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Clear Confirmation Banner */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
                isDark ? 'bg-red-950/80 border-red-500/40 text-red-200' : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-xs sm:text-sm font-bold">
                  هل أنت متأكد من مسح جميع الأسئلة والحلول المحفوظة؟ لن تتمكن من استرجاعها.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setShowClearConfirm(false);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition-all"
                >
                  تأكيد المسح
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    isDark ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {historyItems.length === 0 ? (
            <div className="py-16 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                لا توجد أسئلة سابقة محفوظة حتى الآن
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                عند طرح أي سؤال بالكتابة أو بالتصوير، سيتم حفظ السؤال وحله النموذجي تلقائياً هنا في متصفحك حتى تتمكن من مراجعته في أي وقت بدون الحاجة لإنترنت سريع.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-bold text-slate-400">
                لم يتم العثور على أي أسئلة تطابق بحثك "{searchTerm}"
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSubject('all');
                }}
                className="text-xs text-amber-500 hover:underline font-bold"
              >
                إعادة ضبط عوامل التصفية
              </button>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isExpanded = expandedId === item.id;
              const subject = item.extractedData?.subject || item.curriculumContext?.subject || 'سؤال عام';
              const track = item.extractedData?.track || item.curriculumContext?.track;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isDark 
                      ? 'bg-[#08172e]/90 border-amber-500/25 hover:border-amber-400/50' 
                      : 'bg-white border-slate-200 hover:border-amber-400 shadow-xs hover:shadow-md'
                  }`}
                >
                  {/* Item Header / Summary */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="p-3.5 sm:p-4 cursor-pointer flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Image Thumbnail or Number */}
                      {item.image ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-400/50 bg-black/40 shrink-0">
                          <img 
                            src={`data:image/jpeg;base64,${item.image}`} 
                            alt="Question Thumbnail" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                          isDark ? 'bg-[#050D1A] text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          #{filteredItems.length - idx}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Badges & Date */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5 text-[11px]">
                          <span className={`px-2 py-0.5 rounded-md font-bold ${
                            isDark ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {subject}
                          </span>

                          {track && track !== 'general_all' && (
                            <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              isDark ? 'bg-[#050D1A] text-cyan-300 border border-cyan-500/20' : 'bg-sky-50 text-sky-900 border border-sky-200'
                            }`}>
                              <Layers className="w-3 h-3 text-cyan-500" />
                              {getTrackName(track)}
                            </span>
                          )}

                          <span className={`flex items-center gap-1 text-[10.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.timestamp)}
                          </span>
                        </div>

                        {/* Question Preview */}
                        <p className={`text-xs sm:text-sm font-semibold line-clamp-2 leading-relaxed ${
                          isDark ? 'text-slate-100' : 'text-slate-900'
                        }`}>
                          {item.questionText}
                        </p>
                      </div>
                    </div>

                    {/* Expand/Collapse Chevron */}
                    <div className="flex items-center gap-1 shrink-0 pt-1">
                      <span className={`text-[11px] font-bold hidden sm:inline ${
                        isDark ? 'text-amber-300' : 'text-amber-800'
                      }`}>
                        {isExpanded ? 'إخفاء الحل' : 'عرض الحل'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-amber-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Solution & Detailed View */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`border-t px-4 py-4 space-y-4 ${
                          isDark ? 'bg-[#050D1A]/90 border-amber-500/20' : 'bg-slate-50/80 border-slate-200'
                        }`}
                      >
                        {/* Full Question text if truncated */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between pb-1">
                            <h4 className={`text-xs font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                              نص السؤال الكامل:
                            </h4>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => handleCopy(item.questionText, 'q_' + item.id, e)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all text-[11px] font-bold ${
                                  isDark 
                                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border-amber-500/30' 
                                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                                }`}
                                title="نسخ نص السؤال برموز ومعادلات رياضية واضحة ومنسقة للواتساب والملاحظات بدون أي لخبطة"
                              >
                                {copiedId === 'q_' + item.id ? (
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
                              <button
                                type="button"
                                onClick={(e) => handleCopy(item.questionText, 'q_latex_' + item.id, e, true)}
                                className={`px-2 py-1 rounded-lg border transition-all text-[10px] font-mono font-bold ${
                                  isDark 
                                    ? 'bg-[#0A172E] text-slate-400 hover:text-amber-300 border-amber-500/20' 
                                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-300'
                                }`}
                                title="نسخ نص السؤال ككود LaTeX أصلي"
                              >
                                {copiedId === 'q_latex_' + item.id ? 'تم نسخ LaTeX!' : 'LaTeX'}
                              </button>
                            </div>
                          </div>
                          <div className={`p-3 rounded-xl border text-xs sm:text-sm leading-relaxed markdown-body ${
                            isDark ? 'bg-[#08172e] border-amber-500/20 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                          }`}>
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {item.questionText}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {/* Solution Section */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>الحل النموذجي والشرح خطوة بخطوة:</span>
                            </h4>
                            {item.solutionText && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => handleCopy(item.solutionText || '', item.id, e)}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                    isDark 
                                      ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border-amber-500/30' 
                                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                                  }`}
                                >
                                  {copiedId === item.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>تم النسخ منسقاً!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>نسخ الحل</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const subj = item.extractedData?.subject || item.curriculumContext?.subject || 'البكالوريا';
                                    const trk = getTrackName(item.extractedData?.track || item.curriculumContext?.track) || 'التعليم الثانوي';
                                    const grd = item.extractedData?.grade || item.curriculumContext?.grade || 'الثانوية العامة';
                                    setActiveShareData({
                                      questionText: item.questionText,
                                      solutionText: item.solutionText || '',
                                      subject: subj,
                                      trackName: trk,
                                      grade: grd
                                    });
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-xs transition-all hover:scale-105 active:scale-95"
                                  title="مشاركة الحل كنص أو كبطاقة صورة"
                                >
                                  <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>مشاركة</span>
                                </button>
                              </div>
                            )}
                          </div>

                          <div className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed max-h-96 overflow-y-auto markdown-body ${
                            isDark ? 'bg-[#061122] border-amber-500/25 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                          }`}>
                            {item.solutionText ? (
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {item.solutionText}
                              </ReactMarkdown>
                            ) : (
                              <p className="text-slate-400 italic">لم يتم حفظ نص الإجابة لهذا السؤال.</p>
                            )}
                          </div>
                        </div>

                        {/* Bottom Actions for This Question */}
                        <div className="flex items-center justify-between pt-2 border-t border-amber-500/15">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectQuestion(item.userMessageId);
                              onClose();
                            }}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                              isDark 
                                ? 'bg-[#0A172E] hover:bg-[#0F2244] text-cyan-300 border-cyan-500/30' 
                                : 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-200'
                            }`}
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>الانتقال للمحادثة في الشات</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteQuestion(item.userMessageId, item.botMessageId);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                              isDark 
                                ? 'text-red-400 hover:text-red-300 hover:bg-red-950/40 border-red-500/20' 
                                : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
                            }`}
                            title="حذف هذا السؤال من السجل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-3.5 sm:p-4 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#08172e] border-amber-500/20 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="text-xs">
            {historyItems.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>يتم حفظ الأسئلة تلقائياً في جهازك لسهولة المذاكرة والمراجعة.</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md transition-all"
          >
            إغلاق السجل
          </button>
        </div>
      </motion.div>

      {/* Share Solution Modal inside History */}
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
