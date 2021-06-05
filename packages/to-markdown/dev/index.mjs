import fs from 'fs';
import { customElementsManifestToMarkdown } from '../index.js';

const cem = JSON.parse(fs.readFileSync('./dev/custom-elements.json'));


const md = customElementsManifestToMarkdown(cem);
console.log(md);
fs.writeFileSync('./dev/custom-elements.md', md);