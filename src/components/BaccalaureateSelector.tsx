import React, { useState } from 'react';
import { 
  GraduationCap, 
  HeartPulse, 
  Cpu, 
  Briefcase, 
  Palette, 
  BookOpen, 
  ChevronDown, 
  Check, 
  Sparkles,
  Layers,
  Award,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CurriculumContext, 
  SecondaryGrade, 
  BaccalaureateTrack, 
  SubjectLevelType 
} from '../types';
import { 
  GRADES_LIST, 
  BACCALAUREATE_TRACKS, 
  getAvailableTracksForGrade, 
  getSubjectsForSelection 
} from '../data/baccalaureateCurriculum';
import { useTheme } from '../context/ThemeContext';

interface BaccalaureateSelectorProps {
  context: CurriculumContext;
  onChange: (newContext: CurriculumContext) => void;
  onOpenHistory?: () => void;
  historyCount?: number;
}

export default function BaccalaureateSelector({ 
  context, 
  onChange,
  onOpenHistory,
  historyCount = 0
}: BaccalaureateSelectorProps) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const availableTracks = getAvailableTracksForGrade(context.grade);
  const currentTrackConfig = BACCALAUREATE_TRACKS[context.track] || BACCALAUREATE_TRACKS.preparatory_general;
  const availableSubjects = getSubjectsForSelection(context.grade, context.track);

  const handleGradeChange = (grade: SecondaryGrade) => {
    const validTracks = getAvailableTracksForGrade(grade);
    const newTrack = validTracks.includes(context.track) ? context.track : validTracks[0];
    const newSubjects = getSubjectsForSelection(grade, newTrack);
    const firstSubject = newSubjects[0];

    onChange({
      grade,
      track: newTrack,
      subject: firstSubject ? firstSubject.name : 'عام',
      level_type: firstSubject ? firstSubject.level_type : 'standard',
      topic: firstSubject?.topics ? firstSubject.topics[0] : 'عام'
    });
  };

  const handleTrackChange = (track: BaccalaureateTrack) => {
    const newSubjects = getSubjectsForSelection(context.grade, track);
    const firstSubject = newSubjects[0];

    onChange({
      ...context,
      track,
      subject: firstSubject ? firstSubject.name : 'عام',
      level_type: firstSubject ? firstSubject.level_type : 'standard',
      topic: firstSubject?.topics ? firstSubject.topics[0] : 'عام'
    });
  };

  const handleSubjectChange = (subjectName: string, level: SubjectLevelType, topic?: string) => {
    onChange({
      ...context,
      subject: subjectName,
      level_type: level,
      topic: topic || 'عام'
    });
  };

  const getTrackIcon = (trackId: BaccalaureateTrack) => {
    switch (trackId) {
      case 'medical_and_life_sciences':
        return <HeartPulse className="w-4 h-4 text-emerald-400" />;
      case 'engineering_and_cs':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'business':
        return <Briefcase className="w-4 h-4 text-amber-400" />;
      case 'arts_and_humanities':
        return <Palette className="w-4 h-4 text-purple-400" />;
      case 'preparatory_general':
        return <GraduationCap className="w-4 h-4 text-yellow-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-amber-300" />;
    }
  };

  const currentGradeName = GRADES_LIST.find(g => g.id === context.grade)?.name || 'البكالوريا المصرية';

  return (
    <div className={`w-full backdrop-blur-md border-b z-30 transition-colors shrink-0 ${
      isDark 
        ? 'bg-[#061122]/90 border-amber-500/20 shadow-md text-slate-200' 
        : 'bg-white/95 border-amber-500/20 shadow-xs text-slate-800'
    }`}>
      {/* Active Path Header Bar */}
      <div className="w-full px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs sm:text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-black flex items-center gap-1.5 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>نظام البكالوريا:</span>
          </span>

          {/* Grade Badge */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all border shadow-2xs cursor-pointer ${
              isDark 
                ? 'bg-[#0A172E] hover:bg-[#0F2244] border-amber-500/30 text-slate-200' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
            title="تغيير السنة الدراسية"
          >
            <span>{currentGradeName}</span>
          </button>

          {/* Track Badge */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all shadow-2xs cursor-pointer ${
              isDark 
                ? 'border-amber-500/40 bg-[#0A172E] text-amber-300 hover:border-amber-400' 
                : 'border-amber-400 bg-amber-50 text-amber-900 hover:border-amber-500'
            }`}
            title="تغيير المسار التخصصي"
          >
            {getTrackIcon(context.track)}
            <span>{currentTrackConfig.name}</span>
          </button>

          {/* Subject & Level Badge (المواد) - Highlighted and Prominent */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`px-3 py-1.5 rounded-xl font-bold border flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
              isDark 
                ? 'bg-gradient-to-r from-cyan-950/90 to-[#0A172E] text-cyan-200 border-cyan-500/50 hover:border-cyan-400' 
                : 'bg-gradient-to-r from-sky-50 to-cyan-50 text-sky-950 border-sky-400 hover:border-sky-500'
            }`}
            title="انقر لاختيار وتغيير المادة الدراسية"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="font-black text-amber-300 dark:text-cyan-200">المادة: {context.subject}</span>
            <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black ${
              context.level_type === 'advanced' 
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-xs' 
                : isDark
                ? 'bg-cyan-900/70 text-cyan-200 border border-cyan-500/30'
                : 'bg-sky-200 text-sky-900 border border-sky-300'
            }`}>
              {context.level_type === 'advanced' ? 'مستوى متقدم' : 'مستوى عام'}
            </span>
          </button>

          {/* زر السجل مع زر تغير المواد واختيار السنة */}
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              id="top-bar-history-btn"
              className={`px-3 py-1.5 rounded-xl font-bold border flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95 ${
                isDark
                  ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 ring-1 ring-amber-400/25'
                  : 'bg-gradient-to-r from-amber-100 to-yellow-100 hover:bg-amber-200 text-amber-950 border-amber-400 ring-1 ring-amber-300/40'
              }`}
              title="فتح سجل الأسئلة والمراجعة السابقة"
            >
              <History className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-black">سجل الأسئلة</span>
              {historyCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isDark ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-amber-500 text-slate-950 shadow-xs'
                }`}>
                  {historyCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Expand / Collapse Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 font-bold py-1.5 px-3 rounded-xl border transition-all cursor-pointer shadow-xs ${
            isDark 
              ? 'text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30' 
              : 'text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 border-amber-300'
          }`}
        >
          <span>{isOpen ? 'إغلاق الإعدادات' : 'تغيير السنة والمواد'}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Cascading Selection Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`overflow-y-auto max-h-[82vh] border-t p-4 sm:p-6 shadow-2xl transition-colors backdrop-blur-xl ${
              isDark 
                ? 'border-amber-500/25 bg-[#050D19]/98' 
                : 'border-amber-500/20 bg-slate-50/98 shadow-slate-300/40'
            }`}
          >
            <div className="w-full max-w-6xl mx-auto space-y-5">
              {/* Step 1: Grade Selection */}
              <div>
                <label className={`text-xs font-black uppercase tracking-wider block mb-2 ${
                  isDark ? 'text-amber-300' : 'text-amber-900'
                }`}>
                  1. اختيار السنة الدراسية:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {GRADES_LIST.map((grade) => {
                    const isSelected = context.grade === grade.id;
                    return (
                      <button
                        key={grade.id}
                        type="button"
                        onClick={() => handleGradeChange(grade.id)}
                        className={`p-3 text-right rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-400 shadow-md font-black ring-2 ring-amber-400/30'
                            : isDark 
                            ? 'bg-[#0A172E] hover:bg-[#0F2244] border-amber-500/20 text-slate-200' 
                            : 'bg-white hover:bg-amber-50/60 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-extrabold">{grade.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                        </div>
                        <div className={`text-[10.5px] mt-1 leading-snug ${
                          isSelected 
                            ? 'text-slate-900 font-bold' 
                            : isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {grade.subtitle}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Track Selection (For 2nd and 3rd Secondary) */}
              {(context.grade === '2nd_secondary' || context.grade === '3rd_secondary') && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className={`text-xs font-black uppercase tracking-wider block mb-2 ${
                    isDark ? 'text-amber-300' : 'text-amber-900'
                  }`}>
                    2. اختيار المسار التخصصي (البكالوريا المصرية):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {availableTracks.map((trackId) => {
                      const track = BACCALAUREATE_TRACKS[trackId];
                      const isSelected = context.track === trackId;
                      return (
                        <button
                          key={trackId}
                          type="button"
                          onClick={() => handleTrackChange(trackId)}
                          className={`p-3.5 text-right rounded-xl border text-xs transition-all flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? isDark
                                ? 'bg-[#0B1A33] border-2 border-amber-400 shadow-lg ring-2 ring-amber-400/20 text-white'
                                : 'bg-amber-50 border-2 border-amber-500 shadow-md ring-2 ring-amber-400/30 text-slate-900'
                              : isDark
                              ? 'bg-[#0A172E] hover:bg-[#0F2244] border-amber-500/20 text-slate-200'
                              : 'bg-white hover:bg-amber-50/60 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between font-bold mb-1.5">
                              <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                {getTrackIcon(trackId)}
                                <span className={`text-xs sm:text-sm ${isSelected ? (isDark ? 'text-amber-300 font-extrabold' : 'text-amber-900 font-extrabold') : 'font-bold'}`}>{track.name}</span>
                              </div>
                              {isSelected && <Check className={`w-4 h-4 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />}
                            </div>
                            <p className={`text-[10.5px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {track.description}
                            </p>
                          </div>
                          
                          {/* Note on focus */}
                          <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold ${
                            isDark ? 'border-amber-500/20 text-cyan-300' : 'border-slate-200 text-sky-700'
                          }`}>
                            {context.grade === '3rd_secondary' ? 'مادتان تخصصيتان فقط بمستوى رفيع' : 'مواد تخصصية ومواد مشتركة'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Subject & Level Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className={`text-xs font-black uppercase tracking-wider ${
                    isDark ? 'text-amber-300' : 'text-amber-900'
                  }`}>
                    3. اختيار المادة والمستوى الأكاديمي (المواد تضاف للمجموع):
                  </label>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                    isDark ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-950 border border-amber-300'
                  }`}>
                    {context.grade === '3rd_secondary' 
                      ? 'مواد الصف الثالث البكالوريا المقررة (مادتان فقط لا غير)' 
                      : 'المواد المقررة للمرحلة'}
                  </span>
                </div>

                {/* المواد المشتركة الإجبارية (لغير الصف الثالث البكالوريا) */}
                {availableSubjects.some(s => s.category === 'shared') && (
                  <div>
                    <span className={`text-xs font-extrabold block mb-2 flex items-center gap-1.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                      <span>أولاً: المواد المشتركة الإجبارية (تضاف للمجموع)</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {availableSubjects.filter(s => s.category === 'shared').map((subj) => {
                        const isSelected = context.subject === subj.name;
                        return (
                          <button
                            key={subj.id}
                            type="button"
                            onClick={() => handleSubjectChange(subj.name, subj.level_type, subj.topics?.[0])}
                            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-400 shadow-md font-black ring-2 ring-amber-400/30'
                                : isDark
                                ? 'bg-[#0A172E] hover:bg-[#0F2244] border-amber-500/20 text-slate-200'
                                : 'bg-white hover:bg-amber-50/60 border-slate-200 text-slate-800'
                            }`}
                          >
                            <span className="text-xs sm:text-sm">{subj.name}</span>
                            <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                              isSelected ? 'bg-slate-950/20 text-slate-950' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                            }`}>
                              مشترك
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* المواد التخصصية المقررة */}
                {availableSubjects.some(s => s.category === 'specialized' || !s.category) && (
                  <div>
                    <span className={`text-xs font-extrabold block mb-2 flex items-center gap-1.5 ${
                      isDark ? 'text-amber-300' : 'text-amber-900'
                    }`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                      <span>
                        {context.grade === '3rd_secondary' 
                          ? 'المادتان التخصصيتان المقررتان فقط للصف الثالث البكالوريا:' 
                          : 'ثانياً: المواد التخصصية المقررة للمسار (تضاف للمجموع)'}
                      </span>
                      {context.grade === '3rd_secondary' && (
                        <span className="text-[11px] text-amber-400 font-bold">(مادتان تخصصيتان فقط بمستوى متقدم/عادي)</span>
                      )}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3 max-w-2xl">
                      {availableSubjects.filter(s => s.category === 'specialized' || !s.category).map((subj) => {
                        const isSelected = context.subject === subj.name;
                        return (
                          <button
                            key={subj.id}
                            type="button"
                            onClick={() => handleSubjectChange(subj.name, subj.level_type, subj.topics?.[0])}
                            className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2.5 transition-all cursor-pointer shadow-xs ${
                              isSelected
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-400 shadow-md font-black ring-2 ring-amber-400/40 scale-[1.01]'
                                : isDark
                                ? 'bg-[#0A172E] hover:bg-[#0F2244] border-amber-500/30 text-slate-200'
                                : 'bg-white hover:bg-amber-50/60 border-slate-300 text-slate-800'
                            }`}
                          >
                            <span className="text-xs sm:text-sm font-extrabold">{subj.name}</span>
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black shrink-0 ${
                                subj.isAdvanced
                                  ? isSelected 
                                    ? 'bg-slate-950 text-amber-300 font-black shadow-xs' 
                                    : 'bg-red-950/80 text-red-300 border border-red-500/40 font-bold'
                                  : isSelected 
                                    ? 'bg-slate-950/40 text-slate-950 font-bold' 
                                    : isDark
                                    ? 'bg-[#071326] text-slate-300 border border-amber-500/30'
                                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                              }`}
                            >
                              {subj.levelLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Specialization Guidance Box */}
              <div className={`p-3 border rounded-xl text-xs flex items-start gap-2.5 ${
                isDark 
                  ? 'bg-[#0A172E]/90 border-amber-500/30 text-amber-200' 
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}>
                <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                <div className="leading-relaxed">
                  <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>توجيه الذكاء الاصطناعي للمسار الحالي: </span>
                  <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{currentTrackConfig.specializationGuidance}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
