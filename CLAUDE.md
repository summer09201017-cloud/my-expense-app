# CLAUDE.md

繁體中文（zh-TW）的個人記帳 PWA。Vite + React 19 + LocalStorage，可離線使用、可安裝到手機。

## 常用指令

```powershell
npm run dev       # 開發伺服器 (http://localhost:5173)
npm run build     # 產出 dist/（含 PWA service worker）
npm run preview   # 預覽 build 後產物 (port 4173)
npm run lint      # ESLint
```

也可以雙擊根目錄的 `start.bat`，有選單可選 dev / preview / build / 重新安裝套件。

## 部署

- 已連結 Netlify 自動部署（https://polite-bombolone-075bf5.netlify.app/）
- GitHub repo：`summer09201017-cloud/my-expense-app`
- Netlify 設定：build = `npm run build`，publish = `dist`

## 專案結構

```
src/
├── App.jsx                    # 主畫面：頂部工具列 + 5 個分頁（記帳/明細/日曆/圖表/報告）+ 底部 TabBar
├── main.jsx                   # React entry
├── index.css                  # 全域樣式 + CSS variables + glass-panel + .toolbar-btn / .app-main
├── components/
│   ├── TabBar.{jsx,css}       # 底部固定 5 分頁切換列
│   ├── Dashboard.{jsx,css}    # 結餘 + 月預算進度條 + 本月收支（記帳分頁頂部）
│   ├── ExpenseChart.{jsx,css} # 支出分類餅圖（Recharts）
│   ├── TrendChart.{jsx,css}   # 收支趨勢線圖（近 30 天 / 近 12 月切換）
│   ├── TransactionForm.{jsx,css} # 新增/編輯表單；整合 Numpad 與 AddCategoryDialog
│   ├── TransactionList.{jsx,css} # 日/月切換、搜尋、複製/編輯/刪除
│   ├── CalendarView.{jsx,css} # 月曆 grid，每格顯示當日收支小數字 + 當日明細
│   ├── ReportView.{jsx,css}   # 區間（週/月/季/年/自訂）總覽 + Top5 分類排行
│   ├── Numpad.{jsx,css}       # 自訂數字鍵盤，含 + − × ÷ 連鎖計算與長按 0 → 00
│   ├── IconPicker.{jsx,css}   # IconGrid / IconPicker / AddCategoryDialog 三個元件
│   └── CloudSync.{jsx,css}    # Google Apps Script webhook 雲端同步
├── hooks/
│   ├── useTransactions.js     # 交易 CRUD + 本月 summary + mergeTransactions
│   ├── useCategories.js       # 自訂分類 CRUD（含預設）
│   ├── useTheme.js            # 'light' | 'dark' | 'system' 三段循環
│   └── useBudget.js           # 月預算金額
└── utils/
    ├── csv.js                 # RFC4180 CSV 解析器，把匯出檔反向轉回 transactions
    └── icons.js               # ICON_GROUPS（emoji 分組）+ splitCategory / joinCategory
```

## 核心設計

### 狀態 / 持久化
**所有狀態都在 LocalStorage**，無後端。每個 hook 都遵循「讀 → useState → useEffect 寫回」的模式。

LocalStorage keys：
- `transactions` — 交易陣列
- `categories` — `{ income: string[], expense: string[] }`
- `theme` — `'light' | 'dark' | 'system'`
- `monthly_budget` — 數字字串
- `continuous_mode` — `'0' | '1'`
- `numpad_mode` — `'0' | '1'`，金額是否使用內建數字鍵盤（預設 1）
- `google_sheet_webhook` — CloudSync 用的 GAS webhook URL

### Transaction 物件形狀
```js
{
  id: string,            // crypto.randomUUID()
  type: 'income' | 'expense',
  amount: number,
  category: string,      // 含 emoji 前綴，例如 '🍽️ 餐飲'
  date: string,          // 'YYYY-MM-DD'
  note: string,
  createdAt: string,     // ISO 字串
}
```

### Summary 計算（重要）
`useTransactions.js` 的 `summary`：
- `balance` — 全部歷史收入減支出
- `income` / `expense` — **只算當月**（用 `date.startsWith(currentMonth)` 過濾）

### 主題系統
`index.css` 用 CSS variables，三層覆寫優先順序：
1. `:root` 預設（淺色）
2. `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` — 跟隨系統
3. `:root[data-theme="dark"]` — 手動指定

`useTheme.js` 透過 `document.documentElement.dataset.theme` 控制。

### 表單注入流程
TransactionForm 接收兩種注入：
- `editingTransaction` — 進入編輯模式（送出時呼叫 `onUpdate`）
- `prefillTransaction` — 「複製此筆」用，只填值不進編輯，附帶 `_ts: Date.now()` 強制 useEffect 觸發

### 連續記帳模式
表單 toggle `continuousMode`（持久化）。送出時：
- 開啟：保留 `type / category / date`，只清 `amount / note`
- 關閉：照常清空 `amount / category / note`

### CSV
匯出格式（含 BOM 讓 Excel 正確顯示中文）：
```
ID,類型,金額,分類,日期,備註,建立時間
```
匯入時 `csvToTransactions` 解析後可選擇覆蓋或合併（依 `id` 去重）。

## 規範與慣例

- **emoji 永遠在分類字串前面**（與預設一致），不要拆成 icon 欄位
- **不要把 LocalStorage 換成其他後端**——使用者重視離線/隱私
- **時間用本地日期字串而非 Date 物件**（`YYYY-MM-DD`），避免時區問題
- **新元件用 `glass-panel` 類別**，搭配 `animate-slide-up` / `animate-scale-in`
- **CSS 用 var() 對應的色票**，不要寫死 `#xxxxxx`，否則深色模式會壞
- **新增 LocalStorage key 要在這份檔案登記**

## 已知問題

- ESLint 會報 `react-hooks/set-state-in-effect`（TransactionForm / Numpad 在 effect 裡同步表單欄位或內部計算狀態）——這是刻意的同步模式，不是 bug。
- bundle 已超過 500kB（recharts 是大宗），暫時不處理。

## 雲端同步（CloudSync）

使用者自己部署 Google Apps Script，貼 webhook URL 進設定。GAS 程式碼在根目錄 `google_apps_script.js`，把交易陣列存進 Google Sheet。
- 上傳：POST `{ action: 'backup', data: transactions }`
- 還原：GET `?action=restore`
