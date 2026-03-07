/**
 * 記帳 App - Google Apps Script 雲端同步後端
 * 
 * 使用方式：
 * 1. 在 Google Drive 建立一個新的 Google Sheet。
 * 2. 點擊選單「擴充功能」 -> 「Apps Script」。
 * 3. 將此檔案的所有程式碼貼上並取代原有的程式碼。
 * 4. 點擊右上角「部署」 -> 「新增部署作業」。
 * 5. 類型選擇「網頁應用程式 (Web App)」。
 * 6. 「執行身分」選擇「我」，「誰可以存取」選擇「所有人 (Anyone)」。
 * 7. 點擊部署，並授權權限。
 * 8. 複製產生的「網頁應用程式網址 (URL)」，貼到記帳 App 的雲端同步設定中。
 */

function doPost(e) {
  try {
    // 解析前端傳來的純文字 JSON
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var data = body.data;

    if (action === 'backup') {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      // 我們將備份資料存放在第一個儲存格 (A1) 作為 JSON 字串
      // 這樣最簡單且不會受到欄位變更影響
      sheet.getRange('A1').setValue(JSON.stringify(data));
      sheet.getRange('A2').setValue('最後備份時間：' + new Date().toLocaleString());
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: '備份成功'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    throw new Error('不支援的動作');

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    
    if (action === 'restore') {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      var dataString = sheet.getRange('A1').getValue();
      
      var data = [];
      if (dataString) {
        data = JSON.parse(dataString);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: data
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 如果沒有參數，提供簡單的網頁測試回應
    return ContentService.createTextOutput('Google Apps Script Webhook 啟動中！請回到記帳 App 進行操作。');
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
