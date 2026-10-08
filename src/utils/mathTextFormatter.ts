/**
 * Mathematical Text Formatter & BiDi Stabilizer
 * Converts LaTeX formulas and scientific equations into clean, universal Unicode text
 * that pastes cleanly into WhatsApp, Notes, Facebook, Word, and chat apps without scrambling.
 */

// Mapping superscript characters
const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ', 'a': 'ᵃ', 'b': 'ᵇ',
  'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ',
  'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'o': 'ᵒ', 'p': 'ᵖ',
  'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'z': 'ᶻ'
};

// Mapping subscript characters
const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ',
  'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ', 'p': 'ₚ', 'r': 'ᵣ',
  's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 'v': 'ᵥ', 'x': 'ₓ'
};

export function toSuperscript(str: string): string {
  if (!str) return '';
  let res = '';
  for (const ch of str) {
    if (SUPERSCRIPT_MAP[ch]) {
      res += SUPERSCRIPT_MAP[ch];
    } else {
      // If contains characters without Unicode superscript, wrap cleanly
      return `^(${str})`;
    }
  }
  return res;
}

export function toSubscript(str: string): string {
  if (!str) return '';
  let res = '';
  for (const ch of str) {
    if (SUBSCRIPT_MAP[ch]) {
      res += SUBSCRIPT_MAP[ch];
    } else {
      return `_(${str})`;
    }
  }
  return res;
}

// Extract balanced braces { ... }
function extractBraceGroup(str: string, startIndex: number): { content: string; endIndex: number } | null {
  if (startIndex >= str.length || str[startIndex] !== '{') return null;
  let depth = 1;
  let i = startIndex + 1;
  while (i < str.length && depth > 0) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') depth--;
    i++;
  }
  if (depth === 0) {
    return { content: str.substring(startIndex + 1, i - 1), endIndex: i };
  }
  return null;
}

// Extract balanced brackets [ ... ]
function extractBracketGroup(str: string, startIndex: number): { content: string; endIndex: number } | null {
  if (startIndex >= str.length || str[startIndex] !== '[') return null;
  let depth = 1;
  let i = startIndex + 1;
  while (i < str.length && depth > 0) {
    if (str[i] === '[') depth++;
    else if (str[i] === ']') depth--;
    i++;
  }
  if (depth === 0) {
    return { content: str.substring(startIndex + 1, i - 1), endIndex: i };
  }
  return null;
}

/**
 * Converts a raw LaTeX formula string into clean Unicode math
 */
