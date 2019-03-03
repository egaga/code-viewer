import { expressionToString } from '../utils/string-util';
import {createUnknownType} from './inference/unknowntype';
import {unify} from './inference/unify';
import {expectTypeMatch, expectTypeMatchForAll} from './inference/typematch';
import {typed} from './inference/type-helper';
import {typeCheckFunctionCall} from './typecheck-function-call';
import {typeCheckValueDeclaration} from './typecheck-value-declaration';
import {typeCheckFunction} from './typecheck-function';

export function typeCheckExpression(expr, env) {
  if (expr.user_defined) {
    // user_defined voi olla muuttuja, mutta myös funktio?
    const t = env.getTypeFor(expr.user_defined);
    return typed(expr, t);
  } else if (expr.call) {
    return typeCheckFunctionCall(expr, env);
  } else if (expr.type === 'pattern_match') {
    return typeCheckPatternMatch(expr, env);
  } else if (expr.integer) { //TODO refactor type specific
    return typed(expr, "integer");
  } else if (expr.string) {
    return typed(expr, "string");
  } else if (expr.bool_true || expr.bool_false) {
    return typed(expr, "bool");
  } else if (expr.grouped) {
    return typeCheckExpression(expr.grouped, env);
  } else if (expr.type === 'explicitly_typed_expression') {
    return typeCheckExplicitlyTypedExpression(expr, env);
  } else if (expr.operation) {
    return typeCheckOperation(expr, env);
  } else if (expr.type === 'if_then_else') {
    return typeCheckIfThenElse(expr, env);
  } else if (expr.type === 'list_expression') {
    return typeCheckListExpression(expr, env);
  } else if (expr.string_concat) {
    return typeCheckStringConcat(expr, env);
  } else if (expr.type === 'lambda_expression') {
    return typeCheckLambdaExpression(expr, env);
  } else if (expr.type === 'tuple') {
    return typeCheckTupleExpression(expr, env);
  } else if (expr.type === 'let_in') {
    return typeCheckLetInExpression(expr, env);
  } else if (expr.type === 'value_declaration_pattern_match') {
    return typeCheckValueDeclarationPatternMatch(expr, env);
  } else if (expr.type === 'value_declaration') {
    return typeCheckValueDeclaration(expr, env);
  } else {
    console.log("expr", expr);
    throw "Typechecker does not (yet?) understand given expr: " + expressionToString(expr);
  }
}

function typeCheckIfThenElse(expr, env) {
  const typedCondition = typeCheckExpression(expr.condition, env);
  unify(typedCondition.TYPED, "bool", env);

  const typedThen = typeCheckExpression(expr.then, env);
  const typedElse = typeCheckExpression(expr.else, env);

  //TODO fixme unify somehow?
  expectTypeMatch(typedThen.TYPED, typedElse.TYPED);

  return typed(expr, typedThen.TYPED);
}

function typeCheckListExpression(expr, env) {
  if (expr.content.length === 0) {
    return typed(expr, {
      type: 'list',
      element_type: createUnknownType() //TODO fixme is this ok?
    });
  }

  const typedContent = expr.content.map(x => typeCheckExpression(x, env));
  expectTypeMatchForAll(typedContent.map(x => x.TYPED));

  return Object.assign({}, expr, {
    content: typedContent,
    TYPED: {
      type: 'list',
      element_type: typedContent[0].TYPED
    }
  });
}

function typeCheckStringConcat(expr, env) {
  //TODO support string expression (e.g. function call that produces string)
  return typed(expr, "string");
}

function typeCheckLambdaExpression(expr, env) {
  return typeCheckFunction(expr, env);
}

function typeCheckTupleExpression(expr, env) {
  const typedContent = expr.content.map(x => typeCheckExpression(x, env));
  const indexedTypes = typedContent.map(x => x.TYPED);

  return typed({ type: 'tuple',  content: typedContent },
    {
      type: 'tuple',
      indexedTypes: indexedTypes
    });
}

function typeCheckLetInExpression(expr, parentEnv) {
  const typedValueDeclarations = expr.valueDeclarations.map(v => {
    return typeCheckExpression(v, parentEnv);
  });

  const env = parentEnv.createChildEnvironment("let_in");
  typedValueDeclarations.forEach(v => {
    if (v.variable) { //TODO handle better
      env.add(v.variable, v.TYPED);
    } else if (v.pattern) {
      v.pattern.content.forEach(v2 => {
        //TODO fix handling this
        if (v2.type === 'explicitly_typed_expression')
          env.add(v2.expression.user_defined, v2.TYPED);
        else
          env.add(v2.user_defined, v2.TYPED);
      })
    }
  });

  const typedExpression = typeCheckExpression(expr.expression, env);

  return typed({
    type: 'let_in',
    valueDeclarations: typedValueDeclarations,
    expression: typedExpression
  }, typedExpression.TYPED);
}

