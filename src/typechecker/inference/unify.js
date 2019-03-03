import {bindUnknownType} from './unknowntype';
import {expectTypeMatch} from './typematch';

export const UNKNOWN_TYPE = 'UNKNOWN_TYPE';

export function unify(arg, param, env) {

  if (param.type === UNKNOWN_TYPE && arg.type !== UNKNOWN_TYPE) {
    bindUnknownType(param, arg);
    return;
  }

  if (arg.type === UNKNOWN_TYPE && param.type !== UNKNOWN_TYPE) {
    bindUnknownType(arg, param);
    return;
  }

  if (arg.type === UNKNOWN_TYPE && param.type === UNKNOWN_TYPE) {
    // Bind always the other unknown type to the other, not sure if important
    if (arg.value < param.value)
      bindUnknownType(arg, param);
    else
      bindUnknownType(param, arg);
    return;
  }

  if (param.type === 'fn' && arg.type === 'fn') {
    //TODO FIXME unify params array
    unify(param.return_type, arg.return_type);
    return;
  }

  if (param.type === 'list' && arg.type === 'list') {
    unify(arg.element_type, param.element_type, env);
    return;
  }

  if (param.type === 'tuple' && arg.type === 'tuple') {
    if (param.indexedTypes.length !== arg.indexedTypes.length) {
      sml.print("Not matching amount of tuple cardinality: " + param.indexedTypes.length + " !== " + arg.indexedTypes.length);
      return;
    }

    for (let i = 0; i < param.indexedTypes.length; ++i) {
      unify(param.indexedTypes[i], arg.indexedTypes[i]);
    }

    return;
  }

  expectTypeMatch(arg, param, "Type mismatch at unify");
}

