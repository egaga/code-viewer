import React, {Component} from 'react';
import styles from './style.css';

function row() {
  return Array.from(arguments);
}

const token = {
  plus: '+',
  minus: '-',
  empty: ' ',
  map: 'map'
};

const level = [
  row(5, 3, token.plus, token.minus, "value"),
  row(10, token.map, 2, 15, token.empty),
  row(3, "muuta", 3, 5, 1),
  row("kello", "rauha", token.plus, "hei", 3),
  row(1, "kaksi", 3, "neljä", 5)
];

//console.log(level);

export const LevelViewer = ({}) => {
  return <div className={styles.level}>{level.map((row, index) => <div key={index} className={level.row}>{renderRow(row)}</div>)}</div>
}

function renderRow(row) {
  return row.map((x, index) => <div key={index} className={styles.tile}>{x}</div>);
}