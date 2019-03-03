import {typesEqual} from '../../utils/type-equality';
import {typeToString} from '../debug-string';

let uknowntypes = 0;
const unknownTypeToTypeVariableMap = {};

export function bindUnknownType(unknownType, newType) {
  if (unknownType.type !== 'UNKNOWN_TYPE') throw "Not unknown type";

  const existing = unknownTypeToTypeVariableMap[unknownType.value];
  if (existing === undefined) {
    unknownTypeToTypeVariableMap[unknownType.value] = newType;
  } else if (!typesEqual(existing, newType)) {
    if (existing.type === 'UNKNOWN_TYPE' && newType.type === 'UNKNOWN_TYPE') {
      //What todo
      // check if existing type is bound to something, and if so, find if finally reaches a concrete type
      // UNKOWNN_TYPE -> UNKOWNN_TYPE -> concrete type
      // and bind the newType to that
      sml.print(`Cannot bind different concrete types "${typeToString(existing)}" and "${typeToString(newType)}" to same UNKNOWN`);
    } else if (existing.type !== 'UNKNOWN_TYPE' && newType.type === 'UNKNOWN_TYPE') {
      bindUnknownType(newType, existing); // bind new unknown type to the same concrete type as the existing
    } else if (existing.type !== 'UNKNOWN_TYPE' && newType.type !== 'UNKNOWN_TYPE') {
      sml.print(`Cannot bind different concrete types "${typeToString(existing)}" and "${typeToString(newType)}" to same UNKNOWN`);
      //unknownTypeToTypeVariableMap[unknownType.value] = newType; //TODO remove
    } else {
      throw "Should not reach this else branch"
    }
  }
}

export function getTypeVariableForUnknownType(type, env) {
  const existing = unknownTypeToTypeVariableMap[type.value];
  if (existing) return existing;

  const freshTypeVariable = env.createFreshTypeVariable();
  unknownTypeToTypeVariableMap[type.value] = freshTypeVariable;
  return freshTypeVariable;
}

export function createUnknownType() {
  return {
    type: 'UNKNOWN_TYPE',
    value: uknowntypes++
  }
}