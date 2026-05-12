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
├── App.jsx                    # 主畫面：頂部工具列（設定齒輪/主題/同步/CSV）+ 4 個底部分頁（記帳/明細/日曆/分析）
├── main.jsx                   # React entry
├── index.css                  # 全域樣式 + CSS variables + glass-panel + .toolbar-btn / .app-main
├── components/
│   ├── TabBar.{jsx,css}       # 底部固定 4 分頁切換列（記帳/明細/日曆/分析）
│   ├── Dashboard.{jsx,css}    # 結餘 + 月預算 + 超支預測 + 上月對比 + 分類預算 + 固定交易儀表板 + 成就徽章
│   ├── AnalysisView.{jsx,css} # 分析分頁容器，內含圖表 / 報告二段切換
│   ├── ExpenseChart.{jsx,css} # 支出分類餅圖（Recharts）
│   ├── TrendChart.{jsx,css}   # 收支趨勢線圖（近 30 天 / 近 12 月切換）
│   ├── TransactionForm.{jsx,css} # 新增/編輯表單；整合 Numpad 與 AddCategoryDialog
│   ├── TransactionList.{jsx,css} # 篩選、進階搜尋、複製/編輯/刪除；列表動畫延遲上限 0.5s
│   ├── CalendarView.{jsx,css} # 月曆 grid，每格顯示當日收支小數字 + 支出熱力圖 + 當日明細
│   ├── ReportView.{jsx,css}   # 區間（週/月/季/年/自訂）總覽 + Top5 分類排行
│   ├── Numpad.{jsx,css}       # 自訂數字鍵盤，含 + − × ÷ 連鎖計算與長按 0 → 00
│   ├── IconPicker.{jsx,css}   # IconGrid / IconPicker / AddCategoryDialog 三個元件
│   ├── CloudSync.{jsx,css}    # Google Apps Script webhook 雲端同步
│   └── SettingsView.{jsx,css} # 由工具列齒輪進入；PWA 安裝、主題切換、分類預算、固定交易設定
├── hooks/
│   ├── useTransactions.js     # 交易 CRUD + 本月 summary + mergeTransactions
│   ├── useCategories.js       # 自訂分類 CRUD（含預設）
│   ├── useTheme.js            # 'light' | 'dark' | 'system' 三段循環
│   ├── useBudget.js           # 月預算金額
│   ├── useCategoryBudgets.js  # 各支出分類的月預算
│   ├── useQuickTemplates.js   # 常用模板一鍵記帳
│   ├── useRecurringTransactions.js # 每月固定交易 / 訂閱提醒
│   ├── usePwaInstall.js       # beforeinstallprompt + PWA 安裝狀態
│   └── useVersionUpdate.js    # PWA 新版本可用時顯示更新提示
└── utils/
    ├── csv.js                 # RFC4180 CSV 解析器，把匯出檔反向轉回 transactions
    ├── date.js                # 本地日期工具，避免 toISOString 造成台灣時區日期跑掉
    ├── financeStats.js        # 分類支出、超支預測、上月對比、日均可花、無支出日、連續記帳、徽章計算
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
- `accent_color` — 主題色 key 或自訂色碼（例如 `blue` / `teal` / `space` / `custom:#14B8A6`）
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

`useTheme.js` 透過 `document.documentElement.dataset.theme` 控制。使用者可在頂部工具列循環切換，也可從工具列齒輪進入「設定」頁，看到完整的淺色 / 深色 / 跟隨系統三段控制。

PWA 安裝狀態在「設定」頁顯示，`usePwaInstall.js` 會攔截 `beforeinstallprompt`，可安裝時會提供明確的安裝按鈕。`useVersionUpdate.js` 透過 `virtual:pwa-register` 提供新版可用提示，由使用者按「立即更新」後套用新 service worker。手機版設定齒輪固定在左上角，避免底部 TabBar 或右側安全區擠壓。

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
規則存在 `recurring_transactions`。Dashboard 會顯示固定交易儀表板（固定支出、固定收入、待記入數、近期規則），本月到期且尚未記入的規則可直接按「記入」。記入時會用該規則設定的每月日期新增交易，並把 `lastPostedMonth` 標成當月，避免重複提醒。設定頁也可以手動新增、停用、刪除與記入本月。

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
- 依目前日均支出推估月底支出與可能超支金額
- 本月收入 / 支出與上月相比的差額與百分比
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
- 右下角浮動加號 FAB（非記帳分頁顯示，點擊清空編輯/prefill 並跳回記帳）

