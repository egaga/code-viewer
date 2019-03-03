import React, {Component} from 'react';
import fetch from 'universal-fetch';
import styles from './style.css';

const debounce = require('throttle-debounce/debounce');

import {LevelViewer} from '../level-viewer/level-viewer';
import {scan} from '../compiler/lexer';
import {parse} from '../compiler/parser/parser';
import {typeCheck} from '../typechecker/typechecker';
import {generateJavascript} from '../compiler/code-generator';

const exampleFile = "/examples/datatype.sml";

window.sml = {
  //TODO html document should be ready
  print() {
    const output = document.getElementById("evaluation-output");
    console.debug.apply(this, arguments);
    const message = Array.join.call(null, arguments, " ");
    const previousContent = output.innerHTML;
    output.innerHTML = `<div>${message}</div>${previousContent}`;
  },
  resetConsole() {
    const output = document.getElementById("evaluation-output");
    output.innerHTML = '';
  }
};

function convertToViewModel(previous, paths) {
  if (typeof paths === "string") {
    return {
      fullpath: previous + '/' + paths,
      file: paths
    }
  } else if (Array.isArray(paths)) {
    const result = paths.map(path => (
      convertToViewModel(previous, path)
    ));
    return { path: result }
  } else {
    const arr = Object.keys(paths).map(key => [key, paths[key]]);
    const result = arr.map(path => ({
      path: path[0],
      paths: convertToViewModel(previous + "/" + path[0], path[1])
    }));
    return {
      directory: result
    }
  }
}

function updatepaths() {
  return fetch('http://127.0.0.1:8080').then(function (response) {
    return response.json();
  }).then(function (paths) {
    return convertToViewModel("", paths['.']);
  }).catch(function (e) {
    console.error(e)
  });
}

function getFileContent(path) {
  const url = 'http://127.0.0.1:8080' + path;
  return fetch(url).then(function(response) {
    return response.text();
  }).catch(function (e) {
    console.error(e)
  });
}

export class CodeViewer extends React.Component{

  constructor(props) {
    super(props);

    //this.fileContentChange = debounce(300, this.fileContentChange);
    this.myMagic = debounce(300, this.myMagic);

    this.state = {
      paths: {
        path: []
      },
      fileContent: "",
      javascript: ""
    };
  }

  componentDidMount() {
    const that = this;
    updatepaths().then(function(paths) {
      that.setState({paths: paths});
    });
    this.selectFile({fullpath: exampleFile});
  };

  selectFile(path) {
    const that = this;
    this.setState({ fileContent: "" })
    getFileContent(path.fullpath).then(function (content) {
      window.sml.resetConsole();
      that.fileContentChange(content);
    })
  }

  renderPaths(paths) {
    if (paths.file) {
      return <span className={styles.file}><a onClick={this.selectFile.bind(this, paths)}>{paths.file}</a></span>
    } else if (paths.path) {
      return paths.path.map((path, index) => (
        <div key={index} className={styles.path}>
          {this.renderPaths(path)}
        </div>
      ));
    } else {
      return paths.directory.map((path, index) => (
        <div key={index}>
          <span className={styles.directory}>{path.path}</span>
          <div>{this.renderPaths(path.paths)}</div>
        </div>
      ));
    }
  }

  renderFileContent() {
    return <code className={styles.fileContent}>{this.state.fileContent}</code>
  }

  renderGeneratedCode(javascript) {
    return <code className={styles.fileContent}>{javascript}</code>
  }

  doMagic(content) {
    const lexed = scan(content);
    console.log("lexed", lexed);

    console.time("parse ast");
    const ast = parse(lexed);
    console.timeEnd("parse ast");
    console.log("=== AST ===", ast);

    const typedAst = typeCheck(ast);
    console.log("typed ast", typedAst);
    const javascript = generateJavascript(typedAst);
    return {javascript};
  }

  doMagic2(content) { //this should be in different file and given as props
    let lexed;
    try {
      lexed = scan(content);
      console.log("lexed", lexed);
    } catch(e) {
      window.sml.print("Failed to scan tokens");
      window.sml.print(e);
      return {javascript: ""}
    }

    let ast;
    try {
      console.time("parse ast");
      ast = parse(lexed);
      console.timeEnd("parse ast");
    } catch (e) {
      window.sml.print("Failed to parse tokens to AST");
      window.sml.print(e);
      return {javascript: ""}
    }

    //lexed.filter(x => x.comment).forEach(x => console.log("x", x))

    console.log("=== AST ===", ast);

    try {
      const typedAst = typeCheck(ast);
      console.log("typed ast", typedAst);
    } catch(e) {
      sml.print("Failed to typecheck");
      sml.print(e);
    }

    try {
      sml.print("Skip generating javascript");
      //return;
      const javascript = generateJavascript(ast);
      return {javascript};
    } catch(e) {
      window.sml.print("Failed to generate javascript");
      window.sml.print(e);
      return {javascript: ""}
    }
  }

  myMagic(content) {
      let magic = this.doMagic(content);
      this.setState({javascript: magic.javascript});

      try {
        console.log("try evaluate")
        const evalled = eval(magic.javascript);
        console.log("eval completed");
      } catch (e) {
        console.error("Failed evaluation", e);
        window.sml.print("Failed evaluation", e);
      }
  }

  fileContentChange(value) {
    window.sml.resetConsole();
    this.setState({fileContent: value, javascript: ''})
    this.myMagic(value);
  }

  render() {
    return (
      <div>
        <div className={styles.codeViewer}>
          <div className={styles.files}>{this.renderPaths(this.state.paths)}</div>
          <div className={styles.fileContentWrapper}>
            <h3>SML</h3>
            <textarea className={styles.editCode}
                      value={this.state.fileContent}
                      onChange={e => this.fileContentChange(e.target.value)} />
          </div>
          <div className={styles.generatedCode}>
            <h3>Generated javascript</h3>
            {this.renderGeneratedCode(this.state.javascript)}
          </div>
          <div className={styles.console}>
            <h3>Console</h3>
            <div id="evaluation-output"></div>
          </div>
        </div>
      </div>
    );
  }
}