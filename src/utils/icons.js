// Emoji 圖示分組（給分類 picker 用）
// 每組 ~12-16 個，方便手機一頁看完
export const ICON_GROUPS = [
    {
        key: 'food',
        label: '飲食',
        icons: ['🍽️', '🍔', '🍕', '🍜', '🍱', '🍣', '🍰', '🍩', '🍪', '☕', '🥤', '🍺', '🍷', '🥗', '🍳', '🥟']
    },
    {
        key: 'transport',
        label: '交通',
        icons: ['🚗', '🚌', '🚆', '🚇', '🚕', '✈️', '🛵', '⛽', '🚲', '🅿️', '🛴', '🚢']
    },
    {
        key: 'shopping',
        label: '購物',
        icons: ['🛒', '🛍️', '👕', '👟', '👜', '💄', '📱', '💻', '⌚', '💍', '🧴', '🧸']
    },
    {
        key: 'entertainment',
        label: '娛樂',
        icons: ['🎮', '🎬', '🎵', '🎤', '🎨', '📺', '🎲', '🏖️', '🎢', '🎟️', '📚', '🎸']
    },
    {
        key: 'home',
        label: '居家',
        icons: ['🏠', '🛏️', '💡', '🔧', '🧹', '🚿', '🪑', '🌱', '🧺', '🪟', '🛋️', '🍳']
    },
    {
        key: 'health',
        label: '健康',
        icons: ['🏥', '💊', '🩺', '💉', '🦷', '💪', '🏃', '🧘', '⚽', '🚴', '🏋️', '🥦']
    },
    {
        key: 'edu',
        label: '教育',
        icons: ['📚', '📖', '✏️', '🎓', '🎒', '🧮', '🖊️', '📝', '🔬', '🌐', '🗂️', '📐']
    },
    {
        key: 'work',
        label: '工作',
        icons: ['💼', '💰', '💵', '💸', '📈', '📉', '🧾', '🏦', '💳', '🪙', '📊', '🪪']
    },
    {
        key: 'family',
        label: '家人',
        icons: ['👨‍👩‍👧', '👶', '🐶', '🐱', '🐰', '🍼', '🎂', '🎁', '💌', '🎀', '🎉', '❤️']
    },
    {
        key: 'travel',
        label: '旅行',
        icons: ['🧳', '🗺️', '🏨', '🏝️', '🗽', '🗼', '⛺', '🎿', '🏔️', '🛳️', '📷', '🛂']
    },
    {
        key: 'others',
        label: '其他',
        icons: ['✨', '📦', '❓', '⭐', '🎯', '🔔', '🔑', '🎩', '🌈', '☘️', '🎰', '🪄']
    }
];

// 從分類字串擷取 emoji 與名稱（'🍽️ 餐飲' → { icon, name }）
// 規範：emoji 永遠在最前，後面接空白，再接名稱
export function splitCategory(cat) {
    if (!cat) return { icon: '', name: '' };
    const trimmed = cat.trim();
    // 用 Intl.Segmenter 抓第一個 grapheme（emoji 可能多 codepoint）
    try {
        const seg = new Intl.Segmenter('zh', { granularity: 'grapheme' });
        const first = seg.segment(trimmed)[Symbol.iterator]().next().value;
        if (first) {
            const icon = first.segment;
            // 檢查是否為 emoji（粗略：非 ASCII 英數字）
            if (!/^[\w一-鿿]$/.test(icon)) {
                const rest = trimmed.slice(icon.length).trim();
                return { icon, name: rest };
            }
        }
    } catch {
        // Fallback：用空白分割
        const idx = trimmed.indexOf(' ');
        if (idx > 0) {
            return { icon: trimmed.slice(0, idx), name: trimmed.slice(idx + 1).trim() };
        }
    }
    return { icon: '', name: trimmed };
}

export function joinCategory(icon, name) {
    const i = (icon || '').trim();
    const n = (name || '').trim();
    if (!n) return i;
    if (!i) return n;
    return `${i} ${n}`;
}
