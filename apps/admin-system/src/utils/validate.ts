export function isEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isPhone(value: string) {
    return /^1[3-9]\d{9}$/.test(value);
}
