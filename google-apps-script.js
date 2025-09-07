// Google Apps Script code to receive form data and store in Google Sheets
// This goes in script.google.com as a web app

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Open the spreadsheet (replace with your actual spreadsheet ID)
    const spreadsheetId = 'YOUR_SPREADSHEET_ID_HERE';
    const sheet = SpreadsheetApp.openById(spreadsheetId).getActiveSheet();
    
    // If it's the first entry, add headers
    if (sheet.getLastRow() === 0) {
      const headers = [
        'Timestamp',
        'Machine',
        'Operator',
        'Operation', 
        'Tool Position',
        'Insert Type',
        'Reason for Change',
        'Run Time (min)',
        'Material',
        'Part Number',
        'Notes'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#4CAF50');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
    }
    
    // Prepare the row data
    const rowData = [
      data.timestamp,
      data.machine,
      data.operator,
      data.operation,
      data.toolPosition,
      data.insertType,
      data.reason,
      data.runTime || '',
      data.material,
      data.partNumber || '',
      data.notes || ''
    ];
    
    // Add the data to the next available row
    sheet.appendRow(rowData);
    
    // Auto-resize columns for better readability
    sheet.autoResizeColumns(1, rowData.length);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Tool change logged successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Handle GET requests (optional - for testing)
  return ContentService
    .createTextOutput('Tool Change Tracker API is running')
    .setMimeType(ContentService.MimeType.TEXT);
}

// Function to create summary dashboard data
function createSummaryDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create or get summary sheet
  let summarySheet;
  try {
    summarySheet = ss.getSheetByName('Summary');
  } catch (e) {
    summarySheet = ss.insertSheet('Summary');
  }
  
  const dataSheet = ss.getSheets()[0]; // Assuming data is in first sheet
  const data = dataSheet.getDataRange().getValues();
  
  if (data.length <= 1) return; // No data to summarize
  
  // Clear existing summary
  summarySheet.clear();
  
  // Create summary headers
  summarySheet.getRange(1, 1, 1, 4).setValues([
    ['Machine', 'Avg Tool Life (min)', 'Most Common Failure', 'Total Changes']
  ]);
  
  // Process data by machine
  const machineStats = {};
  
  for (let i = 1; i < data.length; i++) {
    const machine = data[i][1];
    const runTime = parseInt(data[i][7]) || 0;
    const reason = data[i][6];
    
    if (!machineStats[machine]) {
      machineStats[machine] = {
        totalRunTime: 0,
        changeCount: 0,
        reasons: {}
      };
    }
    
    machineStats[machine].totalRunTime += runTime;
    machineStats[machine].changeCount += 1;
    machineStats[machine].reasons[reason] = (machineStats[machine].reasons[reason] || 0) + 1;
  }
  
  // Write summary data
  let row = 2;
  for (const machine in machineStats) {
    const stats = machineStats[machine];
    const avgToolLife = stats.changeCount > 0 ? Math.round(stats.totalRunTime / stats.changeCount) : 0;
    
    // Find most common failure reason
    let mostCommonReason = '';
    let maxCount = 0;
    for (const reason in stats.reasons) {
      if (stats.reasons[reason] > maxCount) {
        maxCount = stats.reasons[reason];
        mostCommonReason = reason;
      }
    }
    
    summarySheet.getRange(row, 1, 1, 4).setValues([[
      machine,
      avgToolLife,
      mostCommonReason,
      stats.changeCount
    ]]);
    row++;
  }
  
  // Format summary sheet
  const headerRange = summarySheet.getRange(1, 1, 1, 4);
  headerRange.setBackground('#2196F3');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  
  summarySheet.autoResizeColumns(1, 4);
}
