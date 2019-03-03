import {createUnknownType} from './inference/unknowntype';

export class Environment {
  constructor(parent, name) {
    this.typeVariables = 0;
    this.env = {};
    this.parent = parent;
    this.name = name;
  }

  static createRootEnvironment() {
    return new Environment(null, null);
  }

  createChildEnvironment(childName) {
    return new Environment(this, childName);
  }

  add(name, type) {
    if (!name)
      throw "Name is required for type reference";

    if (!type)
      throw "Type is required for name: " + name;

    if (this.env[name])
      throw `Name ${name} already exists in type environment`;

    this.env[name] = type;
  }

  update(name, type) {
    if (!name)
      throw "Name is required for type reference";

    if (!type)
      throw "Type is required for name: " + name;

    if (!this.env[name])
      throw `Name ${name} does not exist in type environment`;

    this.env[name] = type;
  }

  getParentTypeFor(name) {
    return this.parent ? this.parent.getTypeFor(name) : undefined;
  }

  getTypeFor(name) {
    // parent might have be a top level value declaration for 'name'
    const type = this.env[name] || this.getParentTypeFor(name);
    if (!type) {
      sml.print("Reference unknown: " + name);
      const newType = createUnknownType();
      this.env[name] = newType;
      return newType;
    }
    return type;
  }

  getFreshTypeVariableName() {
    //TODO FIXME should check that explicit type is not already defined
    const charCodeFor_a = 97;
    const charCodeForTypeVariable = charCodeFor_a + this.typeVariables;
    const freshVariable = String.fromCharCode(charCodeForTypeVariable);
    this.typeVariables++;
    return freshVariable;
  }

  createFreshTypeVariable() {
    return {
      type: 'type_variable',
      variable_name: this.getFreshTypeVariableName()
    }
  }
}