const KEY='cnhsSubstitutionRecordsV1';
const $=id=>document.getElementById(id);
let records=[];
try{records=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){records=[]}
const today=new Date(); const localDate=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
$('planDate').value=localDate;$('filterDate').value=localDate;
function save(){localStorage.setItem(KEY,JSON.stringify(records));render()}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function filtered(){return records.filter(r=>r.date===$('filterDate').value).sort((a,b)=>a.period.localeCompare(b.period))}
function render(){
 const list=filtered();$('totalCount').textContent=records.length;$('todayCount').textContent=list.length;$('assignmentCount').textContent=records.length;
 $('printDate').textContent=$('filterDate').value?`Date: ${new Date($('filterDate').value+'T12:00:00').toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})}`:'All dates';
 $('recordsBody').innerHTML=list.length?list.map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(r.absent)}</td><td>${escapeHtml(r.sub)}</td><td>${escapeHtml(r.grade)}</td><td>${escapeHtml(r.subject)}</td><td>${escapeHtml(r.period)}</td><td>${escapeHtml(r.room)}</td><td>${escapeHtml(r.remarks)}</td><td class="no-print"><button class="delete-btn" data-delete="${r.id}">Delete</button></td></tr>`).join(''):'<tr><td colspan="9" class="empty">No records for this date.</td></tr>';
}
$('entryForm').addEventListener('submit',e=>{e.preventDefault();records.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),date:$('planDate').value,absent:$('absentTeacher').value.trim(),sub:$('subTeacher').value.trim(),grade:$('gradeSection').value.trim(),subject:$('subject').value.trim(),period:$('period').value.trim(),room:$('room').value.trim(),remarks:$('remarks').value.trim()});$('filterDate').value=$('planDate').value;save();$('entryForm').reset();$('planDate').value=localDate;window.location.hash='plans'});
$('recordsBody').addEventListener('click',e=>{const id=e.target.dataset.delete;if(id&&confirm('Delete this substitution assignment?')){records=records.filter(r=>r.id!==id);save()}});
$('filterDate').addEventListener('change',render);$('printBtn').addEventListener('click',()=>window.print());$('printTop').addEventListener('click',()=>window.print());
function csvEscape(v){return '"'+String(v??'').replace(/"/g,'""')+'"'}
function downloadCsv(rows,name){const csv='\ufeff'+rows.map(row=>row.map(csvEscape).join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
$('exportBtn').addEventListener('click',()=>{const rows=[['Plan date','Absent teacher','Substitute teacher','Grade / section','Subject','Time / period','Room','Reason / remarks'],...filtered().map(r=>[r.date,r.absent,r.sub,r.grade,r.subject,r.period,r.room,r.remarks])];downloadCsv(rows,`CNHS-substitution-plan-${$('filterDate').value||'all-dates'}.csv`)});
$('downloadTemplate').addEventListener('click',()=>downloadCsv([['Plan date','Absent teacher','Substitute teacher','Grade / section','Subject','Time / period','Room','Reason / remarks'],['2026-10-21','Teacher name','Substitute name','Grade 7 - Section','Subject','8:00–8:50 AM','Room 1','']], 'CNHS-substitution-data-template.csv'));
const savedUrl=localStorage.getItem('cnhsFormsUrl')||'';$('formUrl').value=savedUrl;function setFormLink(url){const a=$('openForm');if(/^https:\/\/(forms\.office\.com|forms\.cloud\.microsoft|forms\.microsoft\.com)\//i.test(url)){a.href=url;a.style.pointerEvents='auto';a.style.opacity='1'}else{a.href='#';a.style.pointerEvents='none';a.style.opacity='.5'}}
setFormLink(savedUrl);$('saveFormUrl').addEventListener('click',()=>{const url=$('formUrl').value.trim();if(url&&!/^https:\/\/(forms\.office\.com|forms\.cloud\.microsoft|forms\.microsoft\.com)\//i.test(url)){alert('Please enter a valid Microsoft Forms HTTPS link.');return}localStorage.setItem('cnhsFormsUrl',url);setFormLink(url);alert(url?'Microsoft Forms link saved in this browser.':'Form link cleared.')});
render();
