import { downloadBlob } from '@/utils/download';

export type FileTemplateLocale = 'zh-CN' | 'en-US';

/**
 * 商户系统统一模板下载入口。
 *
 * 业务页面只传稳定模板编码，不允许自行拼装对象存储地址或维护静态模板文件。
 */
export async function downloadManagedFileTemplate(
    templateCode: string,
    locale: FileTemplateLocale,
    fallbackFileName = 'template.bin',
) {
    await downloadBlob(
        `/merchant/system/file-templates/${encodeURIComponent(templateCode)}/download`,
        {
            params: { locale },
            fileName: fallbackFileName,
        },
    );
}
