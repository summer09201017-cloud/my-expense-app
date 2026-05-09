import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { ICON_GROUPS } from '../utils/icons';
import './IconPicker.css';

// 純圖示網格 + 群組 tab，可以嵌進其他對話框
export function IconGrid({ value, onPick }) {
    const [activeGroup, setActiveGroup] = useState(ICON_GROUPS[0].key);
    const group = ICON_GROUPS.find(g => g.key === activeGroup) || ICON_GROUPS[0];
    return (
        <>
            <div className="icon-picker-tabs">
                {ICON_GROUPS.map(g => (
                    <button
                        type="button"
                        key={g.key}
                        className={`icon-tab ${activeGroup === g.key ? 'active' : ''}`}
                        onClick={() => setActiveGroup(g.key)}
                    >
                        {g.label}
                    </button>
                ))}
            </div>
            <div className="icon-grid">
                {group.icons.map(icon => (
                    <button
                        type="button"
                        key={icon}
                        className={`icon-cell ${value === icon ? 'selected' : ''}`}
                        onClick={() => onPick(icon)}
                    >
                        {icon}
                    </button>
                ))}
            </div>
        </>
    );
}

// 單純選圖示用 modal
export function IconPicker({ value, onPick, onClose }) {
    return (
        <div className="icon-picker-overlay" onClick={onClose}>
            <div className="icon-picker glass-panel" onClick={e => e.stopPropagation()}>
                <div className="icon-picker-header">
                    <span>選擇圖示</span>
                    <button type="button" className="icon-picker-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <IconGrid value={value} onPick={onPick} />
            </div>
        </div>
    );
}

// 新增分類用 modal：圖示 + 名稱
export function AddCategoryDialog({ initialIcon = '✨', onCancel, onConfirm }) {
    const [icon, setIcon] = useState(initialIcon);
    const [name, setName] = useState('');

    const handleConfirm = () => {
        if (!name.trim()) {
            alert('請輸入分類名稱');
            return;
        }
        onConfirm({ icon, name: name.trim() });
    };

    return (
        <div className="icon-picker-overlay" onClick={onCancel}>
            <div className="icon-picker glass-panel" onClick={e => e.stopPropagation()}>
                <div className="icon-picker-header">
                    <span>新增分類</span>
                    <button type="button" className="icon-picker-close" onClick={onCancel}>
                        <X size={18} />
                    </button>
                </div>

                <div className="add-cat-preview">
                    <span className="add-cat-icon">{icon || '✨'}</span>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="分類名稱（例如：早餐）"
                        className="add-cat-name"
                        autoFocus
                        maxLength={12}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleConfirm(); } }}
                    />
                </div>

                <IconGrid value={icon} onPick={setIcon} />

                <button
                    type="button"
                    className="add-cat-confirm"
                    onClick={handleConfirm}
                    disabled={!name.trim()}
                >
                    <Check size={16} /> 新增分類
                </button>
            </div>
        </div>
    );
}
