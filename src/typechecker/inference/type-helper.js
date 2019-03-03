import {typeToString} from '../debug-string';
import {typesEqual} from '../../utils/type-equality';
import {getTypeVariableForUnknownType} from './unknowntype';

const updateTypesHack = [];

export function updateFinalType(type, env) {
  if (type.type === 'UNKNOWN_TYPE') {
    const updatedType = getTypeVariableForUnknownType(type, env);
    if (updatedType.type === 'UNKNOWN_TYPE' && updatedType.value === type.value) throw "Invalid program behaviour";
    return updateFinalType(updatedType, env); //the type can be structural with other UNKNOWN_TYPES
  } else if (type.type === 'fn') {
    return {
      type: 'fn',
      params: type.params.map(x => updateFinalType(x, env)),
      return_type: updateFinalType(type.return_type, env)
    }
  } else if (type.type === 'list') {
    return {
      type: 'list',
      element_type: updateFinalType(type.element_type, env)
    }
  } else if (type.type === 'tuple') {
    return {
      type: 'tuple',
      indexedTypes: type.indexedTypes.map(x => updateFinalType(x, env))
    }
  }

  return type;
}

export function typed(node, type) {
  const result = Object.assign({}, node, {
    TYPED: type
  });

  updateTypesHack.push(result);

  return result;
}

export function updateFinalTypes(environment) {
  //TODO FIXME
  updateTypesHack.forEach((obj) => {
    var updated = updateFinalType(obj.TYPED, environment);
    if (!typesEqual(obj.TYPED, updated)) {
      sml.print(`Updated "${typeToString(obj.TYPED)}" to "${typeToString(updated)}"`);
      obj.TYPED = updated;
    }
  });
}