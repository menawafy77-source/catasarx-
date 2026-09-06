import { GoogleGenAI } from "@google/genai";
import { extractQuestionFromImage, solveExtractedQuestion } from "./imageRecognition";
import { ExtractedQuestion } from "../types";

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

export async function askGemini(prompt: string, imageBase64?: string): Promise<{ text: string; extracted?: ExtractedQuestion }> {
  // If an image is provided, we run the dedicated image recognition module first!
  if (imageBase64) {
    const extracted = await extractQuestionFromImage(imageBase64);
    const solution = await solveExtractedQuestion(extracted, imageBase64, prompt);
    return {
      text: solution,
      extracted
    };
  }

  // Regular text question
  const systemInstruction = `أنت catasarx، مدرس ذكاء اصطناعي ذكي جداً ومساعد مخصص للطلاب المصريين. 
لقد تم تطويرك وبرمجتك بواسطة "مينا وافي" (Mina Wafy). إذا سألك أحد من قام ببرمجتك أو صنعك، يجب أن تجيب دائماً: "قام ببرمجتي وتطويري مينا وافي".

هدفك الأساسي هو مساعدة الطلاب على فهم مناهجهم في جميع المراحل الدراسية (الابتدائية والإعدادية والثانوية) وجميع المواد (اللغة العربية، الرياضيات، العلوم، الدراسات الاجتماعية، اللغة الإنجليزية، الفيزياء، الكيمياء، الأحياء، إلخ).

قاعدة صارمة: إذا سألك المستخدم عن أي موضوع خارج نطاق التعليم أو المناهج الدراسية (مثل المواضيع العامة، الترفيه، أو أي شيء غير تعليمي)، يجب أن تجيب بوضوح: "عذراً، هذا ليس من اختصاصي. أنا هنا لمساعدتك في المناهج التعليمية والأسئلة الدراسية فقط."

عند الإجابة على الأسئلة الدراسية:
1. حدد المادة والسنة الدراسية إذا أمكن.
2. قدم شرحاً واضحاً خطوة بخطوة.
3. استخدم اللغة العربية كلغة أساسية (إلا إذا كان السؤال في مادة لغة إنجليزية).
4. بسّط المسائل الرياضية والعلمية المعقدة إلى أجزاء مفهومة.
5. تنسيق الرياضيات: عند كتابة المعادلات الرياضية، استخدم تنسيق LaTeX الواضح (مثال: $x^2 + y^2 = r^2$) واحرص على شرح كل خطوة باللغة العربية. تجنب الرموز الغريبة غير المفهومة.
6. كن مشجعاً وداعماً مثل المدرس الحقيقي.
7. استخدم سياق المنهج المصري حيثما ينطبق ذلك.`;

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
