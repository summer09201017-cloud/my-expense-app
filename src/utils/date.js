const pad = (n) => String(n).padStart(2, '0');

export const toLocalDateString = (date = new Date()) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const toLocalMonthString = (date = new Date()) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
};

export const parseLocalDate = (dateString) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
};

export const addDays = (dateString, amount) => {
    const date = parseLocalDate(dateString);
    if (!date) return '';
    date.setDate(date.getDate() + amount);
    return toLocalDateString(date);
};

export const getWeekRange = (base = new Date()) => {
    const start = new Date(base);
    start.setHours(0, 0, 0, 0);
    const diff = start.getDay() === 0 ? 6 : start.getDay() - 1;
    start.setDate(start.getDate() - diff);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: toLocalDateString(start), end: toLocalDateString(end) };
};

export const getMonthRange = (base = new Date()) => {
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    return { start: toLocalDateString(start), end: toLocalDateString(end) };
};

export const getDateRange = (key) => {
    const today = new Date();
    switch (key) {
        case 'today': {
            const value = toLocalDateString(today);
            return { start: value, end: value };
        }
        case 'week':
            return getWeekRange(today);
        case 'month':
            return getMonthRange(today);
        case 'all':
        default:
            return { start: null, end: null };
    }
};

export const isDateInRange = (dateString, start, end) => {
    if (!dateString) return false;
    if (start && dateString < start) return false;
    if (end && dateString > end) return false;
    return true;
};

export const daysRemainingInMonth = (base = new Date()) => {
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    return Math.max(1, end.getDate() - base.getDate() + 1);
};

export const localDateForMonthDay = (monthString, day) => {
    const [year, month] = monthString.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const safeDay = Math.min(Math.max(Number(day) || 1, 1), lastDay);
    return `${year}-${pad(month)}-${pad(safeDay)}`;
};

export const lastNDays = (n) => {
    const out = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = n - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        out.push(toLocalDateString(date));
    }
    return out;
};

export const lastNMonths = (n) => {
    const out = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        out.push(toLocalMonthString(date));
    }
    return out;
};
