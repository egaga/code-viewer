//TODO add source line number and column to result

const reservedWords = {
  'val': 'value',
  'fun': 'function',
  'fn': 'lambda',
  '=': 'equal_sign',
  ',': 'separator',
  '^': 'string_concat',
  'int': 'primitive_type_integer',
  'string': 'primitive_type_string',
  'real': 'primitive_type_real',
  'bool': 'primitive_type_bool',
  'if': 'if',
  'then': 'then',
  'else': 'else',
  'false': 'bool_false',
  'true': 'bool_true',
  '_': 'underscore',
  'of': 'of',
  'case': 'case',
  '|': 'pattern_case',
  'let': 'let',
  'in': 'in',
  'end': 'end',
  'datatype': 'datatype',
  '!': 'type_separator' //TODO is actually * but currently only for binary operation
};

const expressionArrow = "=>";
const typeArrow = "->";

const specials = {
  'string': _special('"', '"'),
  'comment': _special('(*', '*)')
};

function _special(start, end) {
  return { start: start, end: end }
}

class Scanner {

  constructor(input) {
    this.input = input;
    this.currentToken = "";
    this.output = [];
    this.currentSpecial = null;
  }

  addToken(token, type) {
    const t = {};
    t[type] = token;
    this.output.push(t);
  }

  static isInteger(token) {
    return /^(~?)\d+$/.test(token) ? "integer" : false;
  }

  static matchInteger(token) {
    if (Scanner.isInteger(token)) {
      return {
        type: 'integer',
        token: token.replace("~", "-")
      };
    }
  }

  static matchReservedWords(token) {
    const r = reservedWords[token];
    if (!r) return undefined;

    return {
      type: r,
      token: token
    }
  }

  static enhanceToken(token) {
    return Scanner.matchInteger(token) ||
           Scanner.matchReservedWords(token) || 
           {type: "user_defined", token: token};
  }

  addCurrentToken() {
    if (this.currentToken) {
      const {token, type} = Scanner.enhanceToken(this.currentToken);
      this.addToken(token, type);
      this.currentToken = "";
    }
  }

  matchSpecialsStart() {
    for (let i in specials) {
      let special = specials[i];
      const start = special.start;

      if (this.nextCharsEqual(start)) {
        this.addCurrentToken();
        this.popChars(start.length);
        this.currentSpecial = i;
        return true;
      }
    }
  }

  matchSpecialsEnd() {
    if (!this.currentSpecial) return;

    let special = specials[this.currentSpecial];

    const end = special.end;
    if (this.nextCharsEqual(end)) {
      this.addToken(this.currentToken, this.currentSpecial);
      this.currentToken = "";
      this.popChars(end.length);
      this.currentSpecial = null;
      return true;
    }
  }

  popChars(amount) {
    this.input = this.input.slice(amount);
  }

  nextCharsEqual(str) {
    return str === this.input.slice(0, str.length);
  }

  peekChar() {
    return this.input.slice(0, 1)[0];
  }

  readChar() {
    const ch = this.input.charAt(0);
    this.input = this.input.slice(1);
    return ch;
  }

  readNext() {
    this.currentToken += this.readChar();
  }

  addNextChar(type) {
    this.addCurrentToken();
    const ch = this.readChar();
    this.addToken(ch, type);
  }

  readConsequentSpace() { // call only if the next char is ' '
    this.addCurrentToken();
    this.readChar();
    let ws = ' ';

    while (true) {
      const ch2 = this.peekChar();
      if (ch2 === ' ') {
        ws += ' ';
        this.readChar();
      } else {
        this.addToken(ws, "whitespace"); //TODO whitespace length instead of the whole string
        return;
      }
    }
  }

  matchDelimiter() {
    if (this.nextCharsEqual(expressionArrow)) {
      this.addCurrentToken();
      this.popChars(expressionArrow.length);
      this.addToken(expressionArrow, "expression_arrow");
      return true;
    }

    if (this.nextCharsEqual(typeArrow)) {
      this.addCurrentToken();
      this.popChars(typeArrow.length);
      this.addToken(typeArrow, "type_arrow");
      return true;
    }

    if (this.nextCharsEqual("::")) {
      this.addCurrentToken();
      this.popChars("::".length);
      this.addToken("::", "binary_operation");
      return true;
    }

    if (this.nextCharsEqual("@")) {
      this.addCurrentToken();
      this.popChars("@".length);
      this.addToken("@", "binary_operation");
      return true;
    }

    const ch = this.peekChar();

    //TODO fixme
    switch(ch) {
      case ' ':
        throw "Invalid character: non-breaking space";
      case ' ':
        this.readConsequentSpace();
        return true;
      case '\n':
      case '\t':
        this.addNextChar("whitespace");
        return true;
      case ',':
        this.addNextChar("separator");
        return true;
      case '[':
        this.addNextChar("list_start");
        return true;
      case ']':
        this.addNextChar("list_end");
        return true;
      case '>':
      case '<':
      case '*':
      case '/':
      case '+':
      case '-':
        this.addNextChar("binary_operation");
        return true;
      case '(':
      case ')':
        this.addNextChar('paren');
        return true;
      case ':':
        this.addNextChar('type_declaration'); //TODO better name: because could be list destructing
        return true;

      default: return false;
    }
  }

  scan() {
    while (this.input.length > 0) {
      if (this.currentSpecial) {
        this.matchSpecialsEnd() || this.readNext();
      } else {
        this.matchSpecialsStart() ||
        this.matchDelimiter() ||
        this.readNext();
      }
    }

    this.addCurrentToken();

    return this.output;
  }
}

export function scan(input) {
  var scanner = new Scanner(input);
  return scanner.scan();
}