export function formatAmount(value: number | string | null | undefined, currency = 'USD') {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

export function formatDateTime(value: string | number | Date | null | undefined) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
