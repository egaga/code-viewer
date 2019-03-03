import {ExpressionMatcher} from './expression-matcher';
import {getTotal, Splitter, findMatching, matchLeftRight, matchMany, matchManyUntil, splitBy, splitByAny} from './match-common';

let total = 0;
function upTotal() { total++; if (total > 1000000) throw "too much calculation: " + total; }

// splits at each index
const everySplitter = (expr, index) => [index, expr.slice(0, index), expr.slice(index)];

const splitByToken = splitter => (expr, i) => splitBy(splitter, i, expr);

function matchConstant(expr) {
  if (!expr) return undefined;

  if (expr.length === 1) {
    var v = expr[0];
    //TODO fixme
    if (v.integer || v.string || v.real || v.bool_false || v.bool_true) return v;
    else return undefined;
  }
}

function matchString(expr) {
  if (!expr || expr.length !== 1) return undefined;
  return expr[0] && expr[0].string;
}

function matchStringExprConcatStr(expr) {
  if (!expr) return undefined;

  const s = matchString(expr.slice(0, 1));
  if (!s) return undefined;

  if (!expr[1]["string_concat"])
    return undefined;

  const rest = matchStringConcat(expr.slice(2));
  if (!rest) return undefined;

  return [s].concat(rest);
}

function matchStringConcat(expr) {
  if (!expr) return undefined;
  return matchString(expr) || matchStringExprConcatStr(expr);
}

function matchStringExpression(expr) {
  if (!expr) return undefined;
  const result = matchStringConcat(expr);
  if (!result) return undefined;

  return {
    string_concat: result
  }
}

function matchListContent(expr) {
  return matchMany(expr, splitByToken("separator"), matchExpression);
}

function matchListExpression(expr) {
  if (!expr) return undefined;

  //TODO improve: findContaining
  const r = findMatching("list_start", "list_end", expr);
  if (!r) return undefined;
  const [listContent, rest] = r;

  if (rest.length) return undefined;

  const content = matchListContent(listContent);
  if (!content) return undefined;

  return {
    type: 'list_expression',
    content: content
  }
}

function matchIfThenExpression(expr) {
  if (!expr) return undefined;

  const r = findMatching("if", "then", expr);
  if (!r) return undefined;
  const [condition, rest] = r;

  const conditionContent = matchExpression(condition);

  if (!conditionContent) return undefined;
  if (!rest.length) return undefined; // else must be found

  //TODO handle else if's
  const r2 = findMatching("then", "else", [{"then": true}].concat(rest));

  if (!r2) return undefined;
  const [thenC, elseC] = r2;

  const thenEx = matchExpression(thenC);
  if (!thenEx) return undefined;

  const elseEx = matchExpression(elseC);
  if (!elseEx) return undefined;

  return {
    'type': 'if_then_else',
    'condition': conditionContent,
    'then': thenEx,
    'else': elseEx
  };
}

function matchBinaryExpression(expr) {
  if (!expr || expr.length < 3) return undefined;
  return matchBinaryExpressionWithOp(expr, "binary_operation") || matchBinaryExpressionWithOp(expr, "equal_sign");
}

//TODO does not take precedence into account
function matchBinaryExpressionWithOp(expr, operator) {
  const result = matchLeftRight(expr, splitByToken(operator), matchExpression, matchExpression);

  if (result) return {
    operation: expr[result.index],
    left: result.left,
    right: result.right
  }
}

function matchPrimitiveType(expr) {
  if (!expr || expr.length !== 1) return undefined;
  const token = expr[0];

  //TODO FIXME
  return token.primitive_type_integer ? "integer" :
    token.primitive_type_string ? "string" :
      token.primitive_type_real ? "real" : undefined;
}

function matchExpressionWithTypeDeclaration(expr) {
  if (!expr || expr.length < 3) return undefined;

  const col = expr[expr.length - 2];
  if (!col.type_declaration)
    return undefined;

  const right = expr.slice(-1);
  const primitiveType = matchPrimitiveType(right)
  if (!primitiveType) return undefined;

  const leftExpression = matchExpression(expr.slice(0, -2));
  if (!leftExpression) return undefined;

  return {
    type: 'explicitly_typed_expression',
    expression_type: primitiveType,
    expression: leftExpression
  }
}

function matchUserDefinedReference(expr) {
  if (!expr || expr.length !== 1) return undefined;
  return expr[0].user_defined ? expr[0] : undefined;
}

// case <var> of
//   <pattern> => <then>
// | <pattern> => <then>
function matchPatternMatch(expr) {
  if (!expr) return undefined;

  const ex = new ExpressionMatcher(expr);
  return ex.read("case") &&
         ex.read("user_defined", "variable") &&
         ex.read("of") &&
         ex.readWithFunction(matchPatterns, "cases") &&
         ex.build("pattern_match");
}

