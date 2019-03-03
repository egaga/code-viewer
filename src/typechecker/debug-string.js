export function typeToString(type) {
  if (type.type === 'list') {
    return `${typeToString(type.element_type)} list`;
  } else if (type.type === 'type_variable') {
    return `${type.variable_name}`;
  } else if (type.type === 'UNKNOWN_TYPE') {
    return `${type.type}#${type.value}`;
  } else if (type.type === 'fn') {
    const fnParams = type.params.map(x => typeToString(x)).join(' -> ');
    return `(${fnParams} -> ${typeToString(type.return_type)})`;
  } else if (type.type === 'tuple') {
    const indexed = type.indexedTypes.map(x => typeToString(x));
    return `(${indexed})`;
  } else {
    return type;
  }
}
