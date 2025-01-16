#!/usr/bin/env node
import { greet } from './index';

const name = process.argv[2] || 'World';
console.log(greet(name));
