import { computed, isRef, ref, watch, type Ref } from 'vue';
import { tablePreferenceStorage, type TableColumnPreference } from '@/utils/preference';
import type { StandardTableColumn, StandardTableColumnState } from './types';

type MaybeRef<T> = T | Ref<T>;

function valueOf<T>(value: MaybeRef<T>): T {
    return isRef(value) ? value.value : value;
}

function clampWidth(width: number | undefined, column: StandardTableColumn) {
    if (width === undefined || !Number.isFinite(width)) {
        return undefined;
    }
    const minWidth = column.minWidth || 80;
    const maxWidth = column.maxWidth || 600;
    return Math.min(Math.max(width, minWidth), maxWidth);
}

function normalizeColumns(defaultColumns: StandardTableColumn[], preference?: TableColumnPreference): StandardTableColumnState[] {
    const savedByKey = new Map(preference?.columns.map((item) => [item.key, item]));
    const columns = defaultColumns.map((column, index) => {
        const saved = savedByKey.get(column.key);
        const hideable = column.hideable !== false;
        return {
            ...column,
            hideable,
            resizable: column.resizable !== false,
            visible: hideable ? saved?.visible ?? column.defaultVisible !== false : true,
            width: saved?.customWidth === true ? clampWidth(saved.width, column) : undefined,
            order: saved?.order ?? column.order ?? index,
        };
    });
    columns.sort((left, right) => left.order - right.order);
    if (!columns.some((column) => column.visible)) {
        const firstHideable = columns.find((column) => column.hideable);
        if (firstHideable) {
            firstHideable.visible = true;
        }
    }
    return columns.map((column, index) => ({ ...column, order: index }));
}

export function useTableColumnPreference(
    tableKey: MaybeRef<string>,
    defaultColumns: MaybeRef<StandardTableColumn[]>,
    userKey: MaybeRef<string | number | undefined>,
) {
    const columns = ref<StandardTableColumnState[]>([]);

    function persist(nextColumns = columns.value) {
        const key = valueOf(tableKey);
        tablePreferenceStorage.write(valueOf(userKey), {
            version: 1,
            tableKey: key,
            columns: nextColumns.map((column, index) => ({
                key: column.key,
                visible: column.visible,
                width: column.width,
                customWidth: column.width !== undefined,
                order: index,
            })),
            updatedAt: Date.now(),
        });
    }

    function reload() {
        const key = valueOf(tableKey);
        const preference = tablePreferenceStorage.read(valueOf(userKey), key);
        columns.value = normalizeColumns(valueOf(defaultColumns), preference);
    }

    watch(
        () => [valueOf(tableKey), valueOf(userKey), valueOf(defaultColumns).map((column) => `${column.key}:${column.label}:${column.defaultWidth}:${column.minWidth}`).join('|')],
        reload,
        { immediate: true },
    );

    const visibleColumns = computed(() => columns.value.filter((column) => column.visible));

    function setColumnVisible(key: string, visible: boolean) {
        const target = columns.value.find((column) => column.key === key);
        if (!target || target.hideable === false) {
            return true;
        }
        if (!visible && columns.value.filter((column) => column.visible).length <= 1) {
            return false;
        }
        target.visible = visible;
        persist();
        return true;
    }

    function moveColumn(key: string, direction: 'up' | 'down') {
        const index = columns.value.findIndex((column) => column.key === key);
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (index < 0 || targetIndex < 0 || targetIndex >= columns.value.length) {
            return;
        }
        const next = [...columns.value];
        const [target] = next.splice(index, 1);
        next.splice(targetIndex, 0, target);
        columns.value = next.map((column, order) => ({ ...column, order }));
        persist();
    }

    function resetColumns() {
        const key = valueOf(tableKey);
        tablePreferenceStorage.remove(valueOf(userKey), key);
        columns.value = normalizeColumns(valueOf(defaultColumns));
    }

    function handleHeaderDragend(newWidth: number, _oldWidth: number, column: { property?: string }) {
        const key = column.property;
        if (!key) {
            return;
        }
        const target = columns.value.find((item) => item.key === key);
        if (!target || target.resizable === false) {
            return;
        }
        target.width = clampWidth(newWidth, target);
        persist();
    }

    function watchColumns(callback: (columns: StandardTableColumnState[]) => void) {
        return watch(columns, callback, { deep: true, immediate: true });
    }

    return {
        columns,
        visibleColumns,
        reload,
        setColumnVisible,
        moveColumn,
        resetColumns,
        handleHeaderDragend,
        watchColumns,
    };
}
