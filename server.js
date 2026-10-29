import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const port = Number(process.env.PORT || 3000);
const type = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.ico':'image/x-icon'};
const seen = new Set();
const qs = Array.from({length:10},(_,i)=>`q${i+1}`);
const isImage = x => typeof x === 'string' && /^Supplement[A-E][1-5]$/.test(x);
const isCol = x => typeof x === 'string' && /^[A-E]$/.test(x);
function valid(d) {
 if(!d||typeof d!=='object'||typeof d.sessionId!=='string'||!/^[-\w]{12,80}$/.test(d.sessionId))return false;

 if(!Array.isArray(d.order)||d.order.length!==5||new Set(d.order).size!==5||!d.order.every(isCol))return false;
 if(!Array.isArray(d.matches)||d.matches.length!==4)return false;
 let champion=d.order[0];
 for(let i=0;i<4;i++){const m=d.matches[i];if(!m||m.round!==i+1||!isCol(m.winner)||!isCol(m.left)||!isCol(m.right)||!Number.isInteger(m.durationMs)||m.durationMs<0||m.durationMs>3600000||!Number.isInteger(m.uniqueSupplementsOpened)||m.uniqueSupplementsOpened<0||m.uniqueSupplementsOpened>10||!Number.isInteger(m.previewClicks)||m.previewClicks<0||m.previewClicks>500)return false;const contender=d.order[i+1];if(new Set([m.left,m.right]).size!==2||!([m.left,m.right].includes(champion)&&[m.left,m.right].includes(contender))||![m.left,m.right].includes(m.winner))return false;champion=m.winner;}
 if(d.winner!==champion)return false;
 if(!Array.isArray(d.ranked)||d.ranked.length!==5||new Set(d.ranked).size!==5||!d.ranked.every(isImage))return false;
 if(!d.answers||typeof d.answers!=='object'||!qs.every(k=>Number.isInteger(d.answers[k])&&d.answers[k]>=1&&d.answers[k]<=5))return false;
 if(!Array.isArray(d.events)||d.events.length>200||!d.events.every(e=>Number.isInteger(e.round)&&e.round>=1&&e.round<=4&&isCol(e.collection)&&isImage(e.imageId)&&e.imageId.startsWith('Supplement'+e.collection)&&Number.isInteger(e.atMs)&&e.atMs>=0&&e.atMs<=3600000))return false;
 if(!Number.isInteger(d.studyDurationMs)||d.studyDurationMs<0||d.studyDurationMs>14400000)return false;
 return true;
}
const send=(res,code,payload)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(payload));};
const server=http.createServer(async(req,res)=>{
 const pathname = new URL(req.url,'http://localhost').pathname;
 if(req.method==='GET'&&pathname==='/health')return send(res,200,{ok:true,homepageExists:fs.existsSync(path.join(root,'index.html')),sheetsConfigured:Boolean(process.env.SHEETS_WEBHOOK_URL&&process.env.SHEETS_SECRET)});
 if(req.method==='POST'&&pathname==='/api/submit'){
  if(!process.env.SHEETS_WEBHOOK_URL||!process.env.SHEETS_SECRET)return send(res,503,{error:'Google Sheets is not configured. Please contact the study organizer.'});
  let raw='';try{for await(const chunk of req){raw+=chunk;if(raw.length>24000)throw Error('Too large');}}catch{return send(res,413,{error:'Submission too large'});}
  let d;try{d=JSON.parse(raw);}catch{return send(res,400,{error:'Invalid JSON'});}
  if(!valid(d))return send(res,400,{error:'Incomplete or inconsistent responses. Please review your answers.'});
  
  try {
   const target=new URL(process.env.SHEETS_WEBHOOK_URL);
   if(target.protocol!=='https:')throw Error('Webhook must be HTTPS');
   const resp=await fetch(target,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({secret:process.env.SHEETS_SECRET,...d,receivedAt:new Date().toISOString()}),signal:AbortSignal.timeout(20000),redirect:'follow'});
   const text=await resp.text();let data;try{data=JSON.parse(text);}catch{throw Error('Invalid Google response');}
   if(!resp.ok||!data.ok)throw Error(data.error||`Sheets returned ${resp.status}`);
   seen.add(d.sessionId);return send(res,200,{ok:true,duplicate:Boolean(data.duplicate),participantId:data.participantId});
  }catch(err){console.error('Sheets submission failed',err.message);return send(res,502,{error:'Could not save to Google Sheets. Please try submitting again.'});}
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{error:'Method not allowed'});
 let filename=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
 if(filename.includes('..')||filename.startsWith('.'))return send(res,404,{error:'Not found'});
 const file=path.resolve(root,filename);if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html'))return send(res,404,{error:'Not found'});
 try {const stat=fs.statSync(file);if(!stat.isFile())throw Error('Not file');res.writeHead(200,{'Content-Type':type[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);}catch{send(res,404,{error:'Not found',file:filename});}
});
server.listen(port,'0.0.0.0',()=>console.log(`Groundskeeper study listening on port ${port}`));
