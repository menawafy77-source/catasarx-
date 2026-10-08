import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  setDoc,
  doc, 
  updateDoc,
  where
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Admin email configured by owner
export const ADMIN_EMAIL = 'menawafy77@gmail.com';

const app = !getApps().length ? initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId
}) : getApp();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

export interface UserAccount {
  id?: string;
  name: string;
  phone: string;
  email: string;
  password?: string;
  grade?: string;
  createdAt: string;
  lastLoginAt?: string;
  questionsCount?: number;
  questionsLeft?: number;
  role?: 'admin' | 'user';
  isUnlimited?: boolean;
}

export interface ActivityLog {
  id?: string;
  type: 'signup' | 'login' | 'recharge' | 'password_change' | 'question';
  userName: string;
  userPhone: string;
  userEmail: string;
  password?: string;
  grade?: string;
  details: string;
  amount?: number;
  timestamp: string;
}

const LOCAL_STORAGE_USER_KEY = 'shomi_current_user';

// Helper to normalize phone numbers
export const normalizePhone = (num: string): string => {
  return num
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()) // convert Arabic-Indic numerals
    .replace(/[\s\-\+]/g, '')
    .trim();
};

/**
 * التحقق البرمجي الدقيق من صحة رقم الموبايل المصري
 * تتأكد هذه الدالة أن الرقم مكون من 11 رقم بالضبط، ويبدأ بـ 010 أو 011 أو 012 أو 015
 */
export function checkUserPhone(phone: string): boolean {
  if (!phone) return false;
  // كود Regex للتحقق من أرقام الموبايل المصرية
  const phoneRegex = /^01[0125][0-9]{8}$/;
  const cleanPhone = normalizePhone(phone).replace(/[^0-9]/g, '');

  if (phoneRegex.test(cleanPhone)) {
    return true; // الرقم مصري صحيح
  } else {
    return false; // الرقم غير صحيح
  }
}

/**
 * تحديد شبكة الاتصالات المصرية من بادئة الرقم
 */
export function getEgyptianOperator(phone: string): string | null {
  const clean = normalizePhone(phone).replace(/[^0-9]/g, '');
  if (clean.startsWith('010')) return 'فودافون مصر';
  if (clean.startsWith('011')) return 'اتصالات مصر (e&)';
  if (clean.startsWith('012')) return 'أورانج مصر';
  if (clean.startsWith('015')) return 'المصرية للاتصالات (WE)';
  return null;
}

/**
 * Real-time event logger: Every action (signup, login, recharge, password) is sent to Firestore
 * and made immediately visible in the Admin Dashboard.
 */
export const logActivityToAdmin = async (activity: Omit<ActivityLog, 'timestamp'>): Promise<void> => {
  try {
    const logsRef = collection(db, 'activity_logs');
    await addDoc(logsRef, {
      ...activity,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Could not record activity log to Firestore:', err);
  }
};

export const saveRegisteredUser = async (data: { 
  name: string; 
  phone: string; 
  email: string;
  password?: string;
  grade?: string;
}): Promise<UserAccount> => {
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanPhone = normalizePhone(data.phone);
  const password = data.password?.trim() || '';
  const grade = data.grade || '3rd_secondary';
  const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();

  const userRecord: UserAccount = {
    name: data.name.trim(),
    phone: cleanPhone,
    email: cleanEmail,
    password: password,
    grade: grade,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    questionsCount: 0,
    questionsLeft: isAdmin ? 999999 : 10,
    role: isAdmin ? 'admin' : 'user',
    isUnlimited: isAdmin
  };

  try {
    const usersRef = collection(db, 'users');
    
    // Check if user already exists by phone or email
    let existingDocId: string | null = null;
    let existingData: UserAccount | null = null;

    const qPhone = query(usersRef, where('phone', '==', cleanPhone));
    const snapPhone = await getDocs(qPhone);
    if (!snapPhone.empty) {
      existingDocId = snapPhone.docs[0].id;
      existingData = snapPhone.docs[0].data() as UserAccount;
    } else {
      const qEmail = query(usersRef, where('email', '==', cleanEmail));
      const snapEmail = await getDocs(qEmail);
      if (!snapEmail.empty) {
        existingDocId = snapEmail.docs[0].id;
        existingData = snapEmail.docs[0].data() as UserAccount;
      }
    }

    if (existingDocId && existingData) {
      // User already exists, update record with new details and password
      userRecord.id = existingDocId;
      userRecord.questionsCount = existingData.questionsCount ?? 0;
      userRecord.questionsLeft = isAdmin ? 999999 : (existingData.questionsLeft ?? 10);
      userRecord.role = isAdmin ? 'admin' : (existingData.role ?? 'user');
      userRecord.isUnlimited = isAdmin;
      if (!password && existingData.password) {
        userRecord.password = existingData.password;
      }

      await updateDoc(doc(db, 'users', existingDocId), {
        name: userRecord.name,
        phone: userRecord.phone,
        email: userRecord.email,
        password: userRecord.password,
        grade: userRecord.grade,
        lastLoginAt: new Date().toISOString()
      });
    } else {
      // Create new user document
      const docRef = await addDoc(usersRef, userRecord);
      userRecord.id = docRef.id;
    }

    // Log this registration/signup to the admin activity stream in real-time
    await logActivityToAdmin({
      type: 'signup',
      userName: userRecord.name,
      userPhone: userRecord.phone,
      userEmail: userRecord.email,
      password: userRecord.password,
      grade: userRecord.grade,
      details: `إنشاء حساب جديد بنجاح: تم تعيين كلمة السر (${userRecord.password || 'بدون'}) واختيار الصف (${userRecord.grade})`
    });

  } catch (err) {
    console.warn('Firestore write warning (saving to local storage as fallback):', err);
    userRecord.id = 'local_' + Date.now();
  }

  // Save current session locally
  try {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userRecord));
  } catch {
    // Ignore storage errors
  }

  return userRecord;
};

