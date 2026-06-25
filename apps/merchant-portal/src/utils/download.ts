import type { AxiosResponse, ResponseType } from 'axios';
import { http } from '@/api/http';

const JSON_CONTENT_TYPE = 'application/json';

/**
 * Downloads a merchant portal file and saves it with the filename from response headers.
 *
 * @param url request URL
 * @param options request options
 */
export async function downloadBlob(
    url: string,
    options: {
        params?: Record<string, unknown>;
        fileName?: string;
    } = {},
) {
    const response = await http.request<Blob>({
        url,
        method: 'get',
        params: options.params,
        responseType: 'blob' as ResponseType,
    });
    await handleBlobResponse(response, options.fileName || 'download.bin');
}

async function handleBlobResponse(response: AxiosResponse<Blob>, fallbackFileName: string) {
    const contentType = String(response.headers['content-type'] || '');
    if (contentType.includes(JSON_CONTENT_TYPE)) {
        const errorMessage = await resolveBlobErrorMessage(response.data);
        throw new Error(errorMessage);
    }
    const fileName = parseFileName(response.headers['content-disposition'], fallbackFileName);
    const downloadUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
}

function parseFileName(contentDisposition: string | undefined, fallbackFileName: string) {
    if (!contentDisposition) {
        return fallbackFileName;
    }
    const utf8Match = contentDisposition.match(/filename\*=utf-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1]);
    }
    const normalMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    return normalMatch?.[1] ? decodeURIComponent(normalMatch[1]) : fallbackFileName;
}

async function resolveBlobErrorMessage(blob: Blob) {
    try {
        const text = await blob.text();
        if (!text) {
            return 'Download failed';
        }
        const payload = JSON.parse(text) as { message?: string };
        return payload.message || text;
    } catch {
        return 'Download failed';
    }
}