export function convertLatexToUnicodeMath(formula: string): string {
  if (!formula) return '';

  let res = formula.trim();

  // Strip math delimiters $$, $
  res = res.replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, '').trim();

  // 1. Blackboard bold sets
  res = res.replace(/\\mathbb\{R\}/g, 'ℝ')
           .replace(/\\mathbb\{N\}/g, 'ℕ')
           .replace(/\\mathbb\{Z\}/g, 'ℤ')
           .replace(/\\mathbb\{Q\}/g, 'ℚ')
           .replace(/\\mathbb\{C\}/g, 'ℂ')
           .replace(/\\mathbb\{P\}/g, 'ℙ')
           .replace(/\\mathbf\{([^{}]+)\}/g, '$1')
           .replace(/\\mathrm\{([^{}]+)\}/g, '$1')
           .replace(/\\text\{([^{}]+)\}/g, '$1')
           .replace(/\\mathit\{([^{}]+)\}/g, '$1')
           .replace(/\\operatorname\{([^{}]+)\}/g, '$1');

  // Degree
  res = res.replace(/\^\\circ|\^\{\\circ\}|\\circ|\\degree/g, '°');

  // 2. Square roots & N-th roots with nested balanced braces
  let sqrtIdx = res.indexOf('\\sqrt');
  while (sqrtIdx !== -1) {
    let afterCmd = sqrtIdx + 5;
    let rootN = '';
    while (afterCmd < res.length && /\s/.test(res[afterCmd])) afterCmd++;

    if (afterCmd < res.length && res[afterCmd] === '[') {
      const bracket = extractBracketGroup(res, afterCmd);
      if (bracket) {
        rootN = bracket.content;
        afterCmd = bracket.endIndex;
        while (afterCmd < res.length && /\s/.test(res[afterCmd])) afterCmd++;
      }
    }

    if (afterCmd < res.length && res[afterCmd] === '{') {
      const brace = extractBraceGroup(res, afterCmd);
      if (brace) {
        const inner = convertLatexToUnicodeMath(brace.content);
        const prefix = rootN ? (toSuperscript(rootN) || `^(${rootN})`) : '';
        const replacement = `${prefix}√(${inner})`;
        res = res.substring(0, sqrtIdx) + replacement + res.substring(brace.endIndex);
        sqrtIdx = res.indexOf('\\sqrt');
        continue;
      }
    }
    break;
  }

  // 3. Fractions with nested balanced braces
  let fracIdx = res.indexOf('\\frac');
  while (fracIdx !== -1) {
    let afterCmd = fracIdx + 5;
    while (afterCmd < res.length && /\s/.test(res[afterCmd])) afterCmd++;

    const numBrace = extractBraceGroup(res, afterCmd);
    if (numBrace) {
      let afterNum = numBrace.endIndex;
      while (afterNum < res.length && /\s/.test(res[afterNum])) afterNum++;
      const denBrace = extractBraceGroup(res, afterNum);
      if (denBrace) {
        const numClean = convertLatexToUnicodeMath(numBrace.content);
        const denClean = convertLatexToUnicodeMath(denBrace.content);

        let fractionStr = '';
        if (numClean === '1' && denClean === '2') fractionStr = '½';
        else if (numClean === '1' && denClean === '4') fractionStr = '¼';
        else if (numClean === '3' && denClean === '4') fractionStr = '¾';
        else if (numClean === '1' && denClean === '3') fractionStr = '⅓';
        else if (numClean === '2' && denClean === '3') fractionStr = '⅔';
        else {
          const simpleNum = /^[a-zA-Z0-9α-ωΑ-Ω°]+$/.test(numClean.trim());
          const simpleDen = /^[a-zA-Z0-9α-ωΑ-Ω°]+$/.test(denClean.trim());
          const nPart = simpleNum ? numClean.trim() : `(${numClean.trim()})`;
          const dPart = simpleDen ? denClean.trim() : `(${denClean.trim()})`;
          fractionStr = `${nPart}/${dPart}`;
        }

        res = res.substring(0, fracIdx) + fractionStr + res.substring(denBrace.endIndex);
        fracIdx = res.indexOf('\\frac');
        continue;
      }
    }
    break;
  }

  // 4. Vectors and Overlines
  let vecIdx = res.indexOf('\\vec');
  while (vecIdx !== -1) {
    let after = vecIdx + 4;
    while (after < res.length && /\s/.test(res[after])) after++;
    const brace = extractBraceGroup(res, after);
    if (brace) {
      const vName = convertLatexToUnicodeMath(brace.content);
      res = res.substring(0, vecIdx) + `${vName}⃗` + res.substring(brace.endIndex);
      vecIdx = res.indexOf('\\vec');
      continue;
    }
    break;
  }

  let overlineIdx = res.indexOf('\\overline');
  while (overlineIdx !== -1) {
    let after = overlineIdx + 9;
    while (after < res.length && /\s/.test(res[after])) after++;
    const brace = extractBraceGroup(res, after);
    if (brace) {
      const name = convertLatexToUnicodeMath(brace.content);
      res = res.substring(0, overlineIdx) + `${name}̄` + res.substring(brace.endIndex);
      overlineIdx = res.indexOf('\\overline');
      continue;
    }
    break;
  }

  // 5. Limits: \lim_{x \to 0} or \lim_{x \rightarrow \infty}
  res = res.replace(/\\lim_\{([^}]+)\}/g, (_m, cond) => {
    return `lim(${convertLatexToUnicodeMath(cond)})`;
  });

  // 6. Integrals: \int_{a}^{b} or \int_a^b or \int
  res = res.replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, (_m, a, b) => {
    return `∫[${convertLatexToUnicodeMath(a)}→${convertLatexToUnicodeMath(b)}]`;
  });
  res = res.replace(/\\int_([0-9a-zA-Z])\^([0-9a-zA-Z])/g, (_m, a, b) => {
    return `∫[${a}→${b}]`;
  });

  // 7. Sums and Products: \sum_{i=1}^{n}
  res = res.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, (_m, a, b) => {
    return `∑[${convertLatexToUnicodeMath(a)}..${convertLatexToUnicodeMath(b)}]`;
  });
  res = res.replace(/\\prod_\{([^}]+)\}\^\{([^}]+)\}/g, (_m, a, b) => {
    return `∏[${convertLatexToUnicodeMath(a)}..${convertLatexToUnicodeMath(b)}]`;
  });

  // 8. Functions
  res = res.replace(/\\(sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|ln|log|exp|det|max|min|arcsin|arccos|arctan)(?![a-zA-Z])/g, '$1');

  // 9. Greek letters
  const greekMap: Record<string, string> = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\Delta': 'Δ',
    '\\epsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ', '\\Theta': 'Θ',
    '\\iota': 'ι', '\\kappa': 'κ', '\\lambda': 'λ', '\\Lambda': 'Λ', '\\mu': 'μ',
    '\\nu': 'ν', '\\xi': 'ξ', '\\Xi': 'Ξ', '\\pi': 'π', '\\Pi': 'Π',
    '\\rho': 'ρ', '\\sigma': 'σ', '\\Sigma': 'Σ', '\\tau': 'τ', '\\upsilon': 'υ',
    '\\phi': 'φ', '\\Phi': 'Φ', '\\chi': 'χ', '\\psi': 'ψ', '\\Psi': 'Ψ',
    '\\omega': 'ω', '\\Omega': 'Ω'
  };

  for (const [tex, uni] of Object.entries(greekMap)) {
    res = res.split(tex).join(uni);
  }

  // 10. Operators and symbols
  const symMap: Record<string, string> = {
    '\\rightarrow': '→',
    '\\to': '→',
    '\\leftarrow': '←',
    '\\leftrightarrow': '↔',
    '\\Rightarrow': '⇒',
    '\\implies': '⇒',
    '\\Leftarrow': '⇐',
    '\\Leftrightarrow': '⇔',
    '\\iff': '⇔',
    '\\times': '×',
    '\\div': '÷',
    '\\pm': '±',
    '\\mp': '∓',
    '\\cdot': '·',
    '\\ast': '*',
    '\\leq': '≤',
    '\\le': '≤',
    '\\geq': '≥',
    '\\ge': '≥',
    '\\neq': '≠',
    '\\ne': '≠',
    '\\approx': '≈',
    '\\equiv': '≡',
    '\\infty': '∞',
    '\\in': '∈',
    '\\notin': '∉',
    '\\subset': '⊂',
    '\\subseteq': '⊆',
    '\\cup': '∪',
    '\\cap': '∩',
    '\\perp': '⊥',
    '\\parallel': '∥',
    '\\angle': '∠',
    '\\triangle': '△',
    '\\forall': '∀',
    '\\exists': '∃',
    '\\varnothing': '∅',
    '\\empty': '∅',
    '\\emptyset': '∅',
    '\\partial': '∂',
    '\\nabla': '∇',
    '\\int': '∫',
    '\\sum': '∑',
    '\\prod': '∏'
  };

  for (const [tex, uni] of Object.entries(symMap)) {
    const escaped = tex.replace('\\', '\\\\');
    res = res.replace(new RegExp(escaped + '(?![a-zA-Z])', 'g'), uni);
  }

  // 11. Delimiters & brackets
  res = res.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
  res = res.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']');
  res = res.replace(/\\left\{/g, '{').replace(/\\right\}/g, '}');
  res = res.replace(/\\left\|/g, '|').replace(/\\right\|/g, '|');
  res = res.replace(/\\{/g, '{').replace(/\\}/g, '}');
  res = res.replace(/\\limits/g, '');
  res = res.replace(/\\quad|\\qquad/g, '  ');
  res = res.replace(/\\[,;!]/g, ' ');

  // 12. Superscripts & Subscripts
  res = res.replace(/\^\{([^{}]+)\}/g, (_m, p1) => toSuperscript(p1));
  res = res.replace(/\^([0-9a-zA-Z+-])/g, (_m, p1) => toSuperscript(p1));

  res = res.replace(/_\{([^{}]+)\}/g, (_m, p1) => toSubscript(p1));
  res = res.replace(/_([0-9a-zA-Z+-])/g, (_m, p1) => toSubscript(p1));

  // Clean remaining lonely backslashes before plain letters
  res = res.replace(/\\([a-zA-Z]+)/g, '$1');

  // Strip excessive whitespace
  res = res.replace(/\s+/g, ' ').trim();

  return res;
}

