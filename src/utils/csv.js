// 解析符合 RFC4180 / Excel 風格的 CSV：支援雙引號內逗號、雙雙引號逃逸、CRLF
const parseCSV = (text) => {
    // 去除 BOM
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') { cell += '"'; i++; }
                else inQuotes = false;
            } else {
                cell += ch;
            }
        } else {
            if (ch === '"') inQuotes = true;
            else if (ch === ',') { row.push(cell); cell = ''; }
            else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
            else if (ch === '\r') { /* 略過 */ }
            else cell += ch;
        }
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.length && r.some(c => c.trim() !== ''));
};

// 將 CSV 字串轉為 transaction 陣列。支援我們匯出的格式：ID,類型,金額,分類,日期,備註,建立時間
export const csvToTransactions = (text) => {
    const rows = parseCSV(text);
    if (rows.length === 0) return { transactions: [], skipped: 0 };

    const headers = rows[0].map(h => h.trim());
    const idx = (name) => headers.findIndex(h => h === name);

    const iId = idx('ID');
    const iType = idx('類型');
    const iAmount = idx('金額');
    const iCategory = idx('分類');
    const iDate = idx('日期');
    const iNote = idx('備註');
    const iCreated = idx('建立時間');

    if (iType < 0 || iAmount < 0 || iCategory < 0 || iDate < 0) {
        throw new Error('CSV 欄位不符（需含 類型/金額/分類/日期）');
    }

    let skipped = 0;
    const transactions = [];
    for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        const typeRaw = (row[iType] || '').trim();
        const amount = Number(row[iAmount]);
        const category = (row[iCategory] || '').trim();
        const date = (row[iDate] || '').trim();
        if (!typeRaw || !category || !date || !Number.isFinite(amount) || amount <= 0) {
            skipped++;
            continue;
        }
        const type = typeRaw === '收入' || typeRaw === 'income' ? 'income' : 'expense';
        transactions.push({
            id: (iId >= 0 && row[iId] && row[iId].trim()) || crypto.randomUUID(),
            type,
            amount,
            category,
            date,
            note: iNote >= 0 ? (row[iNote] || '') : '',
            createdAt: (iCreated >= 0 && row[iCreated]) || new Date().toISOString(),
        });
    }
    return { transactions, skipped };
};
