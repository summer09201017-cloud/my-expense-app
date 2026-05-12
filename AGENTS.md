# AGENTS.md

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
├── App.jsx                    # 主畫面：頂部工具列 + 6 個分頁（記帳/明細/日曆/圖表/報告/設定）+ 底部 TabBar
├── main.jsx                   # React entry
├── index.css                  # 全域樣式 + CSS variables + glass-panel + .toolbar-btn / .app-main
├── components/
│   ├── TabBar.{jsx,css}       # 底部固定 6 分頁切換列
│   ├── Dashboard.{jsx,css}    # 結餘 + 月預算 + 日均可花 + 分類預算 + 固定交易提醒 + 成就徽章
│   ├── ExpenseChart.{jsx,css} # 支出分類餅圖（Recharts）
│   ├── TrendChart.{jsx,css}   # 收支趨勢線圖（近 30 天 / 近 12 月切換）
│   ├── TransactionForm.{jsx,css} # 新增/編輯表單；整合 Numpad 與 AddCategoryDialog
│   ├── TransactionList.{jsx,css} # 本日/本週/本月/自訂/全部篩選、類型篩選、進階搜尋、複製/編輯/刪除
│   ├── CalendarView.{jsx,css} # 月曆 grid，每格顯示當日收支小數字 + 當日明細
│   ├── ReportView.{jsx,css}   # 區間（週/月/季/年/自訂）總覽 + Top5 分類排行
│   ├── Numpad.{jsx,css}       # 自訂數字鍵盤，含 + − × ÷ 連鎖計算與長按 0 → 00
│   ├── IconPicker.{jsx,css}   # IconGrid / IconPicker / AddCategoryDialog 三個元件
│   ├── CloudSync.{jsx,css}    # Google Apps Script webhook 雲端同步
│   └── SettingsView.{jsx,css} # 可見的 PWA 安裝、主題切換、分類預算、固定交易設定
├── hooks/
│   ├── useTransactions.js     # 交易 CRUD + 本月 summary + mergeTransactions
│   ├── useCategories.js       # 自訂分類 CRUD（含預設）
│   ├── useTheme.js            # 'light' | 'dark' | 'system' 三段循環
│   ├── useBudget.js           # 月預算金額
│   ├── useCategoryBudgets.js  # 各支出分類的月預算
│   ├── useQuickTemplates.js   # 常用模板一鍵記帳
│   ├── useRecurringTransactions.js # 每月固定交易 / 訂閱提醒
│   └── usePwaInstall.js       # beforeinstallprompt + PWA 安裝狀態
└── utils/
    ├── csv.js                 # RFC4180 CSV 解析器，把匯出檔反向轉回 transactions
    ├── date.js                # 本地日期工具，避免 toISOString 造成台灣時區日期跑掉
    ├── financeStats.js        # 分類支出、日均可花、無支出日、連續記帳、徽章計算
    ├── icons.js               # ICON_GROUPS（emoji 分組）+ splitCategory / joinCategory
    └── migrations.js          # LocalStorage schema 升級（V4_EXPENSE/V4_INCOME + 重命名 + transactions/templates/recurring/budgets 同步）
