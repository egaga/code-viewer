import {typesEqual} from '../../utils/type-equality';
import {typeToString} from '../debug-string';
import {unify} from './unify';

export function expectTypeMatch(type1, type2, message) {
  //TODO remove undefined handling
  if (type1 === undefined || type2 === undefined) {
    console.warn("Type is any implicitly"); //TODO fixme, no implicit any when type inference is in-place
    return;
  }

  if (!typesEqual(type1, type2)) {
    sml.print(`"${typeToString(type1)}"`, "!==", `"${typeToString(type2)}"`);
    sml.print(message || "Type mismatch");
  }
}

export function expectTypeMatchForAll(types, message) {
  if (types.length === 0) return;

  const firstType = types[0];
  const restOfTheTypes = types.slice(1);

  //TODO toimiiko tää? [x, 5, 10]
  restOfTheTypes.forEach(t => unify(t, firstType));

  for (let i in restOfTheTypes) {
    const currentType = restOfTheTypes[i];
    expectTypeMatch(firstType, currentType, message || "all branches must have the same type");
  }
}

