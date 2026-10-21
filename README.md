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
Replace `assets/school-logo.png` with the official Calinan National High School logo. Keep the exact filename, or update the image path in `index.html`.

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
