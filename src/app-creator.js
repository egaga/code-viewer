"use strict";

import * as React from 'react';
import es6Promise from 'es6-promise';
es6Promise.polyfill();

import {CodeViewer} from './code-viewer/code-viewer';
import StyleContextProvider from './utils/style-context-provider';

// Get all style content so that the isomorphic style provider can put them into React context
const getStyles = modules => modules.keys().map(mod => require(mod));
const styles = getStyles(require.context('./', true, /\.css$/));

/*
 * Create application root element with given style context
 * @context may define a callback function to get used React styles
 */
export const appCreator = context => mainAuthor => (
  <StyleContextProvider context={context} styles={styles}>
    <CodeViewer />
  </StyleContextProvider>
);