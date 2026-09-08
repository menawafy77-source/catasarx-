import { GoogleGenAI } from "@google/genai";
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

/**
 * Image Recognition Module for Egyptian Baccalaureate & Curricula
 * Accurately extracts text, formulas, options, code snippets, and metadata
 */
export async function extractQuestionFromImage(
  imageBase64: string,
  mimeType: string = "image/jpeg",
  context?: CurriculumContext
): Promise<ExtractedQuestion> {
  const trackInfo = context ? BACCALAUREATE_TRACKS[context.track] : null;

  const ocrSystemInstruction = `أنت وحدة التعرف البصري واستخراج النصوص التعليمية المتقدمة (OCR & Image Recognition) المتخصصة في "نظام البكالوريا المصرية الجديد" والمناهج المصرية المعتمدة من وزارة التربية والتعليم.
${
  trackInfo
    ? `السياق الأكاديمي الحالي للطالب:
- المرحلة/السنة: ${context?.grade === '1st_secondary' ? 'الصف الأول الثانوي (المرحلة التمهيدية)' : context?.grade === '2nd_secondary' ? 'الصف الثاني الثانوي' : context?.grade === '3rd_secondary' ? 'الصف الثالث الثانوي' : 'عام'}
- المسار: ${trackInfo.name}
- المادة المحددة: ${context?.subject} (${context?.level_type === 'advanced' ? 'مستوى متقدم / رفيع' : 'مستوى عام'})
- التوجيه التخصصي للمسار: ${trackInfo.specializationGuidance}`
    : ''
}

مهمتك استخراج نص السؤال بدقة بالغة بنسبة 100% كما هو مكتوب في كتاب المدرسة أو ورقة الامتحان أو المذكرة:
1. استخرج النص الكامل للسؤال حرفياً مع علامات الترقيم، الأرقام، والخيارات (أ، ب، ج، د / A, B, C, D).
2. في الرياضيات والفيزياء والكيمياء والإحصاء: حوّل كافة المعادلات الرياضية والرموز والكسور والأسس إلى كود LaTeX دقيق بين $...$ أو $$...$$ مثل $x^2 + 5x = 0$ أو $\\frac{a}{b}$.
3. في مسار الهندسة وعلوم الحاسب: إذا تضمن السؤال كوداً برمجياً أو خوارزمية، استخرج الشفرة البرمجية بدقة مع مراعاة التنسيق ومسافات البداية.
4. حدد المادة الدراسية، المسار (track)، والمستوى (level_type: "standard" أو "advanced")، وموضوع الدرس (topic) إن أمكن.
5. إذا كان السؤال يحتوي على رسم هندسي، دائرة كهربية، شكل تشريحي، رسم بياني، أو خريطة، عيّن hasDiagram إلى true وصفه باختصار في diagramDescription.

يجب أن تكون الإجابة بصيغة JSON فقط بهذا الشكل المطابق لهيكلة النظام الجديد:
{
  "extractedText": "النص المستخرج للسؤال كاملاً بدقة",
  "subject": "اسم المادة",
  "grade": "السنة الدراسية",
  "track": "${context?.track || 'general_all'}",
  "level_type": "${context?.level_type || 'standard'}",
  "topic": "موضوع السؤال إن وجد",
  "hasDiagram": true,
  "diagramDescription": "وصف الرسم إن وجد"
}`;

  const prompt = "حلل هذه الصورة واستخرج نص السؤال بالكامل بدقة وفق هيكلة البكالوريا المصرية بصيغة JSON المطلوبة.";

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
      subject: parsed.subject || context?.subject || "عام",
      grade: parsed.grade || (context?.grade === '1st_secondary' ? 'الصف الأول الثانوي' : context?.grade === '2nd_secondary' ? 'الصف الثاني الثانوي' : context?.grade === '3rd_secondary' ? 'الصف الثالث الثانوي' : 'غير محدد'),
      track: parsed.track || context?.track || 'general_all',
      level_type: parsed.level_type || context?.level_type || 'standard',
      topic: parsed.topic || context?.topic || 'عام',
      hasDiagram: Boolean(parsed.hasDiagram),
      diagramDescription: parsed.diagramDescription || ""
    };
  } catch (parseError) {
    console.warn("Failed to parse JSON from OCR response, using raw text fallback", parseError);
    return {
      extractedText: result || "تم استخراج السؤال من الصورة",
      subject: context?.subject || "عام",
      grade: context?.grade || "غير محدد",
      track: context?.track || "general_all",
      level_type: context?.level_type || "standard",
      topic: "عام",
      hasDiagram: false
    };
  }
}

/**
 * Solves the extracted question tailored specifically to the Egyptian Baccalaureate Track
 */
