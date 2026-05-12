import { toLocalDateString } from './date';

const pad = (value) => String(value).padStart(2, '0');

const parseRocDate = (value) => {
    if (!/^\d{7}$/.test(value)) return null;
    const year = Number(value.slice(0, 3)) + 1911;
    const month = Number(value.slice(3, 5));
    const day = Number(value.slice(5, 7));
    if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${pad(month)}-${pad(day)}`;
};

export const parseTaiwanInvoiceQr = (rawValue = '') => {
    const value = String(rawValue).trim();
    const invoiceNumber = value.slice(0, 10);
    if (!/^[A-Z]{2}\d{8}$/.test(invoiceNumber)) return null;

    const date = parseRocDate(value.slice(10, 17));
    if (!date) return null;

    const salesAmount = parseInt(value.slice(21, 29), 16);
    const totalAmount = parseInt(value.slice(29, 37), 16);
    const amount = Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : salesAmount;
    if (!Number.isFinite(amount) || amount <= 0) return null;

    return {
        invoiceNumber,
        amount,
        date: date || toLocalDateString(),
        note: `電子發票 ${invoiceNumber}`,
        rawValue: value,
    };
};
