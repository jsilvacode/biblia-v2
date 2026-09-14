// Ensambla la vista de revisión en conversación; no modifica la app.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const destination=process.argv[2];
if(!destination)throw new Error('Indica la ruta absoluta del fragmento de salida.');
let css=await fs.readFile(path.join(here,'styles.css'),'utf8');
css=css.slice(0,css.indexOf('body{'))+css.slice(css.indexOf('#sb-mock'));
const urls=[...new Set([...css.matchAll(/url\('([^']+)'\)/g)].map(match=>match[1]))];
const variables=[];
for(const [index,url] of urls.entries()){
  const mime=url.endsWith('.woff2')?'font/woff2':'image/webp';
  const data=`url('data:${mime};base64,${(await fs.readFile(path.join(here,url))).toString('base64')}')`;
  if(mime==='font/woff2')css=css.replaceAll(`url('${url}')`,data);
  else{variables.push(`--sb-source-${index}:${data}`);css=css.replaceAll(`url('${url}')`,`var(--sb-source-${index})`);}
}
css+=`\n#sb-mock{${variables.join(';')}}\n`;
const content=await fs.readFile(path.join(here,'content.js'),'utf8');
let app=await fs.readFile(path.join(here,'app.js'),'utf8');
app=app.replace("theme: query.get('theme') || 'light'","theme: query.get('theme') || 'auto'").replace("options:['light','dark']","options:['auto','light','dark']");
const html=`<style>\n${css}</style>\n<div id="sb-mock" aria-label="Propuesta visual de Santa Biblia"></div>\n<script>\n${content}\n${app}\n</script>\n`;
if(Buffer.byteLength(html)>1_000_000)throw new Error(`Vista excede 1 MB: ${Buffer.byteLength(html)}`);
await fs.writeFile(destination,html);
console.log(`${destination}: ${Buffer.byteLength(html)} bytes`);
