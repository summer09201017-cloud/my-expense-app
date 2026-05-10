import { Pencil, List, CalendarDays, BarChart3 } from 'lucide-react';
import './TabBar.css';

const TABS = [
    { key: 'add', label: '記帳', Icon: Pencil },
    { key: 'list', label: '明細', Icon: List },
    { key: 'calendar', label: '日曆', Icon: CalendarDays },
    { key: 'analysis', label: '分析', Icon: BarChart3 },
];

export function TabBar({ active, onChange }) {
    return (
        <nav className="tab-bar" role="tablist" aria-label="主要分頁">
            {TABS.map(tab => {
                const TabIcon = tab.Icon;
                return (
                    <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={active === tab.key}
                        className={`tab-btn ${active === tab.key ? 'active' : ''}`}
                        onClick={() => onChange(tab.key)}
                    >
                        <TabIcon size={20} />
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
