import {createUnknownType} from './inference/unknowntype';
import {typeCheckExpression} from './typecheck-expression';
import {updateFinalType} from './inference/type-helper';

export function typeCheckFunction(declaration, env) {
  const name = declaration.name;
  const sig = declaration.function_signature;

  //TODO if return type is not given, it should be possible to infer it
  //TODO fixme ? should return type be different from unknown type, as it may not be handled similar to other unknown types
  const returnType = sig.return_type === undefined ? createUnknownType() : sig.return_type;
  const typedParams = typeFunctionParams(sig.params, declaration);

  const typedSignature = {
    return_type: returnType,
    params: typedParams.map(x => x.TYPED)
  };
  // TODO fixme: prematurely adds itself to environment so that recursive calls are possible
  if (declaration.name)
    env.add(declaration.name, typedSignature);
  else
    sml.print("Warning: declaration has no name. Is it lambda?");

  // Add param types to environment
  typedParams.forEach(param => env.add(param.name, param.TYPED));

  const typedExpression = typeCheckExpression(declaration.expression, env);

  const updatedTypedParams =
    typedParams.map(x => ({
      name: x.name,
      'TYPED': updateFinalType(env.getTypeFor(x.name), env)
    }));

  var updatedExpressionType = updateFinalType(typedExpression.TYPED, env);
  const updatedTypeSignature =
    Object.assign({}, {
      type: 'fn',
      params: updatedTypedParams.map(x => x.TYPED), // get updated types, is this sane?
      return_type: updatedExpressionType
    });

  //const updatedOriginalReturnType = updateFinalType(returnType, env);
  //TODO FIXME
  // expectTypeMatch(updatedExpressionType, updatedOriginalReturnType, "Function return type does not match its definition's type");

  return {
    type: 'function_declaration',
    name: declaration.name,
    params: updatedTypedParams,
    expression: typedExpression,
    TYPED: updatedTypeSignature
  };
}

function typeFunctionParams(params, declaration) {
  return params.map(p => {
    if (p.user_defined) {
      return {
        name: p.user_defined,
        TYPED: createUnknownType()
      };
    } else if (!p.param_name || !p.param_type) {
      console.warn("param name not known for declaration:", declaration.name);
      throw "Not good";
    } else {
      return {name: p.param_name, TYPED: p.param_type};
    }
  });
}