/**
 * Master Formatter for Copying & Sharing
 * 1. Converts embedded LaTeX ($...$ and $$...$$) to readable Unicode
 * 2. Injects Left-to-Right Marks (\u200E) around math formulas so Arabic RTL text
 *    never reverses parentheses, minus signs, or equal signs when pasted!
 * 3. Formats Markdown headers and bullet points neatly
 */
export function formatQuestionAndSolutionForCopy(text: string): string {
  if (!text) return '';

  let processed = text;

  // 1. Process Block Math $$...$$
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula) => {
    const cleanFormula = convertLatexToUnicodeMath(formula);
    // Wrap with LTR mark so formula lines don't get flipped by RTL surrounding text
    return `\n\u200E  ${cleanFormula}\u200E\n`;
  });

  // 2. Process Inline Math $...$
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (_match, formula) => {
    const cleanFormula = convertLatexToUnicodeMath(formula);
    // \u200E (Left-to-Right Mark) with proper spacing prevents RTL text from inverting operators
    return ` \u200E${cleanFormula}\u200E `;
  });

  // 3. Normalize Arabic / English mixed math lines (lines that contain =, +, -, *, /, ²)
  const lines = processed.split('\n');
  const stabilizedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';

    // If line looks like a standalone equation (e.g. "x² + 5x = 0" or "v = v₀ + at" or "س² + 5س = 0")
    const isEquationLine = /^[A-Za-z0-9\s()+\-*/=<>≤≥²³√½¼¾·Δθαβγπ_سصعنقجاظق]+$/.test(trimmed) &&
      (/[=<>≤≥+\-*/²³√]/.test(trimmed));

    if (isEquationLine) {
      return `\u200E${trimmed}\u200E`;
    }

    return line;
  });

  processed = stabilizedLines.join('\n');

  // 4. Clean Markdown bullet points and bolding for clean plain-text reading
  processed = processed
    .replace(/^#{1,6}\s*(.*)$/gm, '▪ $1') // Headings become clean bullet titles
    .replace(/\*\*(.*?)\*\*/g, '*$1*')    // Convert **bold** to WhatsApp *bold*
    .replace(/__([^_]+)__/g, '*$1*')
    .replace(/`([^`]+)`/g, '$1')          // Inline code
    .replace(/[ \t]{2,}/g, ' ')           // Clean multiple horizontal spaces
    .replace(/\n{3,}/g, '\n\n')           // Max 2 blank lines
    .trim();

  return processed;
}

/**
 * Copies text safely to clipboard with fallback for non-secure contexts
 */
export async function copyFormattedTextToClipboard(text: string, asRawLatex = false): Promise<boolean> {
  const formatted = asRawLatex ? text : formatQuestionAndSolutionForCopy(text);
  
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(formatted);
      return true;
    } catch (e) {
      console.warn('Navigator clipboard write failed, attempting fallback...', e);
    }
  }

  // Fallback for older browsers or if permissions fail
  try {
    const textArea = document.createElement('textarea');
    textArea.value = formatted;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
}
