import {until} from './until';

export class ExpressionMatcher {
  constructor(ex) {
    this.input = ex.slice();
    this.parsed = {};
    this.errors = [];
  }

  next() {
    return this.input.splice(0, 1)[0];
  }

  skipTokens(n) {
    this.input.splice(0, n);
  }

  readWithFunction(fun, field) {
    const result = fun(this.input);
    if (result) {
      this.input = [];

      if (field) {
        this.parsed[field] = result;
      }

      return true;
    } else {
      this.errors.push("Expectation not met for " + field);
      return undefined;
    }
  }

  expectToken(token, word) {
    const x = this.next();
    if (x === undefined || x[token] !== word) {
      this.errors.push("Expectation not met, should have been token '" + token + "' with value '" + word + "'");
      return undefined;
    } else {
      return true;
    }
  }

  read(token, field) {
    const x = this.next();

    if (x === undefined) {
      this.errors.push("Expectation not met for " + token);
      return undefined;
    }

    const result = x[token];
    if (result === undefined) {
      this.errors.push("Expectation not met for " + token);
      return undefined;
    } else {
      if (field) {
        this.parsed[field] = result;
      }

      return true;
    }
  }

  readUntil(findable, matchContent, field) {
    const found = until(findable, this.input);

    if (found) {
      const [params, equalSign, rest] = found;
      const matchedContent = matchContent(params);
      if (matchedContent) {
        this.parsed[field] = matchedContent;
        this.skipTokens(params.length + 1 /* findable token */);
      } else {
        this.errors.push("Could not match content for " + field)
        return undefined;
      }
      return true;
    } else {
      this.errors.push("Could not find " + findable + " for " + field)
      return undefined;
    }
  }

  build(type) {
    if (this.input.length > 0) {
      //window.sml.print("Not all input consumed");
      return undefined;
    } else if (this.errors.length === 0) {
      this.parsed["type"] = type;
      return this.parsed;
    } else {
      this.errors.forEach(x => window.sml.print(x));
      window.sml.print("Errors prevented compilation");
      return undefined;
    }
  }
}