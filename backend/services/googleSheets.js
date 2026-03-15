const { google } = require('googleapis');
const path = require('path');

async function appendLeadsToSheet(leads, category, city) {
  if (!leads || leads.length === 0) return;

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, '../google-credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Create a dynamic tab name based on keywords (e.g. "plumber - Topeka, Kansas")
    const tabName = `${category} - ${city}`.substring(0, 100);

    // 1. Try to create the new tab
    let isNewTab = false;
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: { properties: { title: tabName } }
          }]
        }
      });
      isNewTab = true;
      console.log(`Created new tab: ${tabName}`);
    } catch (err) {
      // If it already exists, just ignore the error and append to it
      if (err.message.includes('already exists')) {
        console.log(`Tab "${tabName}" already exists, appending data...`);
      } else {
        throw err;
      }
    }

    // 2. If it's a new tab, add the Column Headers first
    if (isNewTab) {
      const headers = [['Business Name', 'Phone Number', 'Address', 'Category', 'Rating', 'Website (Yes/No)', 'WhatsApp Number', 'Message Sent (Yes/No)', 'Reply Received', 'Lead Status', 'Notes', 'Date Added']];
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${tabName}'!A1:L1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: headers },
      });
    }

    // 3. Format the leads
    const values = leads.map(lead => [
      lead.name,
      lead.phone,
      lead.address,
      lead.category,
      lead.rating,
      'No',
      '',
      'No',
      '',
      'New',
      '',
      new Date().toISOString().split('T')[0]
    ]);

    // 4. Append leads to the specific keyword tab
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${tabName}'!A:L`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
    
    console.log(`SUCCESS: Added ${leads.length} leads to tab "${tabName}".`);
  } catch (error) {
    console.error('ERROR appending to Google Sheets:', error.message);
  }
}

module.exports = { appendLeadsToSheet };