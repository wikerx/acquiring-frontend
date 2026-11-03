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

/**
 * Round a decimal string with HALF_UP semantics without converting it to a
 * JavaScript number. This keeps backend monetary values exact before display.
 */
export function roundDecimalAmount(
    value: string | number,
    fractionDigits = 2,
): string {
    const amountText = String(value).trim();
    const decimalMatch = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(amountText);
    if (!decimalMatch || !Number.isInteger(fractionDigits) || fractionDigits < 0) {
        return amountText;
    }

    const [, sign, integerText, fractionText = ''] = decimalMatch;
    const scale = 10n ** BigInt(fractionDigits);
    const keptFraction = fractionText.slice(0, fractionDigits).padEnd(fractionDigits, '0');
    let scaledAmount = BigInt(integerText) * scale + BigInt(keptFraction || '0');
    if ((fractionText[fractionDigits] || '0') >= '5') {
        scaledAmount += 1n;
    }

    const roundedSign = sign === '-' && scaledAmount !== 0n ? '-' : '';
    const roundedInteger = scaledAmount / scale;
    if (fractionDigits === 0) {
        return `${roundedSign}${roundedInteger}`;
    }
    const roundedFraction = String(scaledAmount % scale).padStart(fractionDigits, '0');
    return `${roundedSign}${roundedInteger}.${roundedFraction}`;
}

/**
 * Normalize a decimal amount without passing through JavaScript floating point.
 * Invalid values and values exceeding the requested currency exponent return null.
 */
export function normalizeDecimalAmount(
    value: string | number | null | undefined,
    maximumFractionDigits?: number,
): string | null {
    if (value === null || value === undefined) {
        return null;
    }
    const match = /^([+-]?)(\d+)(?:\.(\d*))?$/.exec(String(value).trim());
    if (!match) {
        return null;
    }
    const [, sign, integerText, fractionText = ''] = match;
    if (maximumFractionDigits !== undefined
        && (!Number.isInteger(maximumFractionDigits)
            || maximumFractionDigits < 0
            || fractionText.length > maximumFractionDigits)) {
        return null;
    }
    const normalizedInteger = integerText.replace(/^0+(?=\d)/, '') || '0';
    const normalizedFraction = fractionText.replace(/0+$/, '');
    const isZero = normalizedInteger === '0' && normalizedFraction.length === 0;
    const normalizedSign = sign === '-' && !isZero ? '-' : '';
    return `${normalizedSign}${normalizedInteger}${normalizedFraction ? `.${normalizedFraction}` : ''}`;
}

/**
 * 在不经过 JavaScript 浮点数转换的前提下精确比较两个合法十进制金额。
 */
export function compareDecimalAmounts(
    left: string | number,
    right: string | number,
): -1 | 0 | 1 {
    const normalizedLeft = normalizeDecimalAmount(left);
    const normalizedRight = normalizeDecimalAmount(right);
    if (normalizedLeft === null || normalizedRight === null) {
        throw new TypeError('decimal amount is invalid');
    }
    const leftParts = decimalParts(normalizedLeft);
    const rightParts = decimalParts(normalizedRight);
    if (leftParts.negative !== rightParts.negative) {
        return leftParts.negative ? -1 : 1;
    }
    const scale = Math.max(leftParts.fraction.length, rightParts.fraction.length);
    const leftScaled = BigInt(`${leftParts.integer}${leftParts.fraction.padEnd(scale, '0') || '0'}`);
    const rightScaled = BigInt(`${rightParts.integer}${rightParts.fraction.padEnd(scale, '0') || '0'}`);
    const comparison = leftScaled === rightScaled ? 0 : leftScaled < rightScaled ? -1 : 1;
    return leftParts.negative && comparison !== 0 ? (comparison * -1) as -1 | 1 : comparison;
}

/**
 * 仅当输入是格式合法且大于零的十进制金额时返回 true。
 */
export function isPositiveDecimalAmount(value: string | number | null | undefined): boolean {
    const normalized = normalizeDecimalAmount(value);
    return normalized !== null && compareDecimalAmounts(normalized, '0') > 0;
}

/**
 * Calculate labelAmount * targetAmount / sourceAmount with HALF_UP rounding.
 * This helper is intended for display only; the backend remains authoritative for transaction amounts.
 */
export function proportionalDecimalAmount(
    labelAmount: string | number,
    targetAmount: string | number,
    sourceAmount: string | number,
    fractionDigits: number,
): string | null {
    const label = unsignedScaledDecimal(labelAmount);
    const target = unsignedScaledDecimal(targetAmount);
    const source = unsignedScaledDecimal(sourceAmount);
    if (!label || !target || !source || source.integer === 0n
        || !Number.isInteger(fractionDigits) || fractionDigits < 0) {
        return null;
    }
    const numerator = label.integer
        * target.integer
        * (10n ** BigInt(source.scale + fractionDigits));
    const denominator = source.integer
        * (10n ** BigInt(label.scale + target.scale));
    let scaledResult = numerator / denominator;
    const remainder = numerator % denominator;
    if (remainder * 2n >= denominator) {
        scaledResult += 1n;
    }
    const divisor = 10n ** BigInt(fractionDigits);
    if (fractionDigits === 0) {
        return String(scaledResult);
    }
    return `${scaledResult / divisor}.${String(scaledResult % divisor).padStart(fractionDigits, '0')}`;
}

function decimalParts(value: string) {
    const negative = value.startsWith('-');
    const unsigned = negative ? value.slice(1) : value;
    const [integer, fraction = ''] = unsigned.split('.');
    return { negative, integer, fraction };
}

function unsignedScaledDecimal(value: string | number) {
    const normalized = normalizeDecimalAmount(value);
    if (normalized === null || normalized.startsWith('-')) {
        return null;
    }
    const [integer, fraction = ''] = normalized.split('.');
    return {
        integer: BigInt(`${integer}${fraction}`),
        scale: fraction.length,
    };
}
