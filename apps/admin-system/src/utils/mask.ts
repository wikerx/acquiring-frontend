export function maskPhone(value: string) {
    return value.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
}

export function maskEmail(value: string) {
    const [name, domain] = value.split('@');
    if (!name || !domain) {
        return value;
    }
    return `${name.slice(0, 2)}***@${domain}`;
}

export function maskCardNo(value: string) {
    return value.replace(/^(\d{6})\d+(\d{4})$/, '$1******$2');
}

export function maskSecret(value: string) {
    if (value.length <= 12) {
        return '******';
    }
    return `${value.slice(0, 6)}******${value.slice(-4)}`;
}