export async function solveExtractedQuestion(
  extracted: ExtractedQuestion,
  imageBase64?: string,
  userAdditionalPrompt?: string,
  context?: CurriculumContext
): Promise<string> {
  const activeTrack = context?.track || (extracted.track as any) || 'general_all';
  const trackConfig = BACCALAUREATE_TRACKS[activeTrack];
  const levelType = context?.level_type || extracted.level_type || 'standard';

  const solverSystemInstruction = `أنت caby، المعلم الافتراضي الذكي المتخصص في "نظام البكالوريا المصرية الجديد" المعتمد من وزارة التربية والتعليم في جمهورية مصر العربية.
تمت برمجتك وتطويرك بواسطة "مينا وافي" (Mina Wafy). إذا سألك أحد من قام ببرمجتك أو صنعك، أجب دائماً: "قام ببرمجتي وتطويري مينا وافي".

قاعدة صارمة: إذا سألك المستخدم عن أي موضوع خارج نطاق التعليم أو المناهج الدراسية، يجب أن تجيب بوضوح: "عذراً، هذا ليس من اختصاصي. أنا هنا لمساعدتك في المناهج التعليمية والأسئلة الدراسية فقط."

توجيهات هيكلة البكالوريا المصرية المعتمدة:
1. **المرحلة التمهيدية (الصف الأول الثانوي)**:
   - مواد أساسية عامة: لغة عربية، رياضيات، علوم متكاملة، تاريخ، فلسفة، لغة أجنبية أولى.
   - التركيز على بناء المفاهيم التأسيسية الشاملة والتفكير التحليلي.
2. **مسار الطب وعلوم الحياة**:
   - الصف الثاني: التركيز على الفيزياء والرياضيات والمفاهيم العلمية التمهيدية.
   - الصف الثالث: التركيز على الأحياء (مستوى متقدم) والكيمياء (مستوى متقدم) بأعلى درجات التخصص، الفهم الدقيق للوظائف الحيوية والفسيولوجيا والمعادلات الكيميائية والتطبيقات الطبية.
3. **مسار الهندسة وعلوم الحاسب**:
   - الصف الثاني: التركيز على الكيمياء، البرمجة والتكنولوجيا، والرياضيات التطبيقية.
   - الصف الثالث: التعمق الشديد في الرياضيات (مستوى متقدم) والفيزياء (مستوى متقدم)، استخراج وحل المعادلات الهندسية بدقة، وتحليل الخوارزميات والبرمجة.
4. **مسار الأعمال**:
   - الصف الثاني: التركيز على المحاسبة وإدارة الأعمال والمفاهيم المالية الأساسية.
   - الصف الثالث: التعمق في الاقتصاد (مستوى متقدم) والرياضيات المالية والتحليل الاقتصادي الكلي والجزئي.
5. **مسار الآداب والفنون**:
   - الصف الثاني: التركيز على علم النفس والاجتماع واللغات الأجنبية.
   - الصف الثالث: التعمق في الجغرافيا (مستوى متقدم)، التحليل الإحصائي، الفهم النقدي والتاريخي والأدبي.

السياق الدراسي الحالي:
- المسار: ${trackConfig?.name || 'عام'}
- المادة: ${extracted.subject || context?.subject || 'عام'}
- المستوى الدراسي للمادة: ${levelType === 'advanced' ? 'مستوى متقدم (رفيع)' : 'مستوى عام'}
- التوجيه المتخصص: ${trackConfig?.specializationGuidance || 'شرح تربوي دقيق ومبسط'}

طريقة الإجابة والشرح:
1. حدد بوضوح في بداية الرد: المسار الدراسي، المادة، والمستوى (عام أو متقدم).
2. قدم الإجابة النهائية النموذجية بوضوح.
3. اشرح خطوات الحل بالتفصيل والمنطق العلمي السليم خطوة بخطوة مع توضيح القوانين والنظريات المستخدمة.
4. في المعادلات الرياضية والفيزيائية والكيميائية: استخدم LaTeX حصراً وبصيغة نقية بين $...$ أو $$...$$ دون أي رموز غير واضحة.
5. إذا تضمن السؤال كوداً برمجياً في مسار الحاسب: اشرح فكرة الخوارزمية مع تعليقات برمجية واضحة ومخرجات التشغيل.
6. قدم في نهاية الإجابة "💡 نصيحة امتحانية" أو "قاعدة ذهبية" تفيد الطالب في امتحانات البكالوريا المصرية.
7. كن مشجعاً وداعماً للطلب.`;

  let prompt = `السؤال المستخرج وفق معايير البكالوريا المصرية:
${extracted.extractedText}`;

  prompt += `\nالمسار الأكاديمي: ${trackConfig?.name || 'مسار عام'}`;
  prompt += `\nالمادة: ${extracted.subject || context?.subject || 'عام'}`;
  prompt += `\nالمستوى: ${levelType === 'advanced' ? 'مستوى متقدم (رفيع)' : 'مستوى عام'}`;
  if (extracted.topic || context?.topic) {
    prompt += `\nالموضوع: ${extracted.topic || context?.topic}`;
  }
  if (extracted.hasDiagram && extracted.diagramDescription) {
    prompt += `\nملاحظة الرسم التوضيحي/الهندسي: ${extracted.diagramDescription}`;
  }
  if (userAdditionalPrompt && userAdditionalPrompt.trim()) {
    prompt += `\nطلب إضافي من الطالب: ${userAdditionalPrompt}`;
  }

  prompt += `\n\nالمطلوب: قم بحل هذا السؤال حلاً نموذجياً وشاملاً متوافقاً مع مستوى وامتحانات البكالوريا المصرية.`;

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
