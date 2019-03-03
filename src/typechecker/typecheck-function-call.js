import {createUnknownType, bindUnknownType} from './inference/unknowntype';
import {unify} from './inference/unify';
import {typed} from './inference/type-helper';
import {typeToString} from './debug-string';
import {typeCheckExpression} from './typecheck-expression';
import {typesEqual} from '../utils/type-equality';

export function typeCheckFunctionCall(expr, env) {
  //TODO fixme
  // if argument is lambda, e.g. fn x => x*2
  // then it should be typed

  //TODO this is missing a lot
  // - recursiveness
  // - args affect the result type if parameteric polymorphism
  const call = expr.call;
  const args = expr.args;

  const signature = env.getTypeFor(call);

  const typecheckedArgs = args.map(x => typeCheckExpression(x, env));
  const argTypes = typecheckedArgs.map(x => x.TYPED);
  //signature might be UNKNOWN_TYPE so params does not exist => the whole signature should not be UNKNOWN
  // throw ASDFAS

  if (signature.type === 'UNKNOWN_TYPE') {
    const params = argTypes.map(
      argType => {
        const uk = createUnknownType();
        bindUnknownType(uk, argType);
        return uk;
      });
    const returnType = createUnknownType();
    bindUnknownType(signature, {
      type: 'fn',
      params: params,
      return_type: returnType
    }, env);
    return typed(expr, returnType);
  } else {
    const typeVariableMap = typeCheckFunctionCallArguments(argTypes, signature.params, env);
    const returnType = updateWithTypeVariables(typeVariableMap, signature.return_type);
    return Object.assign({}, expr, {
      args: typecheckedArgs,
      TYPED: returnType
    });
  }

}

function updateWithTypeVariables(typeVariableMap, type) {
  if (type.type === 'type_variable') {
    const existing = typeVariableMap[type.variable_name];
    //TODO FIXME should return type_variable with bound concrete type
    if (existing)
      return existing;
    else
      return type;
  } else if (type.type === 'list') {
    return Object.assign({}, type, {
      element_type: updateWithTypeVariables(typeVariableMap, type.element_type)
    })
  }

  return type;
}

function typeCheckFunctionCallArguments(args, params, env) {
  // check each argument/parameter pair and bound type variables to concete types
  // make sure that one type variable is not bound to different concrete types
  const typeVariableMap = {};

  if (args.length !== params.length) {
    sml.print("Different amount of types");
  } else {
    const result = [];
    for (let i in args) {
      const a = args[i];
      const p = params[i];
      //unify(a, p, env); TODO should we also unify
      matchFunctionCallArgumentWithParam(a, p, i, typeVariableMap, env);
    }
  }

  return typeVariableMap;
}

function bindTypeVariable(concreteType, typeVariable, typeVariableMap) {
  const existing = typeVariableMap[typeVariable.variable_name];
  //TODO bind to the argument (but return fresh)
  if (existing === undefined) {
    typeVariableMap[typeVariable.variable_name] = concreteType; // map type variable to specific type
  } else {
    if (!typesEqual(existing, concreteType)) {
      sml.print(`Cannot bind different concrete types "${typeToString(existing)}" and "${typeToString(concreteType)}" to same type variable`);
    } else {
      // same concrete type is bound to same type variable, which is fine
    }
  }
}

function matchFunctionCallArgumentWithParam(arg, param, index, typeVariableMap, env) {

  if (param.type === 'type_variable' && arg.type !== 'type_variable') {
    bindTypeVariable(arg, param, typeVariableMap);
    return;
  }

  if (arg.type === 'type_variable' && param.type !== 'type_variable') {
    sml.print("argument is type variable but parameter is specific type at index " + index);
    return;
  }

  if (arg.type === 'type_variable' && param.type === 'type_variable') {
    sml.print("Not supported type check: type_variable with another");
    return;
  }

  if (param.type === 'list' && arg.type === 'list') {
    matchFunctionCallArgumentWithParam(arg.element_type, param.element_type, index, typeVariableMap, env);
    return;
  }

  unify(arg, param, env);
}