function typeCheckValueDeclarationPatternMatch(expr, env) {
  const typedPattern = typeCheckExpression(expr.pattern, env);
  const typedExpression = typeCheckExpression(expr.expression, env);

  unify(typedPattern.TYPED, typedExpression.TYPED);

  return typed(Object.assign({}, expr, {
    pattern: typedPattern,
    expression: typedExpression
  }), typedExpression.TYPED);
}

function typeCheckExplicitlyTypedExpression(expr, env) {
  const typedExpression = typeCheckExpression(expr.expression, env);

  //expectTypeMatch(expr.expression_type, typedExpression.TYPED, "Explicit type must match expression type");
  unify(expr.expression_type, typedExpression.TYPED, env);

  return Object.assign({}, expr, {
    expression: typedExpression,
    TYPED: typedExpression.TYPED
  });
}

function typeCheckIntegerToBoolBinaryOperation(binaryOp, expr, env) {
  const l = typeCheckExpression(expr.left, env);
  const r = typeCheckExpression(expr.right, env);

  unify(l.TYPED, "integer", env);
  unify(r.TYPED, "integer", env);

  return typed(expr, "bool");
}

function typeCheckIntegerBinaryOperation(binaryOp, expr, env) {
  const binaryOperationType = "integer";

  const l = typeCheckExpression(expr.left, env);
  const r = typeCheckExpression(expr.right, env);

  //matchFunctionCallArgumentWithParam(l.TYPED, binaryOperationType, 0, )
  unify(l.TYPED, binaryOperationType, env);
  unify(r.TYPED, binaryOperationType, env);

  //expectTypeMatch(binaryOperationType, l.TYPED, "binary operation '" + binaryOp + "'");
  //expectTypeMatch(binaryOperationType, r.TYPED, "binary operation '" + binaryOp + "'");

  const newExpr = Object.assign({}, expr, {
    left: l,
    right: r
  });

  return typed(newExpr, binaryOperationType);
}

function typeCheckListConstructor(expr, env) {
  const l = typeCheckExpression(expr.left, env);
  const r = typeCheckExpression(expr.right, env);

  var elementType = createUnknownType();
  unify(r.TYPED, { type: 'list', element_type: elementType }, env);
  unify(l.TYPED, elementType, env);

  //expectTypeMatch(l.TYPED, r.TYPED.element_type);

  return typed(expr, r.TYPED);
}

function typeCheckEqualsOperation(expr, env) {
  const l = typeCheckExpression(expr.left, env);
  const r = typeCheckExpression(expr.right, env);

  unify(l.TYPED, r.TYPED);

  return typed(expr, "bool");
}

function typeCheckOperation(expr, env) {
  if (expr.operation.binary_operation) {
    const binaryOp = expr.operation.binary_operation;
    switch(binaryOp) {
      // TODO fixme, this is not actually correct: for example, integer and real have different operators for dividing
      case '+':
      case '-':
      case '*':
      case '/':
        return typeCheckIntegerBinaryOperation(binaryOp, expr, env);
      case '::':
        return typeCheckListConstructor(expr, env);
      case '<':
      case '>':
        return typeCheckIntegerToBoolBinaryOperation(binaryOp, expr, env);
    }
  } else if (expr.operation.equal_sign) {
    return typeCheckEqualsOperation(expr, env);
  }

  throw "unknown operation";
}


function typeCheckPatternMatchCase(variable, pCase, parentEnv) {
  const env = parentEnv.createChildEnvironment("case then");

  if (pCase.condition.type === 'list_head_tail') {
    const matchVariableType = env.getTypeFor(variable);
    if (matchVariableType.type === 'UNKNOWN_TYPE') {
      const freshTypeVariable = parentEnv.createFreshTypeVariable();
      const listWithTypeVariable = { type: 'list', element_type: freshTypeVariable };
      parentEnv.update(variable, listWithTypeVariable); // destructive!
      env.add(pCase.condition.head, freshTypeVariable);
      env.add(pCase.condition.tail, listWithTypeVariable);
      const typedThen = typeCheckExpression(pCase.then, env);

      return Object.assign({}, pCase, {
        then: typedThen,
        TYPED: typedThen.TYPED // let's make the case TYPED same as its then-clause
      });
    } else if (matchVariableType.type !== 'list') { //if type variable does not work
      sml.print("not a list"); //TODO FIXME
    } else {
      env.add(pCase.condition.head, matchVariableType.element_type);
      env.add(pCase.condition.tail, matchVariableType);
    }
  }

  const typedThen = typeCheckExpression(pCase.then, env);
  return Object.assign({}, pCase, {
    then: typedThen,
    TYPED: typedThen.TYPED // let's make the case TYPED same as its then-clause
  })
}

function typeCheckPatternMatch(expr, env) {
  const variable = expr.variable;
  const cases = expr.cases;
  let typedCases = cases.map(pCase => typeCheckPatternMatchCase(variable, pCase, env));

  const firstType = typedCases[0].TYPED;
  for (let i in typedCases.slice(1)) {
    const type = typedCases[i].TYPED;
    expectTypeMatch(firstType, type, "pattern cases must have the same type");
  }

  return Object.assign({}, expr, {
    cases: typedCases,
    TYPED: firstType
  });
}
