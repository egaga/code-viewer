# FIXME
- jos environmenttiin jää muuttuja jolla on UNKNOWN senkin jälkeen kun update final type on ajettu, niin
  sitten sellaista referenssiä ei ole koskaan saatavilla: käännösvirhe (ks. getTypeFor joka luo unboundvariablen jos ei löydy olemassa olevaa)

- eksplisiitistä paluuarvoa ei tällä hetkellä tarkasteta: 
  fun hello (x: int): string = x
- type inference: parent and child env can have currently same named type variable but not the same type

- lexed tokens should be all of format { type:, value: }, not e.g. { integer: 5 }
- code generator should ensure that the variables don't conflict with helper variables that generation makes itself

# Lexer
- add source information to tokens
 
# Parser
- environment, lexical scopes
- compile errors

# Viewer
- show AST
- show type under cursor

# Code generation
- virtual machine byte code (need to think about variable scopes)
- tail recursion elimination?
- typescript instead of javascript?

# SML
Support possibly:
- raise (exception)
- dataflow analysis (does sml have null type?)
- datatypes
- records
- modules
- reals
- mutable primitives: ref and array