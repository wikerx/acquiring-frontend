function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const value = hex.replace('#', '');
    if (value.length === 3) {
        return {
            r: parseInt(value[0] + value[0], 16),
            g: parseInt(value[1] + value[1], 16),
            b: parseInt(value[2] + value[2], 16),
        };
    }
    return {
        r: parseInt(value.substring(0, 2), 16),
        g: parseInt(value.substring(2, 4), 16),
        b: parseInt(value.substring(4, 6), 16),
    };
}

function mix(color1: string, color2: string, weight: number): string {
    const first = hexToRgb(color1);
    const second = hexToRgb(color2);
    const channel = (left: number, right: number) => Math.round(left * (1 - weight) + right * weight);
    const r = channel(first.r, second.r);
    const g = channel(first.g, second.g);
    const b = channel(first.b, second.b);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function merchantThemeCssVariables(primary: string): Record<string, string> {
    const rgb = hexToRgb(primary);
    return {
        '--merchant-primary': primary,
        '--merchant-primary-deep': mix(primary, '#000000', 0.2),
        '--merchant-primary-rgb': `${rgb.r} ${rgb.g} ${rgb.b}`,
        '--merchant-primary-soft': mix(primary, '#ffffff', 0.92),
        '--merchant-primary-soft-strong': mix(primary, '#ffffff', 0.84),
        '--merchant-primary-border': mix(primary, '#ffffff', 0.72),
        '--merchant-primary-border-strong': mix(primary, '#ffffff', 0.52),
        '--merchant-theme-canvas': mix(primary, '#ffffff', 0.965),
        '--merchant-theme-panel-tint': mix(primary, '#ffffff', 0.95),
        '--merchant-theme-table-hover': mix(primary, '#ffffff', 0.94),
        '--merchant-action-primary': primary,
        '--merchant-action-primary-hover': mix(primary, '#000000', 0.14),
        '--el-color-primary': primary,
        '--el-color-primary-light-3': mix(primary, '#ffffff', 0.3),
        '--el-color-primary-light-5': mix(primary, '#ffffff', 0.5),
        '--el-color-primary-light-7': mix(primary, '#ffffff', 0.7),
        '--el-color-primary-light-8': mix(primary, '#ffffff', 0.8),
        '--el-color-primary-light-9': mix(primary, '#ffffff', 0.9),
        '--el-color-primary-dark-2': mix(primary, '#000000', 0.2),
    };
}
