import { SecondaryGrade, BaccalaureateTrack, SubjectLevelType, CurriculumContext } from '../types';

export interface SubjectOption {
  id: string;
  name: string;
  level_type: SubjectLevelType;
  levelLabel: string;
  isAdvanced: boolean;
  category?: 'shared' | 'specialized'; // مشترك أو تخصصي
  topics?: string[];
}

export interface TrackConfig {
  id: BaccalaureateTrack;
  name: string;
  shortName: string;
  iconName: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  specializationGuidance: string;
  subjectsByGrade: {
    '1st_secondary'?: SubjectOption[];
    '2nd_secondary'?: SubjectOption[];
    '3rd_secondary'?: SubjectOption[];
    'other_grades'?: SubjectOption[];
  };
}

export const GRADES_LIST: { id: SecondaryGrade; name: string; subtitle: string }[] = [
  {
    id: '3rd_secondary',
    name: 'الصف الثالث البكالوريا',
    subtitle: 'المرحلة التخصصية المتقدمة والشهادة (المواد تضاف للمجموع)'
  },
  {
    id: '2nd_secondary',
    name: 'الصف الثاني الثانوي',
    subtitle: 'المرحلة التخصصية والمسارات (المواد تضاف للمجموع)'
  },
  {
    id: '1st_secondary',
    name: 'الصف الأول الثانوي',
    subtitle: 'المرحلة التمهيدية العامة'
  },
  {
    id: 'other_grades',
    name: 'مراحل أخرى / عام',
    subtitle: 'الابتدائي، الإعدادي، والتعليم العام'
  }
];

