/**
 * Palette for printed documents (receipts, prescriptions, clinical documents).
 *
 * Print output is rendered by expo-print as plain HTML, so it cannot use the runtime
 * ThemeProvider; these are the document equivalents of the app palette. Values are kept
 * in the design system so every color literal in the codebase resolves here.
 *
 * The values intentionally match the current printed documents exactly — aligning them
 * with the on-screen warm palette is a separate visual decision, not a token refactor.
 */
export const printPalette = {
  /** Document body text. */
  text: '#17191c',
  /** Secondary/explanatory text. */
  textMuted: '#646a73',
  /** Strong brand rule + clinic masthead. */
  brand: '#18324a',
  /** ℞ and clinical accent text. */
  clinical: '#167d78',
  /** Primary table rule (section separation). */
  border: '#e4e7eb',
  /** Lighter row rule inside tables. */
  borderSoft: '#eceef1',
} as const;

/** Base document CSS shared by every printed template: fonts, body color, muted text, tables. */
export const printBaseCss = `
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${printPalette.text};padding:40px}
    .muted{color:${printPalette.textMuted}}
    table{width:100%;border-collapse:collapse}td{padding:10px 0}.right{text-align:right}
    .footer{font-size:12px;color:${printPalette.textMuted}}
  `;
