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
  Award
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
}

export default function BaccalaureateSelector({ context, onChange }: BaccalaureateSelectorProps) {
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
    <div className={`w-full backdrop-blur-md border-b z-30 transition-colors ${
      isDark 
        ? 'bg-[#061122]/90 border-amber-500/20 shadow-md text-slate-200' 
        : 'bg-white/95 border-amber-500/20 shadow-xs text-slate-800'
    }`}>
      {/* Active Path Header Bar */}
      <div className="max-w-5xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-bold flex items-center gap-1 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
            <Layers className="w-3.5 h-3.5 text-cyan-500" />
            مسار البكالوريا المصرية:
          </span>

          {/* Grade Badge */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors border ${
              isDark 
                ? 'bg-[#0A172E] hover:bg-[#0F2244] border-amber-500/30 text-slate-200' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
          >
            <span>{currentGradeName}</span>
          </button>

          {/* Track Badge */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border transition-colors ${
              isDark 
                ? 'border-amber-500/40 bg-[#0A172E] text-amber-300 hover:border-amber-400' 
                : 'border-amber-400 bg-amber-50 text-amber-900 hover:border-amber-500'
            }`}
          >
            {getTrackIcon(context.track)}
            <span>{currentTrackConfig.name}</span>
          </button>

          {/* Subject & Level Badge */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-2.5 py-1 rounded-lg font-semibold border flex items-center gap-1.5 transition-colors ${
              isDark 
                ? 'bg-[#0A172E] text-cyan-200 border-cyan-500/30 hover:bg-[#0F2244]' 
                : 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100'
            }`}
          >
            <span>المادة: {context.subject}</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
              context.level_type === 'advanced' 
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-2xs font-black' 
                : isDark
                ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-500/30'
                : 'bg-sky-200 text-sky-900 border border-sky-300'
            }`}>
              {context.level_type === 'advanced' ? 'مستوى متقدم' : 'مستوى عام'}
            </span>
          </button>
        </div>

        {/* Expand / Collapse Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1 font-semibold py-1 px-2.5 rounded-lg border transition-colors ${
            isDark 
              ? 'text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/25' 
              : 'text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 border-amber-300'
          }`}
        >
          <span>{isOpen ? 'إغلاق الإعدادات' : 'تغيير المسار والمادة'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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
            className={`overflow-hidden border-t p-4 shadow-2xl transition-colors backdrop-blur-xl ${
              isDark 
                ? 'border-amber-500/25 bg-[#050D19]/95' 
                : 'border-amber-500/20 bg-slate-50/98 shadow-slate-300/40'
            }`}
          >
            <div className="max-w-5xl mx-auto space-y-4">
              {/* Step 1: Grade Selection */}
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${
                  isDark ? 'text-amber-300' : 'text-amber-900'
                }`}>
                  1. اختيار السنة الدراسية:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GRADES_LIST.map((grade) => {
                    const isSelected = context.grade === grade.id;
                    return (
                      <button
                        key={grade.id}
                        type="button"
                        onClick={() => handleGradeChange(grade.id)}
                        className={`p-2.5 text-right rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-400 shadow-md font-black'
                            : isDark 
                            ? 'bg-[#0A172E] hover:bg-[#0F2244] border-amber-500/20 text-slate-200'
                            : 'bg-white hover:bg-amber-50/60 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{grade.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${
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
                  <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${
                    isDark ? 'text-amber-300' : 'text-amber-900'
                  }`}>
                    2. اختيار المسار التخصصي (البكالوريا المصرية):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {availableTracks.map((trackId) => {
                      const track = BACCALAUREATE_TRACKS[trackId];
                      const isSelected = context.track === trackId;
                      return (
                        <button
                          key={trackId}
                          type="button"
                          onClick={() => handleTrackChange(trackId)}
                          className={`p-3 text-right rounded-xl border text-xs transition-all flex flex-col justify-between ${
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
                            <div className="flex items-center justify-between font-bold mb-1">
                              <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                {getTrackIcon(trackId)}
                                <span className={isSelected ? (isDark ? 'text-amber-300 font-bold' : 'text-amber-900 font-bold') : ''}>{track.name}</span>
                              </div>
                              {isSelected && <Check className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />}
                            </div>
                            <p className={`text-[10px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {track.description}
                            </p>
                          </div>
                          
                          {/* Note on focus */}
                          <div className={`mt-2 pt-1.5 border-t text-[9.5px] font-medium ${
                            isDark ? 'border-amber-500/20 text-cyan-300' : 'border-slate-200 text-sky-700'
                          }`}>
                            {context.grade === '3rd_secondary' ? 'يتضمن مواد المستوى المتقدم (الرفيع)' : 'مواد تخصصية ومواد مشتركة'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Subject & Level Selection */}
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${
                  isDark ? 'text-amber-300' : 'text-amber-900'
                }`}>
                  3. اختيار المادة والمستوى الأكاديمي:
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSubjects.map((subj) => {
                    const isSelected = context.subject === subj.name;
                    return (
                      <button
                        key={subj.id}
                        type="button"
                        onClick={() => handleSubjectChange(subj.name, subj.level_type, subj.topics?.[0])}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-400 shadow-sm font-black'
                            : isDark
                            ? 'bg-[#0A172E] hover:bg-[#0F2244] border-amber-500/20 text-slate-200'
                            : 'bg-white hover:bg-amber-50/60 border-slate-200 text-slate-800'
                        }`}
                      >
                        <span>{subj.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            subj.isAdvanced
                              ? isSelected 
                                ? 'bg-red-700 text-white font-black' 
                                : 'bg-red-950/80 text-red-300 border border-red-500/40 font-bold'
                              : isSelected 
                                ? 'bg-slate-950/40 text-slate-950 font-bold' 
                                : isDark
                                ? 'bg-[#071326] text-slate-400 border border-amber-500/20'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {subj.levelLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specialization Guidance Box */}
              <div className={`p-2.5 border rounded-xl text-xs flex items-start gap-2 ${
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
