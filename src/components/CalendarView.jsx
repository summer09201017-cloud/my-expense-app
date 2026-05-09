import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import './CalendarView.css';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const formatMoney = (n) => new Intl.NumberFormat('zh-TW', {
    style: 'currency', currency: 'TWD', minimumFractionDigits: 0
}).format(n);

const ymd = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export function CalendarView({ transactions, onDelete, onEdit, onCopy }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState(ymd(today));

    // 該月格子（含補上前後月份的日期，湊滿 6×7）
    const cells = useMemo(() => {
        const first = new Date(year, month, 1);
        const startWeekday = first.getDay();
        const cells = [];
        // 前面補上一個月的日期
        for (let i = startWeekday - 1; i >= 0; i--) {
            const d = new Date(year, month, -i);
            cells.push({ date: d, inMonth: false });
        }
        // 當月
        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= lastDay; d++) {
            cells.push({ date: new Date(year, month, d), inMonth: true });
        }
        // 補滿 42 格（6 週）
        while (cells.length < 42) {
            const offset = cells.length - (startWeekday + lastDay) + 1;
            cells.push({ date: new Date(year, month + 1, offset), inMonth: false });
        }
        return cells;
    }, [year, month]);

    // 每日加總
    const dailyTotals = useMemo(() => {
        const map = new Map();
        const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
        transactions.forEach(t => {
            if (!t.date) return;
            // 只算當月（含補進來的前後日期會少算，但是 user 只關注主月份）
            if (!t.date.startsWith(monthPrefix.slice(0, 7))) {
                // 仍嘗試比對前後溢出格
                const key = t.date;
                if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
            }
            const key = t.date;
            const cur = map.get(key) || { income: 0, expense: 0 };
            if (t.type === 'income') cur.income += t.amount;
            else cur.expense += t.amount;
            map.set(key, cur);
        });
        return map;
    }, [transactions, year, month]);

    // 月總結
    const monthSummary = useMemo(() => {
        const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
        return transactions.reduce((acc, t) => {
            if (!t.date || !t.date.startsWith(monthPrefix)) return acc;
            if (t.type === 'income') acc.income += t.amount;
            else acc.expense += t.amount;
            return acc;
        }, { income: 0, expense: 0 });
    }, [transactions, year, month]);

    // 當日明細
    const dayTransactions = useMemo(() => {
        return transactions
            .filter(t => t.date === selectedDate)
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }, [transactions, selectedDate]);

    const dayTotals = dayTransactions.reduce((acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
    }, { income: 0, expense: 0 });

    const goPrev = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const goNext = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };
    const goToday = () => {
        const t = new Date();
        setYear(t.getFullYear());
        setMonth(t.getMonth());
        setSelectedDate(ymd(t));
    };

    const todayStr = ymd(today);

    return (
        <div className="calendar-view">
            <div className="calendar-card glass-panel animate-slide-up">
                <div className="calendar-header">
                    <button type="button" className="cal-nav" onClick={goPrev} aria-label="上個月">
                        <ChevronLeft size={20} />
                    </button>
                    <button type="button" className="cal-title" onClick={goToday} title="回到今天">
                        {year} 年 {month + 1} 月
                    </button>
                    <button type="button" className="cal-nav" onClick={goNext} aria-label="下個月">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="cal-month-summary">
                    <div className="cal-summary-item income">
                        <span>本月收入</span>
                        <strong>{formatMoney(monthSummary.income)}</strong>
                    </div>
                    <div className="cal-summary-item expense">
                        <span>本月支出</span>
                        <strong>{formatMoney(monthSummary.expense)}</strong>
                    </div>
                    <div className="cal-summary-item net">
                        <span>淨額</span>
                        <strong className={monthSummary.income - monthSummary.expense >= 0 ? 'pos' : 'neg'}>
                            {formatMoney(monthSummary.income - monthSummary.expense)}
                        </strong>
                    </div>
                </div>

                <div className="cal-weekdays">
                    {WEEKDAYS.map((w, i) => (
                        <div key={w} className={`cal-weekday ${i === 0 ? 'sun' : ''} ${i === 6 ? 'sat' : ''}`}>{w}</div>
                    ))}
                </div>

                <div className="cal-grid">
                    {cells.map(({ date, inMonth }) => {
                        const key = ymd(date);
                        const totals = dailyTotals.get(key);
                        const isToday = key === todayStr;
                        const isSelected = key === selectedDate;
                        return (
                            <button
                                type="button"
                                key={key}
                                className={`cal-cell ${inMonth ? '' : 'out-month'} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                                onClick={() => setSelectedDate(key)}
                            >
                                <span className="cal-day-num">{date.getDate()}</span>
                                {totals && inMonth && (
                                    <span className="cal-day-totals">
                                        {totals.income > 0 && (
                                            <span className="cal-tot income">+{totals.income >= 1000 ? `${(totals.income / 1000).toFixed(1)}k` : totals.income}</span>
                                        )}
                                        {totals.expense > 0 && (
                                            <span className="cal-tot expense">−{totals.expense >= 1000 ? `${(totals.expense / 1000).toFixed(1)}k` : totals.expense}</span>
                                        )}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="cal-day-panel glass-panel animate-slide-up">
                <div className="cal-day-header">
                    <h3>
                        {new Date(selectedDate).toLocaleDateString('zh-TW', {
                            month: 'long', day: 'numeric', weekday: 'long'
                        })}
                    </h3>
                    <div className="cal-day-summary">
                        <span className="income">+{formatMoney(dayTotals.income)}</span>
                        <span className="expense">−{formatMoney(dayTotals.expense)}</span>
                    </div>
                </div>

                {dayTransactions.length === 0 ? (
                    <p className="cal-empty">這天沒有任何紀錄 📝</p>
                ) : (
                    <ul className="cal-day-list">
                        {dayTransactions.map(t => (
                            <li key={t.id} className="cal-day-item">
                                <div className="cal-item-left">
                                    <span className={`cal-type-badge ${t.type}`}>
                                        {t.type === 'income' ? '收' : '支'}
                                    </span>
                                    <div>
                                        <div className="cal-item-cat">{t.category}</div>
                                        {t.note && <div className="cal-item-note">{t.note}</div>}
                                    </div>
                                </div>
                                <div className="cal-item-right">
                                    <span className={`cal-item-amt ${t.type}`}>
                                        {t.type === 'income' ? '+' : '−'}{formatMoney(t.amount)}
                                    </span>
                                    <div className="cal-item-actions">
                                        <button type="button" onClick={() => onCopy(t)} title="複製">⧉</button>
                                        <button type="button" onClick={() => onEdit(t)} title="編輯">✎</button>
                                        <button type="button" onClick={() => onDelete(t.id)} title="刪除">
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
