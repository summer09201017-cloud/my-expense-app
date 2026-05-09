import { useState } from 'react';
import {
    BellRing,
    Check,
    Monitor,
    Moon,
    Palette,
    PlusCircle,
    Smartphone,
    Sun,
    Trash2,
    WalletCards,
} from 'lucide-react';
import './SettingsView.css';

const formatMoney = (amount) => new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
}).format(amount);

const themeOptions = [
    { key: 'light', label: '淺色', Icon: Sun },
    { key: 'dark', label: '深色', Icon: Moon },
    { key: 'system', label: '跟隨系統', Icon: Monitor },
];

export function SettingsView({
    theme,
    setTheme,
    pwa,
    categories,
    categoryBudgets,
    setCategoryBudget,
    recurringRules,
    addRecurringRule,
    updateRecurringRule,
    deleteRecurringRule,
    onPostRecurring,
}) {
    const [ruleType, setRuleType] = useState('expense');
    const [ruleAmount, setRuleAmount] = useState('');
    const [ruleCategory, setRuleCategory] = useState(categories.expense[0] || '');
    const [ruleNote, setRuleNote] = useState('');
    const [ruleDay, setRuleDay] = useState(1);

    const handleRuleTypeChange = (nextType) => {
        setRuleType(nextType);
        setRuleCategory(categories[nextType][0] || '');
    };

    const handleAddRule = (event) => {
        event.preventDefault();
        const ok = addRecurringRule({
            type: ruleType,
            amount: ruleAmount,
            category: ruleCategory,
            note: ruleNote,
            dayOfMonth: ruleDay,
        });
        if (!ok) {
            alert('請輸入有效的固定交易內容');
            return;
        }
        setRuleAmount('');
        setRuleNote('');
        setRuleDay(1);
    };

    return (
        <div className="settings-view">
            <section className="settings-section glass-panel animate-slide-up">
                <div className="settings-title">
                    <Palette size={18} />
                    <h3>外觀與 PWA</h3>
                </div>

                <div className="theme-segment" role="group" aria-label="主題模式">
                    {themeOptions.map((option) => {
                        const ThemeChoiceIcon = option.Icon;
                        return (
                            <button
                                type="button"
                                key={option.key}
                                className={`theme-choice ${theme === option.key ? 'active' : ''}`}
                                onClick={() => setTheme(option.key)}
                            >
                                <ThemeChoiceIcon size={16} />
                                <span>{option.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="pwa-panel">
                    <div>
                        <div className="pwa-title">
                            <Smartphone size={18} />
                            <span>安裝成手機 App</span>
                        </div>
                        <p>
                            {pwa.isStandalone
                                ? '目前已用 PWA 模式開啟。'
                                : pwa.canInstall
                                    ? '此瀏覽器已可安裝，點一下就能加到桌面。'
                                    : '若看不到安裝提示，請用瀏覽器選單的「加到主畫面」。'}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="install-btn"
                        onClick={pwa.install}
                        disabled={pwa.isStandalone || !pwa.canInstall}
                    >
                        <Check size={16} />
                        {pwa.isStandalone ? '已安裝' : '安裝'}
                    </button>
                </div>
            </section>

            <section className="settings-section glass-panel animate-slide-up">
                <div className="settings-title">
                    <WalletCards size={18} />
                    <h3>分類預算</h3>
                </div>
                <div className="category-budget-list">
                    {categories.expense.map((category) => (
                        <label key={category} className="category-budget-row">
                            <span>{category}</span>
                            <input
                                type="number"
                                min="0"
                                inputMode="numeric"
                                value={categoryBudgets[category] || ''}
                                placeholder="不限制"
                                onChange={(event) => setCategoryBudget(category, event.target.value)}
                            />
                        </label>
                    ))}
                </div>
            </section>

            <section className="settings-section glass-panel animate-slide-up">
                <div className="settings-title">
                    <BellRing size={18} />
                    <h3>每月固定交易 / 訂閱提醒</h3>
                </div>

                <form className="recurring-form" onSubmit={handleAddRule}>
                    <div className="recurring-type">
                        <button
                            type="button"
                            className={ruleType === 'expense' ? 'active expense' : ''}
                            onClick={() => handleRuleTypeChange('expense')}
                        >
                            支出
                        </button>
                        <button
                            type="button"
                            className={ruleType === 'income' ? 'active income' : ''}
                            onClick={() => handleRuleTypeChange('income')}
                        >
                            收入
                        </button>
                    </div>
                    <input
                        type="number"
                        min="1"
                        inputMode="decimal"
                        value={ruleAmount}
                        placeholder="金額"
                        onChange={(event) => setRuleAmount(event.target.value)}
                    />
                    <select value={ruleCategory} onChange={(event) => setRuleCategory(event.target.value)}>
                        {categories[ruleType].map((category) => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        min="1"
                        max="31"
                        value={ruleDay}
                        onChange={(event) => setRuleDay(event.target.value)}
                        aria-label="每月幾號"
                    />
                    <input
                        type="text"
                        value={ruleNote}
                        placeholder="名稱，例如 Netflix / 房租"
                        onChange={(event) => setRuleNote(event.target.value)}
                    />
                    <button type="submit" className="add-recurring-btn">
                        <PlusCircle size={16} />
                        新增提醒
                    </button>
                </form>

                <div className="recurring-list">
                    {recurringRules.length === 0 ? (
                        <p className="settings-empty">還沒有固定交易。可以先新增房租、薪水或訂閱費。</p>
                    ) : (
                        recurringRules.map((rule) => (
                            <div key={rule.id} className={`recurring-row ${rule.enabled ? '' : 'disabled'}`}>
                                <div>
                                    <strong>{rule.note || rule.category}</strong>
                                    <span>
                                        每月 {rule.dayOfMonth} 日 · {rule.type === 'income' ? '收入' : '支出'} · {formatMoney(rule.amount)}
                                    </span>
                                </div>
                                <div className="recurring-actions">
                                    <button
                                        type="button"
                                        onClick={() => updateRecurringRule(rule.id, { enabled: !rule.enabled })}
                                    >
                                        {rule.enabled ? '啟用中' : '已停用'}
                                    </button>
                                    <button type="button" onClick={() => onPostRecurring(rule)}>
                                        記入本月
                                    </button>
                                    <button
                                        type="button"
                                        className="danger"
                                        onClick={() => {
                                            if (window.confirm('確定刪除此固定交易？')) deleteRecurringRule(rule.id);
                                        }}
                                        title="刪除固定交易"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