**分類系統**
- 30 個 emoji 預設（20 支出 + 10 收入），由 `migrations.js` 集中管理
- IconPicker（11 組共 ~140 個 emoji）+ AddCategoryDialog
- LocalStorage schema 版本化遷移（v1 → v4），含 `transactions` / `quick_templates` / `recurring_transactions` / `category_budgets` 同步重命名

**檢視 / 報告**
- 4 分頁底部 TabBar（記帳 / 明細 / 日曆 / 分析），設定改由頂部齒輪進入
- 手機版設定齒輪固定在左上角（`<header>` 直屬，不被 `.toolbar-actions` 的 overflow 容器影響），標題自動讓位，含 safe-area
- 明細：本日/週/月/自訂/全部 + 收支類型 + 進階搜尋（分類/備註/金額/類型）
- 明細列表動畫延遲上限 0.5s，避免大量紀錄慢慢跳出
- 月曆視圖：每格顯示當日收支小數字 + 支出熱力圖 + 點擊看當日明細
- 分析頁：內部分段切換「圖表 / 報告」
- 圖表：支出分類餅圖 + 收支趨勢線圖（30 天 / 12 月切換）
- 報告：週/月/季/年/自訂 區間總覽 + 收支 Top5 排行 + 最大單筆 + 支出/收入比例

**Dashboard / 預算**
- 總結餘 + 本月收入/支出
- 月預算（含警戒色 ok/warn/danger）+ 剩餘日均可花 + 本月超支預測
- 本月 vs 上月對比卡（收入 / 支出差額與百分比）
- 分類預算（按使用率排序）
- 每月固定交易儀表板（固定收入、固定支出、待記入、近期規則）
- 連續記帳天數、本月無支出日、5 種徽章

**資料 / 同步**
- CSV 匯入（覆蓋 or 合併依 ID 去重）+ 匯出（含 BOM）
- 7 秒 undo toast（刪除與編輯可復原）
- Google Apps Script webhook 雲端同步

**主題 / PWA**
- 三段主題（淺色 / 深色 / 跟隨系統）
- 工具列即時切換 + 設定頁完整三段控制
- PWA 安裝按鈕（攔 `beforeinstallprompt`）+ service worker
- PWA 版本更新提醒：新版 service worker waiting 時顯示「立即更新 / 稍後」
- `body { overflow-x: hidden }` 取代 `#root { overflow-x: clip }`，避免 iOS Safari / 舊版 Chromium 把 fixed 後代（齒輪、FAB）一起 clip 掉
- 行動裝置橫看安全區（safe-area-inset-left/right）+ 極窄螢幕 TabBar 緊湊樣式

---

### ⚡ 待做：極高 CP（每項 1–3 小時）

1. **標籤系統 `#tag`** — 備註內 `#旅遊 #京都` 自動解析、列表用 chip 篩選。零 schema 改動，純 `useMemo` 解析 + 篩選 UI。
2. **預測下月總支出** — `financeStats.js` 加近 3 個月平均 × 季節因子，Dashboard 多一張 narrative 卡。
3. **PWA Badge API** — `navigator.setAppBadge(dueRecurringRules.length)`，app icon 顯示待記入數。Chrome / Edge 桌面 + Android 支援。
4. **智慧分類建議** — 備註打「星巴克」自動高亮「☕ 咖啡」；維護一張關鍵字 → 分類 map。
5. **鍵盤快捷鍵** — `N` 新增、`/` 搜尋聚焦、`Esc` 取消、`1–4` 切分頁。
6. **月底自動 narrative 卡** — 把上月對比、超支預測、Top5 串成一段「你這個月⋯」，月末三天彈出。

### 🟢 待做：高 CP（每項 半天內）

