import { useState, useEffect } from 'react';
import { Delete, Check } from 'lucide-react';
import './Numpad.css';

// 簡易兩運算元連鎖計算機，符合一般記帳 app 的數字鍵盤體驗
export function Numpad({ value, onChange, onDone }) {
    const [prev, setPrev] = useState(null);   // 前一個運算元
    const [op, setOp] = useState(null);       // '+', '-', '*', '/'
    const [justEvaluated, setJustEvaluated] = useState(false);
    const [zeroPressTimer, setZeroPressTimer] = useState(null);

    // 當 value 由外部清空時，也清掉內部 prev/op
    useEffect(() => {
        if (value === '' || value === null || value === undefined) {
            setPrev(null);
            setOp(null);
            setJustEvaluated(false);
        }
    }, [value]);

    const current = String(value ?? '');

    const calc = (a, b, operator) => {
        const x = Number(a);
        const y = Number(b);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return b;
        let r;
        switch (operator) {
            case '+': r = x + y; break;
            case '-': r = x - y; break;
            case '*': r = x * y; break;
            case '/': r = y === 0 ? x : x / y; break;
            default: r = y;
        }
        // 至多兩位小數，去掉浮點尾巴
        return String(Math.round(r * 100) / 100);
    };

    const pressDigit = (d) => {
        if (justEvaluated) {
            // 上次按了 = 之後再按數字 → 開新一段
            onChange(d === '00' ? '0' : d);
            setPrev(null);
            setOp(null);
            setJustEvaluated(false);
            return;
        }
        if (current === '0' || current === '') {
            onChange(d === '00' ? '0' : d);
        } else {
            onChange(current + d);
        }
    };

    const pressDot = () => {
        if (justEvaluated) {
            onChange('0.');
            setPrev(null);
            setOp(null);
            setJustEvaluated(false);
            return;
        }
        if (!current.includes('.')) {
            onChange((current || '0') + '.');
        }
    };

    const pressOp = (nextOp) => {
        // 若有 prev 與 current → 先算
        if (prev !== null && op && current !== '') {
            const result = calc(prev, current, op);
            setPrev(result);
            onChange(''); // 清掉 current 等待下一段
        } else if (current !== '') {
            setPrev(current);
            onChange('');
        }
        setOp(nextOp);
        setJustEvaluated(false);
    };

    const pressEqual = () => {
        if (prev !== null && op && current !== '') {
            const result = calc(prev, current, op);
            onChange(result);
            setPrev(null);
            setOp(null);
            setJustEvaluated(true);
        }
    };

    const pressBackspace = () => {
        if (current.length > 0) {
            onChange(current.slice(0, -1));
        } else if (op) {
            // current 已空，再退一次清掉 op，把 prev 拉回 current
            setOp(null);
            if (prev !== null) {
                onChange(prev);
                setPrev(null);
            }
        }
        setJustEvaluated(false);
    };

    const pressClear = () => {
        onChange('');
        setPrev(null);
        setOp(null);
        setJustEvaluated(false);
    };

    // 長按 0 = 00
    const onZeroDown = () => {
        const t = setTimeout(() => {
            pressDigit('00');
            setZeroPressTimer('consumed');
        }, 350);
        setZeroPressTimer(t);
    };
    const onZeroUp = () => {
        if (zeroPressTimer && zeroPressTimer !== 'consumed') {
            clearTimeout(zeroPressTimer);
            pressDigit('0');
        }
        setZeroPressTimer(null);
    };

    // 顯示運算式預覽
    const expressionPreview = (() => {
        if (prev === null || !op) return '';
        const opSym = { '+': '+', '-': '−', '*': '×', '/': '÷' }[op];
        return `${prev} ${opSym} ${current || ''}`.trim();
    })();

    return (
        <div className="numpad">
            {expressionPreview && (
                <div className="numpad-expression">{expressionPreview}</div>
            )}
            <div className="numpad-grid">
                <button type="button" className="key key-num" onClick={() => pressDigit('7')}>7</button>
                <button type="button" className="key key-num" onClick={() => pressDigit('8')}>8</button>
                <button type="button" className="key key-num" onClick={() => pressDigit('9')}>9</button>
                <button type="button" className="key key-back" onClick={pressBackspace} aria-label="退格">
                    <Delete size={20} />
                </button>

                <button type="button" className="key key-num" onClick={() => pressDigit('4')}>4</button>
                <button type="button" className="key key-num" onClick={() => pressDigit('5')}>5</button>
                <button type="button" className="key key-num" onClick={() => pressDigit('6')}>6</button>
                <button type="button" className={`key key-op ${op === '/' ? 'active' : ''}`} onClick={() => pressOp('/')}>÷</button>

                <button type="button" className="key key-num" onClick={() => pressDigit('1')}>1</button>
                <button type="button" className="key key-num" onClick={() => pressDigit('2')}>2</button>
                <button type="button" className="key key-num" onClick={() => pressDigit('3')}>3</button>
                <button type="button" className={`key key-op ${op === '*' ? 'active' : ''}`} onClick={() => pressOp('*')}>×</button>

                <button type="button" className={`key key-op ${op === '-' ? 'active' : ''}`} onClick={() => pressOp('-')}>−</button>
                <button
                    type="button"
                    className="key key-num"
                    onPointerDown={onZeroDown}
                    onPointerUp={onZeroUp}
                    onPointerLeave={() => { if (zeroPressTimer && zeroPressTimer !== 'consumed') { clearTimeout(zeroPressTimer); setZeroPressTimer(null); } }}
                    title="長按 = 00"
                >0</button>
                <button type="button" className="key key-num" onClick={pressDot}>.</button>
                <button type="button" className={`key key-op ${op === '+' ? 'active' : ''}`} onClick={() => pressOp('+')}>+</button>

                <button type="button" className="key key-clear" onClick={pressClear}>清除</button>
                <button type="button" className="key key-equal" onClick={pressEqual}>=</button>
                <button type="button" className="key key-done" onClick={onDone}>
                    <Check size={18} /> 完成
                </button>
            </div>
        </div>
    );
}
