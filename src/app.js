import {STAGES,STORAGE_KEY,MAX_ENTRIES,normalizeEntry,validDate,todayISO,dayDifference,isDue,metrics,upcoming,validateImport,makeBackup,makeCSV,makeCalendar,makeFollowup,sampleEntries,newEntryId} from './core.js';
const $=id=>document.getElementById(id);
const els={board:$('board'),dialog:$('entry-dialog'),form:$('entry-form'),notice:$('sample-notice'),toast:$('toast'),search:$('search'),filter:$('stage-filter'),stats:{total:$('stat-total'),active:$('stat-progress'),interviews:$('stat-interviews'),due:$('stat-due')}};
let entries=[],demo=false,view='board',dueOnly=false,deleteTarget=null,actionsTarget=null,toastTimer=null;
try {const raw=localStorage.getItem(STORAGE_KEY);if(raw){const parsed=JSON.parse(raw);entries=validateImport(parsed)}}catch{showToast('Unable to load saved data. Nothing was overwritten.');}
if(!entries.length && !localStorage.getItem(STORAGE_KEY)) {entries=sampleEntries(); demo=true;}
$('year').textContent=new Date().getFullYear();
function save(){
  try{localStorage.setItem(STORAGE_KEY,makeBackup(entries));return true;}
  catch{showToast('Could not save on this device. Export a backup before leaving.');return false;}
}
function showToast(message){const el=els.toast;el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3800)}
function showDemo(){
  if(entries.length&&!demo){if(!confirm('Replace your current workspace with sample opportunities? Download a JSON backup first if you want to keep your work.'))return;}
  entries=sampleEntries(); demo=true; try{localStorage.removeItem(STORAGE_KEY)}catch{} els.search.value=''; els.filter.value='all';dueOnly=false;render();$('workspace').scrollIntoView({behavior:'smooth'});showToast('Sample workspace opened. Clear it when you are ready.');
}
function clearDemo(){demo=false;entries=[];if(save()){render();showToast('You have a clean slate.')}else {render()}}
function beginEditing(entry){
  $('modal-title').textContent=entry?'Edit opportunity':'Add a new role';$('entry-id').value=entry?.id||'';
  for(const key of ['company','role','stage','nextDate','url','nextAction','notes']){
    const el=els.form.elements.namedItem(key);if(el)el.value=entry?.[key]||(key==='stage'?'saved':'');
  }
  $('modal-error').hidden=true;els.dialog.showModal();$('input-company').focus();
}
function download(name,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function btn(text,label,fn){const e=el('button','card-action-button',text);e.type='button';e.setAttribute('aria-label',label);e.addEventListener('click',fn);return e}
function formatted(date){if(!date||!validDate(date))return '';return new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric'});}
function card(e,i){
  const item=el('article','job-card');item.draggable=true;item.setAttribute('aria-label',`${e.role} at ${e.company}, ${e.stage}`);item.dataset.id=e.id;
  const top=el('div','card-top');const badge=el('div',`company-badge v${i%4}`,e.company.slice(0,1).toUpperCase());badge.setAttribute('aria-hidden','true');top.append(badge,el('span','company-name',e.company));item.append(top,el('div','card-role',e.role));
  if(e.nextAction)item.append(el('div','card-meta',e.nextAction));else item.append(el('div','card-meta','Next step not set'));
  if(e.nextDate){const tag=el('span',`card-due ${dayDifference(e.nextDate)<0?'overdue':''}`,`${dayDifference(e.nextDate)<0?'Due ':'On '}${formatted(e.nextDate)}`);item.append(tag)}
  const actions=el('div','card-actions');const select=el('select','card-stage-select');select.setAttribute('aria-label',`Stage for ${e.role} at ${e.company}`);
  for(const s of STAGES){const option=el('option','',s.label);option.value=s.id;option.selected=s.id===e.stage;select.append(option)}
  select.addEventListener('change',()=>{e.stage=select.value;if(!demo)save();render();showToast(demo?'Sample stage updated. Not saved.':'Stage updated.')});
  actions.append(select,btn('Edit',`Edit ${e.role}`,()=>beginEditing(e)),btn('⋯',`More actions for ${e.role}`,()=>showActions(e)));
  item.append(actions);item.addEventListener('dragstart',evt=>{evt.dataTransfer.setData('text/plain',e.id);evt.dataTransfer.effectAllowed='move'});return item;
}
function showActions(entry){actionsTarget=entry;$('actions-description').textContent=`${entry.role} at ${entry.company}`;$('open-posting').disabled=!entry.url;$('actions-dialog').showModal();}
$('close-actions').addEventListener('click',()=>$('actions-dialog').close());
$('copy-followup').addEventListener('click',()=>{if(!actionsTarget)return;const draft=makeFollowup(actionsTarget);$('actions-dialog').close();if(navigator.clipboard?.writeText){navigator.clipboard.writeText(draft).then(()=>showToast('Draft copied. Review before sending.')).catch(()=>{download('follow-up.txt',draft,'text/plain');showToast('Draft downloaded for your review.')})}else{download('follow-up.txt',draft,'text/plain');showToast('Draft downloaded for your review.')}});
$('open-posting').addEventListener('click',()=>{if(!actionsTarget?.url)return;window.open(actionsTarget.url,'_blank','noopener,noreferrer');$('actions-dialog').close()});
$('delete-entry').addEventListener('click',()=>{deleteTarget=actionsTarget;$('actions-dialog').close();$('confirm-dialog').showModal()});

function render(){
  const q=els.search.value.toLocaleLowerCase().trim(),filter=els.filter.value;
  const display=entries.filter(e=>(filter==='all'||e.stage===filter)&&(!q||[e.company,e.role,e.nextAction,e.notes].some(v=>v.toLocaleLowerCase().includes(q)))&&(!dueOnly||isDue(e)));
  const m=metrics(entries);els.stats.total.textContent=m.total;els.stats.active.textContent=m.active;els.stats.interviews.textContent=m.interviews;els.stats.due.textContent=m.due;
  $('side-total').textContent=m.total;$('side-due').textContent=m.due;
  $('board-heading').replaceChildren(document.createTextNode(dueOnly?'Due this week ':'The journey board '),el('span','board-total',String(display.length)));
  els.notice.hidden=!demo;els.board.replaceChildren();els.board.classList.toggle('list-layout',view==='list');
  for(const stage of STAGES){const column=el('section','board-column');column.setAttribute('aria-label',`${stage.label} opportunities`);
    const head=el('div','column-head');const circle=el('span',`stage-indicator stage-${stage.id}`);circle.setAttribute('aria-hidden','true');head.append(circle,el('span','',stage.label),el('span','col-count',String(display.filter(e=>e.stage===stage.id).length)));column.append(head);
    const content=el('div','column-content');const filtered=display.filter(e=>e.stage===stage.id);
    if(!filtered.length)content.append(el('div','col-empty','Drop opportunities here'));
    else filtered.forEach((entry,i)=>content.append(card(entry,i)));
    column.append(content);
    column.addEventListener('dragover',evt=>{evt.preventDefault();column.classList.add('drag-over')});
    column.addEventListener('dragleave',evt=>{if(!column.contains(evt.relatedTarget))column.classList.remove('drag-over')});
    column.addEventListener('drop',evt=>{evt.preventDefault();column.classList.remove('drag-over');const id=evt.dataTransfer.getData('text/plain');const moved=entries.find(x=>x.id===id);if(moved){moved.stage=stage.id;if(!demo)save();render();showToast(demo?'Sample moved. Not saved.':'Opportunity moved.')}});
    els.board.append(column);
  }
  $('empty-workspace').hidden=entries.length>0;
  const next=upcoming(entries);const list=$('upcoming-list');list.replaceChildren();
  if(!next.length)list.append(el('p','upcoming-empty','No dates scheduled yet. Add a follow-up date to see it here.'));
  for(const e of next){const row=el('div','upcoming-item');const badge=el('div','upcoming-date');const date=new Date(`${e.nextDate}T12:00:00`);badge.append(el('span','',date.toLocaleDateString(undefined,{month:'short'}).toUpperCase()),el('strong','',String(date.getDate())));
    const copy=el('div','upcoming-text');copy.append(el('strong','',e.nextAction||'Follow up'),el('small','',`${e.company} · ${e.role}`));row.append(badge,copy,btn('↗',`Edit follow-up for ${e.role}`,()=>beginEditing(e)));list.append(row);
  }
  $('nav-board').classList.toggle('active',!dueOnly);$('nav-due').classList.toggle('active',dueOnly);
}
$('new-entry').addEventListener('click',()=>beginEditing(null));$('empty-add').addEventListener('click',()=>beginEditing(null));$('close-modal').addEventListener('click',()=>els.dialog.close());$('cancel-modal').addEventListener('click',()=>els.dialog.close());
els.form.addEventListener('submit',evt=>{evt.preventDefault();const f=new FormData(els.form);const id=String(f.get('entryId')||'');const previous=entries.find(e=>e.id===id);const next={id:id||newEntryId(),company:f.get('company'),role:f.get('role'),stage:f.get('stage'),nextDate:f.get('nextDate'),url:f.get('url'),nextAction:f.get('nextAction'),notes:f.get('notes'),createdAt:previous?.createdAt||todayISO()};
  let normalized;try{normalized=normalizeEntry(next)}catch(err){$('modal-error').textContent=err.message;$('modal-error').hidden=false;return;}
  if(!previous&&entries.length>=MAX_ENTRIES){$('modal-error').textContent='This board has reached its 1,000 opportunity limit.';$('modal-error').hidden=false;return;}
  if(demo&&!previous){demo=false;entries=[];}
  if(previous){const i=entries.findIndex(e=>e.id===id);if(i!==-1)entries[i]=normalized;else entries.unshift(normalized)}else entries.unshift(normalized);
  if(!demo)save();els.dialog.close();render();showToast(demo?'Sample edited; not saved.':previous?'Opportunity updated.':'New opportunity added.');
});
$('cancel-delete').addEventListener('click',()=>$('confirm-dialog').close());$('confirm-delete').addEventListener('click',()=>{if(deleteTarget){entries=entries.filter(e=>e.id!==deleteTarget.id);if(!demo)save();render();showToast('Opportunity removed.');deleteTarget=null}$('confirm-dialog').close()});
$('show-demo').addEventListener('click',showDemo);$('empty-demo').addEventListener('click',showDemo);$('clear-sample').addEventListener('click',clearDemo);
$('search').addEventListener('input',render);$('stage-filter').addEventListener('change',render);
$('view-board').addEventListener('click',()=>setView('board'));$('view-list').addEventListener('click',()=>setView('list'));
function setView(v){view=v;$('view-board').classList.toggle('selected',v==='board');$('view-list').classList.toggle('selected',v==='list');$('view-board').setAttribute('aria-pressed',String(v==='board'));$('view-list').setAttribute('aria-pressed',String(v==='list'));render()}
$('nav-board').addEventListener('click',()=>{dueOnly=false;render()});$('nav-due').addEventListener('click',()=>{dueOnly=true;render();$('board-heading').scrollIntoView({block:'center',behavior:'smooth'})});
$('export-json').addEventListener('click',()=>download('applygrove-backup.json',makeBackup(entries),'application/json'));
$('export-csv').addEventListener('click',()=>download('applygrove-applications.csv',makeCSV(entries),'text/csv;charset=utf-8'));
$('export-calendar').addEventListener('click',()=>{const dated=entries.filter(e=>validDate(e.nextDate)&&!['closed','offer'].includes(e.stage));if(!dated.length){showToast('Add a follow-up date first.');return;}download('applygrove-reminders.ics',makeCalendar(entries),'text/calendar;charset=utf-8')});
$('import-json').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async evt=>{const file=evt.target.files?.[0];evt.target.value='';if(!file)return;
  if(file.size>2*1024*1024){showToast('Backup too large (2 MB maximum).');return}
  let imported;try{imported=validateImport(JSON.parse(await file.text()))}catch(err){showToast(err.message||'Invalid backup.');return}
  if(!confirm(`Replace this workspace with ${imported.length} opportunities from the backup?`))return;
  entries=imported;demo=false;save();els.search.value='';els.filter.value='all';dueOnly=false;render();showToast('Backup imported.');
});
if('serviceWorker'in navigator&&location.protocol==='https:'){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))}
render();
