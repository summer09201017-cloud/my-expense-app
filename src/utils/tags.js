const TAG_REGEX = /#[\p{L}\p{N}_-]+/gu;

export const extractTags = (note = '') => {
    const matches = String(note).match(TAG_REGEX) || [];
    const seen = new Set();
    return matches
        .map((tag) => tag.slice(1).trim())
        .filter(Boolean)
        .filter((tag) => {
            const key = tag.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
};

export const hasTag = (transaction, tag) => {
    if (!tag) return true;
    const target = tag.toLowerCase();
    return extractTags(transaction.note).some((item) => item.toLowerCase() === target);
};

export const getTagStats = (transactions) => {
    const stats = new Map();

    transactions.forEach((transaction) => {
        extractTags(transaction.note).forEach((tag) => {
            const key = tag.toLowerCase();
            const previous = stats.get(key) || {
                tag,
                count: 0,
                income: 0,
                expense: 0,
            };

            previous.count += 1;
            if (transaction.type === 'income') previous.income += transaction.amount;
            if (transaction.type === 'expense') previous.expense += transaction.amount;
            stats.set(key, previous);
        });
    });

    return [...stats.values()].sort((a, b) => b.count - a.count || b.expense - a.expense);
};
