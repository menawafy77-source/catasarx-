import { GoogleGenAI } from "@google/genai";
import { extractQuestionFromImage, solveExtractedQuestion } from "./imageRecognition";
import { ExtractedQuestion, CurriculumContext } from "../types";
import { BACCALAUREATE_TRACKS } from "../data/baccalaureateCurriculum";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CANDIDATE_MODELS = [
  "gemini-3.8-flash",
  "gemini-2.5-flash",
  "gemini-3-flash-preview"
];

async function callWithFallback(fn: (model: string) => Promise<any>) {
  let lastError: any = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      return await fn(model);
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed, trying next fallback:`, err?.message || err);
    }
  }
  throw lastError;
}

export async function askGemini(
  prompt: string,
  imageBase64?: string,
  context?: CurriculumContext
): Promise<{ text: string; extracted?: ExtractedQuestion }> {
  // If an image is provided, we run the dedicated image recognition module first!
  if (imageBase64) {
    const extracted = await extractQuestionFromImage(imageBase64, "image/jpeg", context);
    const solution = await solveExtractedQuestion(extracted, imageBase64, prompt, context);
    return {
      text: solution,
      extracted
    };
  }

  // Regular text question with Baccalaureate context
  const trackInfo = context ? BACCALAUREATE_TRACKS[context.track] : null;

  const systemInstruction = `أنت shomi، مدرس ذكاء اصطناعي ذكي جداً وخبير متخصص في نظام البكالوريا المصرية الجديد والمناهج المصرية لكافة المراحل.
لقد تم تطويرك وبرمجتك بواسطة "مينا وافي" (Mina Wafy). إذا سألك أحد من قام ببرمجتك أو صنعك، يجب أن تجيب دائماً: "قام ببرمجتي وتطويري مينا وافي".

قاعدة صارمة: إذا سألك المستخدم عن أي موضوع خارج نطاق التعليم أو المناهج الدراسية (مثل المواضيع العامة، الترفيه، أو أي شيء غير تعليمي)، يجب أن تجيب بوضوح: "عذراً، هذا ليس من اختصاصي. أنا هنا لمساعدتك في المناهج التعليمية والأسئلة الدراسية فقط."

${
  context
    ? `السياق الأكاديمي المعتمد للطالب:
- المرحلة/الصف: ${
        context.grade === '1st_secondary'
          ? 'الصف الأول الثانوي (المرحلة التمهيدية)'
          : context.grade === '2nd_secondary'
          ? 'الصف الثاني الثانوي (المرحلة التخصصية وتحديد المسار)'
          : context.grade === '3rd_secondary'
          ? 'الصف الثالث البكالوريا (المرحلة التخصصية والشهادة)'
          : 'عام'
      }
- المسار: ${trackInfo?.name || 'عام'}
- المادة المحددة: ${context.subject} (${context.level_type === 'advanced' ? 'مستوى متقدم / رفيع' : 'مستوى عادي / عام'})
- التوجيه التخصصي: ${trackInfo?.specializationGuidance || ''}`
    : ''
}

عند الإجابة على الأسئلة الدراسية:
1. راعِ بدقة معايير البكالوريا المصرية (النظام الجديد) والمسار المختار:
   • المواد الأساسية المشتركة (تضاف للمجموع): اللغة العربية، اللغة الأجنبية الأولى، التاريخ المصري.
   • في الصف الثالث البكالوريا يدرس الطالب مادتين فقط تخصصيتين حسب مساره:
     - مسار الطب وعلوم الحياة: الأحياء (مستوى متقدم رفيع) والكيمياء (مستوى متقدم رفيع).
     - مسار الهندسة وعلوم الحاسب: الرياضيات (مستوى متقدم رفيع) والفيزياء (مستوى متقدم رفيع).
     - مسار الأعمال: الاقتصاد (مستوى متقدم رفيع) والرياضيات (مستوى عادي).
     - مسار الآداب والفنون: الجغرافيا (مستوى متقدم رفيع) والإحصاء (مستوى عادي).
   • في الصف الثاني الثانوي: مواد التخصص تشمل (الفيزياء أو الرياضيات للطب) و(الكيمياء أو البرمجة والذكاء الاصطناعي للهندسة) و(المحاسبة أو إدارة الأعمال للأعمال) و(علم النفس أو اللغة الثانية للآداب).
2. قدم الإجابة والشرح خطوة بخطوة بلغة عربية فصيحة وميسرة.
3. تنسيق الرياضيات والعلوم: عند كتابة المعادلات والرموز، استخدم تنسيق LaTeX الواضح حصراً ($...$ أو $$...$$) واحرص على شرح كل خطوة. تجنب أي رموز مشوهة.
4. كن مشجعاً وداعماً مثل أفضل معلم خاص.`;

  const solution = await callWithFallback(async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { systemInstruction }
    });
    return response.text;
  });

  return { text: solution || "" };
}

export { extractQuestionFromImage, solveExtractedQuestion };
