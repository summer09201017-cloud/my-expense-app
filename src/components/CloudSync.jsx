import { useState, useEffect } from 'react';
import { Cloud, CloudUpload, CloudDownload, X, CheckCircle, AlertCircle } from 'lucide-react';
import './CloudSync.css';

export function CloudSync({ transactions, onRestore }) {
    const [isOpen, setIsOpen] = useState(false);
    const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('google_sheet_webhook') || '');
    const [status, setStatus] = useState({ type: '', message: '' }); // 'success', 'error', 'loading'

    useEffect(() => {
        localStorage.setItem('google_sheet_webhook', webhookUrl);
    }, [webhookUrl]);

    const showMessage = (type, message) => {
        setStatus({ type, message });
        if (type !== 'loading') {
            setTimeout(() => setStatus({ type: '', message: '' }), 4000);
        }
    };

    const handleBackup = async () => {
        if (!webhookUrl) return showMessage('error', '請先設定 Webhook URL！');
        
        showMessage('loading', '正在備份至雲端...');
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                // Webhook sometimes requires text/plain or application/x-www-form-urlencoded to avoid CORS preflight,
                // but we will try application/json first or simply stringify mode.
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'backup',
                    data: transactions
                })
            });

            const result = await response.json();
            if (result.status === 'success') {
                showMessage('success', '✅ 備份成功！');
            } else {
                throw new Error(result.message || 'Server returned an error');
            }
        } catch (error) {
            console.error('Backup failed:', error);
            showMessage('error', '❌ 備份失敗，請確認網址或網路狀況。');
        }
    };

    const handleRestore = async () => {
        if (!webhookUrl) return showMessage('error', '請先設定 Webhook URL！');
        
        if (!window.confirm('還原將會覆蓋目前的本地紀錄，您確定要繼續嗎？')) {
            return;
        }

        showMessage('loading', '正在從雲端下載...');
        try {
            const response = await fetch(`${webhookUrl}?action=restore`);
            const result = await response.json();
            
            if (result.status === 'success' && Array.isArray(result.data)) {
                onRestore(result.data);
                showMessage('success', '✅ 還原成功！');
            } else {
                throw new Error('Invalid data format received');
            }
        } catch (error) {
            console.error('Restore failed:', error);
            showMessage('error', '❌ 還原失敗，請確認網址或備份檔內容。');
        }
    };

    return (
        <div className="cloud-sync-container">
            <button
                className="toolbar-btn cloud-toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
                title="雲端同步設定"
            >
                <Cloud size={16} />
                <span className="toolbar-label">雲端</span>
            </button>

            {isOpen && (
                <div className="cloud-modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="cloud-modal glass-panel" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><Cloud size={20} /> 雲端同步 (Google Sheet)</h3>
                            <button className="close-btn" onClick={() => setIsOpen(false)}><X size={20} /></button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Google Apps Script Webhook URL</label>
                                <input
                                    type="text"
                                    className="std-input"
                                    placeholder="https://script.google.com/macros/s/.../exec"
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                />
                                <small className="helper-text">
                                    請貼上您部署的 Google Apps Script 網頁應用程式網址。
                                </small>
                            </div>

                            <div className="sync-actions">
                                <button className="sync-btn backup" onClick={handleBackup} disabled={status.type === 'loading'}>
                                    <CloudUpload size={18} /> 上傳備份至雲端
                                </button>
                                <button className="sync-btn restore" onClick={handleRestore} disabled={status.type === 'loading'}>
                                    <CloudDownload size={18} /> 從雲端下載還原
                                </button>
                            </div>

                            {status.message && (
                                <div className={`status-message ${status.type}`}>
                                    {status.type === 'success' && <CheckCircle size={16} />}
                                    {status.type === 'error' && <AlertCircle size={16} />}
                                    {status.type === 'loading' && <div className="spinner"></div>}
                                    <span>{status.message}</span>
                                </div>
                            )}
                            
                            <div className="setup-guide">
                                <h4>設定指南：</h4>
                                <ol>
                                    <li>新增一個完整的 Google Spreadsheet (試算表)。</li>
                                    <li>點擊「擴充功能」 {'>'} 「Apps Script」。</li>
                                    <li>將我們提供的程式碼貼上並覆蓋原有內容。</li>
                                    <li>點擊右上角「部署」 {'>'} 「新增部署作業」。</li>
                                    <li>選擇類型「網頁應用程式」，將存取權限設為「所有人」。</li>
                                    <li>複製 Webhook URL 貼到上方欄位即可使用！</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
