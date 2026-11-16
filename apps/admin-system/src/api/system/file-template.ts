import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadBlob } from '@/utils/download';

export type FileTemplateOwnerSystem = 'ADMIN' | 'MERCHANT' | 'SHARED';
export type FileTemplatePublishStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type FileTemplateLocale = 'zh-CN' | 'en-US';

export interface FileTemplateAsset {
    id: number;
    locale: FileTemplateLocale;
    originalFilename: string;
    contentType: string;
    fileSize: number;
    sha256: string;
}

export interface FileTemplateVersion {
    id: number;
    versionNo: number;
    schemaVersion?: string;
    requestId: string;
    releaseNote?: string;
    publishStatus: FileTemplatePublishStatus;
    publishedBy?: string;
    publishedTime?: string;
    createBy?: string;
    createTime?: string;
    assets: FileTemplateAsset[];
}

export interface FileTemplateSummary {
    id: number;
    templateCode: string;
    ownerSystem: FileTemplateOwnerSystem;
    moduleCode: string;
    nameZh: string;
    nameEn: string;
    fileExtension: string;
    adminPermissionCode?: string;
    merchantPermissionCode?: string;
    status: number;
    currentVersionId?: number;
    currentVersionNo?: number;
    version: number;
    updateBy?: string;
    updateTime?: string;
}

export interface FileTemplateDetail extends FileTemplateSummary {
    remark?: string;
    createBy?: string;
    createTime?: string;
    versions: FileTemplateVersion[];
}

export interface FileTemplateQuery extends PageQuery {
    keyword?: string;
    ownerSystem?: FileTemplateOwnerSystem;
    status?: number;
}

export interface FileTemplateModuleOption {
    code: string;
    nameZh: string;
    nameEn: string;
    ownerSystems: FileTemplateOwnerSystem[];
}

export interface FileTemplatePermissionOption {
    code: string;
    name: string;
}

export interface FileTemplateFormOptions {
    modules: FileTemplateModuleOption[];
    adminPermissions: FileTemplatePermissionOption[];
    merchantPermissions: FileTemplatePermissionOption[];
}

export interface FileTemplateCreateRequest {
    ownerSystem: FileTemplateOwnerSystem;
    moduleCode: string;
    nameZh: string;
    nameEn: string;
    fileExtension: string;
    adminPermissionCode?: string;
    merchantPermissionCode?: string;
    remark?: string;
}

export interface FileTemplateUpdateRequest extends Omit<FileTemplateCreateRequest, 'fileExtension'> {
    status: number;
    expectedVersion: number;
}

export interface FileTemplateUploadRequest {
    versionNo: number;
    schemaVersion?: string;
    requestId: string;
    releaseNote?: string;
    zhFile: File;
    enFile: File;
}

export interface FileTemplateSwitchVersionRequest {
    expectedTemplateVersion: number;
    requestId: string;
    reason: string;
}

export async function searchFileTemplates(data: FileTemplateQuery) {
    const result = await http.post<CommonResult<PageResult<FileTemplateSummary>>>(
        '/admin/system/file-templates/search', data,
    );
    return unwrapResult(result.data);
}

export async function getFileTemplate(id: number) {
    const result = await http.get<CommonResult<FileTemplateDetail>>(
        `/admin/system/file-templates/${id}`,
    );
    return unwrapResult(result.data);
}

export async function getFileTemplateFormOptions() {
    const result = await http.get<CommonResult<FileTemplateFormOptions>>(
        '/admin/system/file-templates/options',
    );
    return unwrapResult(result.data);
}

export async function createFileTemplate(data: FileTemplateCreateRequest) {
    const result = await http.post<CommonResult<FileTemplateDetail>>(
        '/admin/system/file-templates', data,
    );
    return unwrapResult(result.data);
}

export async function updateFileTemplate(id: number, data: FileTemplateUpdateRequest) {
    const result = await http.put<CommonResult<FileTemplateDetail>>(
        `/admin/system/file-templates/${id}`, data,
    );
    return unwrapResult(result.data);
}

export async function uploadFileTemplateVersion(id: number, data: FileTemplateUploadRequest) {
    const formData = new FormData();
    formData.append('versionNo', String(data.versionNo));
    formData.append('requestId', data.requestId);
    if (data.schemaVersion) formData.append('schemaVersion', data.schemaVersion);
    if (data.releaseNote) formData.append('releaseNote', data.releaseNote);
    formData.append('zhFile', data.zhFile);
    formData.append('enFile', data.enFile);
    const result = await http.post<CommonResult<FileTemplateVersion>>(
        `/admin/system/file-templates/${id}/versions`, formData,
    );
    return unwrapResult(result.data);
}

export async function publishFileTemplateVersion(
    templateId: number,
    versionId: number,
    data: FileTemplateSwitchVersionRequest,
) {
    const result = await http.post<CommonResult<FileTemplateDetail>>(
        `/admin/system/file-templates/${templateId}/versions/${versionId}/publish`, data,
    );
    return unwrapResult(result.data);
}

export async function rollbackFileTemplateVersion(
    templateId: number,
    versionId: number,
    data: FileTemplateSwitchVersionRequest,
) {
    const result = await http.post<CommonResult<FileTemplateDetail>>(
        `/admin/system/file-templates/${templateId}/versions/${versionId}/rollback`, data,
    );
    return unwrapResult(result.data);
}

export async function downloadCurrentFileTemplate(template: FileTemplateSummary, locale: FileTemplateLocale) {
    const localizedName = locale === 'en-US' ? template.nameEn : template.nameZh;
    await downloadBlob(
        `/admin/system/file-templates/code/${encodeURIComponent(template.templateCode)}/download`,
        {
            params: { locale },
            fileName: `${localizedName}.${template.fileExtension}`,
        },
    );
}
