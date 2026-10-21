export const STAGES = Object.freeze([
  {id:'saved',label:'Saved'}, {id:'applied',label:'Applied'},
  {id:'interview',label:'Interview'}, {id:'offer',label:'Offer'}, {id:'closed',label:'Closed'}
]);
export const MAX_ENTRIES = 1000;
export const STORAGE_KEY = 'applygrove.entries.v1';
const MAX_LENGTH = Object.freeze({id:90,company:90,role:110,stage:16,nextDate:10,url:1000,nextAction:180,notes:4000});

export function text(value, max=1000) {
  return (typeof value==='string'?value:'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').trim().slice(0,max);
}
export function validDate(value) {
  if(typeof value!=='string'||!/^(\d{4})-(\d{2})-(\d{2})$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(+date) && date.toISOString().slice(0,10)===value;
}
export function safeUrl(value) {
  const raw=text(value,MAX_LENGTH.url);
  if(!raw) return '';
  try{ const parsed=new URL(raw); return ['https:','http:'].includes(parsed.protocol)&& !parsed.username && !parsed.password && parsed.hostname ? parsed.href : ''; }
  catch{return '';}
}
export function normalizeEntry(raw, {fallbackId}={}) {
  if(!raw || typeof raw!=='object'||Array.isArray(raw)) throw new TypeError('Invalid opportunity.');
  const company=text(raw.company,MAX_LENGTH.company),role=text(raw.role,MAX_LENGTH.role);
  if(!company||!role) throw new TypeError('Every opportunity requires a company and a role.');
  const stage=text(raw.stage,MAX_LENGTH.stage);
  const date=text(raw.nextDate,MAX_LENGTH.nextDate);
  if(date&&!validDate(date)) throw new TypeError('Invalid calendar date.');
  if(raw.url && !safeUrl(raw.url)) throw new TypeError('Job links must begin with http:// or https:// and cannot contain embedded credentials.');
  const id=text(raw.id,MAX_LENGTH.id)||fallbackId;
  if(!id|| !/^[a-zA-Z0-9_-]{1,90}$/.test(id)) throw new TypeError('Invalid opportunity ID.');
  return {id,company,role,stage:STAGES.some(x=>x.id===stage)?stage:'saved',nextDate:date,url:safeUrl(raw.url),nextAction:text(raw.nextAction,MAX_LENGTH.nextAction),notes:text(raw.notes,MAX_LENGTH.notes),createdAt: validDate(raw.createdAt)?raw.createdAt:todayISO()};
}
export function todayISO(reference=new Date()) {
  const y=reference.getFullYear(), m=String(reference.getMonth()+1).padStart(2,'0'),d=String(reference.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
export function dayDifference(date, reference=todayISO()){
  if(!validDate(date)||!validDate(reference)) return Infinity;
  return Math.round((Date.parse(`${date}T00:00:00Z`)-Date.parse(`${reference}T00:00:00Z`))/86400000);
}
export function isDue(entry,reference=todayISO()) {
  return entry.nextDate && !['closed','offer'].includes(entry.stage) && dayDifference(entry.nextDate,reference)<=7;
}
export function metrics(entries,reference=todayISO()) {
  return {total:entries.length,active:entries.filter(e=>['applied','interview'].includes(e.stage)).length,interviews:entries.filter(e=>e.stage==='interview').length,due:entries.filter(e=>isDue(e,reference)).length};
}
export function upcoming(entries,reference=todayISO(),limit=4){
  return entries.filter(e=>e.nextDate&& !['closed','offer'].includes(e.stage)).sort((a,b)=>a.nextDate.localeCompare(b.nextDate)).slice(0,limit);
}
export function validateImport(value) {
  if(!value||typeof value!=='object'||value.format!=='applygrove-v1'||!Array.isArray(value.entries)) throw new TypeError('Not an Applygrove backup file.');
  if(value.entries.length>MAX_ENTRIES) throw new TypeError('This backup contains too many opportunities.');
  const entries=value.entries.map(e=>normalizeEntry(e));
  const ids=new Set(entries.map(e=>e.id));
  if(ids.size!==entries.length) throw new TypeError('This backup contains duplicate IDs.');
  return entries;
}
export function makeBackup(entries){return JSON.stringify({format:'applygrove-v1',exportedAt:new Date().toISOString(),entries},null,2);}
function csvCell(value) {
  let v=String(value??'').replace(/\u0000/g,'');
  if(/^[\s\uFEFF]*[=+@\-\t\r]/.test(v)) v="'"+v;
  return '"'+v.replace(/"/g,'""')+'"';
}
export function makeCSV(entries){
  const headers=['Company','Role','Stage','Follow-up date','Next step','Job URL','Notes','Created'];
  const lines=[headers.map(csvCell).join(',')];
  for(const e of entries)lines.push([e.company,e.role,e.stage,e.nextDate,e.nextAction,e.url,e.notes,e.createdAt].map(csvCell).join(','));
  return '\ufeff'+lines.join('\r\n')+'\r\n';
}
function escapeICal(s){return String(s||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');}
function icalDate(s){return s.replaceAll('-','');}
function addOneDay(s){const d=new Date(`${s}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);}
function foldICal(value){
  // Limit physical lines to 75 UTF-8 octets, as required by RFC 5545.
  const chars=Array.from(value);let current='',octets=0,out='';
  for(const c of chars){const n=new TextEncoder().encode(c).length;if(octets+n>75){out+=current+'\r\n ';current='';octets=1;}current+=c;octets+=n;}
  return out+current;
}
export function makeCalendar(entries,stamp=new Date()){
  const dtstamp=stamp.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Applygrove//Local Career Board//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
  for(const e of entries.filter(e=>validDate(e.nextDate)&&!['closed','offer'].includes(e.stage))){
    lines.push('BEGIN:VEVENT',`UID:${e.id}.applygrove.local`,`DTSTAMP:${dtstamp}`,`DTSTART;VALUE=DATE:${icalDate(e.nextDate)}`,`DTEND;VALUE=DATE:${icalDate(addOneDay(e.nextDate))}`,`SUMMARY:${escapeICal(e.nextAction||'Follow up')} — ${escapeICal(e.company)}`,`DESCRIPTION:${escapeICal(`${e.role} at ${e.company}${e.url?'\n'+e.url:''}`)}`,'END:VEVENT');
  }
  lines.push('END:VCALENDAR');return lines.map(foldICal).join('\r\n')+'\r\n';
}
export function makeFollowup(e){return `Subject: Checking in — ${e.role} at ${e.company}\n\nHello,\n\nI hope you're doing well. I'm following up about the ${e.role} opportunity at ${e.company}. I'm still interested and would appreciate any updates you can share on the next steps.\n\nThank you for your time.\n\nBest regards,\n[Your name]\n`}
export const SAMPLE_ENTRIES=Object.freeze([
  {id:'sample-north',company:'Northwind Studio',role:'Product Designer',stage:'interview',nextDate:'',nextAction:'Prepare for the design conversation',url:'',notes:'Bring two portfolio case studies.',createdAt:'2026-10-15'},
  {id:'sample-pine',company:'Pine & Co.',role:'Frontend Engineer',stage:'applied',nextDate:'',nextAction:'Check for an update',url:'',notes:'',createdAt:'2026-10-14'},
  {id:'sample-mono',company:'Mono Collective',role:'Brand Designer',stage:'saved',nextDate:'',nextAction:'Tailor portfolio and apply',url:'',notes:'',createdAt:'2026-10-12'},
  {id:'sample-acre',company:'Acres Creative',role:'UX Researcher',stage:'offer',nextDate:'',nextAction:'Review offer details',url:'',notes:'',createdAt:'2026-10-13'}
]);

export function sampleEntries(reference=new Date()){
  const dates=[3,6,12];
  const d=offset=>{const x=new Date(reference.getFullYear(),reference.getMonth(),reference.getDate()+offset);return todayISO(x)};
  return SAMPLE_ENTRIES.map((entry,index)=>({...entry,nextDate:index===0?d(dates[0]):index===1?d(dates[1]):index===2?d(dates[2]):''}));
}
export function newEntryId() {
  const bytes=new Uint8Array(16);
  if(!globalThis.crypto?.getRandomValues)throw new Error('Secure random number generation is not available in this browser.');
  globalThis.crypto.getRandomValues(bytes);
  return 'a_'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
