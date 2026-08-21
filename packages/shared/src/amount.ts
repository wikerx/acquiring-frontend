/**
 * Format a decimal amount without converting the backend decimal string to a
 * JavaScript number. This preserves large balances and up to eight fractional
 * digits exactly as returned by the account and fee APIs.
 */
export function formatDecimalAmount(
    value: string | number,
    locale = 'zh-CN',
    minimumFractionDigits = 2,
    maximumFractionDigits = 8,
): string {
    const amountText = String(value).trim();
    const decimalMatch = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(amountText);
    if (!decimalMatch) {
        return amountText;
    }

    const [, sign, integerText, fractionText = ''] = decimalMatch;
    const signedInteger = `${sign}${integerText}`;
    const groupedInteger = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
        .format(BigInt(signedInteger));
    const significantFractionLength = fractionText.replace(/0+$/, '').length;
    const displayFractionLength = Math.min(
        maximumFractionDigits,
        Math.max(minimumFractionDigits, significantFractionLength),
    );
    if (displayFractionLength === 0) {
        return groupedInteger;
    }

    const decimalSeparator = new Intl.NumberFormat(locale).formatToParts(1.1)
        .find((part) => part.type === 'decimal')?.value ?? '.';
    return `${groupedInteger}${decimalSeparator}${fractionText.padEnd(displayFractionLength, '0').slice(0, displayFractionLength)}`;
}
