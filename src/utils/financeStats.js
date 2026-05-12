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

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const monthFromOffset = (base, offset) => {
    return toLocalMonthString(new Date(base.getFullYear(), base.getMonth() + offset, 1));
};

const getMonthExpense = (transactions, month) => {
    return transactions
        .filter((transaction) => transaction.type === 'expense' && transaction.date?.startsWith(month))
        .reduce((sum, transaction) => sum + transaction.amount, 0);
};

export const getNextMonthExpenseForecast = (transactions, base = new Date()) => {
    const recentMonths = [-1, -2, -3].map((offset) => monthFromOffset(base, offset));
    const recentValues = recentMonths.map((month) => getMonthExpense(transactions, month));
    const monthsWithData = recentValues.filter((amount) => amount > 0).length;
    const divisor = monthsWithData || recentValues.length;
    const average = recentValues.reduce((sum, amount) => sum + amount, 0) / divisor;

    const nextMonthLastYear = monthFromOffset(base, -11);
    const nearbyLastYearMonths = [-12, -11, -10].map((offset) => monthFromOffset(base, offset));
    const nearbyLastYearValues = nearbyLastYearMonths.map((month) => getMonthExpense(transactions, month));
    const nearbyWithData = nearbyLastYearValues.filter((amount) => amount > 0);
    const lastYearTarget = getMonthExpense(transactions, nextMonthLastYear);
    const nearbyAverage = nearbyWithData.length > 0
        ? nearbyWithData.reduce((sum, amount) => sum + amount, 0) / nearbyWithData.length
        : 0;
    const seasonalFactor = nearbyAverage > 0 && lastYearTarget > 0
        ? clamp(lastYearTarget / nearbyAverage, 0.75, 1.35)
        : 1;
    const amount = Math.round(average * seasonalFactor);

    return {
        amount,
        average: Math.round(average),
        seasonalFactor,
        monthsWithData,
        confidence: monthsWithData >= 3 ? 'high' : monthsWithData >= 1 ? 'medium' : 'low',
    };
};

// 月度心情：依預算使用率 / 收支平衡推出一個 emoji + 文字總結
// 沒設預算時看收支比；有預算時看實際 + 預估超支
export const getMonthlyMood = ({
    budget,
    expense,
    income,
    projectedExpense,
    daysElapsed,
    daysInMonth,
    hasTransactions,
}) => {
    if (!hasTransactions) {
        return { emoji: '✨', label: '新月開始', hint: '還沒有交易，新月的好開始' };
    }

    if (budget > 0) {
        if (expense > budget) {
            return { emoji: '🔥', label: '超支警報', hint: '本月支出已超過預算' };
        }
        if (projectedExpense > budget) {
            return { emoji: '😬', label: '勉強應付', hint: '照目前速度月底可能超支' };
        }
        const ratio = expense / budget;
        const monthHalfPassed = daysElapsed >= daysInMonth / 2;
        if (ratio < 0.5 && monthHalfPassed) {
            return { emoji: '🎉', label: '太會省', hint: '預算用不到一半，月底鐵定達標' };
        }
        if (ratio < 0.8) {
            return { emoji: '😌', label: '穩穩守住', hint: '預算控制中，繼續保持' };
        }
        return { emoji: '😅', label: '逼近上限', hint: '預算快用完了，省著點' };
    }

    if (income === 0) {
        return { emoji: '💸', label: '只出不進', hint: '本月還沒有收入紀錄' };
    }
    if (income >= expense * 2) {
        return { emoji: '🎉', label: '收入翻倍', hint: '收入是支出的兩倍以上' };
    }
    if (income >= expense) {
        return { emoji: '😌', label: '正向結餘', hint: '本月收入大於支出' };
    }
    return { emoji: '😬', label: '入不敷出', hint: '本月支出超過收入' };
};

export const getMoneyInsights = (transactions, monthlyBudget = 0) => {
    const now = new Date();
    const today = toLocalDateString(now);
    const { start: monthStart } = getMonthRange();
    const month = toLocalMonthString();
    const previousMonth = toLocalMonthString(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const monthTransactions = transactions.filter((t) => t.date?.startsWith(month));
    const previousMonthTransactions = transactions.filter((t) => t.date?.startsWith(previousMonth));
    const monthExpense = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    const monthIncome = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const previousMonthExpense = previousMonthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    const previousMonthIncome = previousMonthTransactions
        .filter((t) => t.type === 'income')
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
    const daysElapsed = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyAverageExpense = daysElapsed > 0 ? monthExpense / daysElapsed : 0;
    const projectedMonthExpense = Math.round(dailyAverageExpense * daysInMonth);
    const nextMonthExpenseForecast = getNextMonthExpenseForecast(transactions, now);

    const getComparison = (current, previous) => {
        const diff = current - previous;
        if (previous === 0) {
            return {
                current,
                previous,
                diff,
                percent: current === 0 ? 0 : null,
                label: current === 0 ? '與上月持平' : '上月無資料',
            };
        }
        return {
            current,
            previous,
            diff,
            percent: Math.round((diff / previous) * 100),
            label: `${diff >= 0 ? '+' : ''}${Math.round((diff / previous) * 100)}%`,
        };
    };

    const badges = [];
    if (transactions.length > 0) badges.push({ key: 'first', label: '第一筆完成', hint: '已開始累積自己的金流地圖' });
    if (streak >= 3) badges.push({ key: 'streak3', label: '連記 3 天', hint: '記帳習慣正在成形' });
    if (streak >= 7) badges.push({ key: 'streak7', label: '連記 7 天', hint: '穩定度很漂亮' });
    if (noExpenseDays >= 3) badges.push({ key: 'zero3', label: '本月 3 天無支出', hint: '有幾天守住錢包了' });
    if (monthlyBudget > 0 && monthExpense <= monthlyBudget) {
        badges.push({ key: 'budget', label: '預算守門員', hint: '目前仍在本月預算內' });
    }
    if (monthTransactions.length >= 30) badges.push({ key: 'power', label: '紀錄達人', hint: '本月已累積 30 筆以上紀錄' });

    const monthMood = getMonthlyMood({
        budget: monthlyBudget,
        expense: monthExpense,
        income: monthIncome,
        projectedExpense: projectedMonthExpense,
        daysElapsed,
        daysInMonth,
        hasTransactions: monthTransactions.length > 0,
    });

    return {
        dailyAllowance,
        dailyAverageExpense,
        projectedMonthExpense,
        projectedOverspend: monthlyBudget > 0 ? Math.max(0, projectedMonthExpense - monthlyBudget) : 0,
        projectedExpenseRatio: monthlyBudget > 0 ? projectedMonthExpense / monthlyBudget : 0,
        nextMonthExpenseForecast,
        daysElapsed,
        daysInMonth,
        noExpenseDays,
        streak,
        monthComparison: {
            expense: getComparison(monthExpense, previousMonthExpense),
            income: getComparison(monthIncome, previousMonthIncome),
        },
        monthMood,
        badges,
    };
};
