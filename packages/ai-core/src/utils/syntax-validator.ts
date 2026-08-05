export function isLikelySyntacticallyComplete(content: string): boolean {
  if (!content || !content.trim()) return false;

  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  const openBrackets = (content.match(/\[/g) || []).length;
  const closeBrackets = (content.match(/\]/g) || []).length;

  const braceDelta = openBraces - closeBraces;
  const parenDelta = openParens - closeParens;
  const bracketDelta = openBrackets - closeBrackets;

  const lines = content.trimEnd().split("\n").filter(l => l.trim().length > 0);
  const lastMeaningfulLine = lines.length > 0 ? lines[lines.length - 1].trim() : "";

  const looksTruncatedMidExpression =
    /[,.]$/.test(lastMeaningfulLine) ||
    /(&&|\|\||===|!==|==|!=|=>|=|\?|:|\+|-|\*|\/)\s*$/.test(lastMeaningfulLine) ||
    /\b(return|const|let|var|if|else|for|while)\s*$/.test(lastMeaningfulLine) ||
    (/\.\w+(\(|\[)?$/.test(lastMeaningfulLine) && !/[)\];]$/.test(lastMeaningfulLine));

  if (braceDelta > 0 || parenDelta > 0 || bracketDelta > 0 || looksTruncatedMidExpression) {
    return false;
  }

  return true;
}
