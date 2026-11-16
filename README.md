# Calinan National High School — Teacher Substitution Plan

A responsive school substitution schedule with a Google Sheets backend. The school seal is included in the header.

## Features
- Add and manage the teacher directory
- Let teachers encode weekly teaching loads by day, period, subject, class/section and room
- Find vacant teachers for a selected date and period; teachers with a recorded class in that slot are excluded
- Filter substitute choices to teachers marked vacant for the selected assignment slot
- Record absent teacher, substitute, date, class/section, subject, period, room, status and notes
- Search and filter the substitution schedule
- Daily summary counts and print-friendly schedule
- Google Sheets storage through Google Apps Script
- Demo mode works locally in the browser before the Sheet is connected

## Repository files
- `index.html` — application page
- `styles.css` — responsive school-themed layout
- `app.js` — frontend logic
- `config.js` — Apps Script deployment URL
- `Code.gs` — Google Apps Script backend
- `assets/cnhs-logo.png` — uploaded school logo

## 1. Set up the Google Sheet
1. Create a new Google Spreadsheet named **CNHS Teacher Substitution Plan**.
2. Open **Extensions → Apps Script**.
3. Copy all code from `Code.gs` in this repository into the Apps Script editor.
4. Save, select `setupSheet` in the function list, and click **Run**. Approve the requested spreadsheet permissions.
5. The script creates three tabs: `Teachers`, `Substitutions`, and `TeachingSchedule`, with headers.

If you create a standalone Apps Script project instead of opening it from the Sheet, paste the spreadsheet ID into `SHEET_ID` at the top of `Code.gs`.

## 2. Deploy the backend
1. In Apps Script, choose **Deploy → New deployment**.
2. Select **Web app**.
3. Set **Execute as** to **Me**.
4. Set access according to your school's data privacy and account policy. For a school-only deployment, use the narrowest access option available to your organization. Avoid public access if the app will contain staff-sensitive information.
5. Deploy, authorize if prompted, and copy the Web App URL ending in `/exec`.

**Important:** After updating the backend, run `setupSheet()` once to ensure the `TeachingSchedule` tab exists, then deploy a **new version** of the Web App and update `config.js` if the deployment URL changes. The deployed web app runs with the deployer's spreadsheet permissions. Keep the spreadsheet private and distribute the web app only to authorized school personnel. Review access with your school administrator before using real staff records.

## 3. Connect the GitHub Pages frontend
1. Open `config.js`.
2. Set `SCRIPT_URL` to the deployed `/exec` URL, for example:

   ```js
   window.CNHS_CONFIG = {
     SCRIPT_URL: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
   };
   ```
3. Commit and push the repository to GitHub.
4. In the repository, open **Settings → Pages**.
5. Choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
6. Open the published Pages URL.

The frontend uses JSONP for read requests and a cross-origin no-cors POST for write requests. After each write it reloads the records from the Sheet. Test the deployed setup with sample records before official use. If your Google Workspace policy blocks cross-origin access, host the frontend through Apps Script HTML Service or use an approved authenticated integration.

## 4. Local preview
Open `index.html` in a browser. With `SCRIPT_URL` blank, the app runs in **Demo mode** and stores sample entries in that browser's local storage only. Demo records are not sent to Google Sheets.

## Suggested operating procedure
- Assign one authorized coordinator to maintain the substitution plan.
- Confirm the substitute's availability and teaching load before saving an assignment.
- Use the Notes field for lesson instructions and handover reminders.
- Review pending assignments before printing or circulating the daily plan.
- Do not enter student personal or sensitive information in Notes.

## Data structure
**Teachers:** `id`, `name`, `department`, `createdAt`

**Substitutions:** `id`, `date`, `absentTeacher`, `substituteTeacher`, `section`, `subject`, `period`, `room`, `status`, `notes`, `createdAt`

**TeachingSchedule:** `id`, `teacherId`, `teacher`, `day`, `period`, `subject`, `section`, `room`, `createdAt`

For accurate vacancy checking, enter one timetable row for each teacher, day and class period. Use consistent period labels (for example, `7:30–8:30 AM`) in the timetable and substitution form. If a teacher has no saved class entry for that day and period, the system treats them as vacant. This is a timetable-based check; update the schedule for meetings, duties, leave, or other commitments not represented as classes.

## Privacy and security
This starter project is intended for controlled school use. GitHub Pages is public by default, so do not commit private teacher information, spreadsheet credentials, or student data. The Apps Script URL is a capability endpoint: protect its distribution and deploy it with the narrowest access policy your school supports. For stronger authentication, use an organization-approved sign-in and backend architecture before production rollout.

## License
Add the license approved by Calinan National High School before redistributing.
