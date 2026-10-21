# Calinan National High School — Teachers Substitution Management

A GitHub Pages-ready static website to record teacher substitution assignments, filter by date, print a substitution plan, and export records as a CSV file that opens in Microsoft Excel.

## Files
- `index.html` — website layout
- `styles.css` — responsive styling and print layout
- `app.js` — records, date filtering, CSV export, Microsoft Forms link
- `assets/school-logo.png` — replace with the official school logo

## Publish on GitHub Pages
1. Create a GitHub repository, for example `cnhs-teacher-substitution`.
2. Upload all files and the `assets` folder to the repository root.
3. Open **Settings → Pages**.
4. Under Build and deployment, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
5. Open the Pages URL shown by GitHub.

## Add the school logo
The official Calinan National High School logo provided by the user is included as `assets/school-logo.png` and displayed in the header.

## Collect data through Microsoft Forms + Excel
1. In Microsoft Forms, create a form named **CNHS Teacher Substitution Request**.
2. Suggested fields: Plan date, absent teacher, substitute teacher (if known), grade/section, subject, time/period, room, reason/remarks.
3. Use **Open in Excel** / the Forms Responses workbook option to manage submitted entries in Excel.
4. Copy the responder link and paste it into the website's **Connect Microsoft Forms + Excel** area.
5. For a public or staff-shared workflow, use the Microsoft Forms response workbook as the shared master record. This static website does not connect directly to a private Excel workbook or automatically sync Forms responses into its table.

## Important data note
The table in the website stores entries in the current browser's local storage. It is suitable for a prototype or a single workstation, not shared multi-user storage. Export records using **Export CSV for Excel**. For a shared production workflow, use Microsoft Forms + its linked Excel workbook as the authoritative collection source, or add a secure backend/Power Automate integration.

## Print
Select the plan date, then click **Print plan**. In the print dialog, choose landscape orientation if needed.


## Excel upload and SharePoint link
The Data Collection area provides an `.xlsx` template and accepts `.xlsx`, `.xls`, and `.csv` uploads. It imports the first worksheet; keep template headers unchanged. Imported assignments are stored in the current browser and can be printed/exported. Excel reading and template creation use the SheetJS CDN.

A button opens the provided SharePoint folder. The static site cannot directly authenticate to or sync data into that protected folder. For live shared database syncing, configure Microsoft Graph or Power Automate with school administrator approval.


## Save records to SharePoint (requires administrator setup)
The site includes a **Save records to SharePoint** button. GitHub Pages cannot write to a protected SharePoint folder using only a sharing link. To activate saving:
1. A Microsoft 365 administrator creates a Power Automate cloud flow with an HTTP request trigger and validates the incoming JSON.
2. The flow writes each record into a SharePoint List (recommended) or uses an approved SharePoint/Excel connector.
3. Configure access restrictions and authentication according to school policy; do not expose a privileged endpoint publicly.
4. Paste the flow's HTTPS trigger URL into **Data Collection → Power Automate HTTP trigger URL**, then select **Save integration URL**.
5. Upload/enter records and click **Save records to SharePoint**. Check the flow run history and SharePoint list to confirm.

The website sends `{ source, sentAt, records }` as JSON using HTTP POST. The integration URL is stored in the current browser only. A successful HTTP response means the endpoint accepted the request; verify the flow's actions completed.


## Teacher selection from uploaded / SharePoint data
The **On-leave / absent teacher** dropdown is populated from teacher names found in uploaded substitution records (both absent and substitute teacher columns). For a live directory in SharePoint, configure a separate Power Automate HTTP GET endpoint and paste it in **Data Collection → Power Automate URL to GET teacher directory from SharePoint**. The endpoint should return JSON like `{"teachers":[{"name":"Teacher Name"}]}`. Configure access controls and CORS for the GitHub Pages origin. A SharePoint folder-sharing URL alone cannot be queried as a structured database by this static site.


## Available substitute dropdown
The substitute dropdown excludes the selected absent teacher and locally recorded assignments for the same date/period. To check all staff schedules in SharePoint, configure the directory Power Automate endpoint to return JSON such as `{"teachers":[{"name":"Teacher Name","busySlots":[{"date":"2026-10-21","period":"8:00–8:50 AM"}]}]}`. A `busySlots` entry means that teacher is unavailable for that date/period. The endpoint must be authorized/configured and return valid JSON; the SharePoint folder URL alone cannot provide schedule availability.


## Teaching Loads feature
The website includes a Teaching Loads section where staff can add teacher, day, period, subject, grade/section, and room. Loads are stored in the current browser and can be sent to the configured Power Automate endpoint with `type: "teachingLoads"`. Update the flow to branch on this type and write each load into a SharePoint List (recommended) or an approved Excel table. To identify vacant teachers across staff, the teacher-directory/availability endpoint should return these loads and any exceptions/leave records; the browser cannot directly read the SharePoint folder.
