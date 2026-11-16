(() => {
  const $ = id => document.getElementById(id);
  const form = $("assignmentForm");
  const today = new Date();
  const isoToday = new Date(today.getTime() - today.getTimezoneOffset()*60000).toISOString().slice(0,10);
  $("assignmentDate").value = isoToday;
  $("availabilityDate").value = isoToday;
  let teachers = [], assignments = [], schedules = [];
  const demo = !window.CNHS_CONFIG?.SCRIPT_URL;
  const endpoint = window.CNHS_CONFIG?.SCRIPT_URL || "";
  const localKey = "cnhs-substitution-demo-v2";
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const dayForDate = date => date ? new Date(date+"T12:00:00").toLocaleDateString("en-US",{weekday:"long"}) : "";
  const norm = s => String(s||"").toLowerCase().replace(/[–—]/g,"-").replace(/\s+/g," ").trim();

  const jsonp = params => new Promise((resolve,reject) => {
    const callback = "cnhs_cb_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    const timer = setTimeout(() => { cleanup(); reject(new Error("Request timed out")); },15000);
    function cleanup(){clearTimeout(timer);delete window[callback];script.remove();}
    window[callback] = data => {cleanup();resolve(data);};
    script.onerror = () => {cleanup();reject(new Error("Could not reach Google Sheet. Check the Web App URL and deployment access."));};
    script.src = endpoint + "?" + new URLSearchParams({...params,callback}).toString();
    document.body.appendChild(script);
  });
  async function api(action,payload={}) {
    if (demo) return demoApi(action,payload);
    if (action === "bootstrap") return jsonp({action});
    await fetch(endpoint,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,...payload})});
    await new Promise(r=>setTimeout(r,900)); return {ok:true};
  }
  function demoApi(action,payload){
    const db=JSON.parse(localStorage.getItem(localKey)||'{"teachers":[],"assignments":[],"schedules":[]}');
    db.schedules ||= [];
    if(action==="bootstrap") return Promise.resolve(db);
    if(action==="addTeacher") db.teachers.push({id:crypto.randomUUID(),name:payload.name,department:payload.department});
    if(action==="deleteTeacher") {db.teachers=db.teachers.filter(t=>t.id!==payload.id);db.schedules=db.schedules.filter(s=>s.teacherId!==payload.id);}
    if(action==="addAssignment") db.assignments.unshift({...payload,id:crypto.randomUUID(),createdAt:new Date().toISOString()});
    if(action==="deleteAssignment") db.assignments=db.assignments.filter(a=>a.id!==payload.id);
    if(action==="addSchedule") db.schedules.push({...payload,id:crypto.randomUUID(),createdAt:new Date().toISOString()});
    if(action==="deleteSchedule") db.schedules=db.schedules.filter(s=>s.id!==payload.id);
    localStorage.setItem(localKey,JSON.stringify(db)); return Promise.resolve({ok:true});
  }
  function setConnection(online,message){const el=$("connectionStatus");el.textContent=message;el.className="status-pill "+(online?"online":"offline");}
  async function load(){
    try{const data=await api("bootstrap");teachers=data.teachers||[];assignments=data.assignments||[];schedules=data.schedules||[];setConnection(true,demo?"Demo mode":"Google Sheet connected");render();}
    catch(err){setConnection(false,"Connection error");$("formMessage").textContent=err.message;}
  }
  function renderTeacherOptions(){
    const opts=teachers.map(t=>`<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)}</option>`).join("");
    ["absentTeacher","substituteTeacher","scheduleTeacher"].forEach(id=>$(id).innerHTML='<option value="">Select teacher</option>'+opts);
    $("teacherDirectory").innerHTML=teachers.length?teachers.map(t=>`<span class="teacher-chip">${escapeHtml(t.name)}${t.department?" · "+escapeHtml(t.department):""}<button type="button" data-delete-teacher="${escapeHtml(t.id)}" aria-label="Remove ${escapeHtml(t.name)}">×</button></span>`).join(""):'<span class="muted">No teachers added yet.</span>';
    const periods=[...new Set(schedules.map(s=>s.period).filter(Boolean))].sort();
    $("periodOptions").innerHTML=periods.map(p=>`<option value="${escapeHtml(p)}"></option>`).join("");
  }
  function availableTeachers(date,period,absentName=""){
    if(!date||!period.trim()) return [];
    const day=dayForDate(date), target=norm(period);
    const busyIds=new Set(schedules.filter(s=>s.day===day&&norm(s.period)===target).map(s=>s.teacherId));
    const busyNames=new Set(schedules.filter(s=>s.day===day&&norm(s.period)===target).map(s=>norm(s.teacher)));
    const alreadyAssigned=new Set(assignments.filter(a=>a.date===date&&norm(a.period)===target&&a.status!=="Cancelled").map(a=>norm(a.substituteTeacher)));
    return teachers.filter(t=>t.name!==absentName&&!busyIds.has(t.id)&&!busyNames.has(norm(t.name))&&!alreadyAssigned.has(norm(t.name)));
  }
  function renderAvailability(){
    const date=$("availabilityDate").value, period=$("availabilityPeriod").value, day=dayForDate(date);
    if(!date||!period.trim()){$("availabilityResults").innerHTML='<p class="empty-state">Enter a date and period to check teacher availability.</p>';return;}
    const available=availableTeachers(date,period);
    const busy=schedules.filter(s=>s.day===day&&norm(s.period)===norm(period));
    const assigned=assignments.filter(a=>a.date===date&&norm(a.period)===norm(period)&&a.status!=="Cancelled");
    $("availabilityResults").innerHTML=`<div class="availability-summary"><strong>${available.length} teacher(s) available</strong><span>${escapeHtml(day)}, ${escapeHtml(date)} · ${escapeHtml(period)}</span></div>`+
      (available.length?`<div class="availability-grid">${available.map(t=>{const subjects=[...new Set(schedules.filter(s=>s.teacherId===t.id).map(s=>s.subject))];return `<article class="available-card"><strong>${escapeHtml(t.name)}</strong><span>${escapeHtml(t.department||subjects.join(", ")||"No subject profile")}</span><small>Free period · no class recorded</small></article>`;}).join("")}</div>`:'<p class="empty-state">No vacant teachers found for this period. Check the teacher schedules or try another period.')+
      `<details class="busy-details"><summary>View teachers with classes (${busy.length})</summary><ul>${busy.map(s=>`<li>${escapeHtml(s.teacher)} — ${escapeHtml(s.subject)}${s.section?" · "+escapeHtml(s.section):""}</li>`).join("")||"<li>No class schedules recorded for this period.</li>"}</ul></details>`+
      (assigned.length?`<p class="muted">Already assigned as substitute: ${assigned.map(a=>escapeHtml(a.substituteTeacher)).join(", ")}</p>`:"");
  }
  function render(){
    renderTeacherOptions();
    const dateFilter=$("filterDate").value, query=$("filterText").value.toLowerCase(), status=$("filterStatus").value;
    const filtered=assignments.filter(a=>(!dateFilter||a.date===dateFilter)&&(!status||a.status===status)&&(!query||[a.absentTeacher,a.substituteTeacher,a.section,a.subject,a.period,a.room].join(" ").toLowerCase().includes(query)));
    $("assignmentRows").innerHTML=filtered.length?filtered.map(a=>`<tr><td>${escapeHtml(a.date)}</td><td>${escapeHtml(a.absentTeacher)}</td><td><strong>${escapeHtml(a.substituteTeacher)}</strong></td><td>${escapeHtml(a.section)}</td><td>${escapeHtml(a.subject)}</td><td>${escapeHtml(a.period)}</td><td>${escapeHtml(a.room||"—")}</td><td><span class="tag ${String(a.status||"").toLowerCase()}">${escapeHtml(a.status||"Assigned")}</span></td><td class="no-print"><button class="small-action" data-delete-assignment="${escapeHtml(a.id)}">Delete</button></td></tr>`).join(""):'<tr><td colspan="9" class="empty-state">No substitution assignments match your filters.</td></tr>';
    $("scheduleRows").innerHTML=schedules.length?schedules.map(s=>`<tr><td>${escapeHtml(s.teacher)}</td><td>${escapeHtml(s.day)}</td><td>${escapeHtml(s.period)}</td><td>${escapeHtml(s.subject)}</td><td>${escapeHtml(s.section||"—")}</td><td>${escapeHtml(s.room||"—")}</td><td class="no-print"><button class="small-action" data-delete-schedule="${escapeHtml(s.id)}">Delete</button></td></tr>`).join(""):'<tr><td colspan="7" class="empty-state">No teacher schedules added yet.</td></tr>';
    $("teacherCount").textContent=teachers.length;$("todayCount").textContent=assignments.filter(a=>a.date===isoToday&&a.status!=="Cancelled").length;$("attentionCount").textContent=assignments.filter(a=>a.status==="Pending").length;
    renderAvailability(); updateSubstituteOptions();
  }
  function updateSubstituteOptions(){
    const date=$("assignmentDate").value, period=$("assignmentPeriod").value, absent=$("absentTeacher").value, select=$("substituteTeacher");
    const previous=select.value;
    const candidates=availableTeachers(date,period,absent);
    select.innerHTML='<option value="">Select vacant teacher</option>'+candidates.map(t=>`<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)}</option>`).join("");
    if(candidates.some(t=>t.name===previous))select.value=previous;
    select.disabled=Boolean(date&&period.trim()&&candidates.length===0);
    if(date&&period.trim()&&candidates.length===0) $("formMessage").textContent="No vacant substitute found for the selected date and period. Check the schedules below.";
  }
  form.addEventListener("submit",async e=>{
    e.preventDefault();const data=Object.fromEntries(new FormData(form).entries());
    if(data.absentTeacher===data.substituteTeacher){$("formMessage").textContent="The absent teacher and substitute must be different.";return;}
    const valid=availableTeachers(data.date,data.period,data.absentTeacher).some(t=>t.name===data.substituteTeacher);
    if(!valid){$("formMessage").textContent="That teacher is not marked vacant for the selected date and period. Refresh availability and choose a vacant teacher.";return;}
    try{$("formMessage").textContent="Saving…";await api("addAssignment",data);form.reset();$("assignmentDate").value=isoToday;$("formMessage").textContent="Assignment saved.";await load();}
    catch(err){$("formMessage").textContent=err.message;}
  });
  $("teacherForm").addEventListener("submit",async e=>{
    e.preventDefault();const name=$("teacherName").value.trim(),department=$("teacherDepartment").value.trim();if(!name)return;
    if(teachers.some(t=>t.name.toLowerCase()===name.toLowerCase())){$("formMessage").textContent="That teacher is already in the directory.";return;}
    try{await api("addTeacher",{name,department});$("teacherName").value="";$("teacherDepartment").value="";await load();}catch(err){$("formMessage").textContent=err.message;}
  });
  $("scheduleForm").addEventListener("submit",async e=>{
    e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget).entries());
    const teacher=teachers.find(t=>t.name===data.teacher);if(!teacher){$("scheduleMessage").textContent="Please select a teacher from the directory.";return;}
    data.teacherId=teacher.id;
    if(schedules.some(s=>s.teacherId===data.teacherId&&s.day===data.day&&norm(s.period)===norm(data.period))){$("scheduleMessage").textContent="This teacher already has a schedule entry for that day and period.";return;}
    try{$("scheduleMessage").textContent="Saving schedule…";await api("addSchedule",data);e.currentTarget.reset();$("scheduleMessage").textContent="Class schedule saved.";await load();}catch(err){$("scheduleMessage").textContent=err.message;}
  });
  document.addEventListener("click",async e=>{
    const teacher=e.target.closest("[data-delete-teacher]"), assignment=e.target.closest("[data-delete-assignment]"), schedule=e.target.closest("[data-delete-schedule]");
    try{if(teacher&&confirm("Remove this teacher and their class schedule entries?")){await api("deleteTeacher",{id:teacher.dataset.deleteTeacher});await load();}
      if(assignment&&confirm("Delete this substitution assignment?")){await api("deleteAssignment",{id:assignment.dataset.deleteAssignment});await load();}
      if(schedule&&confirm("Delete this class schedule entry?")){await api("deleteSchedule",{id:schedule.dataset.deleteSchedule});await load();}}
    catch(err){$("formMessage").textContent=err.message;}
  });
  ["filterDate","filterText","filterStatus"].forEach(id=>$(id).addEventListener("input",render));
  ["availabilityDate","availabilityPeriod"].forEach(id=>$(id).addEventListener("input",renderAvailability));
  ["assignmentDate","assignmentPeriod","absentTeacher"].forEach(id=>$(id).addEventListener("input",updateSubstituteOptions));
  $("refreshBtn").addEventListener("click",load);
  $("printBtn").addEventListener("click",()=>window.print());
  $("printSubstitutionBtn").addEventListener("click",()=>{
    document.body.classList.add("print-substitution-only");
    window.print();
  });
  window.addEventListener("afterprint",()=>document.body.classList.remove("print-substitution-only"));
  load();
})();
