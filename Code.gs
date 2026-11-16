/**
 * Calinan National High School - Teacher Substitution Plan backend
 * Create/open a Google Sheet, paste this file into Extensions > Apps Script,
 * run setupSheet() once, then deploy as a Web App.
 *
 * Keep the spreadsheet private and restrict Web App access to authorized
 * school personnel. Re-deploy a new version after changing this script.
 */
const SHEET_ID = ""; // Optional: spreadsheet ID if this is a standalone Apps Script project.
const TAB_TEACHERS = "Teachers";
const TAB_ASSIGNMENTS = "Substitutions";
const TAB_SCHEDULES = "TeachingSchedule";

function spreadsheet_() {
  if (SHEET_ID) return SpreadsheetApp.openById(SHEET_ID);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("No active spreadsheet. Bind this script to a Google Sheet or set SHEET_ID.");
  return ss;
}
function setupSheet() {
  const ss = spreadsheet_();
  const definitions = [
    [TAB_TEACHERS, ["id","name","department","createdAt"]],
    [TAB_ASSIGNMENTS, ["id","date","absentTeacher","substituteTeacher","section","subject","period","room","status","notes","createdAt"]],
    [TAB_SCHEDULES, ["id","teacherId","teacher","day","period","subject","section","room","createdAt"]]
  ];
  definitions.forEach(([name, headers]) => {
    const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sheet.getLastRow() === 0) sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,headers.length).setFontWeight("bold").setBackground("#dcebdc");
    sheet.autoResizeColumns(1,headers.length);
  });
  return "CNHS substitution sheets are ready.";
}
function doGet(e) {
  const action = (e.parameter.action || "bootstrap").toLowerCase();
  const result = action === "bootstrap" ? bootstrap_() : {ok:false,error:"Unknown action"};
  const body = JSON.stringify(result);
  const callback = e.parameter.callback;
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback))
    return ContentService.createTextOutput(callback+"("+body+");").setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || "{}");
    let result;
    switch (data.action) {
      case "addTeacher": result = addTeacher_(data); break;
      case "deleteTeacher": result = deleteTeacher_(data); break;
      case "addAssignment": result = addAssignment_(data); break;
      case "deleteAssignment": result = deleteAssignment_(data); break;
      case "addSchedule": result = addSchedule_(data); break;
      case "deleteSchedule": result = deleteSchedule_(data); break;
      default: throw new Error("Unknown action");
    }
    return ContentService.createTextOutput(JSON.stringify({ok:true,result:result})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err.message||err)})).setMimeType(ContentService.MimeType.JSON);
  }
}
function bootstrap_() {
  const ss = spreadsheet_();
  const teacherRows = rows_(ss.getSheetByName(TAB_TEACHERS));
  const assignmentRows = rows_(ss.getSheetByName(TAB_ASSIGNMENTS));
  const scheduleRows = rows_(ss.getSheetByName(TAB_SCHEDULES));
  return {
    teachers: teacherRows.map(r=>({id:String(r[0]),name:String(r[1]),department:String(r[2]||"")})),
    assignments: assignmentRows.map(r=>({id:String(r[0]),date:dateString_(r[1]),absentTeacher:String(r[2]),substituteTeacher:String(r[3]),section:String(r[4]),subject:String(r[5]),period:String(r[6]),room:String(r[7]),status:String(r[8]),notes:String(r[9]||""),createdAt:String(r[10]||"")})).reverse(),
    schedules: scheduleRows.map(r=>({id:String(r[0]),teacherId:String(r[1]),teacher:String(r[2]),day:String(r[3]),period:String(r[4]),subject:String(r[5]),section:String(r[6]||""),room:String(r[7]||""),createdAt:String(r[8]||"")}))
  };
}
function rows_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn()).getValues();
}
function dateString_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  return String(v||"").slice(0,10);
}
function addTeacher_(d) {
  if (!d.name || !String(d.name).trim()) throw new Error("Teacher name is required.");
  const id=Utilities.getUuid();
  spreadsheet_().getSheetByName(TAB_TEACHERS).appendRow([id,String(d.name).trim(),String(d.department||"").trim(),new Date()]);
  return id;
}
function deleteTeacher_(d) {
  const ss=spreadsheet_();
  deleteById_(TAB_TEACHERS,d.id);
  // Also remove the teacher's timetable to avoid stale availability records.
  const sheet=ss.getSheetByName(TAB_SCHEDULES), values=rows_(sheet);
  values.map((r,i)=>({r,i})).filter(x=>String(x.r[1])===String(d.id)).reverse().forEach(x=>sheet.deleteRow(x.i+2));
  return true;
}
function addAssignment_(d) {
  ["date","absentTeacher","substituteTeacher","section","subject","period"].forEach(k=>{if(!d[k])throw new Error(k+" is required.");});
  if(d.absentTeacher===d.substituteTeacher) throw new Error("Substitute must differ from absent teacher.");
  const s=spreadsheet_().getSheetByName(TAB_ASSIGNMENTS), id=Utilities.getUuid();
  s.appendRow([id,d.date,d.absentTeacher,d.substituteTeacher,d.section,d.subject,d.period,d.room||"",d.status||"Assigned",d.notes||"",new Date()]);
  return id;
}
function addSchedule_(d) {
  ["teacherId","teacher","day","period","subject"].forEach(k=>{if(!d[k]||!String(d[k]).trim())throw new Error(k+" is required.");});
  const sheet=spreadsheet_().getSheetByName(TAB_SCHEDULES), existing=rows_(sheet);
  const key=s=>String(s||"").toLowerCase().replace(/[–—]/g,"-").replace(/\s+/g," ").trim();
  if(existing.some(r=>String(r[1])===String(d.teacherId)&&String(r[3])===String(d.day)&&key(r[4])===key(d.period)))
    throw new Error("This teacher already has a schedule entry for that day and period.");
  const id=Utilities.getUuid();
  sheet.appendRow([id,d.teacherId,d.teacher,d.day,d.period,d.subject,d.section||"",d.room||"",new Date()]);
  return id;
}
function deleteAssignment_(d) { return deleteById_(TAB_ASSIGNMENTS,d.id); }
function deleteSchedule_(d) { return deleteById_(TAB_SCHEDULES,d.id); }
function deleteById_(tab,id) {
  if(!id) throw new Error("Record ID is required.");
  const s=spreadsheet_().getSheetByName(tab), values=rows_(s);
  const index=values.findIndex(r=>String(r[0])===String(id));
  if(index<0) throw new Error("Record not found.");
  s.deleteRow(index+2); return true;
}
