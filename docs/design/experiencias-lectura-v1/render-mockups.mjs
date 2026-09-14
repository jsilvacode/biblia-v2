// Visual QA del prototipo; no prueba ni modifica la aplicación de producción.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({headless:true});
const pages=['home','picker','reader','rpsp','topics','topic','course','lesson','library','book'];
const report={checkedAt:new Date().toISOString(),engine:'Playwright Chromium (emulación)',layouts:[],errors:[],interactions:[]};
const page=await browser.newPage();
page.on('pageerror',error=>report.errors.push(error.message));
page.on('response',response=>{if(response.status()>=400)report.errors.push(`${response.status()} ${response.url()}`);});
try {
  for(const width of [320,390,768,1440])for(const theme of ['light','dark'])for(const screen of pages){
    await page.setViewportSize({width,height:width<600?844:1000});
    await page.goto(`http://127.0.0.1:4180/?capture=1&page=${screen}&theme=${theme}`);
    await page.evaluate(()=>document.fonts.ready);
    const metrics=await page.evaluate(()=>({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}));
    report.layouts.push({screen,theme,...metrics});
    if(metrics.scrollWidth>width+1)report.errors.push(`Overflow ${screen} ${width} ${theme}: ${metrics.scrollWidth}`);
    if(width===390||width===1440)await page.screenshot({path:path.join(here,'screenshots',`${screen}-${width===390?'mobile':'desktop'}-${theme}.jpg`),type:'jpeg',quality:82,fullPage:true});
    if(screen==='home'){
      const boxes=await page.locator('.sb-reading-actions .sb-button').evaluateAll(els=>els.map(el=>{const b=el.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height};}));
      if(Math.abs(boxes[0].width-boxes[1].width)>1||Math.abs(boxes[0].height-boxes[1].height)>1)report.errors.push(`Unequal home actions ${width} ${theme}`);
      if(width<900){const centers=await page.evaluate(()=>{const a=document.querySelector('.sb-reading-actions').getBoundingClientRect();const c=document.querySelector('.sb-reading-card').getBoundingClientRect();return[a.x+a.width/2,c.x+c.width/2];});if(Math.abs(centers[0]-centers[1])>1)report.errors.push(`Off-center actions ${width}`);}
    }
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4180/?capture=1&page=home&history=0');
  if(await page.locator('.sb-reading-actions .sb-button').count()!==1)report.errors.push('Empty history should have one action');
  await page.screenshot({path:path.join(here,'screenshots/home-mobile-no-history.jpg'),type:'jpeg',quality:82,fullPage:true});
  await page.locator('.sb-reading-actions a').click();
  await page.locator('#book-search').fill('Hechos');
  await page.locator('[data-action="book-44"]').click();
  await page.locator('[data-action="chapter-16"]').click();
  if(!await page.locator('.sb-reader-tools').textContent().then(s=>s.includes('Hechos')))report.errors.push('Picker did not open Acts');
  report.interactions.push('Home sin historial → buscar Hechos → capítulo 16 → lector');
  await page.goto('http://127.0.0.1:4180/?capture=1&page=topics');
  await page.locator('#topic-search').fill('miedo');
  if(!await page.locator('[data-topic="tengo-miedo"]').count())report.errors.push('Topic search missing known result');
  await page.locator('[data-topic="tengo-miedo"]').click();
  if(await page.locator('.sb-verses p').count()!==14)report.errors.push('Topic chapter incomplete');
  report.interactions.push('Buscar miedo → situación → Salmo 27 completo');
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('http://127.0.0.1:4180/?capture=1&page=picker');
  const yBefore=await page.locator('.sb-chapters-panel').boundingBox();
  await page.locator('.sb-books').evaluate(el=>el.scrollTop=el.scrollHeight);
  const yAfter=await page.locator('.sb-chapters-panel').boundingBox();
  if(yBefore.y!==yAfter.y)report.errors.push('Book scroll moved chapters');
  report.interactions.push('Scroll independiente de libros en escritorio');
  for(const audio of ['pending','error','playing']){
    await page.setViewportSize({width:390,height:844});
    await page.goto(`http://127.0.0.1:4180/?capture=1&page=rpsp&audio=${audio}`);
    if(await page.locator('.sb-verses p').count()!==22)report.errors.push(`Chapter missing in audio state ${audio}`);
    await page.screenshot({path:path.join(here,'screenshots',`rpsp-mobile-${audio}-demo.jpg`),type:'jpeg',quality:82,fullPage:true});
  }
  report.interactions.push('Texto visible en audio pendiente, error y reproducción simulada');
} finally {
  await browser.close();
  await fs.writeFile(path.join(here,'qa-report.json'),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({layouts:report.layouts.length,interactions:report.interactions,errors:report.errors},null,2));
if(report.errors.length)process.exitCode=1;
