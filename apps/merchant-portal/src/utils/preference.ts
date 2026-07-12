const APP_CODE = 'merchant';

export interface TableColumnPreferenceItem {
    key: string;
    visible: boolean;
    width?: number;
    customWidth?: boolean;
    order: number;
}

export interface TableColumnPreference {
    version: 1;
    tableKey: string;
    columns: TableColumnPreferenceItem[];
    updatedAt: number;
}

function safeUserKey(userKey?: string | number | null) {
    return String(userKey || 'anonymous');
}

function safeReadJson<T>(key: string): T | undefined {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : undefined;
    } catch {
        localStorage.removeItem(key);
        return undefined;
    }
}

function safeWriteJson(key: string, value: unknown) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // UI preference persistence should never block page rendering.
    }
}

export const tablePreferenceStorage = {
    tableKey(userKey: string | number | null | undefined, tableKey: string) {
        return `vexra:${APP_CODE}:table-preference:${safeUserKey(userKey)}:${tableKey}`;
    },
    read(userKey: string | number | null | undefined, tableKey: string) {
        const preference = safeReadJson<TableColumnPreference>(this.tableKey(userKey, tableKey));
        if (!preference || preference.version !== 1 || preference.tableKey !== tableKey || !Array.isArray(preference.columns)) {
            return undefined;
        }
        return preference;
    },
    write(userKey: string | number | null | undefined, preference: TableColumnPreference) {
        safeWriteJson(this.tableKey(userKey, preference.tableKey), preference);
    },
    remove(userKey: string | number | null | undefined, tableKey: string) {
        localStorage.removeItem(this.tableKey(userKey, tableKey));
    },
};
