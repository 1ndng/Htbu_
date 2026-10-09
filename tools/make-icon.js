/* 產生 App 圖標：node tools/make-icon.js out.png，再縮成 512／192／180 */
const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--allow-file-access-from-files']});const p=await b.newPage({viewport:{width:1024,height:1024}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+__dirname+'/icon.html');await p.waitForFunction(()=>document.title==='done');
const d=await p.evaluate(()=>document.getElementById('c').toDataURL('image/png'));require('fs').writeFileSync(process.argv[2]||__dirname+'/icon-1024.png',Buffer.from(d.split(',')[1],'base64'));await b.close()})();
