import * as _ from 'lodash';
import { controlFlow } from './lib/control'

function component() {
  const element = document.createElement('div');
  const btn = document.createElement('button');

  // Lodash, now imported by this script
  element.innerHTML = _.join(['Hello', 'webpack'], ' ');

  btn.innerHTML = 'Ploy';
  btn.addEventListener('click', controlFlow)
  element.appendChild(btn);
  
  return element;
}

document.body.appendChild(component());