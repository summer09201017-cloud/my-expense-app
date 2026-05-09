// 集中處理 LocalStorage schema 升級。從 main.jsx 開機時呼叫一次，必須在任何 hook
// 讀取 localStorage 之前完成。每次 bump CURRENT_VERSION 並補上對應的 rename map。
//
// v4：預設分類擴張到 30 個（20 支出 + 10 收入），並重新命名既有預設以維持一致風格。

const VERSION_KEY = 'categories_defaults_version';
const CURRENT_VERSION = 4;

// 既有分類字串 → 新字串。沒列在這裡的視為使用者自訂，不動。
const EXPENSE_RENAMES = {
    '🍽️ 餐飲': '🍱 飲食',
    '🚌 交通': '🚇 交通',
    '🏠 居住': '🏠 居家',
    '🍿 娛樂': '🎮 娛樂',
    '🏥 醫療': '💊 醫療',
    '✈️ 旅行': '✈️ 旅遊',
    '📺 訂閱': '🔔 訂閱',
    '🐶 寵物': '🐾 寵物',
    '💄 美容': '💅 美容',
    '🎁 送禮': '🎁 禮物',
    '💡 水電': '💡 水電瓦斯',
};

const INCOME_RENAMES = {
    '🎁 獎金': '🏆 獎金',
    '🔁 退款': '↩️ 退款',
    '💻 副業': '💼 兼職',
    '✨ 其他': '📦 其他',
};

export const V4_EXPENSE = [
    '🍱 飲食', '🚇 交通', '🏠 居家', '🎮 娛樂', '💊 醫療',
    '🛍️ 購物', '📚 教育', '✈️ 旅遊', '📱 通訊', '🔔 訂閱',
    '🐾 寵物', '💅 美容', '🛡️ 保險', '🧾 稅費', '🎁 禮物',
    '👨‍👩‍👧 孝親', '💝 捐贈', '🏃 運動', '💡 水電瓦斯', '📦 其他',
];

export const V4_INCOME = [
    '💰 薪資', '🏆 獎金', '📈 投資', '↩️ 退款', '💼 兼職',
    '🧧 紅包', '🏦 利息', '🏘️ 租金', '💌 禮金', '📦 其他',
];

const renameList = (list, map) => list.map((c) => map[c] || c);

const dedupe = (list) => {
    const seen = new Set();
    return list.filter((c) => {
        if (!c || seen.has(c)) return false;
        seen.add(c);
        return true;
    });
};

// 把使用者既有自訂分類插在 V4 預設「其他」之前，已被刪掉的舊預設不會被救回；
// 若使用者刪掉的是 V4 預設（例如 飲食），會被本次升級強制加回——使用者明確要求 V4 = 30 個。
const mergeWithCustoms = (renamedUser, v4List, otherKey) => {
    const v4Set = new Set(v4List);
    const customs = dedupe(renamedUser.filter((c) => !v4Set.has(c)));
    if (customs.length === 0) return v4List.slice();
    const idx = v4List.indexOf(otherKey);
    if (idx < 0) return [...v4List, ...customs];
    return [...v4List.slice(0, idx), ...customs, ...v4List.slice(idx)];
};

const renameByType = (raw) => {
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return null;
        let touched = false;
        const next = parsed.map((item) => {
            const map = item?.type === 'income' ? INCOME_RENAMES : EXPENSE_RENAMES;
            if (item?.category && map[item.category]) {
                touched = true;
                return { ...item, category: map[item.category] };
            }
            return item;
        });
        return touched ? next : null;
    } catch {
        return null;
    }
};

export function runCategoryMigrations() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const ver = Number(localStorage.getItem(VERSION_KEY)) || 0;
    if (ver >= CURRENT_VERSION) return;

    // 1. categories
    const savedCats = localStorage.getItem('categories');
    let nextCats;
    if (!savedCats) {
        nextCats = { expense: V4_EXPENSE.slice(), income: V4_INCOME.slice() };
    } else {
        try {
            const parsed = JSON.parse(savedCats);
            const renamedExpense = renameList(
                Array.isArray(parsed?.expense) ? parsed.expense : [],
                EXPENSE_RENAMES
            );
            const renamedIncome = renameList(
                Array.isArray(parsed?.income) ? parsed.income : [],
                INCOME_RENAMES
            );
            nextCats = {
                expense: mergeWithCustoms(renamedExpense, V4_EXPENSE, '📦 其他'),
                income: mergeWithCustoms(renamedIncome, V4_INCOME, '📦 其他'),
            };
        } catch (e) {
            console.error('migrations: failed to parse categories, falling back to V4 defaults', e);
            nextCats = { expense: V4_EXPENSE.slice(), income: V4_INCOME.slice() };
        }
    }
    localStorage.setItem('categories', JSON.stringify(nextCats));

    // 2. transactions / quick_templates / recurring_transactions —— 同樣 { type, category } 形狀
    for (const key of ['transactions', 'quick_templates', 'recurring_transactions']) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const next = renameByType(raw);
        if (next) localStorage.setItem(key, JSON.stringify(next));
    }

    // 3. category_budgets —— object，key 是支出分類字串
    const savedBudgets = localStorage.getItem('category_budgets');
    if (savedBudgets) {
        try {
            const parsed = JSON.parse(savedBudgets);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                let touched = false;
                const migrated = {};
                for (const [cat, val] of Object.entries(parsed)) {
                    const next = EXPENSE_RENAMES[cat] || cat;
                    if (next !== cat) touched = true;
                    migrated[next] = val;
                }
                if (touched) localStorage.setItem('category_budgets', JSON.stringify(migrated));
            }
        } catch (e) {
            console.error('migrations: failed to parse category_budgets', e);
        }
    }

    localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
}
