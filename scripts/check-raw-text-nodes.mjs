import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const roots = ['app', 'src'];
const textComponents = new Set(['Text', 'AppText', 'SvgText']);
const failures = [];

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolute);
    return /\.[jt]sx$/.test(entry.name) ? [absolute] : [];
  });
}

function tagName(tag) {
  return tag.getText().split('.').at(-1);
}

function record(source, node, detail) {
  const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
  failures.push(`${path.relative(process.cwd(), source.fileName)}:${line + 1}:${character + 1} ${detail}`);
}

function canEmitStaticText(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isNumericLiteral(node) || ts.isTemplateExpression(node)) return true;
  if (ts.isParenthesizedExpression(node)) return canEmitStaticText(node.expression);
  if (ts.isConditionalExpression(node)) return canEmitStaticText(node.whenTrue) || canEmitStaticText(node.whenFalse);
  if (ts.isBinaryExpression(node)) {
    if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return canEmitStaticText(node.right);
    if (node.operatorToken.kind === ts.SyntaxKind.PlusToken || node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
      return canEmitStaticText(node.left) || canEmitStaticText(node.right);
    }
  }
  return ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'join';
}

function inspectElement(source, element, children) {
  const name = tagName(element.tagName);
  if (textComponents.has(name)) return;
  for (const child of children) {
    if (ts.isJsxText(child)) {
      // JSX discards newline indentation, but a same-line space between
      // siblings is emitted as a real text child and crashes RN Web Views.
      const emitted = child.text.includes('\n') ? child.text.trim() : child.text;
      if (emitted.length > 0) record(source, child, `raw JSX text ${JSON.stringify(emitted)} inside <${name}>; wrap it in <AppText>.`);
    } else if (ts.isJsxExpression(child) && child.expression && canEmitStaticText(child.expression)) {
      record(source, child, `expression can emit text directly inside <${name}>; wrap it in <AppText>.`);
    }
  }
}

for (const file of roots.flatMap((root) => sourceFiles(path.resolve(root)))) {
  const sourceText = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    if (ts.isJsxElement(node)) inspectElement(source, node.openingElement, node.children);
    if (ts.isJsxFragment(node)) inspectElement(source, { tagName: { getText: () => 'Fragment' } }, node.children);
    ts.forEachChild(node, visit);
  }
  visit(source);
}

if (failures.length > 0) {
  console.error('Unsafe React Native text children found:\n');
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Raw text node guard passed.');
