export function generateJavascript(ast) {
  return ast.map(x => generateExpression(x)).join("\n");
}

function typeToString(type, level) {
  if (!level) level = 0;

  if (type.type === 'list') {
    return `${typeToString(type.element_type)} list`;
  } else if (type.type === 'type_variable') {
    return `'${type.variable_name}`;
  } else if (type.type === 'fn') {
    const fnParams = type.params.map(x => typeToString(x)).join(' -> ');
    return `(${fnParams} -> ${typeToString(type.return_type)})`;
  } else if (type.type === 'UNKNOWN_TYPE') {
    return `'${type.type} ${type.value}`;
  } else if (type.type === 'tuple') {
    const indexed = type.indexedTypes.map(x => typeToString(x, level+1)).join("*");
    return level === 0 ? `${indexed}` : `(${indexed})`;
  } else {
    return type;
  }
}

function typeToCommentedString(type) {
  return `/*${typeToString(type)}*/`;
}

function paramToString(p) {
  return `${p.name} ${typeToCommentedString(p.TYPED)}`;
}

function generateExpression(expr) {
  // TODO result variable should be unique

  if (expr.type === 'function_declaration') {
    const params = expr.params.map(x => paramToString(x)).join(", ");
    const returnType = typeToCommentedString(expr.TYPED.return_type);
    const expression = generateExpression(expr.expression);

    if (!expr.name) { // anonymous function, i.e. lambda
      return `(${params}) => { const r__ = ${expression}; return r__; }`;
    }

    const name = expr.name;

    return `
function ${name}(${params}) ${returnType} {
  const result = ${expression};
  return result;
}`;
  } else if (expr.type === 'if_then_else') {
    const conditionExpr = generateExpression(expr.condition);
    const thenExpr = generateExpression(expr.then);
    const elseExpr = generateExpression(expr.else);

    // if-then-else as self-evaluating expression
    return `
(() => {
  if (${conditionExpr}) {
    const l = ${thenExpr};
    return l;
  } else {
    const r =  ${elseExpr};
    return r;
  }
})()`;
  } else if (expr.string) {
    return '\"' + expr.string + '\"';
  } else if (expr.integer) {
    return parseInt(expr.integer, 10);
  } else if (expr.operation) {
    //TODO fixme refactor
    const left = generateExpression(expr.left);
    const right = generateExpression(expr.right);

    if (expr.operation.binary_operation === "::") {
      return `[${left}].concat(${right})`;
    }

    if (expr.operation.binary_operation === '@') {
      return `${left}.concat(${right})`;
    }
    const op = expr.operation.binary_operation ? expr.operation.binary_operation : "===";
    return `${left} ${op} ${right}`;
  } else if (expr.user_defined) {
    return expr.user_defined;
  } else if (expr.type === 'value_declaration') {
    const variable = expr.variable;
    const expression = generateExpression(expr.expression);
    return `
const ${variable} ${typeToCommentedString(expr.TYPED)} = ${expression};
sml.print("${variable}", ${variable});`;
  } else if (expr.call) {
    const name = expr.call;
    const argumentsList = expr.args.map(x => generateExpression(x)).join(", ")

    return `${name}(${argumentsList})`;
  } else if (expr.grouped) {
    const expression = generateExpression(expr.grouped);
    return `(${expression})`;
  } else if (expr.type === 'list_expression') {
    const list = expr.content.map(x => generateExpression(x)).join(", ");
    return `[${list}]`;
  } else if (expr.string_concat) {
    const concat = expr.string_concat.join("");
    return `"${concat}"`;
  } else if (expr.type === 'explicitly_typed_expression') {
    return generateExpression(expr.expression);
  } else if (expr.type === 'explicitly_typed_param') {
    return `${expr.param_name} /*${expr.param_type}*/`;
  } else if (expr.type === 'function_return_type') {
    return `/* ${expr.return_type} */`
  } else if (expr['bool_false']) {
    return "false";
  } else if (expr['bool_true']) {
    return "true";
  } else if (expr.type === 'pattern_match') {
    const caseTests = expr.cases.map(c => [toCaseCondition(c, expr.variable), toCaseThen(c, expr.variable)]);

    // make lambdas and join the array
    const caseTestsOutput = `[${caseTests.map(([cond, then]) => `[() => ${cond}, ${then}]`).join(', ')}]`
    const caseExpression = `
const caseTests = ${caseTestsOutput};
for (let i in caseTests) {
  const [c, then] = caseTests[i];
  const cr = c();
  if (cr) {
    return then();
  }
}
throw "Pattern match failed";`;

    return `(() => {${caseExpression}})();`;
  } else if (expr.type === 'tuple') {
    const content = expr.content.map(x => generateExpression(x));
    return `[${content}]`; // tuple is encoded as an array
  } else if (expr.type === 'let_in') {
    //TODO if not variable but pattern, e.g.
    // let val (x, y) = foobar

    const params = expr.valueDeclarations.map(v => {
      //TODO handle better
      if (v.variable) return v.variable
      else if (v.pattern) {
        return v.pattern.content.map(v2 => {
          //TODO fix handling this
          if (v2.type === 'explicitly_typed_expression')
            return v2.expression.user_defined;
          else
            return v2.user_defined;
        }).join(", ")
      } else {
        return "FIXME";
      }
    }).join(", ");
    const args = expr.valueDeclarations.map((v) => {
      if (v.variable) {
        return generateExpression(v.expression);
      } else if (v.pattern) {
        const e = generateExpression(v.expression); //TODO to variable
        return v.pattern.content.map((v2, index) => `${e}[${index}]`).join(", ")
      } else {
        return "FIXME";
      }
    }).join(", ");
    const body = generateExpression(expr.expression);
    //return `${variables.join('\n')}\n${generateExpression(expr.expression)}`;
    return `((${params}) => {
  const r__ = ${body};
  return r__;
})(${args});
`;
  } else if (expr.type === 'datatype_declaration') {
    const def = expr.definition.map(x => {
      //TODO use type checked types when available
      const t = x.constructorTypes.map(y => y.toString());
      const types = t.length === 0 ? "" : `(${t.join(",")})`;
      return `${x.name} ${types}`;
    }).join(" | ")
    return `/*${expr.name} = ${def}*/`; //TODO
  } else {
    console.error("Unknown expr", expr);
    throw "Unknown exr";
  }
}

function toCaseThen(c, variable) {
  const thenExpression = generateExpression(c.then);

  if (c.condition.type === 'list_head_tail') {
    const x = c.condition;
    return `(() => {
      const ${x.head} = ${variable}[0];
      const ${x.tail} = ${variable}.slice(1);
      return () => ${thenExpression};
    })()`;
  } else {
    return `() => ${thenExpression}`;
  }
}

function toCaseCondition(c, variable) {
  const x = c.condition;
  if (x.type === 'match_case_any') return `true`;

  if (x.type === 'list_expression') {
    return `List_equals(${generateExpression(x)}, ${variable})`;
  }

  if (x.integer || x.string) {
    return `${generateExpression(x)} === ${variable}`;
  }

  if (x.type === 'list_head_tail') {
    return `${variable}.length >= 1`;
  }

  throw "Unknown pattern match condition: " + x.type;
}

// Hack: add list equals available in executing environment
window.List_equals = function(l1, l2) {
  if (l1.length !== l2.length) return false;
  for(let i = 0; i < l1.length; ++i) {
    if (l1[i] !== l2[i]) return false;
  }
  return true;
};