// [] | [x:xs] | _ | constant
function matchPatternFormat(expr) {
  if (!expr) return undefined;

  //TODO should not accept any §expression, only literals, e.g. not [5+3, 1]
  const listExpression = matchListExpression(expr);
  if (listExpression) return listExpression;

  const constant = matchConstant(expr);
  if (constant) return constant;

  if (expr.length === 1) {
    const e = expr[0];
    if (e.underscore) return {
        type: 'match_case_any'
    }
  }

  // list descruting, e.g. x::xs
  const dEx = new ExpressionMatcher(expr);
  return dEx.read("user_defined", "head") &&
         dEx.expectToken("binary_operation", "::") &&
         dEx.read("user_defined", "tail") &&
         dEx.build("list_head_tail");
}

function matchOnePattern(expr) {
  const result = matchLeftRight(
    expr,
    splitByToken("expression_arrow"),
    matchPatternFormat,
    matchExpression);

  if (result) return {
    condition: result.left,
    then: result.right
  }
}

function matchPatterns(expr) {
  return matchMany(expr, splitByToken("pattern_case"), matchOnePattern);
}

function matchLambdaArguments(expr) {
  if (!expr) return undefined;

  return matchFunctionSignature(expr); // re-use
}

function matchLambdaDefinition(expr) {
  if (!expr) return undefined;

  const matched = matchLeftRight(expr, splitByToken("expression_arrow"), matchLambdaArguments, matchExpression)
  if (!matched) return undefined;

  return {
    function_signature: matched.left,
    expression: matched.right
  }
}

function matchAnonymousFunctionExpression(expr) {
  if (!expr) return undefined;

  const ex = new ExpressionMatcher(expr);
  const result = ex.read("lambda") &&
         ex.readWithFunction(matchLambdaDefinition, "definition") &&
         ex.build("lambda_expression");
  if (!result) return undefined;
  return {
    type: 'lambda_expression',
    function_signature: result.definition.function_signature,
    expression: result.definition.expression
  }
}

const matchAnonymousFunctionExpressionWithParens = matchWithParenthesis(matchAnonymousFunctionExpression);

const matchSeparatedExpressionsWithinParens = matchWithParenthesis(expr => matchMany(expr, splitByToken("separator"), matchExpression, true));

function matchTuple(expr) {
  if (!expr) return undefined;
  const matched = matchSeparatedExpressionsWithinParens(expr);
  if (!matched) return undefined;

  return {
    type: 'tuple',
    content: matched.grouped
  }
}

function matchValueDeclarationPatternInLetExpression(expr) {
  if (!expr || !expr[0] || expr.length < 3) return undefined;

  if (!expr[0]['value']) return undefined;

  var expr2 = expr.slice(1);
  const matched = matchLeftRight(expr2, splitByToken("equal_sign"), matchTuple, matchExpression);
  if (!matched) return undefined;

  return {
    type: 'value_declaration_pattern_match',
    pattern: matched.left,
    expression: matched.right
  }
}

function matchValueDeclarationInLetExpression(expr) {
  if (!expr) return undefined;
  return matchValueDeclarationPatternInLetExpression(expr) ||
         matchValueDeclaration(expr);
}

function matchValueDeclarationsInLetExpression(expr) {
  if (!expr) return undefined;

  const splitF = (expr, index) => splitByAny(["value"], index, expr);
  return matchMany(expr, splitF, e => matchValueDeclarationInLetExpression(e));
}

function matchLetInExpressionInside(expr) {
  const matched = matchLeftRight(expr, splitByToken('in'), matchValueDeclarationsInLetExpression, matchExpression);
  if (!matched) return undefined;

  return {
    type: 'let_in',
    valueDeclarations: matched.left,
    expression: matched.right
  }
}

const matchLetInExpression = matchWithin('let', 'end', matchLetInExpressionInside);

