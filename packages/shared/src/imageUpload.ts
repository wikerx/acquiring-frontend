export const IMAGE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
export type ImageFormat = 'PNG' | 'JPEG' | 'WebP' | 'GIF' | 'BMP' | 'SVG';
export type ImageValidation =
    | { valid: true; format: 'PNG' | 'JPEG' }
    | { valid: false; reason: 'empty' | 'size' | 'unsupported' | 'extension' | 'content' | 'mime' | 'read'; actual?: ImageFormat };

/** 检查实际字节；浏览器声明的 MIME 和文件后缀不能把其他格式变成 PNG/JPEG。 */
export function detectImageFormat(bytes: Uint8Array): ImageFormat | undefined {
    const starts = (values: number[]) => values.every((value, index) => bytes[index] === value);
    const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
    if (starts([137, 80, 78, 71, 13, 10, 26, 10])) return 'PNG';
    if (starts([255, 216, 255])) return 'JPEG';
    if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'WebP';
    if (['GIF87a', 'GIF89a'].includes(ascii(0, 6))) return 'GIF';
    if (ascii(0, 2) === 'BM') return 'BMP';
    const text = new TextDecoder().decode(bytes).replace(/^\uFEFF/, '').trimStart();
    if (/^(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(text)) return 'SVG';
    return undefined;
}

export async function validateImageFile(file: File): Promise<ImageValidation> {
    if (file.size === 0) return { valid: false, reason: 'empty' };
    if (file.size > IMAGE_UPLOAD_MAX_BYTES) return { valid: false, reason: 'size' };
    let actual: ImageFormat | undefined;
    try { actual = detectImageFormat(new Uint8Array(await file.slice(0, 512).arrayBuffer())); }
    catch { return { valid: false, reason: 'read' }; }
    if (!actual) return { valid: false, reason: 'content' };
    if (actual !== 'PNG' && actual !== 'JPEG') return { valid: false, reason: 'unsupported', actual };
    const extensionMatches = actual === 'PNG' ? /\.png$/i.test(file.name) : /\.jpe?g$/i.test(file.name);
    if (!extensionMatches) return { valid: false, reason: 'extension', actual };
    const expectedMime = actual === 'PNG' ? 'image/png' : 'image/jpeg';
    if (file.type && ![expectedMime, 'application/octet-stream'].includes(file.type.toLowerCase())) return { valid: false, reason: 'mime', actual };
    return { valid: true, format: actual };
}
