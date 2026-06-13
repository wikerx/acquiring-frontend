/** Parse a hex color string into { r, g, b } */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '');
    if (h.length === 3) {
        return {
            r: parseInt(h[0] + h[0], 16),
            g: parseInt(h[1] + h[1], 16),
            b: parseInt(h[2] + h[2], 16),
        };
    }
    return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16),
    };
}

/** Mix two colors. weight 0 = all color1, weight 1 = all color2 */
function mix(color1: string, color2: string, weight: number): string {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = Math.round(c1.r * (1 - weight) + c2.r * weight);
    const g = Math.round(c1.g * (1 - weight) + c2.g * weight);
    const b = Math.round(c1.b * (1 - weight) + c2.b * weight);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Compute the full set of Element Plus primary color CSS variables for a given theme color */
function computePrimaryPalette(primary: string): Record<string, string> {
    return {
        '--app-primary': primary,
        '--app-primary-light': mix(primary, '#ffffff', 0.82),
        '--app-primary-dark': mix(primary, '#000000', 0.18),
        '--el-color-primary': primary,
        '--el-color-primary-light-3': mix(primary, '#ffffff', 0.3),
        '--el-color-primary-light-5': mix(primary, '#ffffff', 0.5),
        '--el-color-primary-light-7': mix(primary, '#ffffff', 0.7),
        '--el-color-primary-light-8': mix(primary, '#ffffff', 0.8),
        '--el-color-primary-light-9': mix(primary, '#ffffff', 0.9),
        '--el-color-primary-dark-2': mix(primary, '#000000', 0.2),
    };
}

/** Apply a theme color to the document root, updating all related CSS variables */
export function applyThemeColor(color: string) {
    const vars = computePrimaryPalette(color);
    Object.entries(vars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
    });
}