function matchExpression(expr, skipFunctionApplication) {
  if (!expr) return undefined;
  const first = expr[0];
  if (!first) return undefined;

  // First token helps to optimize
  if (first["if"]) return matchIfThenExpression(expr);
  if (first["case"]) return matchPatternMatch(expr);
  if (first["value"] || first["function"] || first["equal_sign"] || first["pattern_case"]) {
    return undefined;
  }

  if (first["let"]) return matchLetInExpression(expr);
  if (first["list_start"]) return matchListExpression(expr);

  if (expr.length === 1)
    return matchUserDefinedReference(expr) || matchConstant(expr);

  if (first["user_defined"]) {
    return matchUserDefinedReference(expr) ||
           matchBinaryExpression(expr) ||
           matchExpressionWithTypeDeclaration(expr) ||
           (skipFunctionApplication ? undefined : matchFunctionApplication(expr))
  }

  if (matchWithParenthesis((e) => true)(expr)) { //TODO optimize
    return matchAnonymousFunctionExpressionWithParens(expr) ||
           matchTuple(expr) ||
           matchExpressionInParenthesis(expr);
  }

  if (expr.length < 3) return undefined;

  upTotal();

  return  matchBinaryExpression(expr) ||
          matchExpressionWithTypeDeclaration(expr) ||
          matchStringExpression(expr);
}

function matchWithin(startToken, endToken, matcher) {
  return function(expr) {
    if (!expr || !expr[0] || !expr[expr.length-1]) return undefined;
    if (expr[0][startToken] && expr[expr.length-1][endToken]) {
      return matcher(expr.slice(1, -1));
    }
  }
}

function matchWithParenthesis(matcher) {
  return function(expr) {
    if (!expr || !expr[0] || !expr[expr.length-1]) return undefined;
    if (expr[0].paren === '(' && expr[expr.length-1].paren === ')') {
      const e = matcher(expr.slice(1, -1));
      if (e) return {
        grouped: e
      }
    }
  }
}

function matchExpressionInParenthesis(expr) { //TODO refactor
  if (!expr || !expr[0] || !expr[expr.length-1]) return undefined;
  if (expr[0].paren === '(' && expr[expr.length-1].paren === ')') {
    const e = matchExpression(expr.slice(1, -1));
    if (e) return {
      grouped: e
    }
  }
}

// TODO fixme slow implementation: tries to partition recursively expression
function matchFunctionArguments(expr) {
  // in matchExpression call skip function applications so that the arguments won't make a function call themselves
  // e.g. func a b c could be interpreted as func a (b c)
  return matchMany(expr, everySplitter, e => matchExpression(e, true));
}

// e.g. function_name [1,2,3] 10+5 (sum 5 3 1)
function matchFunctionApplication(expr) {
  if (!expr || !expr[0]) return undefined;

  const name = expr[0].user_defined;
  if (!name) return undefined;

  const args = expr.slice(1);

  const argMatch = matchFunctionArguments(args);
  if (!argMatch) return undefined;

  return {
    call: name,
    args: argMatch
  }
}

function matchValueDeclaration(tokens) {
    const ex = new ExpressionMatcher(tokens);
    return ex.read("value") &&
           ex.read("user_defined", "variable") &&
           ex.read("equal_sign") &&
           ex.readWithFunction(matchExpression, "expression") &&
           ex.build("value_declaration");
}

//valid:
//fun moo1 (x:int) (y:bool): int = x
//fun moo2 (x: int, y: bool):int = x
//fun moo2 (x: int, y: bool):int = x
// interesting:
// fun moo2 (x:int) y:string = x
// - the string type is for the return type, and thus this won't type check as x is int but function return type is string
// - the type of y is 'a
//invalid:
//fun moo1 ((x:int) (y:bool)): int = x
function matchFunctionSignature(params) {
  // (x_1: type, ... x_n: type): type
  // || (x_1:int) x2 :int
  const result = matchManyUntil(params, everySplitter, matchFunctionParam, matchFunctionType);
  if (!result) return undefined;

  if (!result.many) // function must have parameters
    return undefined;

  return {
    type: 'signature',
    params: result.many,
    return_type: result.stop ? result.stop.return_type : undefined
  }
}

function matchUserDefinedWord(word) {
  return function (expr) {
    if (!expr || expr.length !== 1) return undefined;
    return expr[0].user_defined === word ? expr[0].user_defined : undefined;
  }
}

function matchListType(expr) {
  if (!expr) return undefined;
  const listToken = "list";

  const listType = matchLeftRight(expr, everySplitter, matchType, matchUserDefinedWord(listToken));
  if (!listType) return undefined;

  return {
    type: listToken,
    element_type: listType.left
  };
}

function matchTypeVariable(expr) {
  const userDefinedMatch = matchUserDefinedReference(expr);
  if (!userDefinedMatch) return undefined;

  var word = userDefinedMatch.user_defined;

  if (word[0] === "'") {
    return {
      type: 'type_variable',
      variable_name: word.slice(1)
    }
  }
}

function matchFnType(expr) {
  if (!expr) return undefined;

  // 'require multiple' argument is given so that not infinite recursion because
  // matchMany tries immediately match the whole expression with single matcher
  // which has matchFnType as one of its sub matchers
  var matched = matchMany(expr, splitByToken("type_arrow"), matchType, true);
  if (!matched) return undefined;

  return {
    type: 'fn',
    params: matched.slice(0, -1),
    return_type: matched.slice(-1)[0]
  };
}