/**
 * Login with phone number and password from another device
 */
export const loginWithPhoneAndPassword = async (
  identifier: string, // phone or email
  passwordInput: string
): Promise<UserAccount> => {
  const cleanId = identifier.trim();
  const cleanPhone = normalizePhone(cleanId);
  const cleanEmail = cleanId.toLowerCase();
  const cleanPass = passwordInput.trim();

  const usersRef = collection(db, 'users');
  let matchedDoc: any = null;
  let userData: UserAccount | null = null;

  try {
    // 1. Try finding by phone
    const qPhone = query(usersRef, where('phone', '==', cleanPhone));
    const snapPhone = await getDocs(qPhone);
    if (!snapPhone.empty) {
      matchedDoc = snapPhone.docs[0];
      userData = matchedDoc.data() as UserAccount;
    } else {
      // 2. Try finding by email
      const qEmail = query(usersRef, where('email', '==', cleanEmail));
      const snapEmail = await getDocs(qEmail);
      if (!snapEmail.empty) {
        matchedDoc = snapEmail.docs[0];
        userData = matchedDoc.data() as UserAccount;
      }
    }
  } catch (err) {
    console.error('Firestore query error:', err);
  }

  if (!matchedDoc || !userData) {
    // If admin is logging in with default credentials
    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
      return saveRegisteredUser({
        name: 'المشرف العام',
        phone: '01283569077',
        email: ADMIN_EMAIL,
        password: cleanPass
      });
    }
    throw new Error('رقم الهاتف أو البريد غير مسجل في قاعدة البيانات، يرجى إنشاء حساب جديد أولاً.');
  }

  // Verify password if user has a password set
  if (userData.password && userData.password !== cleanPass) {
    // Log failed attempt to admin
    await logActivityToAdmin({
      type: 'login',
      userName: userData.name,
      userPhone: userData.phone,
      userEmail: userData.email,
      password: cleanPass,
      details: `محاولة تسجيل دخول فاشلة: كلمة السر المدخلة (${cleanPass}) لا تطابق كلمة السر المسجلة`
    });
    throw new Error('كلمة السر غير صحيحة، يرجى التأكد من كلمة السر وإعادة المحاولة.');
  }

  // Update password if it was missing
  if (!userData.password && cleanPass) {
    userData.password = cleanPass;
    try {
      await updateDoc(doc(db, 'users', matchedDoc.id), {
        password: cleanPass,
        lastLoginAt: new Date().toISOString()
      });
    } catch {
      // ignore
    }
  } else {
    try {
      await updateDoc(doc(db, 'users', matchedDoc.id), {
        lastLoginAt: new Date().toISOString()
      });
    } catch {
      // ignore
    }
  }

  userData.id = matchedDoc.id;
  userData.lastLoginAt = new Date().toISOString();
  if (userData.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    userData.role = 'admin';
    userData.isUnlimited = true;
  }

  // Log successful login to admin
  await logActivityToAdmin({
    type: 'login',
    userName: userData.name,
    userPhone: userData.phone,
    userEmail: userData.email,
    password: cleanPass || userData.password,
    grade: userData.grade,
    details: `تسجيل دخول ناجح من جهاز جديد برقم الهاتف وكلمة السر`
  });

  // Save session locally
  try {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userData));
  } catch {
    // ignore
  }

  return userData;
};

export const getStoredCurrentUser = (): UserAccount | null => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserAccount;
    if (parsed.email && parsed.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      parsed.role = 'admin';
      parsed.isUnlimited = true;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearStoredCurrentUser = () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  } catch {
    // Ignore
  }
};

export const fetchAllUsersFromFirestore = async (): Promise<UserAccount[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const usersList: UserAccount[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as UserAccount;
      usersList.push({
        ...data,
        id: docSnap.id,
        isUnlimited: (data.email && data.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) || data.isUnlimited
      });
    });

    return usersList;
  } catch (err) {
    console.error('Error fetching users from Firestore:', err);
    const current = getStoredCurrentUser();
    return current ? [current] : [];
  }
};

export const fetchActivityLogsFromFirestore = async (): Promise<ActivityLog[]> => {
  try {
    const logsRef = collection(db, 'activity_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const logsList: ActivityLog[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as ActivityLog;
      logsList.push({
        ...data,
        id: docSnap.id
      });
    });

    return logsList;
  } catch (err) {
    console.error('Error fetching activity logs from Firestore:', err);
    return [];
  }
};
