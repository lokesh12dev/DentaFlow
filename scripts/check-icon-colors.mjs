import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const failures = [];

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolute);
    return /\.[jt]sx$/.test(entry.name) ? [absolute] : [];
  });
}

for (const file of ['app', 'src'].flatMap((root) => sourceFiles(path.resolve(root)))) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const icons = new Set();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || !statement.moduleSpecifier.text.endsWith('/ui/icons')) continue;
    for (const item of statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) ? statement.importClause.namedBindings.elements : []) {
      if (!item.isTypeOnly) icons.add(item.name.text);
    }
  }
  function visit(node) {
    const opening = ts.isJsxSelfClosingElement(node) ? node : ts.isJsxOpeningElement(node) ? node : undefined;
    if (opening && ts.isIdentifier(opening.tagName) && icons.has(opening.tagName.text)) {
      const hasColor = opening.attributes.properties.some((attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText(source) === 'color');
      if (!hasColor) {
        const { line, character } = source.getLineAndCharacterOfPosition(opening.getStart(source));
        failures.push(`${path.relative(process.cwd(), file)}:${line + 1}:${character + 1} <${opening.tagName.text}> has no explicit theme colour; render it with AppIcon or pass color.`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

if (failures.length) {
  console.error('Icons without an explicit colour found:\n');
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Icon colour guard passed.');
