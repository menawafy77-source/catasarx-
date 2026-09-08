import { UserCredits, RechargePlan } from '../types';

const STORAGE_KEY = 'caby_user_credits_v1';
const LEGACY_STORAGE_KEY = 'catasarx_user_credits_v1';
export const DEFAULT_FREE_QUOTA = 10;

export const RECHARGE_PLANS: RechargePlan[] = [
  {
    id: 'starter_30',
    name: 'باقة المذاكرة السريعة',
    questionsCount: 30,
    priceEGP: 25,
    features: [
      '30 سؤالاً في أي مادة',
      'استخراج المعادلات بـ LaTeX',
      'دعم الكاميرا والمعرض'
    ]
  },
  {
    id: 'pro_100',
    name: 'باقة التفوق والامتحانات',
    questionsCount: 100,
    priceEGP: 60,
    popular: true,
    badge: 'الأكثر توفيراً',
    features: [
      '100 سؤال شامل كافة المسارات',
      'شرح متقدم لمسارات البكالوريا',
      'أولوية قصوى في سرعة الاستجابة',
      'صلاحية مفتوحة طوال العام'
    ]
  },
  {
    id: 'term_300',
    name: 'باقة الترم الكامل (VIP)',
    questionsCount: 300,
    priceEGP: 150,
    badge: 'شامل المنهج',
    features: [
      '300 سؤال لجميع المواد والمسارات',
      'حل المسائل الهندسية والرسوم البيانية',
      'مراجعات امتحانية ونماذج البكالوريا',
      'دعم فني مباشر'
    ]
  }
];

export function getUserCredits(): UserCredits {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Could not read user credits from storage:', err);
  }

  // Initial state with 10 free questions
  const initial: UserCredits = {
    questionsLeft: DEFAULT_FREE_QUOTA,
    totalQuestionsAsked: 0,
    initialFreeQuota: DEFAULT_FREE_QUOTA,
    isUnlimited: false,
    history: [
      {
        type: 'free_initial',
        amount: DEFAULT_FREE_QUOTA,
        date: Date.now(),
        description: 'رصيد التجربة المجاني الأولي (10 أسئلة)'
      }
    ]
  };

  saveUserCredits(initial);
  return initial;
}

export function saveUserCredits(credits: UserCredits): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credits));
  } catch (err) {
    console.warn('Could not save user credits to storage:', err);
  }
}

export function canAskQuestion(): { allowed: boolean; remaining: number } {
  const credits = getUserCredits();
  return {
    allowed: credits.isUnlimited || credits.questionsLeft > 0,
    remaining: credits.questionsLeft
  };
}

export function deductQuestionCredit(): { success: boolean; remaining: number } {
  const credits = getUserCredits();

  if (credits.isUnlimited) {
    credits.totalQuestionsAsked += 1;
    saveUserCredits(credits);
    return { success: true, remaining: credits.questionsLeft };
  }

  if (credits.questionsLeft <= 0) {
    return { success: false, remaining: 0 };
  }

  credits.questionsLeft -= 1;
  credits.totalQuestionsAsked += 1;
  saveUserCredits(credits);

  return {
    success: true,
    remaining: credits.questionsLeft
  };
}

const USED_CODES_KEY = 'caby_used_mena_codes_v1';
const LEGACY_USED_CODES_KEY = 'catasarx_used_mena_codes_v1';

export function getUsedMenaCodes(): string[] {
  try {
    const raw = localStorage.getItem(USED_CODES_KEY) || localStorage.getItem(LEGACY_USED_CODES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markMenaCodeUsed(code: string): void {
  try {
    const list = getUsedMenaCodes();
    if (!list.includes(code)) {
      list.push(code);
      localStorage.setItem(USED_CODES_KEY, JSON.stringify(list));
    }
  } catch (err) {
    console.warn('Could not save used code:', err);
  }
}

/**
 * دالة التحقق من كود MENA:
 * 1. التأكد من الطول والبادئة MENA والـ 4 أرقام
 * 2. شرط الرقم الثالث: مجموع الأول والثاني ((d1 + d2) % 10)
 * 3. شرط الرقم الرابع: الرقم التالي للثالث مباشرة ((d3 + 1) % 10)
 * ملاحظة: عند كتابة أي كود لا يحقق الشروط تظهر رسالة "هذا الكود غير صحيح"
 */
export function validateSimpleMenaCode(code: string): { valid: boolean; message: string } {
  // 1. التأكد من الطول والبادئة MENA
  if (!code || !code.startsWith("MENA") || code.length !== 8) {
    return { valid: false, message: "هذا الكود غير صحيح" };
  }

  const digits = code.substring(4);
  if (!/^\d{4}$/.test(digits)) {
    return { valid: false, message: "هذا الكود غير صحيح" };
  }

  const d1 = parseInt(digits[0], 10);
  const d2 = parseInt(digits[1], 10);
  const d3 = parseInt(digits[2], 10);
  const d4 = parseInt(digits[3], 10);

  // 2. شرط الرقم الثالث (مجموع الأول والثاني)
  const expectedD3 = (d1 + d2) % 10;
  if (d3 !== expectedD3) {
    return { valid: false, message: "هذا الكود غير صحيح" };
  }

  // 3. شرط الرقم الرابع (الرقم التالي للثالث)
  const expectedD4 = (d3 + 1) % 10;
  if (d4 !== expectedD4) {
    return { valid: false, message: "هذا الكود غير صحيح" };
  }

  return { valid: true, message: "تم شحن 20 سؤالاً بنجاح!" };
}

export const validateMenaCode = validateSimpleMenaCode;

export function redeemPromoCode(code: string): { 
  success: boolean; 
  message: string; 
  added: number; 
  newTotal: number 
} {
  const normalizedCode = code.trim().toUpperCase();
  const credits = getUserCredits();

  // فحص المعادلة البرمجية
  const validation = validateSimpleMenaCode(normalizedCode);
  if (!validation.valid) {
    return {
      success: false,
      message: validation.message,
      added: 0,
      newTotal: credits.questionsLeft
    };
  }

  // التحقق من عدم تكرار استخدام نفس الكود
  const usedCodes = getUsedMenaCodes();
  if (usedCodes.includes(normalizedCode)) {
    return {
      success: false,
      message: "عذراً، هذا الكود تم استخدامه من قبل!",
      added: 0,
      newTotal: credits.questionsLeft
    };
  }

  // تسجيل الكود كمستخدم وإضافة 20 سؤالاً لرصيد المستخدم
  markMenaCodeUsed(normalizedCode);

  credits.questionsLeft += 20;
  credits.history.unshift({
    type: 'voucher',
    amount: 20,
    date: Date.now(),
    description: `شحن كود تعليمي (${normalizedCode})`
  });

  saveUserCredits(credits);

  return {
    success: true,
    message: validation.message,
    added: 20,
    newTotal: credits.questionsLeft
  };
}

export function applyRechargePayment(
  plan: RechargePlan,
  methodName: string,
  referencePhoneOrNumber?: string
): UserCredits {
  const credits = getUserCredits();

  credits.questionsLeft += plan.questionsCount;
  credits.history.unshift({
    type: 'wallet_vodafone',
    amount: plan.questionsCount,
    date: Date.now(),
    description: `شحن ${plan.name} عبر ${methodName} ${referencePhoneOrNumber ? `(مرجع: ${referencePhoneOrNumber})` : ''}`
  });

  saveUserCredits(credits);
  return credits;
}