```

## 核心設計

### 狀態 / 持久化
**所有狀態都在 LocalStorage**，無後端。每個 hook 都遵循「讀 → useState → useEffect 寫回」的模式。

LocalStorage keys：
- `transactions` — 交易陣列
- `categories` — `{ income: string[], expense: string[] }`
- `categories_defaults_version` — 預設分類遷移版號（目前為 `4`，由 `src/utils/migrations.js` 管理；升級時會重命名舊預設、把新 V4 預設併入清單，並同步改寫 `transactions` / `quick_templates` / `recurring_transactions` / `category_budgets` 內所有引用到的舊分類字串）
- `theme` — `'light' | 'dark' | 'system'`
- `accent_color` — 主題色 key（`blue` / `purple` / `pink` / `red` / `orange` / `green` / `teal` / `indigo`）
- `monthly_budget` — 數字字串
- `category_budgets` — `{ [category: string]: number }`
- `quick_templates` — 常用模板陣列，提供一鍵記帳
- `recurring_transactions` — 每月固定交易規則陣列
- `continuous_mode` — `'0' | '1'`
- `numpad_mode` — `'0' | '1'`，金額是否使用內建數字鍵盤（預設 1）
- `google_sheet_webhook` — CloudSync 用的 GAS webhook URL

### Transaction 物件形狀
```js
{
  id: string,            // crypto.randomUUID()
  type: 'income' | 'expense',
  amount: number,
  category: string,      // 含 emoji 前綴，例如 '🍱 飲食'
  date: string,          // 'YYYY-MM-DD'
  note: string,
  createdAt: string,     // ISO 字串
}
```

### Summary 計算（重要）
`useTransactions.js` 的 `summary`：
- `balance` — 全部歷史收入減支出
- `income` / `expense` — **只算當月**（用 `date.startsWith(currentMonth)` 過濾）

### 日期系統（重要）
所有預設日期請使用 `src/utils/date.js`：
- `toLocalDateString()` — 本地 `YYYY-MM-DD`
- `toLocalMonthString()` — 本地 `YYYY-MM`
- `getDateRange()` / `getWeekRange()` / `getMonthRange()` — 篩選與報表共用

不要用 `new Date().toISOString().split('T')[0]` 當預設日期；台灣凌晨時段可能會被轉成前一天。`createdAt` 可以繼續用 ISO 字串，因為它是時間戳，不是使用者看到的記帳日期。

### 主題 / PWA
`index.css` 用 CSS variables，三層覆寫優先順序：
1. `:root` 預設（淺色）
2. `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` — 跟隨系統
3. `:root[data-theme="dark"]` — 手動指定

`useTheme.js` 透過 `document.documentElement.dataset.theme` 控制。使用者可在頂部工具列循環切換，也可在「設定」分頁看到完整的淺色 / 深色 / 跟隨系統三段控制。

PWA 安裝狀態在「設定」分頁顯示，`usePwaInstall.js` 會攔截 `beforeinstallprompt`，可安裝時會提供明確的安裝按鈕。

### 表單注入流程
TransactionForm 接收兩種注入：
- `editingTransaction` — 進入編輯模式（送出時呼叫 `onUpdate`）
- `prefillTransaction` — 「複製此筆」用，只填值不進編輯，附帶 `_ts: Date.now()` 強制 useEffect 觸發

### 連續記帳模式
表單 toggle `continuousMode`（持久化）。送出時：
- 開啟：保留 `type / category / date`，只清 `amount / note`
- 關閉：照常清空 `amount / category / note`

### 常用模板
`useQuickTemplates.js` 內有預設模板（早餐、午餐、捷運、咖啡）。在記帳表單點模板會直接用今天本地日期新增一筆；「存目前」會把目前表單內容存成模板，最多保留 12 個。

### 固定交易 / 訂閱提醒
規則存在 `recurring_transactions`。Dashboard 會顯示本月到期且尚未記入的規則；按「記入」會用該規則設定的每月日期新增交易，並把 `lastPostedMonth` 標成當月，避免重複提醒。設定頁也可以手動新增、停用、刪除與記入本月。

### 分類系統 / 預設與遷移
預設分類由 `src/utils/migrations.js` 的 `V4_EXPENSE` / `V4_INCOME` 為唯一事實來源（20 支出 + 10 收入，全 emoji 化）。`useCategories.js` 直接 import 這兩個常數作為新用戶的初始值。遷移在 `main.jsx` 開機時呼叫 `runCategoryMigrations()` 一次完成，**必須**在任何 hook 讀取 LocalStorage 之前。每次 schema 改動的標準作法：
1. 在 `migrations.js` 加 `EXPENSE_RENAMES` / `INCOME_RENAMES` 條目（舊→新）
2. 更新 `V4_EXPENSE` / `V4_INCOME`（或推進為 V5）
3. 把 `CURRENT_VERSION` 加 1
4. 必要時補上對 `category_budgets` 之類非 `{type, category}` 形狀的特殊處理

升級規則：使用者自訂分類保留並插在「📦 其他」之前；已被刪掉的舊預設**不會**被救回；但 V4 預設清單中的項目（即使使用者曾刪除）會被本次升級補回，因為 V4 = 30 是當前的契約。

### 分類預算與徽章
分類預算存在 `category_budgets`，只針對支出分類。Dashboard 會按本月支出比例排序顯示最需要注意的分類預算。

`financeStats.js` 目前計算：
- 剩餘日均可花
- 本月無支出日
- 從今天往前算的連續記帳天數
- 小徽章（第一筆完成、連記 3/7 天、本月 3 天無支出、預算守門員、紀錄達人）

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

## Roadmap

### ✅ 已完成（對齊現況）

**輸入體驗**
- 自訂 Numpad（+−×÷ 連鎖計算、長按 0 → 00）；可切回系統鍵盤
- 快速金額 chips（50/100/200/500/1000）+ 「清除」按鈕
- 連續記帳模式（保留 type/category/date，只清 amount/note）
- 常用模板一鍵記帳（最多 12 個，含 4 個預設）+ 「存目前」
- 複製此筆 → 帶值不進入編輯模式
- 編輯模式（與新增共用同一表單）

**分類系統**
- 30 個 emoji 預設（20 支出 + 10 收入），由 `migrations.js` 集中管理
- IconPicker（11 組共 ~140 個 emoji）+ AddCategoryDialog
- LocalStorage schema 版本化遷移（v1 → v4），含 `transactions` / `quick_templates` / `recurring_transactions` / `category_budgets` 同步重命名

**檢視 / 報告**
- 6 分頁底部 TabBar（記帳 / 明細 / 日曆 / 圖表 / 報告 / 設定）
- 明細：本日/週/月/自訂/全部 + 收支類型 + 進階搜尋（分類/備註/金額/類型）
- 月曆視圖：每格顯示當日收支小數字 + 點擊看當日明細
- 圖表：支出分類餅圖 + 收支趨勢線圖（30 天 / 12 月切換）
- 報告：週/月/季/年/自訂 區間總覽 + 收支 Top5 排行 + 最大單筆 + 支出/收入比例

**Dashboard / 預算**
- 總結餘 + 本月收入/支出
- 月預算（含警戒色 ok/warn/danger）+ 剩餘日均可花
- 分類預算（按使用率排序）
- 每月固定交易 / 訂閱提醒（到期未記入會浮在 Dashboard）
- 連續記帳天數、本月無支出日、5 種徽章

**資料 / 同步**
- CSV 匯入（覆蓋 or 合併依 ID 去重）+ 匯出（含 BOM）
- 7 秒 undo toast（刪除可救回）
- Google Apps Script webhook 雲端同步

**主題 / PWA**
- 三段主題（淺色 / 深色 / 跟隨系統）
- 工具列即時切換 + 設定頁完整三段控制
- PWA 安裝按鈕（攔 `beforeinstallprompt`）+ service worker
- 行動裝置橫看安全區（safe-area-inset-left/right）+ 極窄螢幕 TabBar 緊湊樣式

### 🟢 待做：高 CP 值（半天內）

優先順序由上而下，建議下一個 sprint 取前 3 項：

1. **本月超支預測** — `financeStats.js` 加一行：依目前日均推估月底會花到多少；超支顯示紅字。零依賴。
2. **`window.confirm/alert` 換成自家 Toast/Modal** — 全 app UX 提升，散在 App.jsx、TransactionForm、SettingsView 等多處。
3. **本月 vs 上月對比卡** — Dashboard 加 ±% 顯示，立刻有「故事」。
4. **TransactionList 分頁 / 滾動載入** — 目前 `animationDelay: i * 0.05s` 在第 100 筆要等 5 秒，先一行 `Math.min(i * 0.05, 0.5)` 修掉效能笑話，再加 50 筆/頁。
5. **編輯也加 undo toast** — 沿用現有 `undoDelete` pattern，對稱補完。
6. **`ReportView.jsx` 的 `computeRange` 收回去用 `utils/date.js`** — 維護債清理。
7. **長按交易 → 多選 → 批次刪除/改分類** — 大量誤分類時救命。

### 🟡 待做：中等投資（1–2 天）

8. **儲蓄目標 / 旅遊基金** — 目標金額 + 期限 + Dashboard 進度條，給「為什麼要記帳」一個情緒鉤子。
9. **搜尋條件儲存 + 釘選** — 重複查詢場景超常見。
10. **分類改名 + 合併** — 已有 `migrations.js` 框架，套同樣手法做運行時的 rename（含同步 transactions）。
11. **每筆交易附收據圖** — IndexedDB（LocalStorage 5MB 上限），不要碰 base64 直接塞 LocalStorage。
12. **月曆熱力圖** — `CalendarView` 加 CSS 變數，背景顏色深淺反映支出強度。
13. **匯出 PDF / 分享圖卡** — `html2canvas` 把月報告變一張可分享圖。
14. **鍵盤快捷鍵** — N 新增、`/` 搜尋、Esc 取消、1–6 切分頁。
15. **自動雲端備份提醒** — 超過 7 天沒同步在頂列顯示橘點。

### 🟠 待做：較大改動（2–4 天）

16. **帳戶 / 錢包系統** — 現金 / 街口 / 信用卡 / 悠遊卡，含轉帳。會動到 Transaction schema、Dashboard、ReportView，但讓 app 從「日記」進化成「資產管理」的分水嶺。
17. **多幣別 + 即時匯率** — `exchangerate.host` 免費 API，快取 24h。
18. **訂閱 / 固定支出儀表板** — 從 `recurring_transactions` + 同分類規律支出自動偵測「你每月被扣 $XXX」。
19. **OCR 拍發票** — Tesseract.js 中文版，只抓金額 + 商家。中文發票辨識率不穩，當試驗品。

### ⚠️ 已知問題

- `dist/assets/index-*.js` ~630 KB（recharts 約佔大半），暫不處理。要動的話：報告/圖表分頁用 `React.lazy()` + 動態 import，bundle 切兩塊。

## 雲端同步（CloudSync）

使用者自己部署 Google Apps Script，貼 webhook URL 進設定。GAS 程式碼在根目錄 `google_apps_script.js`，把交易陣列存進 Google Sheet。
- 上傳：POST `{ action: 'backup', data: transactions }`
- 還原：GET `?action=restore`
