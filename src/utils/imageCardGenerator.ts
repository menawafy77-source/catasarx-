/**
 * Social Media Image Card Generator for Shomi Baccalaureate
 * Renders high-resolution (1200x630 or 1080x1080) branded solution cards for social sharing.
 */

import { convertLatexToUnicodeMath } from './mathTextFormatter';

export interface ShareCardOptions {
  questionText: string;
  solutionText: string;
  subject?: string;
  trackName?: string;
  grade?: string;
  aspectRatio?: 'landscape' | 'square';
}

/**
 * Strips heavy markdown formatting into clean readable text for the canvas graphic
 */
export function cleanMarkdownForCard(markdown: string): string {
  if (!markdown) return '';
  let text = markdown;

  // Convert formulas to clean Unicode math
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_m, f) => convertLatexToUnicodeMath(f));
  text = text.replace(/\$([^\$\n]+?)\$/g, (_m, f) => convertLatexToUnicodeMath(f));

  return text
    .replace(/#{1,6}\s?/g, '')       // headings
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1')     // italics
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')  // links
    .replace(/>\s?/g, '')            // blockquotes
    .replace(/[-*+]\s+/g, '• ')      // bullet points
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Wraps text into lines that fit within a maximum width on the canvas
 */
function wrapArabicText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  const rawParagraphs = text.split('\n');

  for (const paragraph of rawParagraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      lines.push('');
      continue;
    }

    const words = trimmed.split(' ');
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      const width = ctx.measureText(testLine).width;

      if (width < maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Draws rounded rectangle path across all browser canvas implementations safely
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
): void {
  const anyCtx = ctx as any;
  if (typeof anyCtx.roundRect === 'function') {
    anyCtx.roundRect(x, y, w, h, radius);
  } else {
    ctx.rect(x, y, w, h);
  }
}

/**
 * Generates an image data URL for a social share card using HTML5 Canvas
 */
export async function generateShareCardImage(options: ShareCardOptions): Promise<string> {
  const {
    questionText,
    solutionText,
    subject = 'البكالوريا',
    trackName = 'التعليم الثانوي',
    grade = 'الثانوية العامة',
    aspectRatio = 'landscape'
  } = options;

  const width = 1200;
  const height = aspectRatio === 'square' ? 1200 : 630;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Background gradient: Deep royal obsidian / navy
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#040d1a');
  bgGrad.addColorStop(0.5, '#07152d');
  bgGrad.addColorStop(1, '#02070f');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle decorative geometric accents
  ctx.save();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.08)';
  ctx.lineWidth = 1.5;
  for (let x = 40; x < width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 40; y < height; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  // Outer glowing border
  ctx.save();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  drawRoundedRect(ctx, 16, 16, width - 32, height - 32, 28);
  ctx.stroke();
  ctx.restore();

  // Direction & RTL settings
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';

  // --- HEADER SECTION ---
  // Brand Pill
  const brandX = width - 48;
  const brandY = 42;

  // Shomi Logo icon & text
  ctx.font = 'bold 32px "Cairo", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('⚡ شومي | SHOMI BACCALAUREATE', brandX, brandY);

  ctx.font = '500 18px "Cairo", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('منصة الذكاء الاصطناعي لحل وشرح مناهج الثانوية والبكالوريا', brandX, brandY + 40);

  // Subject and Track Badges (Left side of header)
  ctx.direction = 'ltr';
  ctx.textAlign = 'left';

  const badgeY = 44;
  let badgeX = 48;

  // Track Badge
  const trackText = `${trackName} • ${grade}`;
  ctx.font = 'bold 15px "Cairo", system-ui, -apple-system, sans-serif';
  const trackWidth = ctx.measureText(trackText).width + 30;

  ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
  ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  drawRoundedRect(ctx, badgeX, badgeY, trackWidth, 34, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.fillText(trackText, badgeX + 15, badgeY + 8);

  // Subject Badge
  badgeX += trackWidth + 12;
  const subjText = `مادة: ${subject}`;
  const subjWidth = ctx.measureText(subjText).width + 28;

  ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
  ctx.beginPath();
  drawRoundedRect(ctx, badgeX, badgeY, subjWidth, 34, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.fillText(subjText, badgeX + 14, badgeY + 8);

  // Divider line
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(48, 105);
  ctx.lineTo(width - 48, 105);
  ctx.stroke();

  // Reset to RTL for body text
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';

  // --- QUESTION CARD ---
  const qBoxX = 48;
  const qBoxY = 125;
  const qBoxW = width - 96;
  const qBoxH = aspectRatio === 'square' ? 260 : 160;

  // Background of Question Box
  ctx.fillStyle = 'rgba(15, 30, 60, 0.85)';
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  drawRoundedRect(ctx, qBoxX, qBoxY, qBoxW, qBoxH, 18);
  ctx.fill();
  ctx.stroke();

  // Question Title Tag
  ctx.font = 'bold 20px "Cairo", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('📌 نص السؤال:', width - 72, qBoxY + 18);

  // Question Content wrapped
  const cleanQ = cleanMarkdownForCard(questionText);
  ctx.font = '500 20px "Cairo", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#f1f5f9';
  const qLines = wrapArabicText(ctx, cleanQ, qBoxW - 48);
  const maxQLines = aspectRatio === 'square' ? 6 : 3;
  let currY = qBoxY + 54;
  for (let i = 0; i < Math.min(qLines.length, maxQLines); i++) {
    let line = qLines[i];
    if (i === maxQLines - 1 && qLines.length > maxQLines) {
      line += '...';
    }
    ctx.fillText(line, width - 72, currY);
    currY += 28;
  }

  // --- SOLUTION CARD ---
  const sBoxY = qBoxY + qBoxH + 20;
  const footerH = 65;
  const sBoxH = height - sBoxY - footerH - 24;

  ctx.fillStyle = 'rgba(6, 20, 42, 0.9)';
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  drawRoundedRect(ctx, qBoxX, sBoxY, qBoxW, sBoxH, 18);
  ctx.fill();
  ctx.stroke();

  // Solution Title Tag
  ctx.font = 'bold 22px "Cairo", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#34d399';
  ctx.fillText('✨ الحل النموذجي المعتمد والشرح:', width - 72, sBoxY + 18);

  // Solution Content wrapped
  const cleanS = cleanMarkdownForCard(solutionText);
  ctx.font = '400 19px "Cairo", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#e2e8f0';

  const sLines = wrapArabicText(ctx, cleanS, qBoxW - 48);
  const maxSLines = Math.floor((sBoxH - 65) / 28);
  currY = sBoxY + 56;
  for (let i = 0; i < Math.min(sLines.length, maxSLines); i++) {
    let line = sLines[i];
    if (i === maxSLines - 1 && sLines.length > maxSLines) {
      line += '... [الحل مفصل ومكتمل في التطبيق]';
    }
    ctx.fillText(line, width - 72, currY);
    currY += 28;
  }

  // --- FOOTER SECTION ---
  const footerY = height - 52;

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(48, height - 68);
  ctx.lineTo(width - 48, height - 68);
  ctx.stroke();

  // Footer right side
  ctx.font = 'bold 16px "Cairo", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('🎓 منصة شومي الذكية | نموذج إجابة موثوق وفق معايير وزارة التربية والتعليم', width - 48, footerY);

  // Footer left side
  ctx.direction = 'ltr';
  ctx.textAlign = 'left';
  ctx.font = '500 15px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('shomi.app • حل فوري وشرح بالذكاء الاصطناعي', 48, footerY);

  return canvas.toDataURL('image/png', 0.95);
}

/**
 * Converts a data URL to a File object for Web Share API
 */
export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: 'image/png' });
}
