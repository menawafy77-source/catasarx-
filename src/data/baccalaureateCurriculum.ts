import { SecondaryGrade, BaccalaureateTrack, SubjectLevelType, CurriculumContext } from '../types';

export interface SubjectOption {
  id: string;
  name: string;
  level_type: SubjectLevelType;
  levelLabel: string;
  isAdvanced: boolean;
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
    id: '1st_secondary',
    name: 'الصف الأول الثانوي',
    subtitle: 'المرحلة التمهيدية العامة'
  },
  {
    id: '2nd_secondary',
    name: 'الصف الثاني الثانوي',
    subtitle: 'المرحلة التخصصية (المسارات)'
  },
  {
    id: '3rd_secondary',
    name: 'الصف الثالث الثانوي',
    subtitle: 'المرحلة التخصصية والشهادة'
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
    description: 'مواد أساسية عامة لبناء قاعدة قوية ومتكاملة قبل التوزيع على المسارات التخصصية.',
    specializationGuidance: 'التركيز على المفاهيم التأسيسية الشاملة في المواد الأساسية (عربي، رياضيات، علوم، تاريخ، فلسفة، لغة أولى) وفق معايير وزارة التربية والتعليم.',
    subjectsByGrade: {
      '1st_secondary': [
        { id: 'arabic', name: 'اللغة العربية', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'math', name: 'الرياضيات', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'integrated_science', name: 'العلوم المتكاملة', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'history', name: 'التاريخ', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'philosophy', name: 'الفلسفة والمنطق', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'english', name: 'اللغة الأجنبية الأولى (الإنجليزية)', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false }
      ]
    }
  },

  medical_and_life_sciences: {
    id: 'medical_and_life_sciences',
    name: 'مسار الطب وعلوم الحياة',
    shortName: 'الطب والعلوم',
    iconName: 'HeartPulse',
    accentColor: 'emerald',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-700',
    description: 'مسار متخصص للراغبين في كليات الطب البشري، طب الأسنان، الصيدلة، العلاج الطبيعي، والعلوم البيولوجية.',
    specializationGuidance: 'التركيز المكثف على الفهم العميق لعلوم الأحياء والكيمياء بمستوى متقدم، التحليل الفسيولوجي والبيولوجيا الجزيئية، والتطبيقات الصيدلانية مع صياغة علمية دقيقة.',
    subjectsByGrade: {
      '2nd_secondary': [
        { id: 'physics_std', name: 'الفيزياء', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'math_std', name: 'الرياضيات', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'biology_std', name: 'الأحياء التمهيدية', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'chemistry_std', name: 'الكيمياء التمهيدية', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'arabic', name: 'اللغة العربية (مشترك)', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'english', name: 'اللغة الأجنبية الأولى (مشترك)', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'history_shared', name: 'التاريخ (مشترك)', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false }
      ],
      '3rd_secondary': [
        { id: 'biology_adv', name: 'الأحياء (مستوى متقدم)', level_type: 'advanced', levelLabel: 'مستوى متقدم (رفيع)', isAdvanced: true },
        { id: 'chemistry_adv', name: 'الكيمياء (مستوى متقدم)', level_type: 'advanced', levelLabel: 'مستوى متقدم (رفيع)', isAdvanced: true },
        { id: 'arabic', name: 'اللغة العربية', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'english', name: 'اللغة الأجنبية الأولى', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'life_science_applied', name: 'تطبيقات علوم الحياة والصحة', level_type: 'advanced', levelLabel: 'مستوى متقدم', isAdvanced: true }
      ]
    }
  },

  engineering_and_cs: {
    id: 'engineering_and_cs',
    name: 'مسار الهندسة وعلوم الحاسب',
    shortName: 'الهندسة والحاسب',
    iconName: 'Cpu',
    accentColor: 'blue',
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeText: 'text-blue-700',
    description: 'مسار موجه للراغبين في كليات الهندسة، الحاسبات والذكاء الاصطناعي، وعلوم البيانات.',
    specializationGuidance: 'التركيز على التعمق في الرياضيات والفيزياء بمستوى متقدم، استخراج ومعالجة المعادلات الهندسية والدوال والتفاضل والتكامل، وتطبيقات البرمجة والخوارزميات بدقة متناهية.',
    subjectsByGrade: {
      '2nd_secondary': [
        { id: 'chemistry_std', name: 'الكيمياء', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'programming', name: 'البرمجة والتكنولوجيا', level_type: 'standard', levelLabel: 'مستوى عام تخصصي', isAdvanced: false, topics: ['algorithms', 'coding', 'logic'] },
        { id: 'pure_math', name: 'الرياضيات البحتة والتطبيقية', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'physics_eng', name: 'الفيزياء الهندسية', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'arabic', name: 'اللغة العربية (مشترك)', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'english', name: 'اللغة الأجنبية الأولى (مشترك)', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false }
      ],
      '3rd_secondary': [
        { id: 'math_adv', name: 'الرياضيات (مستوى متقدم)', level_type: 'advanced', levelLabel: 'مستوى متقدم (رفيع)', isAdvanced: true },
        { id: 'physics_adv', name: 'الفيزياء (مستوى متقدم)', level_type: 'advanced', levelLabel: 'مستوى متقدم (رفيع)', isAdvanced: true },
        { id: 'ai_and_cs', name: 'علوم الحاسب والذكاء الاصطناعي', level_type: 'advanced', levelLabel: 'مستوى متقدم', isAdvanced: true },
        { id: 'arabic', name: 'اللغة العربية', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'english', name: 'اللغة الأجنبية الأولى', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false }
      ]
    }
  },

  business: {
    id: 'business',
    name: 'مسار الأعمال',
    shortName: 'الأعمال والاقتصاد',
    iconName: 'Briefcase',
    accentColor: 'amber',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-700',
    description: 'مسار متخصص لقطاع الأعمال، المحاسبة، التجارة الدولية، التمويل والاستثمار، وإدارة المشاريع.',
    specializationGuidance: 'التركيز على النظريات الاقتصادية الكلية والجزئية، مبادئ القوائم المالية والمحاسبة، الرياضيات المالية، واستراتيجيات إدارة الأعمال الحديثة مع أمثلة عملية.',
    subjectsByGrade: {
      '2nd_secondary': [
        { id: 'accounting', name: 'المحاسبة المالية', level_type: 'standard', levelLabel: 'مستوى عام تخصصي', isAdvanced: false },
        { id: 'business_admin', name: 'إدارة الأعمال', level_type: 'standard', levelLabel: 'مستوى عام تخصصي', isAdvanced: false },
        { id: 'general_math', name: 'الرياضيات', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'arabic', name: 'اللغة العربية (مشترك)', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'english', name: 'اللغة الأجنبية الأولى (مشترك)', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'history_shared', name: 'التاريخ (مشترك)', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false }
      ],
      '3rd_secondary': [
        { id: 'economics_adv', name: 'الاقتصاد (مستوى متقدم)', level_type: 'advanced', levelLabel: 'مستوى متقدم (رفيع)', isAdvanced: true },
        { id: 'financial_math', name: 'الرياضيات والتمويل', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'entrepreneurship', name: 'ريادة الأعمال والاستثمار', level_type: 'advanced', levelLabel: 'مستوى متقدم', isAdvanced: true },
        { id: 'arabic', name: 'اللغة العربية', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'english', name: 'اللغة الأجنبية الأولى', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false }
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
    description: 'مسار متخصص للراغبين في كليات الإعلام، الألسن، الآداب، الفنون الجميلة والتطبيقية، والعلوم الإنسانية.',
    specializationGuidance: 'التركيز على الجغرافيا التحليلية ونظم المعلومات الجغرافية بمستوى متقدم، التحليل الإحصائي السلوكي، النظريات النفسية والاجتماعية، والتذوق البلاغي والأدبي الرفيع.',
    subjectsByGrade: {
      '2nd_secondary': [
        { id: 'psychology', name: 'علم النفس والاجتماع', level_type: 'standard', levelLabel: 'مستوى عام تخصصي', isAdvanced: false },
        { id: 'second_lang', name: 'اللغة الأجنبية الثانية (فرنسي/ألماني/إيطالي/إسباني)', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'geography_intro', name: 'الجغرافيا العامة', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'arabic', name: 'اللغة العربية (مشترك)', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'english', name: 'اللغة الأجنبية الأولى (مشترك)', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false }
      ],
      '3rd_secondary': [
        { id: 'geography_adv', name: 'الجغرافيا (مستوى متقدم)', level_type: 'advanced', levelLabel: 'مستوى متقدم (رفيع)', isAdvanced: true },
        { id: 'statistics', name: 'الإحصاء التطبيقي', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'arts_history', name: 'تاريخ الفنون والحضارات', level_type: 'advanced', levelLabel: 'مستوى متقدم', isAdvanced: true },
        { id: 'arabic', name: 'اللغة العربية', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'english', name: 'اللغة الأجنبية الأولى', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false }
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
    description: 'لجميع الطلاب في المراحل الابتدائية والإعدادية والأسئلة التعليمية العامة.',
    specializationGuidance: 'شرح مبسط وداعم يناسب المرحلة الدراسية المحددة في المنهج المصري.',
    subjectsByGrade: {
      'other_grades': [
        { id: 'arabic', name: 'اللغة العربية', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'math', name: 'الرياضيات', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'science', name: 'العلوم', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'social_studies', name: 'الدراسات الاجتماعية', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false },
        { id: 'english', name: 'اللغة الإنجليزية', level_type: 'standard', levelLabel: 'مستوى عام', isAdvanced: false }
      ]
    }
  }
};

export function getDefaultCurriculumContext(): CurriculumContext {
  return {
    grade: '1st_secondary',
    track: 'preparatory_general',
    subject: 'الرياضيات',
    level_type: 'standard',
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
  // Fallback to preparatory or general if none defined
  return (
    BACCALAUREATE_TRACKS.preparatory_general.subjectsByGrade['1st_secondary'] || []
  );
}
