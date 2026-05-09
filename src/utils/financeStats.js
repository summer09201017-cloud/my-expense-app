import {
    addDays,
    daysRemainingInMonth,
    getMonthRange,
    toLocalDateString,
    toLocalMonthString,
} from './date';

export const getCategorySpending = (transactions, month = toLocalMonthString()) => {
    return transactions.reduce((acc, transaction) => {
        if (transaction.type !== 'expense' || !transaction.date?.startsWith(month)) return acc;
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        return acc;
    }, {});
};

export const getMoneyInsights = (transactions, monthlyBudget = 0) => {
    const today = toLocalDateString();
    const { start: monthStart } = getMonthRange();
    const month = toLocalMonthString();
    const monthTransactions = transactions.filter((t) => t.date?.startsWith(month));
    const monthExpense = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const expenseDates = new Set(
        monthTransactions.filter((t) => t.type === 'expense').map((t) => t.date)
    );
    let noExpenseDays = 0;
    for (let day = monthStart; day <= today; day = addDays(day, 1)) {
        if (!expenseDates.has(day)) noExpenseDays += 1;
        if (day === today) break;
    }

    const activeDates = new Set(transactions.map((t) => t.date).filter(Boolean));
    let streak = 0;
    for (let day = today; activeDates.has(day); day = addDays(day, -1)) {
        streak += 1;
    }

    const remainingBudget = Math.max(0, monthlyBudget - monthExpense);
    const dailyAllowance = monthlyBudget > 0
        ? Math.floor(remainingBudget / daysRemainingInMonth())
        : 0;

    const badges = [];
    if (transactions.length > 0) badges.push({ key: 'first', label: '第一筆完成', hint: '已開始累積自己的金流地圖' });
    if (streak >= 3) badges.push({ key: 'streak3', label: '連記 3 天', hint: '記帳習慣正在成形' });
    if (streak >= 7) badges.push({ key: 'streak7', label: '連記 7 天', hint: '穩定度很漂亮' });
    if (noExpenseDays >= 3) badges.push({ key: 'zero3', label: '本月 3 天無支出', hint: '有幾天守住錢包了' });
    if (monthlyBudget > 0 && monthExpense <= monthlyBudget) {
        badges.push({ key: 'budget', label: '預算守門員', hint: '目前仍在本月預算內' });
    }
    if (monthTransactions.length >= 30) badges.push({ key: 'power', label: '紀錄達人', hint: '本月已累積 30 筆以上紀錄' });

    return {
        dailyAllowance,
        noExpenseDays,
        streak,
        badges,
    };
};
