import { ElMessageBox } from 'element-plus';
import { searchDictData, type SysDictData } from '@/api/system/dict';

export interface SelectOption {
    label: string;
    value: string;
    extraJson?: string;
}

export async function loadEmailDictOptions(dictType: string, locale: string): Promise<SelectOption[]> {
    const result = await searchDictData({
        pageNo: 1,
        pageSize: 500,
        dictType,
        locale,
        status: 1,
    });
    return result.records.map((item: SysDictData) => ({
        label: item.dictLabel,
        value: item.dictValue,
        extraJson: item.extraJson,
    }));
}

export function optionLabel(options: SelectOption[], value?: string) {
    if (!value) {
        return '-';
    }
    return options.find((item) => item.value === value)?.label || value;
}

export function statusType(value?: number) {
    return value === 1 ? 'success' : 'info';
}

export function sendStatusType(value?: number) {
    if (value === 2) {
        return 'success';
    }
    if (value === 3) {
        return 'danger';
    }
    return 'warning';
}

export function resolveErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
}

export function showEmailError(error: unknown, title: string, fallback: string) {
    return ElMessageBox.alert(resolveErrorMessage(error, fallback), title, { type: 'error' });
}

export function parseJsonObject(value?: string) {
    const source = String(value || '').trim();
    if (!source) {
        return {};
    }
    const parsed = JSON.parse(source) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error('JSON must be an object');
    }
    return parsed as Record<string, unknown>;
}

export function prettyJson(value?: string) {
    const source = String(value || '').trim();
    if (!source) {
        return '-';
    }
    try {
        return JSON.stringify(JSON.parse(source), null, 2);
    } catch {
        return source;
    }
}

export function maskSecret(configured?: number) {
    return configured === 1 ? '******' : '-';
}
