import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadExcel } from '@/utils/download';

export interface CardBinQuery extends PageQuery {
    cardBin?: string;
    cardBrand?: string;
    cardType?: string;
    issuerCountryAlpha2?: string;
    issuerBank?: string;
    status?: number;
    dataSource?: string;
}

export interface CardBinSaveRequest {
    id?: number;
    cardBinStart: string;
    cardBinEnd?: string;
    cardBrand: string;
    cardSubBrand?: string;
    cardType: string;
    cardLevel?: string;
    issuerCountryName?: string;
    issuerCountryAlpha2?: string;
    issuerCountryAlpha3?: string;
    issuerCountryNumeric?: string;
    issuerBank?: string;
    issuerWebUrl?: string;
    issuerTelephone?: string;
    dataSource?: string;
    sourcePriority?: number;
    effectiveTime?: string;
    expireTime?: string;
    status?: number;
    remark?: string;
}

export interface CardBinRecord extends CardBinSaveRequest {
    id: number;
    legacyPkId?: number;
    cardBinStart: string;
    cardBinEnd: string;
    binLength?: number;
    cardBrandName?: string;
    cardTypeName?: string;
    dataSourceName?: string;
    statusName?: string;
    sourceBatchNo?: string;
    createBy?: string;
    updateBy?: string;
    createTime?: string;
    updateTime?: string;
}

export interface CardBinOption {
    label: string;
    value: string;
    alpha2?: string;
    extraJson?: string;
    flagEmoji?: string;
    alpha3?: string;
    numeric?: string;
    countryName?: string;
}

export interface CardBinOptions {
    cardBrandOptions: CardBinOption[];
    cardTypeOptions: CardBinOption[];
    statusOptions: CardBinOption[];
    dataSourceOptions: CardBinOption[];
    countryOptions: CardBinOption[];
}

export interface CardBinMatchResponse {
    matched: boolean;
    matchCount: number;
    bestMatch?: CardBinRecord | null;
    matches: CardBinRecord[];
}

export interface CardBinImportBatch {
    id: number;
    batchNo: string;
    importType: string;
    dataSource: string;
    fileName?: string;
    totalCount: number;
    successCount: number;
    failedCount: number;
    conflictCount: number;
    duplicateCount: number;
    status: number;
    errorMessage?: string;
    remark?: string;
    createBy?: string;
    createTime?: string;
    updateTime?: string;
}

export async function pageCardBins(data: CardBinQuery = {}) {
    const result = await http.post<CommonResult<PageResult<CardBinRecord>>>('/admin/base/card-bin/page', data);
    return unwrapResult(result.data);
}

export async function getCardBin(id: number) {
    const result = await http.get<CommonResult<CardBinRecord>>(`/admin/base/card-bin/${id}`);
    return unwrapResult(result.data);
}

export async function addCardBin(data: CardBinSaveRequest) {
    const result = await http.post<CommonResult<CardBinRecord>>('/admin/base/card-bin', data);
    return unwrapResult(result.data);
}

export async function updateCardBin(id: number, data: CardBinSaveRequest) {
    const result = await http.put<CommonResult<CardBinRecord>>(`/admin/base/card-bin/${id}`, data);
    return unwrapResult(result.data);
}

export async function deleteCardBin(id: number) {
    const result = await http.delete<CommonResult<void>>(`/admin/base/card-bin/${id}`);
    return unwrapResult(result.data);
}

export async function updateCardBinStatus(id: number, status: number) {
    const result = await http.put<CommonResult<CardBinRecord>>(`/admin/base/card-bin/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function matchCardBin(cardBin: string) {
    const result = await http.post<CommonResult<CardBinMatchResponse>>('/admin/base/card-bin/match', { cardBin });
    return unwrapResult(result.data);
}

export async function exportCardBins(data: CardBinQuery = {}) {
    await downloadExcel('/admin/base/card-bin/export', {
        method: 'post',
        data,
        fileName: 'card-bin.xlsx',
    });
}

export async function pageCardBinImportBatches(data: CardBinQuery = {}) {
    const result = await http.post<CommonResult<PageResult<CardBinImportBatch>>>('/admin/base/card-bin/import-batches', data);
    return unwrapResult(result.data);
}

export async function initCardBinFromLegacyDb() {
    const result = await http.post<CommonResult<CardBinImportBatch>>('/admin/base/card-bin/init-from-legacy-db');
    return unwrapResult(result.data);
}

export async function getCardBinOptions() {
    const result = await http.get<CommonResult<CardBinOptions>>('/admin/base/card-bin/options');
    return unwrapResult(result.data);
}
