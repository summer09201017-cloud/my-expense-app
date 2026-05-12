import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Calendar,
    CheckSquare,
    Copy,
    Edit2,
    FolderPen,
    ListChecks,
    Search,
    Square,
    Tags,
    Trash2,
    X,
} from 'lucide-react';
import { getDateRange, isDateInRange, toLocalDateString } from '../utils/date';
import { extractTags, getTagStats, hasTag } from '../utils/tags';
import './TransactionList.css';

const RANGE_OPTIONS = [
    { key: 'today', label: '本日' },
    { key: 'week', label: '本週' },
    { key: 'month', label: '本月' },
    { key: 'custom', label: '自訂' },
    { key: 'all', label: '全部' },
];

const TYPE_OPTIONS = [
    { key: 'all', label: '全部' },
    { key: 'expense', label: '只看支出' },
    { key: 'income', label: '只看收入' },
];

const formatMoney = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
    });
};

export function TransactionList({
    transactions,
    onDelete,
    onEdit,
    onCopy,
    onBulkDelete,
    onBulkChangeCategory,
    categoriesState,
    focusSearchRequest,
}) {
    const today = toLocalDateString();
    const [rangeKey, setRangeKey] = useState('month');
    const [customStart, setCustomStart] = useState(today);
    const [customEnd, setCustomEnd] = useState(today);
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [activeTag, setActiveTag] = useState('');
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [pendingCategory, setPendingCategory] = useState('');
    const searchInputRef = useRef(null);
    const longPressTimerRef = useRef(null);

    const range = rangeKey === 'custom'
        ? { start: customStart, end: customEnd }
        : getDateRange(rangeKey);

    const baseTransactions = useMemo(() => {
        return transactions.filter((transaction) => {
            if (!isDateInRange(transaction.date, range.start, range.end)) return false;
            if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;
            return true;
        });
    }, [transactions, range.start, range.end, typeFilter]);

    const tagStats = useMemo(() => getTagStats(baseTransactions), [baseTransactions]);

    const filteredTransactions = useMemo(() => {
        const keyword = searchKeyword.trim().toLowerCase();
        return baseTransactions.filter((transaction) => {
            if (activeTag && !hasTag(transaction, activeTag)) return false;
            if (!keyword) return true;

            const typeLabel = transaction.type === 'income' ? '收入 income' : '支出 expense';
            const tags = extractTags(transaction.note).map((tag) => `#${tag}`);
            const haystack = [
                transaction.category,
                transaction.note,
                transaction.date,
                String(transaction.amount),
                formatMoney(transaction.amount),
                typeLabel,
                ...tags,
            ].join(' ').toLowerCase();
            return haystack.includes(keyword);
        });
    }, [baseTransactions, activeTag, searchKeyword]);

    const sortedTransactions = useMemo(() => {
        return [...filteredTransactions].sort((a, b) => {
            const dateDiff = new Date(b.date) - new Date(a.date);
            if (dateDiff !== 0) return dateDiff;
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
    }, [filteredTransactions]);

    const selectedIdList = useMemo(() => [...selectedIds], [selectedIds]);
    const selectedTransactions = useMemo(
        () => transactions.filter((transaction) => selectedIds.has(transaction.id)),
        [transactions, selectedIds]
    );
    const selectedTypes = useMemo(
        () => [...new Set(selectedTransactions.map((transaction) => transaction.type))],
        [selectedTransactions]
    );
    const selectedType = selectedTypes.length === 1 ? selectedTypes[0] : '';
    const categoryOptions = selectedType ? categoriesState?.categories?.[selectedType] || [] : [];

    const periodSummary = filteredTransactions.reduce((acc, curr) => {
        if (curr.type === 'income') acc.income += curr.amount;
        else acc.expense += curr.amount;
        return acc;
    }, { income: 0, expense: 0 });

    useEffect(() => {
        if (!focusSearchRequest) return;
        searchInputRef.current?.focus();
    }, [focusSearchRequest]);

    useEffect(() => {
        setPendingCategory('');
    }, [selectedType]);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key !== 'Escape') return;
            setSelectionMode(false);
            setSelectedIds(new Set());
            setPendingCategory('');
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        const existingIds = new Set(transactions.map((transaction) => transaction.id));
        setSelectedIds((previous) => {
            if (previous.size === 0) return previous;
            const next = new Set([...previous].filter((id) => existingIds.has(id)));
            return next.size === previous.size ? previous : next;
        });
    }, [transactions]);

    const toggleSelection = (id) => {
        setSelectedIds((previous) => {
            const next = new Set(previous);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedIds(new Set());
        setPendingCategory('');
    };

    const startLongPress = (event, transaction) => {
        if (event.target.closest('button, input, select, a')) return;
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = window.setTimeout(() => {
            setSelectionMode(true);
            setSelectedIds((previous) => new Set(previous).add(transaction.id));
        }, 520);
    };

    const clearLongPress = () => {
        window.clearTimeout(longPressTimerRef.current);
    };

    const handleItemClick = (transaction) => {
        if (!selectionMode) return;
        toggleSelection(transaction.id);
    };

    const handleApplyCategory = () => {
        if (!pendingCategory || selectedIdList.length === 0) return;
        onBulkChangeCategory?.(selectedIdList, pendingCategory);
        exitSelectionMode();
    };

    const handleBulkDelete = () => {
        if (selectedIdList.length === 0) return;
        onBulkDelete?.(selectedIdList);
        exitSelectionMode();
    };

    if (transactions.length === 0) {
        return (
            <div className="transaction-list empty-state glass-panel animate-slide-up">
                <p>還沒有任何交易</p>
                <p className="sub-text">新增第一筆，讓今天的錢有地方交代。</p>
            </div>
        );
    }

    return (
        <div className="transaction-list glass-panel animate-slide-up">
            <div className="filter-group">
                <div className="view-mode-toggle range-toggle">
                    {RANGE_OPTIONS.map((option) => (
                        <button
                            type="button"
                            key={option.key}
                            className={`mode-btn ${rangeKey === option.key ? 'active' : ''}`}
                            onClick={() => setRangeKey(option.key)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {rangeKey === 'custom' && (
                    <div className="custom-range-filter">
                        <Calendar size={17} />
                        <input
                            type="date"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="date-filter-input"
                        />
                        <span>到</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="date-filter-input"
                        />
                    </div>
                )}

                <div className="type-filter">
                    {TYPE_OPTIONS.map((option) => (
                        <button
                            type="button"
                            key={option.key}
                            className={`${typeFilter === option.key ? 'active' : ''}`}
                            onClick={() => setTypeFilter(option.key)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {tagStats.length > 0 && (
                <div className="tag-filter-row">
                    <Tags size={16} />
                    <div className="tag-chip-scroll">
                        {activeTag && (
                            <button
                                type="button"
                                className="tag-filter-chip clear"
                                onClick={() => setActiveTag('')}
                            >
                                清除 #{activeTag}
                            </button>
                        )}
                        {tagStats.slice(0, 14).map((tag) => (
                            <button
                                type="button"
                                key={tag.tag}
                                className={`tag-filter-chip ${activeTag === tag.tag ? 'active' : ''}`}
                                onClick={() => setActiveTag(tag.tag)}
                                title={`${tag.count} 筆，支出 ${formatMoney(tag.expense)}`}
                            >
                                #{tag.tag}
                                <span>{tag.count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    ref={searchInputRef}
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="搜尋分類、備註、金額、#京都旅遊..."
                    className="search-input"
                />
            </div>

            <div className={`bulk-toolbar ${selectionMode ? 'active' : ''}`}>
                <button
                    type="button"
                    className="bulk-mode-btn"
                    onClick={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
                >
                    {selectionMode ? <X size={16} /> : <ListChecks size={16} />}
                    <span>{selectionMode ? '取消多選' : '多選'}</span>
                </button>

                {selectionMode && (
                    <>
                        <span className="bulk-count">已選 {selectedIds.size}</span>
                        <select
                            value={pendingCategory}
                            onChange={(e) => setPendingCategory(e.target.value)}
                            disabled={!selectedType || selectedIds.size === 0}
                            className="bulk-category-select"
                        >
                            <option value="">
                                {selectedType ? '改成分類...' : '請選同一類型'}
                            </option>
                            {categoryOptions.map((category) => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="bulk-action-btn"
                            onClick={handleApplyCategory}
                            disabled={!pendingCategory}
                        >
                            <FolderPen size={16} />
                            <span>套用</span>
                        </button>
                        <button
                            type="button"
                            className="bulk-action-btn danger"
                            onClick={handleBulkDelete}
                            disabled={selectedIds.size === 0}
                        >
                            <Trash2 size={16} />
                            <span>刪除</span>
                        </button>
                    </>
                )}
            </div>

            <div className="period-summary">
                <div className="summary-item expense">
                    <span>區間支出</span>
                    <span className="amount">{formatMoney(periodSummary.expense)}</span>
                </div>
                <div className="summary-item income">
                    <span>區間收入</span>
                    <span className="amount">{formatMoney(periodSummary.income)}</span>
                </div>
            </div>

            {filteredTransactions.length === 0 ? (
                <div className="empty-state">
                    <p>這個條件沒有交易</p>
                </div>
            ) : (
                <div className="list-container">
                    {sortedTransactions.map((transaction, index) => {
                        const itemTags = extractTags(transaction.note);
                        const selected = selectedIds.has(transaction.id);

                        return (
                            <div
                                key={transaction.id}
                                className={`transaction-item ${selectionMode ? 'selecting' : ''} ${selected ? 'selected' : ''}`}
                                style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                                onPointerDown={(event) => startLongPress(event, transaction)}
                                onPointerUp={clearLongPress}
                                onPointerCancel={clearLongPress}
                                onPointerLeave={clearLongPress}
                                onClick={() => handleItemClick(transaction)}
                            >
                                <div className="item-left">
                                    {selectionMode && (
                                        <button
                                            type="button"
                                            className="select-toggle-btn"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                toggleSelection(transaction.id);
                                            }}
                                            title="選取"
                                        >
                                            {selected ? <CheckSquare size={20} /> : <Square size={20} />}
                                        </button>
                                    )}
                                    <div className={`type-badge ${transaction.type}`}>
                                        {transaction.type === 'income' ? '+' : '-'}
                                    </div>
                                    <div className="item-details">
                                        <span className="item-category">{transaction.category}</span>
                                        {transaction.note && <span className="item-note">{transaction.note}</span>}
                                        {itemTags.length > 0 && (
                                            <div className="item-tags">
                                                {itemTags.map((tag) => (
                                                    <button
                                                        type="button"
                                                        key={tag}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setActiveTag(tag);
                                                        }}
                                                    >
                                                        #{tag}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="item-right">
                                    <div className="item-meta">
                                        <span className={`item-amount ${transaction.type}`}>
                                            {transaction.type === 'income' ? '+' : '-'}
                                            {formatMoney(transaction.amount)}
                                        </span>
                                        <span className="item-date">{formatDate(transaction.date)}</span>
                                    </div>

                                    {!selectionMode && (
                                        <div className="item-actions">
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onCopy(transaction);
                                                }}
                                                className="copy-btn"
                                                title="複製此筆"
                                            >
                                                <Copy size={18} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onEdit(transaction);
                                                }}
                                                className="edit-btn"
                                                title="編輯"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onDelete(transaction.id);
                                                }}
                                                className="delete-btn"
                                                title="刪除"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
