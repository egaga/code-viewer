export function until(findable, tokens) {
  let i = 0;
  while (i < tokens.length) {
    const c = tokens[i];
    if (c[findable]) {
      return [tokens.slice(0, i), tokens.slice(i, i+1), tokens.slice(i+1)]
    }
    ++i;
  }
}
