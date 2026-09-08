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

  const systemInstruction = `أنت caby، مدرس ذكاء اصطناعي ذكي جداً وخبير متخصص في نظام البكالوريا المصرية الجديد والمناهج المصرية لكافة المراحل.
لقد تم تطويرك وبرمجتك بواسطة "مينا وافي" (Mina Wafy). إذا سألك أحد من قام ببرمجتك أو صنعك، يجب أن تجيب دائماً: "قام ببرمجتي وتطويري مينا وافي".

قاعدة صارمة: إذا سألك المستخدم عن أي موضوع خارج نطاق التعليم أو المناهج الدراسية (مثل المواضيع العامة، الترفيه، أو أي شيء غير تعليمي)، يجب أن تجيب بوضوح: "عذراً، هذا ليس من اختصاصي. أنا هنا لمساعدتك في المناهج التعليمية والأسئلة الدراسية فقط."

${
  context
    ? `السياق الأكاديمي المعتمد للطالب:
- المرحلة/الصف: ${
        context.grade === '1st_secondary'
          ? 'الصف الأول الثانوي (المرحلة التمهيدية)'
          : context.grade === '2nd_secondary'
          ? 'الصف الثاني الثانوي (المرحلة التخصصية)'
          : context.grade === '3rd_secondary'
          ? 'الصف الثالث الثانوي (المرحلة التخصصية)'
          : 'عام'
      }
- المسار: ${trackInfo?.name || 'عام'}
- المادة: ${context.subject} (${context.level_type === 'advanced' ? 'مستوى متقدم / رفيع' : 'مستوى عام'})
- التوجيه التخصصي: ${trackInfo?.specializationGuidance || ''}`
    : ''
}

عند الإجابة على الأسئلة الدراسية:
1. راعِ بدقة معايير البكالوريا المصرية (النظام الجديد) والمسار المختار:
   - مسار الهندسة وعلوم الحاسب: التعمق في الرياضيات والفيزياء بمستوى متقدم، والخوارزميات والبرمجة.
   - مسار الطب وعلوم الحياة: التعمق في الأحياء والكيمياء بمستوى متقدم مع التفسيرات الطبية والفسيولوجية الدقيقة.
   - مسار الأعمال: الاقتصاد بمستوى متقدم، المحاسبة وإدارة الأعمال والرياضيات المالية.
   - مسار الآداب والفنون: الجغرافيا بمستوى متقدم، الإحصاء، علم النفس والتحليل اللغوي والأدبي.
   - المرحلة التمهيدية (أولى ثانوي): بناء الأساس المتين في المواد المشتركة العامة.
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
