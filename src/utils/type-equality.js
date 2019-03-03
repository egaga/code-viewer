const UNKNOWN_TYPE = 'UNKNOWN_TYPE';

export function typesEqual(type1, type2) {
  if (type1 === undefined || type2 === undefined) {
    return type1 === type2;
  } else if (type1.type === 'list') {
    return type2.type === 'list' && typesEqual(type1.element_type, type2.element_type);
  } else if (type1.type === 'type_variable') {
    return type2.type === 'type_variable' && type1.variable_name === type2.variable_name;
  } else if (type1.type === 'fn') {
    if (type2.type !== 'fn') return false;
    if (!typesEqual(type1.return_type, type2.return_type))
      return false;

    if (type1.params.length !== type2.params.length)
      return false;
    for (let i = 0; i < type1.params.length; ++i) {
      if (!typesEqual(type1.params[i], type2.params[i]))
        return false;
    }
    return true;
  } else if (type1.type === UNKNOWN_TYPE) {
    return type2.type === UNKNOWN_TYPE && type1.value === type2.value;
  } else if (type1.type === 'explicitly_typed_expression' && type2.type === 'explicitly_typed_expression') {
    return type1.expression_type === type2.expression_type; //TODO probably works only for primitive types
  } else if (type1.type === 'tuple') {
    if (type2.type !== 'tuple') return false;
    if (type1.indexedTypes.length !== type2.indexedTypes.length)
      return false;
    for (let i = 0; i < type1.indexedTypes.length; ++i) {
      if (!typesEqual(type1.indexedTypes[i], type2.indexedTypes[i]))
        return false;
    }
    return true;
  } else {
    return type1 === type2;
  }
}