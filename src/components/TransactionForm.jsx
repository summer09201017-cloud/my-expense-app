import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Camera,
    Check,
    Hash,
    Keyboard,
    Mic,
    MicOff,
    MinusCircle,
    PlusCircle,
    QrCode,
    Repeat,
    Save,
    Sparkles,
    Trash2,
    X,
    Zap,
} from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useQuickTemplates } from '../hooks/useQuickTemplates';
import { Numpad } from './Numpad';
import { AddCategoryDialog } from './IconPicker';
import { joinCategory } from '../utils/icons';
import { parseSpokenTransaction, suggestCategoryFromText } from '../utils/categorySuggestions';
import { toLocalDateString } from '../utils/date';
import { parseTaiwanInvoiceQr } from '../utils/taiwanInvoice';
import './TransactionForm.css';

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export function TransactionForm({ onAdd, editingTransaction, prefillTransaction, onUpdate, onCancelEdit, onConsumePrefill, categoriesState }) {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(toLocalDateString());
    const [note, setNote] = useState('');
    const [continuousMode, setContinuousMode] = useState(() => localStorage.getItem('continuous_mode') === '1');
    const [useNumpad, setUseNumpad] = useState(() => localStorage.getItem('numpad_mode') !== '0');
    const [justSaved, setJustSaved] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voiceMessage, setVoiceMessage] = useState('');
    const [showInvoiceScanner, setShowInvoiceScanner] = useState(false);
    const [scanMessage, setScanMessage] = useState('');

    const localCategoriesState = useCategories();
    const { categories, addCategory, deleteCategory } = categoriesState || localCategoriesState;
    const { templates, addTemplate, deleteTemplate } = useQuickTemplates();
    const [showAddCategory, setShowAddCategory] = useState(false);
    const recognitionRef = useRef(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const scannerFrameRef = useRef(null);
    const barcodeDetectorRef = useRef(null);

    const categorySuggestion = useMemo(
        () => suggestCategoryFromText(note, categories),
        [note, categories]
    );
    const speechSupported = typeof window !== 'undefined'
        && (window.SpeechRecognition || window.webkitSpeechRecognition);

    useEffect(() => {
        localStorage.setItem('continuous_mode', continuousMode ? '1' : '0');
    }, [continuousMode]);

    useEffect(() => {
        localStorage.setItem('numpad_mode', useNumpad ? '1' : '0');
    }, [useNumpad]);

    useEffect(() => {
        if (editingTransaction) {
            setType(editingTransaction.type);
            setAmount(String(editingTransaction.amount));
            setCategory(editingTransaction.category);
            setDate(editingTransaction.date);
            setNote(editingTransaction.note || '');
        } else {
            setType('expense');
            setAmount('');
            setCategory('');
            setDate(toLocalDateString());
            setNote('');
        }
    }, [editingTransaction]);

    useEffect(() => {
        if (prefillTransaction) {
            setType(prefillTransaction.type);
            setAmount(String(prefillTransaction.amount));
            setCategory(prefillTransaction.category);
            setDate(prefillTransaction.date);
            setNote(prefillTransaction.note || '');
        }
    }, [prefillTransaction]);

    useEffect(() => {
        if (category && !categories[type].includes(category)) {
            setCategory('');
        }
    }, [type, categories, category]);

    const flashSaved = () => {
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1200);
    };

    const applyParsedTransaction = (parsed) => {
        if (!parsed) return;
        if (parsed.type) setType(parsed.type);
        if (parsed.amount) setAmount(String(parsed.amount));
        if (parsed.date) setDate(parsed.date);
        if (parsed.note) setNote(parsed.note);
        if (parsed.category) setCategory(parsed.category);
    };

    const applyCategorySuggestion = (suggestion = categorySuggestion) => {
        if (!suggestion?.category) return;
        setType(suggestion.type);
        setCategory(suggestion.category);
    };

    const handleVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setVoiceMessage('這個瀏覽器目前不支援語音輸入');
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-TW';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            setIsListening(true);
            setVoiceMessage('正在聽...');
        };
        recognition.onend = () => {
            setIsListening(false);
        };
        recognition.onerror = () => {
            setVoiceMessage('語音辨識失敗，請再試一次');
        };
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map((result) => result[0]?.transcript || '')
                .join('')
                .trim();
            const parsed = parseSpokenTransaction(transcript, categories);
            applyParsedTransaction(parsed);
            setVoiceMessage(transcript ? `聽到：${transcript}` : '沒有聽到內容');
        };

        recognition.start();
    };

    const stopInvoiceScanner = () => {
        if (scannerFrameRef.current) {
            cancelAnimationFrame(scannerFrameRef.current);
            scannerFrameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const handleCloseInvoiceScanner = () => {
        stopInvoiceScanner();
        setShowInvoiceScanner(false);
    };

    const applyInvoice = (invoice) => {
        const suggestion = suggestCategoryFromText(invoice.note, categories);
        setType('expense');
        setAmount(String(invoice.amount));
        setDate(invoice.date);
        setNote(invoice.note);
        if (suggestion?.category) {
            setCategory(suggestion.category);
        }
        setScanMessage(`已掃描 ${invoice.invoiceNumber}`);
    };

    const scanInvoiceFrame = async () => {
        const detector = barcodeDetectorRef.current;
        const video = videoRef.current;
        if (!detector || !video || video.readyState < 2) {
            scannerFrameRef.current = requestAnimationFrame(scanInvoiceFrame);
            return;
        }

        try {
            const barcodes = await detector.detect(video);
            const invoice = barcodes
                .map((barcode) => parseTaiwanInvoiceQr(barcode.rawValue))
                .find(Boolean);

            if (invoice) {
                applyInvoice(invoice);
                handleCloseInvoiceScanner();
                return;
            }
        } catch (error) {
            setScanMessage(`掃描失敗：${error.message}`);
        }

        scannerFrameRef.current = requestAnimationFrame(scanInvoiceFrame);
    };

    const handleInvoiceScan = async () => {
        setShowInvoiceScanner(true);
        setScanMessage('正在開啟相機...');

        if (!('BarcodeDetector' in window)) {
            setScanMessage('這個瀏覽器目前不支援 QR 掃描，建議用 Android Chrome / Edge');
            return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            setScanMessage('無法使用相機');
            return;
        }

        try {
            const supportedFormats = window.BarcodeDetector.getSupportedFormats
                ? await window.BarcodeDetector.getSupportedFormats()
                : ['qr_code'];
            if (!supportedFormats.includes('qr_code')) {
                setScanMessage('此裝置的 BarcodeDetector 不支援 QR Code');
                return;
            }

            barcodeDetectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false,
            });
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setScanMessage('請對準電子發票左側 QR Code');
            scannerFrameRef.current = requestAnimationFrame(scanInvoiceFrame);
        } catch (error) {
            setScanMessage(`無法啟動相機：${error.message}`);
        }
    };

    useEffect(() => {
        return () => {
            recognitionRef.current?.abort?.();
            if (scannerFrameRef.current) {
                cancelAnimationFrame(scannerFrameRef.current);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const handleAddCategory = ({ icon, name }) => {
        const joined = joinCategory(icon, name);
        const success = addCategory(type, joined);
        if (success) {
            setCategory(joined);
            setShowAddCategory(false);
        } else {
            alert('此分類已存在或名稱無效！');
        }
    };

    const handleQuickAdd = (template) => {
        onAdd({
            type: template.type,
            amount: template.amount,
            category: template.category,
            date: toLocalDateString(),
            note: template.note || '',
        });
        flashSaved();
    };

    const handleSaveTemplate = () => {
        const success = addTemplate({ type, amount, category, note });
        if (!success) {
            alert('請先輸入有效金額並選擇分類，才能存成模板');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const amt = Number(amount);
        if (!amount || !Number.isFinite(amt) || amt <= 0) {
            alert('請輸入有效的金額');
            return;
        }
        if (!category.trim()) {
            alert('請選擇分類');
            return;
        }

        if (editingTransaction) {
            onUpdate(editingTransaction.id, { type, amount: amt, category, date, note });
            onCancelEdit();
        } else {
            onAdd({ type, amount: amt, category, date, note });
            if (continuousMode) {
                setAmount('');
                setNote('');
            } else {
                setAmount('');
                setCategory('');
                setNote('');
            }
            if (prefillTransaction && onConsumePrefill) onConsumePrefill();
            flashSaved();
        }
    };

    return (
        <form className="transaction-form glass-panel animate-slide-up" onSubmit={handleSubmit}>
            {editingTransaction && (
                <div className="edit-header">
                    <span>✏️ 正在修改紀錄</span>
                    <button type="button" onClick={onCancelEdit} className="cancel-edit-btn" title="取消修改">
                        <X size={18} />
                    </button>
                </div>
            )}

            <div className="type-toggle">
                <button
                    type="button"
                    className={`toggle-btn ${type === 'expense' ? 'active expense' : ''}`}
                    onClick={() => setType('expense')}
                >
                    <MinusCircle size={18} />
                    支出
                </button>
                <button
                    type="button"
                    className={`toggle-btn ${type === 'income' ? 'active income' : ''}`}
                    onClick={() => setType('income')}
                >
                    <PlusCircle size={18} />
                    收入
                </button>
            </div>

            {!editingTransaction && templates.length > 0 && (
                <div className="template-section">
                    <div className="template-header">
                        <span><Zap size={15} /> 常用模板</span>
                        <button
                            type="button"
                            className="save-template-btn"
                            onClick={handleSaveTemplate}
                            title="把目前輸入存成模板"
                        >
                            <Save size={14} />
                            存目前
                        </button>
                    </div>
                    <div className="template-chips">
                        {templates.map((template) => (
                            <button
                                type="button"
                                key={template.id}
                                className={`template-chip ${template.type}`}
                                onClick={() => handleQuickAdd(template)}
                                title="一鍵新增今天的這筆紀錄"
                            >
                                <span>{template.note || template.category}</span>
                                <strong>${template.amount}</strong>
                                <span
                                    role="button"
                                    tabIndex={0}
                                    className="template-delete"
                                    title="刪除模板"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        deleteTemplate(template.id);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            deleteTemplate(template.id);
                                        }
                                    }}
                                >
                                    <Trash2 size={12} />
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="form-group amount-group">
                <span className="currency-symbol">$</span>
                <input
                    type={useNumpad ? 'text' : 'number'}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="amount-input"
                    inputMode={useNumpad ? 'none' : 'decimal'}
                    readOnly={useNumpad}
                />
                <button
                    type="button"
                    className="kb-toggle"
                    onClick={() => setUseNumpad(v => !v)}
                    title={useNumpad ? '切換系統鍵盤' : '切換數字鍵盤'}
                >
                    {useNumpad ? <Keyboard size={16} /> : <Hash size={16} />}
                </button>
            </div>

            <div className="quick-amounts">
                {QUICK_AMOUNTS.map(n => (
                    <button
                        type="button"
                        key={n}
                        className="quick-amount-chip"
                        onClick={() => setAmount(String(n))}
                    >
                        ${n}
                    </button>
                ))}
                {amount && (
                    <button
                        type="button"
                        className="quick-amount-chip clear"
                        onClick={() => setAmount('')}
                        title="清除金額"
                    >
                        清除
                    </button>
                )}
            </div>

            <div className="smart-entry-row">
                <button
                    type="button"
                    className={`smart-entry-btn ${isListening ? 'active' : ''}`}
                    onClick={handleVoiceInput}
                    title={speechSupported ? '語音輸入' : '這個瀏覽器不支援語音輸入'}
                >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    <span>{isListening ? '停止' : '語音'}</span>
                </button>
                <button
                    type="button"
                    className="smart-entry-btn"
                    onClick={handleInvoiceScan}
                    title="掃描台灣電子發票 QR Code"
                >
                    <QrCode size={16} />
                    <span>掃發票</span>
                </button>
                {voiceMessage && <span className="smart-entry-message">{voiceMessage}</span>}
            </div>

            {useNumpad && (
                <Numpad
                    value={amount}
                    onChange={setAmount}
                    onDone={handleSubmit}
                />
            )}

            <div className="form-row">
                <div className="form-group flex-1">
                    <label>分類</label>
                    <div className="category-chips">
                        {categories[type].map(cat => (
                            <div
                                key={cat}
                                className={`category-chip ${category === cat ? 'selected' : ''}`}
                                onClick={() => setCategory(cat)}
                            >
                                {cat}
                                <button
                                    type="button"
                                    className="delete-category-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`確定要刪除「${cat}」分類嗎？`)) {
                                            deleteCategory(type, cat);
                                            if (category === cat) setCategory('');
                                        }
                                    }}
                                    title="刪除此分類"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            className="category-chip add-btn"
                            onClick={() => setShowAddCategory(true)}
                        >
                            + 新增
                        </button>
                    </div>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group flex-1">
                    <label>日期</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="std-input"
                    />
                </div>
                <div className="form-group flex-1">
                    <label>備註 (選填)</label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="輸入備註..."
                        className="std-input"
                    />
                </div>
            </div>

            {categorySuggestion && categorySuggestion.category !== category && (
                <button
                    type="button"
                    className="category-suggestion"
                    onClick={() => applyCategorySuggestion(categorySuggestion)}
                >
                    <Sparkles size={16} />
                    <span>建議分類：{categorySuggestion.category}</span>
                    <strong>{categorySuggestion.label}</strong>
                </button>
            )}

            {!editingTransaction && (
                <div className="form-options">
                    <label className={`continuous-toggle ${continuousMode ? 'active' : ''}`} title="開啟後送出仍保留分類與日期，方便連續輸入">
                        <input
                            type="checkbox"
                            checked={continuousMode}
                            onChange={(e) => setContinuousMode(e.target.checked)}
                        />
                        <Repeat size={14} />
                        <span>連續記帳模式</span>
                    </label>
                    <button
                        type="button"
                        className="save-template-inline"
                        onClick={handleSaveTemplate}
                    >
                        <Save size={14} />
                        存成模板
                    </button>
                </div>
            )}

            <div className="form-actions">
                {editingTransaction && (
                    <button type="button" onClick={onCancelEdit} className="cancel-btn">
                        取消
                    </button>
                )}
                <button type="submit" className={`submit-btn ${justSaved ? 'saved' : ''}`} style={{ flex: 1 }}>
                    {justSaved ? <><Check size={18} /> 已新增</> : (editingTransaction ? '儲存修改' : '新增紀錄')}
                </button>
            </div>

            {showInvoiceScanner && (
                <div className="scanner-backdrop" role="dialog" aria-modal="true">
                    <div className="scanner-dialog glass-panel">
                        <div className="scanner-header">
                            <div>
                                <strong>掃描電子發票</strong>
                                <span>對準左側 QR Code</span>
                            </div>
                            <button type="button" onClick={handleCloseInvoiceScanner} title="關閉">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="scanner-video-frame">
                            <video ref={videoRef} muted playsInline />
                            <Camera size={28} />
                        </div>
                        <p>{scanMessage}</p>
                    </div>
                </div>
            )}

            {showAddCategory && (
                <AddCategoryDialog
                    onCancel={() => setShowAddCategory(false)}
                    onConfirm={handleAddCategory}
                />
            )}
        </form>
    );
}