function matchType(expr) {
  if (!expr) return undefined;
  return matchPrimitiveType(expr) ||
         matchTypeVariable(expr) ||
         matchFnType(expr) ||
         matchListType(expr);
}

function matchFunctionType(expr) {
  if (!expr) return undefined;
  const ex = new ExpressionMatcher(expr);
  return ex.read("type_declaration") &&
         ex.readWithFunction(matchType, "return_type") &&
         ex.build("function_return_type");
}

function matchFunctionParamWithTypeDeclaration(expr) {
  const ex = new ExpressionMatcher(expr);
  return ex.read("user_defined", "param_name") &&
         ex.read("type_declaration") &&
         ex.readWithFunction(matchType, "param_type") &&
         ex.build('explicitly_typed_param');
}

function matchFunctionParamRaw(expr) {
  if (!expr || expr.length < 1) return undefined;

  return matchFunctionParamWithTypeDeclaration(expr) ||
         matchUserDefinedReference(expr);
}

function matchFunctionParam(expr) {
  if (!expr) return undefined;

  return matchWrappedInParens(expr, matchFunctionParamRaw) || matchFunctionParamRaw(expr)
}

function matchWrappedInParens(expr, matcher) {
  if (!expr || !expr[0] || !expr[expr.length-1]) return undefined;
  if (expr[0].paren === '(' && expr[expr.length-1].paren === ')') {
    return matcher(expr.slice(1, -1));
  }
}

function matchFunctionDeclaration(tokens) {
  const ex = new ExpressionMatcher(tokens);
  return ex.read("function") &&
         ex.read("user_defined", "name") &&
         ex.readUntil("equal_sign", matchFunctionSignature, "function_signature") &&
         ex.readWithFunction(matchExpression, "expression") &&
         ex.build('function_declaration');
}

function matchDataConstructor(expr) {
  if (!expr || !expr[0]) return undefined;

  if (!expr[0].user_defined) return undefined;

  const name = expr[0].user_defined;

  if (expr.length === 1) {
    return {
      type: 'dataconstructor',
      name: name,
      constructorTypes: []
    }
  }

  if (!expr[1]['of'])
    return undefined;

  const matchTypeOrDatatype = (expr) => {
    if (!expr) return undefined;
    const t = matchType(expr);
    if (t) return t;

    if (expr.length === 1 && expr[0].user_defined) //TODO fixme hack
      return {
        type: 'type_reference_to_datatype',
        name: expr[0].user_defined //TODO at type check phase that the datatype exists
      }
  };

  const constructor = matchMany(expr.slice(2), splitByToken("type_separator"), matchTypeOrDatatype);

  if (constructor) return {
    type: 'dataconstructor',
    name: name,
    constructorTypes: constructor
  };

  // read dataconstructor name
  // if the
}

function matchDatatypeDefinition(expr) {
  if (!expr) return undefined;
  return matchMany(expr, splitByToken("pattern_case"), matchDataConstructor);
}

function matchDatatypeDeclaration(tokens) {
  const ex = new ExpressionMatcher(tokens);
  return ex.read("datatype") &&
    ex.read("user_defined", "name") &&
    ex.read("equal_sign") &&
    ex.readWithFunction(matchDatatypeDefinition, "definition") &&
    ex.build('datatype_declaration');
}

function readStatement(tokens) {
  if (!tokens || tokens.length === 0) return undefined;

  return matchValueDeclaration(tokens) ||
         matchFunctionDeclaration(tokens) ||
         matchDatatypeDeclaration(tokens);
}

function readDeclarations(tokens) {
  if (tokens.length === 0) return [];

  const splitter = new Splitter(["value", "function", "datatype"], tokens);

  while(true) {
    const split = splitter.split();
    if (!split) return undefined;

    const [index, candidate, rest] = split;

    const leftExpr = readStatement(candidate);
    if (!leftExpr) continue;

    if (rest.length === 0)
      return [ leftExpr ];

    const rightExpr = readDeclarations(rest);
    if (!rightExpr) {
      sml.print("Could not read statement");
      throw "Could not parse tokens to AST";
    }

    return [leftExpr].concat(rightExpr);
  }
}

export function parse(lexed) {
  total = 0;
  const isInteresting = token => !token.whitespace && !token.comment;
  const interestingTokens = lexed.filter(isInteresting);
  const declarations = readDeclarations(interestingTokens);

  sml.print("TOTAL: " + getTotal());
  if (!declarations) throw "Could not read declarations";
  return declarations;
}