7. **`window.confirm` / `alert` 換成自家 Toast/Modal** — 散在 `App.jsx`、`TransactionForm`、`SettingsView` 等多處，全 app UX 提升。
8. **TransactionList 分頁 / 虛擬列表** — 動畫延遲上限已完成；下一步 50 筆/頁或 `react-window`。
9. **長按交易 → 多選 → 批次刪除 / 改分類** — 大量誤分類時救命。
10. **搜尋條件儲存 + 釘選** — 重複查詢場景超常見。
11. **自動雲端備份提醒** — 超過 7 天沒同步在頂列顯示橘點。
12. **儲蓄目標 / 旅遊基金** — 目標金額 + 期限 + Dashboard 進度條，給「為什麼要記帳」情緒鉤子。
13. **PWA 推播通知** — 月底提醒 + 預算 100% 警告，用 Notification API（無 server，本機 timer）。
14. **語音輸入** — Web Speech API：「我買了 120 元的早餐」→ 自動填金額/分類/備註。
15. **Web Share API** — 分享單筆或月報給家人，無後端。
16. **`ReportView.jsx` 的 `computeRange` 收回 `utils/date.js`** — 維護債清理。

### 🟡 待做：中等投資（每項 1–2 天）

17. **分類改名 + 合併** — 套 `migrations.js` 框架做 runtime rename（同步 transactions / templates / recurring / budgets）。
18. **訂閱 / 固定支出自動偵測** — 從 transactions 抓「每月同分類 + 相近金額」推導出 recurring 候選清單。
19. **匯出 PDF / 分享圖卡** — `html2canvas` 把月報變一張可分享圖。
20. **每筆交易附收據圖** — IndexedDB（LocalStorage 5MB 上限），不要 base64 塞 LS。
21. **OCR 拍照辨識金額** — Tesseract.js 中文版，只抓金額 + 商家；中文辨識率不穩，當試驗品。
22. **掃台灣電子發票 QR Code** — `BarcodeDetector` API + 政府電子發票格式解析，掃完直接帶金額 / 商家 / 日期。台灣專屬殺手鐧。
23. **Bundle 切割** — 分析頁 `React.lazy()` + 動態 import，把 Recharts 切出 main chunk（目前 ~640KB）。

### 🟠 待做：較大改動（每項 2–4 天）

24. **帳戶 / 錢包系統** — 現金 / 街口 / 信用卡 / 悠遊卡 + 轉帳。動 Transaction schema、Dashboard、ReportView，但讓 app 從「日記」進化成「資產管理」的分水嶺。
25. **多幣別 + 即時匯率** — `exchangerate.host` 免費 API，快取 24h。
26. **資產淨值追蹤** — 每月手動填現金 / 存款 / 投資餘額，看淨值曲線；不想做帳戶系統時的折中方案。
27. **旅遊分攤帳本** — 多人 AA + 誰欠誰結算；無後端就只能匯出 JSON 互傳。

### 💡 實驗性 / 看心情

- **客製化 accent 顏色** — 主題色 picker，破壞 `var(--accent-color)` 單色設計
- **手勢操作** — 列表項滑動刪除 / 編輯，需要 touch handler 或 framer-motion
- **月初預算結轉** — 上月用剩的滾到下月，定義要怎麼算（全部 / 上限 / 比例）

### ⚠️ 已知問題

- `dist/assets/index-*.js` ~640 KB（Recharts 約佔大半）。目前唯一 chunk，可參考 #23 切割。
- LocalStorage ~5MB 上限：30 個分類 + 數年交易 + 模板 / recurring / budgets 應該還有餘裕，但接收據圖（#20）勢必要遷 IndexedDB。
- 雲端同步是手動觸發；多裝置同步沒有 conflict resolution，後贏。

## 雲端同步（CloudSync）

使用者自己部署 Google Apps Script，貼 webhook URL 進設定。GAS 程式碼在根目錄 `google_apps_script.js`，把交易陣列存進 Google Sheet。
- 上傳：POST `{ action: 'backup', data: transactions }`
- 還原：GET `?action=restore`
