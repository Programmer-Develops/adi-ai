/**
 * Google Apps Script Webhook to accept POSTed leads and append them to a Google Sheet.
 *
 * 1. Create a new Google Sheet and open Extensions → Apps Script.
 * 2. Paste this script and set the sheet name if needed.
 * 3. Deploy → New deployment → select "Web app" and set "Who has access" to "Anyone" (or restrict as needed).
 * 4. Use the deployment URL as `LEAD_WEBHOOK_URL` in your environment variables.
 */

const SHEET_NAME = 'Leads';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const lead = body.lead || body;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['receivedAt', 'name', 'email', 'interest', 'raw']);
    }

    const receivedAt = new Date().toISOString();
    const name = lead.name || '';
    const email = lead.email || '';
    const interest = lead.interest || '';
    sheet.appendRow([receivedAt, name, email, interest, JSON.stringify(lead)]);

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}
