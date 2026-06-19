import type { AxiosResponse, ResponseType } from 'axios';
import { http } from '@/api/http';

/**
 * Excel 二进制文件 MIME 类型。
 */
const EXCEL_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * 统一发起 Excel 下载请求，并从响应头中解析文件名。
 *
 * @param url 请求地址
 * @param options 请求选项
 */
export async function downloadExcel(
    url: string,
    options: {
        method?: 'get' | 'post';
        params?: Record<string, unknown>;
        data?: unknown;
        fileName?: string;
    } = {},
) {
    const response = await http.request<Blob>({
        url,
        method: options.method || 'post',
        params: options.params,
        data: options.data,
        responseType: 'blob' as ResponseType,
    });
    await handleBlobResponse(response, options.fileName || 'export.xlsx');
}

/**
 * 处理 Blob 响应，失败时优先解析为统一错误消息。
 *
 * @param response Axios Blob 响应
 * @param fallbackFileName 兜底文件名
 */
async function handleBlobResponse(response: AxiosResponse<Blob>, fallbackFileName: string) {
    const contentType = String(response.headers['content-type'] || '');
    if (!contentType.includes(EXCEL_CONTENT_TYPE)) {
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

/**
 * 从响应头中解析下载文件名，兼容 `filename*=` 和 `filename=` 两种格式。
 *
 * @param contentDisposition 响应头
 * @param fallbackFileName 兜底文件名
 * @return 解析后的文件名
 */
function parseFileName(contentDisposition: string | undefined, fallbackFileName: string) {
    if (!contentDisposition) {
        return fallbackFileName;
    }
    const utf8Match = contentDisposition.match(/filename\*=utf-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1]);
    }
    const normalMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    if (normalMatch?.[1]) {
        return decodeURIComponent(normalMatch[1]);
    }
    return fallbackFileName;
}

/**
 * 将后端异常 Blob 尝试解析为统一错误消息。
 *
 * @param blob 错误响应体
 * @return 友好的错误消息
 */
async function resolveBlobErrorMessage(blob: Blob) {
    try {
        const text = await blob.text();
        if (!text) {
            return 'Export failed';
        }
        const payload = JSON.parse(text) as { message?: string };
        return payload.message || text;
    } catch {
        return 'Export failed';
    }
}
