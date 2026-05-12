import { addDays, toLocalDateString } from './date';

const EXPENSE_RULES = [
    {
        keywords: ['星巴克', '咖啡', '拿鐵', '美式', '路易莎', 'cama', 'latte'],
        targets: ['咖啡', '☕'],
        label: '咖啡',
    },
    {
        keywords: ['早餐', '午餐', '晚餐', '便當', '餐', '吃', '火鍋', '拉麵', '麥當勞', '肯德基', '宵夜', '飲料', '珍奶'],
        targets: ['飲食', '餐', '食', '🍱', '🍜'],
        label: '飲食',
    },
    {
        keywords: ['捷運', '公車', '高鐵', '火車', '計程車', 'uber', '加油', '停車', '交通'],
        targets: ['交通', '車', '捷運', '🚇', '🚗'],
        label: '交通',
    },
    {
        keywords: ['全聯', '家樂福', '好市多', '超市', '日用品', '衛生紙', '洗衣精'],
        targets: ['日用', '購物', '生活', '🛒'],
        label: '日用品',
    },
    {
        keywords: ['房租', '租金', '管理費', '水費', '電費', '瓦斯', '網路費', '電信', '電話費'],
        targets: ['居住', '水電', '通訊', '房', '🏠', '📱'],
        label: '居住水電',
    },
    {
        keywords: ['醫院', '診所', '藥局', '藥', '看醫生', '牙醫', '保健'],
        targets: ['醫療', '健康', '藥', '💊'],
        label: '醫療',
    },
    {
        keywords: ['電影', 'netflix', 'spotify', '遊戲', '演唱會', '娛樂', '訂閱'],
        targets: ['娛樂', '訂閱', '遊戲', '🎬'],
        label: '娛樂',
    },
    {
        keywords: ['機票', '飯店', '住宿', '旅遊', '京都', '東京', '旅行'],
        targets: ['旅遊', '旅行', '✈️', '🧳'],
        label: '旅遊',
    },
    {
        keywords: ['發票', '電子發票', '載具'],
        targets: ['日用', '購物', '其他', '🧾', '📦'],
        label: '發票',
    },
];

const INCOME_RULES = [
    {
        keywords: ['薪水', '薪資', '工資', '月薪', '薪'],
        targets: ['薪', '薪水', '💼'],
        label: '薪水',
    },
    {
        keywords: ['年終', '獎金', 'bonus', '分紅'],
        targets: ['獎金', '年終', '🎁'],
        label: '獎金',
    },
    {
        keywords: ['退款', '退費', '退貨', '回饋', '回饋金'],
        targets: ['退款', '回饋', '其他', '↩', '💰'],
        label: '退款回饋',
    },
];

const NUMBER_MAP = {
    零: 0,
    〇: 0,
    一: 1,
    二: 2,
    兩: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
};

const UNIT_MAP = {
    十: 10,
    百: 100,
    千: 1000,
    萬: 10000,
};

const normalize = (value = '') => String(value).toLowerCase();

const findCategory = (categoryList = [], targets = []) => {
    return categoryList.find((category) => {
        const text = normalize(category);
        return targets.some((target) => text.includes(normalize(target)));
    });
};

const matchRule = (text, rules) => {
    const normalized = normalize(text);
    return rules.find((rule) => rule.keywords.some((keyword) => normalized.includes(normalize(keyword))));
};

export const suggestCategoryFromText = (text, categories) => {
    if (!text?.trim() || !categories) return null;

    const incomeRule = matchRule(text, INCOME_RULES);
    if (incomeRule) {
        const category = findCategory(categories.income, incomeRule.targets);
        if (category) {
            return {
                type: 'income',
                category,
                label: incomeRule.label,
            };
        }
    }

    const expenseRule = matchRule(text, EXPENSE_RULES);
    if (expenseRule) {
        const category = findCategory(categories.expense, expenseRule.targets);
        if (category) {
            return {
                type: 'expense',
                category,
                label: expenseRule.label,
            };
        }
    }

    return null;
};

const parseChineseNumber = (value) => {
    let total = 0;
    let section = 0;
    let number = 0;

    for (const char of value) {
        if (Object.prototype.hasOwnProperty.call(NUMBER_MAP, char)) {
            number = NUMBER_MAP[char];
            continue;
        }

        const unit = UNIT_MAP[char];
        if (!unit) return null;

        if (unit === 10000) {
            section = (section + number) * unit;
            total += section;
            section = 0;
        } else {
            section += (number || 1) * unit;
        }
        number = 0;
    }

    return total + section + number;
};

export const parseAmountFromText = (text = '') => {
    const arabic = String(text).match(/(\d+(?:\.\d+)?)\s*(?:元|塊|塊錢|台幣|twd)?/i);
    if (arabic) return Number(arabic[1]);

    const chinese = String(text).match(/[零〇一二兩三四五六七八九十百千萬]+(?=\s*(?:元|塊|塊錢|台幣|買|花|付|早餐|午餐|晚餐|咖啡|飲料|薪水|獎金))/);
    if (!chinese) return null;

    const amount = parseChineseNumber(chinese[0]);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const parseDateFromText = (text = '') => {
    if (text.includes('前天')) return addDays(toLocalDateString(), -2);
    if (text.includes('昨天')) return addDays(toLocalDateString(), -1);
    if (text.includes('明天')) return addDays(toLocalDateString(), 1);
    return toLocalDateString();
};

export const parseSpokenTransaction = (text = '', categories) => {
    const amount = parseAmountFromText(text);
    const suggestion = suggestCategoryFromText(text, categories);
    const incomeLike = matchRule(text, INCOME_RULES);

    return {
        type: suggestion?.type || (incomeLike ? 'income' : 'expense'),
        amount,
        category: suggestion?.category || '',
        date: parseDateFromText(text),
        note: text.trim(),
        suggestion,
    };
};
