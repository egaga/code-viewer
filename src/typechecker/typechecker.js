import {Environment} from './environment';
import {typeCheckFunction} from './typecheck-function';
import {typeCheckValueDeclaration} from './typecheck-value-declaration';
import {updateFinalTypes} from './inference/type-helper';

export function typeCheck(ast) {
  // TODO entä jos forward referencejä?
  // 1) laitetaanko type checkaus tilapäisesti talteen ja jatketaan myöhemmin
  // vai 2) tutkitaanko etukäteen riippuvuudet?
  // jälkimmäinen kuulostaa järkevältä

  console.time("Type check");
  const root = Environment.createRootEnvironment();

  const result = [];
  for (let i in ast) {
    const declaration = ast[i];
    const checked = typeCheckDeclaration(declaration, root);
    result.push(checked);
  }

  updateFinalTypes(root); //TODO fixme hack

  console.timeEnd("Type check");
  sml.print("Type check done");
  return result;
}

function typeCheckDeclaration(declaration, env) {
  const type = declaration.type;

  const childEnv = env.createChildEnvironment(declaration.name);

  if (type === 'function_declaration') {
    const fun = typeCheckFunction(declaration, childEnv);
    env.add(declaration.name, fun.TYPED);
    return fun;
  } else if (type === 'value_declaration') {
    const value = typeCheckValueDeclaration(declaration, childEnv);
    env.add(declaration.variable, value.TYPED);
    return value;
  } else if (type === 'datatype_declaration') {
    //TODO
    return declaration;
  } else {
    throw "Unknown type: " + type;
  }
}