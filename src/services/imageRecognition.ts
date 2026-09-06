import { GoogleGenAI } from "@google/genai";
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

/**
 * Image Recognition Module for Egyptian Curricula
 * Accurately extracts text, formulas, options, and metadata from question photos
 */
export async function extractQuestionFromImage(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<ExtractedQuestion> {
  const ocrSystemInstruction = `أنت وحدة التعرف البصري واستخراج النصوص التعليمية (OCR & Image Recognition) لتطبيق catasarx الخاص بالمنهج المصري لجميع المراحل (الابتدائية، الإعدادية، الثانوية) وجميع المواد.
مهمتك استخراج نص السؤال بدقة بالغة بنسبة 100% كما هو مكتوب في كتاب المدرسة أو ورقة الامتحان أو المذكرة أو السبورة:
1. استخرج النص الكامل للسؤال حرفياً مع علامات الترقيم وخيارات الاختيار من متعدد (أ، ب، ج، د).
2. في مادة الرياضيات والفيزياء والكيمياء: حوّل المعادلات والكسور والأسس والجذور إلى تنسيق LaTeX نظيف وسليم بين $...$ مثل $x^2 + 3x = 10$ أو $\\frac{1}{2}$.
3. حدد المادة الدراسية (مثل: رياضيات، علوم، لغة عربية، دراسات اجتماعية، فيزياء، كيمياء، أحياء، لغة إنجليزية، تاريخ، جغرافيا، إلخ).
4. حدد المرحلة أو الصف الدراسي إن وجد في رأس الصفحة أو كان واضحاً من مستوى الدرس.
5. إذا كان السؤال يحتوي على رسم هندسي أو دائرة كهربية أو مخطط أو خريطة، اذكر ذلك في hasDiagram مع وصف مختصر في diagramDescription.

يجب أن تكون الإجابة بصيغة JSON فقط بهذا الشكل:
{
  "extractedText": "النص المستخرج للسؤال كاملاً بدقة",
  "subject": "اسم المادة",
  "grade": "المرحلة أو الصف الدراسي",
  "hasDiagram": true,
  "diagramDescription": "وصف الرسم إن وجد"
}`;

  const prompt = "حلل هذه الصورة واستخرج نص السؤال بالكامل بدقة مع تفاصيل المادة وفق صيغة JSON المطلوبة.";

  const result = await callWithFallback(async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: ocrSystemInstruction,
        responseMimeType: "application/json"
      }
    });
    return response.text;
  });

  try {
    let cleanJson = result.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```/, "").replace(/```$/, "").trim();
    }
    const parsed = JSON.parse(cleanJson);
    return {
      extractedText: parsed.extractedText || "لم يتم التعرف على نص واضح في الصورة",
      subject: parsed.subject || "عام",
      grade: parsed.grade || "غير محدد",
      hasDiagram: Boolean(parsed.hasDiagram),
      diagramDescription: parsed.diagramDescription || ""
    };
  } catch (parseError) {
    console.warn("Failed to parse JSON from OCR response, using raw text fallback", parseError);
    return {
      extractedText: result || "تم استخراج السؤال من الصورة",
      subject: "عام",
      grade: "غير محدد",
      hasDiagram: false
    };
  }
}

/**
 * Solves the extracted question with step-by-step Egyptian curriculum explanation
 */
export async function solveExtractedQuestion(
  extracted: ExtractedQuestion,
  imageBase64?: string,
  userAdditionalPrompt?: string
): Promise<string> {
  const solverSystemInstruction = `أنت catasarx، معلم ذكاء اصطناعي ذكي جداً ومساعد مخصص للطلاب المصريين في جميع المراحل (الابتدائية والإعدادية والثانوية) وجميع المواد.
تمت برمجتك وتطويرك بواسطة "مينا وافي" (Mina Wafy). إذا سألك أحد من قام ببرمجتك أو صنعك، أجب دائماً: "قام ببرمجتي وتطويري مينا وافي".

قاعدة صارمة: إذا سألك المستخدم عن أي موضوع خارج نطاق التعليم أو المناهج الدراسية، يجب أن تجيب بوضوح: "عذراً، هذا ليس من اختصاصي. أنا هنا لمساعدتك في المناهج التعليمية والأسئلة الدراسية فقط."

طريقة الإجابة والشرح:
1. ابدأ بتحديد المادة والصف إن كان معلوماً.
2. قدم الإجابة النموذجية النهائية بوضوح.
3. اشرح خطوات الحل بالتفصيل والتبسيط خطوة بخطوة كما يشرح المدرس الخصوصي المتميز في مصر.
4. في المسائل الرياضية والعلمية: استخدم رموز وكسور LaTeX واضحة تماماً بين $...$ أو $$...$$. لا تستخدم أي رموز مشوهة أو غير مفهومة.
5. إذا كان هناك رسم هندسي أو توضيحي مذكور، اشرح بالاعتماد على معطيات الرسم والزوايا والأطوال.
6. قدم نصيحة دراسية أو ملاحظة هامة (قاعدة أو قانون مستخدم) في نهاية الإجابة.
7. كن مشجعاً وداعماً للطلب.`;

  let prompt = `السؤال المستخرج من الصورة بدقة بواسطة وحدة التعرف البصري:
${extracted.extractedText}`;

  if (extracted.subject && extracted.subject !== "عام") {
    prompt += `\nالمادة: ${extracted.subject}`;
  }
  if (extracted.grade && extracted.grade !== "غير محدد") {
    prompt += `\nالمرحلة/الصف: ${extracted.grade}`;
  }
  if (extracted.hasDiagram && extracted.diagramDescription) {
    prompt += `\nملاحظة الرسم التوضيحي/الهندسي: ${extracted.diagramDescription}`;
  }
  if (userAdditionalPrompt && userAdditionalPrompt.trim()) {
    prompt += `\nطلب إضافي من الطالب: ${userAdditionalPrompt}`;
  }

  prompt += `\n\nالمطلوب: قم بحل هذا السؤال حلاً نموذجياً وشاملاً مع الشرح خطوة بخطوة باللغة العربية.`;

  return await callWithFallback(async (model) => {
    const parts: any[] = [];
    if (imageBase64) {
      parts.push({ inlineData: { data: imageBase64, mimeType: "image/jpeg" } });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: { systemInstruction: solverSystemInstruction }
    });
    return response.text || "عذراً، لم أتمكن من إيجاد حل للسؤال.";
  });
}