export const BACCALAUREATE_TRACKS: Record<BaccalaureateTrack, TrackConfig> = {
  preparatory_general: {
    id: 'preparatory_general',
    name: 'المرحلة التمهيدية (الصف الأول الثانوي)',
    shortName: 'التمهيدي العام',
    iconName: 'GraduationCap',
    accentColor: 'indigo',
    badgeBg: 'bg-indigo-50 border-indigo-200',
    badgeText: 'text-indigo-700',
    description: 'مواد أساسية لبناء قاعدة قوية ومتكاملة قبل التوزيع على المسارات التخصصية.',
    specializationGuidance: 'التركيز على المفاهيم التأسيسية الشاملة في المواد الأساسية (عربي، لغة أولى، تاريخ مصري، رياضيات، علوم متكاملة، فلسفة).',
    subjectsByGrade: {
      '1st_secondary': [
        { id: 'arabic_1st', name: 'اللغة العربية', level_type: 'standard', levelLabel: 'مشترك إجباري', isAdvanced: false, category: 'shared' },
        { id: 'english_1st', name: 'اللغة الأجنبية الأولى', level_type: 'standard', levelLabel: 'مشترك إجباري', isAdvanced: false, category: 'shared' },
        { id: 'history_1st', name: 'التاريخ المصري', level_type: 'standard', levelLabel: 'مشترك إجباري', isAdvanced: false, category: 'shared' },
        { id: 'math_1st', name: 'الرياضيات', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false, category: 'specialized' },
        { id: 'integrated_science_1st', name: 'العلوم المتكاملة', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false, category: 'specialized' },
        { id: 'philosophy_1st', name: 'الفلسفة والمنطق', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false, category: 'specialized' }
      ]
    }
  },

  medical_and_life_sciences: {
    id: 'medical_and_life_sciences',
    name: 'مسار الطب وعلوم الحياة',
    shortName: 'الطب وعلوم الحياة',
    iconName: 'HeartPulse',
    accentColor: 'emerald',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-700',
    description: 'مسار متخصص لكليات الطب، طب الأسنان، الصيدلة، العلاج الطبيعي والعلوم البيولوجية.',
    specializationGuidance: 'في الصف الثالث البكالوريا: دراسة تخصصية بمستوى متقدم (رفيع) في الأحياء والكيمياء فقط. في الصف الثاني: التخصص في الفيزياء أو الرياضيات إلى جانب المواد المشتركة.',
    subjectsByGrade: {
      '2nd_secondary': [
        // المواد المشتركة (تضاف للمجموع)
        { id: 'arabic_2nd_med', name: 'اللغة العربية', level_type: 'standard', levelLabel: 'مشترك إجباري', isAdvanced: false, category: 'shared' },
        { id: 'english_2nd_med', name: 'اللغة الأجنبية الأولى', level_type: 'standard', levelLabel: 'مشترك إجباري', isAdvanced: false, category: 'shared' },
        { id: 'history_2nd_med', name: 'التاريخ المصري', level_type: 'standard', levelLabel: 'مشترك إجباري', isAdvanced: false, category: 'shared' },
        // مواد التخصص (الفيزياء أو الرياضيات)
        { id: 'physics_2nd_med', name: 'الفيزياء', level_type: 'standard', levelLabel: 'مادة تخصص', isAdvanced: false, category: 'specialized' },
        { id: 'math_2nd_med', name: 'الرياضيات', level_type: 'standard', levelLabel: 'مادة تخصص', isAdvanced: false, category: 'specialized' }
      ],
      '3rd_secondary': [
        // مواد الصف الثالث البكالوريا المقررة تخصصياً فقط
        { id: 'biology_adv', name: 'الأحياء (مستوى متقدم)', level_type: 'advanced', levelLabel: 'مستوى متقدم (رفيع)', isAdvanced: true, category: 'specialized' },
        { id: 'chemistry_adv', name: 'الكيمياء (مستوى متقدم)', level_type: 'advanced', levelLabel: 'مستوى متقدم (رفيع)', isAdvanced: true, category: 'specialized' }
      ]
    }
  },

  engineering_and_cs: {
    id: 'engineering_and_cs',
    name: 'مسار الهندسة وعلوم الحاسب',
    shortName: 'الهندسة وعلوم الحاسب',
    iconName: 'Cpu',
    accentColor: 'blue',
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeText: 'text-blue-700',
    description: 'مسار متخصص لكليات الهندسة، الحاسبات، الذكاء الاصطناعي، وعلوم البيانات.',
    specializationGuidance: 'في الصف الثالث البكالوريا: دراسة تخصصية بمستوى متقدم (رفيع) في الرياضيات والفيزياء فقط. في الصف الثاني: التخصص في الكيمياء أو البرمجة والذكاء الاصطناعي إلى جانب المواد المشتركة.',
    subjectsByGrade: {
      '2nd_secondary': [
        // المواد المشتركة (تضاف للمجموع)
        { id: 'arabic_2nd_eng', name: 'اللغة العربية', level_type: 'standard', levelLabel: 'مشترك إجباري', isAdvanced: false, category: 'shared' },
        { id: 'english_2nd_eng', name: 'اللغة الأجنبية الأولى', level_type: 'standard', levelLabel: 'مشترك إجباري', isAdvanced: false, category: 'shared' },
        { id: 'history_2nd_eng', name: 'التاريخ المصري', level_type: 'standard', levelLabel: 'مشترك إجباري', isAdvanced: false, category: 'shared' },
        // مواد التخصص (الكيمياء أو البرمجة والذكاء الاصطناعي)
        { id: 'chemistry_2nd_eng', name: 'الكيمياء', level_type: 'standard', levelLabel: 'مادة تخصص', isAdvanced: false, category: 'specialized' },
        { id: 'ai_prog_2nd_eng', name: 'البرمجة والذكاء الاصطناعي', level_type: 'standard', levelLabel: 'مادة تخصص', isAdvanced: false, category: 'specialized' }
      ],
      '3rd_secondary': [
        // مواد الصف الثالث البكالوريا المقررة تخصصياً فقط
        { id: 'math_adv', name: 'الرياضيات (مستوى متقدم)', level_type: 'advanced', levelLabel: 'مستوى متقدم (رفيع)', isAdvanced: true, category: 'specialized' },
        { id: 'physics_adv', name: 'الفيزياء (مستوى متقدم)', level_type: 'advanced', levelLabel: 'مستوى متقدم (رفيع)', isAdvanced: true, category: 'specialized' }
      ]
    }
  },

  business: {
    id: 'business',
    name: 'مسار الأعمال',
    shortName: 'مسار الأعمال',
    iconName: 'Briefcase',
    accentColor: 'amber',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-700',
    description: 'مسار متخصص لكليات التجارة وإدارة الأعمال، الاقتصاد والعلوم السياسية، التمويل والمحاسبة.',
    specializationGuidance: 'في الصف الثالث البكالوريا: دراسة تخصصية في الاقتصاد (مستوى متقدم رفيع) والرياضيات (مستوى عادي) فقط. في الصف الثاني: التخصص في المحاسبة أو إدارة الأعمال إلى جانب المواد المشتركة.',
    subjectsByGrade: {
      '2nd_secondary': [
        // المواد المشتركة (تضاف للمجموع)
        { id: 'arabic_2nd_bus', name: 'اللغة العربية', level_type: 'standard', levelLabel: 'مشترك إجباري', isAdvanced: false, category: 'shared' },
        { id: 'english_2nd_bus', name: 'اللغة الأجنبية الأولى', level_type: 'standard', levelLabel: 'مشترك إجباري', isAdvanced: false, category: 'shared' },
        { id: 'history_2nd_bus', name: 'التاريخ المصري', level_type: 'standard', levelLabel: 'مشترك إجباري', isAdvanced: false, category: 'shared' },
        // مواد التخصص (المحاسبة أو إدارة الأعمال)
        { id: 'accounting_2nd_bus', name: 'المحاسبة', level_type: 'standard', levelLabel: 'مادة تخصص', isAdvanced: false, category: 'specialized' },
        { id: 'management_2nd_bus', name: 'إدارة الأعمال', level_type: 'standard', levelLabel: 'مادة تخصص', isAdvanced: false, category: 'specialized' }
      ],
      '3rd_secondary': [
        // مواد الصف الثالث البكالوريا المقررة تخصصياً فقط
        { id: 'economics_adv', name: 'الاقتصاد (مستوى متقدم)', level_type: 'advanced', levelLabel: 'مستوى متقدم (رفيع)', isAdvanced: true, category: 'specialized' },
        { id: 'math_bus_std', name: 'الرياضيات (مستوى عادي)', level_type: 'standard', levelLabel: 'مستوى عادي', isAdvanced: false, category: 'specialized' }
      ]
    }
  },

  arts_and_humanities: {
    id: 'arts_and_humanities',
    name: 'مسار الآداب والفنون',
    shortName: 'الآداب والفنون',
    iconName: 'Palette',
    accentColor: 'purple',
    badgeBg: 'bg-purple-50 border-purple-200',
    badgeText: 'text-purple-700',
    description: 'مسار متخصص لكليات الإعلام، الألسن، اللغات، الآداب، الفنون الجميلة، والعلوم الإنسانية والاجتماعية.',
    specializationGuidance: 'في الصف الثالث البكالوريا: دراسة تخصصية في الجغرافيا (مستوى متقدم رفيع) والإحصاء (مستوى عادي) فقط. في الصف الثاني: التخصص في علم النفس أو اللغة الأجنبية الثانية إلى جانب المواد المشتركة.',
    subjectsByGrade: {
      '2nd_secondary': [
        // المواد المشتركة (تضاف للمجموع)
        { id: 'arabic_2nd_art', name: 'اللغة العربية', level_type: 'standard', levelLabel: 'مشترك إجباري', isAdvanced: false, category: 'shared' },
        { id: 'english_2nd_art', name: 'اللغة الأجنبية الأولى', level_type: 'standard', levelLabel: 'مشترك إجباري', isAdvanced: false, category: 'shared' },
        { id: 'history_2nd_art', name: 'التاريخ المصري', level_type: 'standard', levelLabel: 'مشترك إجباري', isAdvanced: false, category: 'shared' },
        // مواد التخصص (علم النفس أو اللغة الأجنبية الثانية)
        { id: 'psychology_2nd_art', name: 'علم النفس', level_type: 'standard', levelLabel: 'مادة تخصص', isAdvanced: false, category: 'specialized' },
        { id: 'second_lang_2nd_art', name: 'اللغة الأجنبية الثانية', level_type: 'standard', levelLabel: 'مادة تخصص', isAdvanced: false, category: 'specialized' }
      ],
      '3rd_secondary': [
        // مواد الصف الثالث البكالوريا المقررة تخصصياً فقط
        { id: 'geography_adv', name: 'الجغرافيا (مستوى متقدم)', level_type: 'advanced', levelLabel: 'مستوى متقدم (رفيع)', isAdvanced: true, category: 'specialized' },
        { id: 'statistics_std', name: 'الإحصاء (مستوى عادي)', level_type: 'standard', levelLabel: 'مستوى عادي', isAdvanced: false, category: 'specialized' }
      ]
    }
  },

  general_all: {
    id: 'general_all',
    name: 'التعليم العام / مراحل أخرى',
    shortName: 'عام',
    iconName: 'BookOpen',
    accentColor: 'gray',
    badgeBg: 'bg-gray-100 border-gray-200',
    badgeText: 'text-gray-700',
    description: 'لجميع الطلاب في المراحل التعليمية الأخرى والأسئلة العامة.',
    specializationGuidance: 'شرح مبسط ومباشر وفق أحدث المناهج المعتمدة من وزارة التربية والتعليم المصرية.',
    subjectsByGrade: {
      'other_grades': [
        { id: 'arabic_gen', name: 'اللغة العربية', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false, category: 'shared' },
        { id: 'math_gen', name: 'الرياضيات', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false, category: 'specialized' },
        { id: 'science_gen', name: 'العلوم', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false, category: 'specialized' },
        { id: 'history_gen', name: 'التاريخ المصري', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false, category: 'shared' },
        { id: 'english_gen', name: 'اللغة الإنجليزية', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false, category: 'shared' }
      ]
    }
  }
};

export function getDefaultCurriculumContext(): CurriculumContext {
  return {
    grade: '3rd_secondary',
    track: 'medical_and_life_sciences',
    subject: 'الأحياء (مستوى متقدم)',
    level_type: 'advanced',
    topic: 'عام'
  };
}

export function getAvailableTracksForGrade(grade: SecondaryGrade): BaccalaureateTrack[] {
  if (grade === '1st_secondary') {
    return ['preparatory_general'];
  }
  if (grade === '2nd_secondary' || grade === '3rd_secondary') {
    return [
      'medical_and_life_sciences',
      'engineering_and_cs',
      'business',
      'arts_and_humanities'
    ];
  }
  return ['general_all'];
}

export function getSubjectsForSelection(grade: SecondaryGrade, track: BaccalaureateTrack): SubjectOption[] {
  const trackConfig = BACCALAUREATE_TRACKS[track];
  if (!trackConfig) return [];
  const subjects = trackConfig.subjectsByGrade[grade];
  if (subjects && subjects.length > 0) {
    return subjects;
  }
  // Fallback
  return (
    BACCALAUREATE_TRACKS.medical_and_life_sciences.subjectsByGrade['3rd_secondary'] || []
  );
}
