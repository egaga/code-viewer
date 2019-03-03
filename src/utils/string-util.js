function tokenToString(token) {
  for (let i in token) return token[i];
}

export function expressionToString(tokens) {
  if (Array.isArray(tokens))
    return tokens.map(x => tokenToString(x)).join("  ");
  else
    return tokenToString(tokens);
}