let total = 0;
export function getTotal() { const r = total; total = 0; return r; }
function upTotal() { total++; if (total > 1000000) throw "too much calculation: " + total; }

export function findMatching(start, end, expr) {
  if (!expr || !expr[0]) return undefined;
  if (!expr[0][start]) return undefined;

  let deep = 1;
  let i = 1;
  while (i < expr.length) {
    const c = expr[i];
    if (c[start]) {
      deep++;
    } else if (c[end]) {
      deep--;
      if (deep === 0) {
        return [expr.slice(1, i), expr.slice(i + 1)]
      }
    }

    ++i;
  }
}

export function matchLeftRight(expr, splitFun, leftMatcher, rightMatcher) {
  if (!expr) return undefined;

  upTotal();

  for (let i = 0; i < expr.length; i++) {
    const split = splitFun(expr, i);
    if (!split) return undefined;

    const [index, left, right] = split;
    i = index;

    const leftExpr = leftMatcher(left);
    if (!leftExpr) continue;

    const rightExpr = rightMatcher(right);
    if (!rightExpr) continue;

    return {
      left: leftExpr,
      right: rightExpr,
      index: index
    }
  }
}

export function matchManyUntil(expr, splitFun, individualMatcher, untilMatcher) {
  upTotal();

  if (expr.length === 0) return []; // special case for empty list content: but works for others?

  const matchTotally = individualMatcher(expr);
  if (matchTotally)
    return {
      many: [matchTotally],
      stop: undefined
    };

  for (let i = 1; i < expr.length; i++) {
    const split = splitFun(expr, i);
    if (!split) return undefined;

    const [index, candidate, rest] = split;
    i = index;

    const leftExpr = individualMatcher(candidate);
    if (!leftExpr) continue;

    const untilExpr = untilMatcher(rest);
    if (untilExpr) {
      return {
        many: [leftExpr],
        stop: untilExpr
      }
    }

    const rightExpr = matchManyUntil(rest, splitFun, individualMatcher, untilMatcher);
    if (!rightExpr) continue;

    return {
      many: [leftExpr].concat(rightExpr.many),
      stop: rightExpr.stop
    }
  }
}

export function matchMany(expr, splitFun, individualMatcher, requireMultiple) {
  if (requireMultiple === undefined) requireMultiple = false;

  upTotal();

  if (expr.length === 0) return []; // special case for empty list content: but works for others?

  if (!requireMultiple) {
    const matchTotally = individualMatcher(expr);
    if (matchTotally)
      return [matchTotally];
  }

  for (let i = 1; i < expr.length; i++) {
    const split = splitFun(expr, i);
    if (!split) return undefined;

    const [index, candidate, rest] = split;
    i = index;

    const leftExpr = individualMatcher(candidate);
    if (!leftExpr) continue;

    const rightExpr = matchMany(rest, splitFun, individualMatcher);
    if (!rightExpr) continue;

    return [leftExpr].concat(rightExpr);
  }
}

/**
 * Splits given expr with any matching splitter token
 * If first token is a match, then instead of splitting at first index,
 * find the next match (or none).
 * 'continuation' represents the finding of next match
 */
export class Splitter {

  constructor(listOfSplitters, expr, index) {
    this.listOfSplitters = listOfSplitters;
    this.expr = expr;
    this.index = index || 0;
    this.continuation = null;
  }

  split() {
    if (this.continuation) {
      return this.processContinuation();
    }

    if (this.index >= this.listOfSplitters.length)
      return undefined;

    return this.splitByAny()
  }

  processContinuation() {
    upTotal();
    const next = this.continuation.split();

    const i = 0;
    const expr = this.expr;

    if (next) { // we found next one
      return [i, expr.slice(i, next[0]), expr.slice(next[0])];
    } else {
      this.continuation = null;
      return [i, expr, []]; // from start to end
    }
  }

  splitByAny() {
    upTotal();
    const listOfSplitters = this.listOfSplitters;
    const expr = this.expr;

    while (this.index < expr.length) {
      const c = expr[this.index];
      for (let a = 0; a < listOfSplitters.length; ++a) {
        const findable = listOfSplitters[a];

        if (c[findable]) {
          if (this.index === 0) { // if first word is splitter, we try to find the next one
            this.continuation = new Splitter(listOfSplitters, expr, this.index+1);
            // bump up the index so that after continuation has been fully processed
            // we continue on next index
            ++this.index;
            return this.processContinuation();
          } else {
            return [this.index, expr.slice(0, this.index), expr.slice(this.index)]
          }
        }
      }

      ++this.index;
    }
  }
}

export function splitByAny(listOfSplitters, startIndex, expr) {
  upTotal();

  let i = startIndex;
  while (i < expr.length) {
    const c = expr[i];
    for (let a = 0; a < listOfSplitters.length; ++a) {
      const findable = listOfSplitters[a];

      if (c[findable]) {
        if (i === 0) { // if first word is splitter, we try to find the next one
          const next = splitByAny(listOfSplitters, i + 1, expr);
          if (next) { // we found next one
            return [i, expr.slice(i, next[0]), expr.slice(next[0])];
          } else {
            return [i, expr, []]; // from start to end
          }
        }
        return [i, expr.slice(0, i), expr.slice(i)]
      }
    }

    ++i;
  }
}

export function splitBy(findable, startIndex, expr) {
  upTotal();

  let i = startIndex;
  while (i < expr.length) {
    const c = expr[i];
    if (c[findable]) {
      return [i, expr.slice(0, i), expr.slice(i+1)]
    }

    ++i;
  }
}