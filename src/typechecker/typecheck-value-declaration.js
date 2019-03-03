import {typeCheckExpression} from './typecheck-expression';
import {typed} from './inference/type-helper';

export function typeCheckValueDeclaration(expr, env) {
  const typedExpression = typeCheckExpression(expr.expression, env);

  return typed(Object.assign({}, expr, {
    expression: typedExpression
  }), typedExpression.TYPED);
}
