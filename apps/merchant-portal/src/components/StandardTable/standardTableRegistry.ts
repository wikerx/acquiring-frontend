import { computed, ref, shallowReactive, type ComputedRef, type Ref } from 'vue';
import { useTableColumnPreference } from './useTableColumnPreference';
import type { StandardTableColumn, StandardTableColumnState } from './types';

type ElementTableColumn = {
    id: string;
    label?: string;
    property?: string;
    type?: string;
    width?: number | string;
    minWidth?: number | string;
    realWidth?: number;
    fixed?: boolean | 'left' | 'right';
    visible?: boolean;
    order?: number;
};

type ElementTableExpose = {
    $el?: HTMLElement;
    context?: {
        vnode?: {
            el?: HTMLElement;
        };
        store?: ElementTableStore;
    };
    store?: ElementTableStore;
    doLayout?: () => void;
};

type ElementTableStore = {
    states?: {
        _columns?: { value?: ElementTableColumn[] };
        columns?: { value?: ElementTableColumn[] };
    };
    updateColumns?: () => void;
    scheduleLayout?: (needUpdateColumns?: boolean, immediate?: boolean) => void;
};

type StandardTableColumnDefaults = Pick<StandardTableColumn, 'defaultWidth' | 'minWidth'>;

type ColumnLayoutItem = {
    column: ElementTableColumn;
    state?: StandardTableColumnState;
    index: number;
    key: string;
    visible: boolean;
    business: boolean;
    fixed: boolean;
    customWidth: boolean;
};

export interface StandardTableContext {
    tableKey: string;
    columns: Ref<StandardTableColumnState[]>;
    fixedColumns: ComputedRef<Array<{ key: string; label: string }>>;
    setColumnVisible: (key: string, visible: boolean) => boolean;
    moveColumn: (key: string, direction: 'up' | 'down') => void;
    resetColumns: () => void;
}

export interface StandardTableRegistration {
    context: StandardTableContext;
    handleHeaderDragend: (newWidth: number, oldWidth: number, column: { property?: string; id?: string }) => void;
    hasColumns: () => boolean;
    reloadColumns: () => void;
    refreshLayout: () => void;
    shouldFitContainer: () => boolean;
    dispose: () => void;
}

const contexts = shallowReactive<Record<string, StandardTableContext>>({});
const toolbarContexts = shallowReactive<Record<string, string>>({});
const TIME_COLUMN_MIN_WIDTH = 170;
const TIME_COLUMN_KEY_PATTERN = /(^|_|-)(create|created|update|updated|modify|modified|operation|operate|operated|start|end|expire|expired|effective|login|logout|fetch|check|heartbeat|trigger|publish|apply|applied|send|success|decision|evaluation|latest).*time$|time$|time(_|-)|gmt(create|modified)$|createdat$|updatedat$|operatedat$|loginat$/i;
const TIME_COLUMN_LABEL_PATTERN = /(创建|修改|更新|操作|开始|结束|生效|失效|过期|登录|登出|获取|检查|心跳|触发|发布时间|应用|发送|成功|决策|命中|最新).*时间|时间$/;

function toNumber(value: number | string | undefined, fallback?: number) {
    const result = Number(value);
    return Number.isFinite(result) ? result : fallback;
}

function isVisibleColumn(column: ElementTableColumn) {
    return column.visible !== false;
}

function isBusinessColumn(column: ElementTableColumn) {
    return !column.type || column.type === 'default';
}

function columnBaseWidth(column: ElementTableColumn) {
    return toNumber(column.width, undefined) || toNumber(column.minWidth, undefined) || (isBusinessColumn(column) ? 120 : 50);
}

function columnPreferredWidth(item: ColumnLayoutItem) {
    return item.state?.width || item.state?.defaultWidth || item.state?.minWidth || columnBaseWidth(item.column);
}

function columnKey(column: ElementTableColumn, _index = 0) {
    return column.property || column.label || column.id;
}

function columnLabel(column: ElementTableColumn) {
    return column.label || column.property || column.id;
}

function isTimeColumn(column: ElementTableColumn, label = columnLabel(column)) {
    const key = String(column.property || column.id || '');
    return TIME_COLUMN_KEY_PATTERN.test(key) || TIME_COLUMN_LABEL_PATTERN.test(label) || /\btime\b/i.test(label);
}

function toStandardColumn(column: ElementTableColumn, index: number): StandardTableColumn {
    const fixed = column.fixed === true ? 'left' : column.fixed || undefined;
    const label = columnLabel(column);
    const isOperation = label === '操作' || label === 'Operation' || label === 'Actions';
    const isFixedSystemColumn = column.type === 'selection' || column.type === 'index' || fixed === 'right' || isOperation;
    const timeColumn = isBusinessColumn(column) && isTimeColumn(column, label);
    const columnWidth = toNumber(column.width, undefined);
    const configuredMinWidth = toNumber(column.minWidth, isBusinessColumn(column) ? 120 : 50);
    const minWidth = timeColumn ? Math.max(configuredMinWidth || 0, TIME_COLUMN_MIN_WIDTH) : configuredMinWidth;
    const defaultWidth = timeColumn ? Math.max(columnWidth || 0, minWidth || TIME_COLUMN_MIN_WIDTH) : columnWidth;
    return {
        key: columnKey(column, index),
        label,
        defaultWidth,
        minWidth,
        hideable: isBusinessColumn(column) && !isFixedSystemColumn,
        resizable: isBusinessColumn(column),
        fixed,
        order: column.order ?? index,
    };
}

function readColumns(table: ElementTableExpose) {
    const store = table.store || table.context?.store;
    return store?.states?._columns?.value || store?.states?.columns?.value || [];
}

function tableRoot(table: ElementTableExpose) {
    return table.$el || table.context?.vnode?.el;
}

function applyColumns(table: ElementTableExpose, states: StandardTableColumnState[]) {
    const stateByKey = new Map(states.map((column, index) => [column.key, { column, index }]));
    const columns = readColumns(table);
    const layoutItems = columns.map((column, index) => {
        const key = columnKey(column, index);
        const saved = stateByKey.get(key);
        const isBusiness = isBusinessColumn(column);
        const visible = isBusiness ? saved?.column.visible !== false : true;
        return {
            column,
            state: saved?.column,
            index: saved?.index ?? index,
            key,
            visible,
            business: isBusiness,
            fixed: Boolean(column.fixed),
            customWidth: saved?.column.width !== undefined,
        };
    });
    const fitContainer = isFitContainer(table, layoutItems);
    const stretchableKeys = stretchableColumnKeys(layoutItems, fitContainer);
    layoutItems.forEach((item) => {
        const { column, state } = item;
        column.visible = item.visible;
        if (item.customWidth && state?.width) {
            column.width = state.width;
            column.realWidth = state.width;
        } else if (item.business && !item.fixed && stretchableKeys.has(item.key)) {
            column.width = undefined;
            column.realWidth = undefined;
        } else if (item.business && state?.defaultWidth !== undefined) {
            column.width = state.defaultWidth;
            column.realWidth = state.defaultWidth;
        } else if (item.business && column.minWidth && !item.fixed) {
            column.width = undefined;
            column.realWidth = undefined;
        }
        column.order = item.index;
    });
    columns.sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
    applyVisibilityStyle(table, columns);
    const store = table.store || table.context?.store;
    store?.updateColumns?.();
    store?.scheduleLayout?.(true, true);
    table.doLayout?.();
}

function isFitContainer(table: ElementTableExpose, layoutItems: ColumnLayoutItem[]) {
    const root = tableRoot(table);
    const containerWidth = root?.parentElement?.clientWidth || root?.clientWidth || 0;
    const preferredWidth = layoutItems
        .filter((item) => item.visible)
        .reduce((total, item) => total + columnPreferredWidth(item), 0);
    return !containerWidth || preferredWidth <= containerWidth;
}

function stretchableColumnKeys(layoutItems: ColumnLayoutItem[], fitContainer: boolean) {
    if (!fitContainer) {
        return new Set(
            layoutItems
                .filter((item) => item.business && !item.fixed && !item.customWidth && item.state?.defaultWidth === undefined)
                .map((item) => item.key),
        );
    }
    const stretchableItems = layoutItems.filter((item) => item.visible && item.business && !item.fixed && !item.customWidth);
    const preferredItems = stretchableItems.filter((item) => {
        const minWidth = toNumber(item.column.minWidth, undefined);
        const defaultWidth = item.state?.defaultWidth || toNumber(item.column.width, 0) || 0;
        return item.state?.defaultWidth === undefined || (minWidth !== undefined && minWidth >= 120) || defaultWidth >= 120;
    });
    return new Set((preferredItems.length ? preferredItems : stretchableItems).map((item) => item.key));
}

function applyVisibilityStyle(table: ElementTableExpose, columns: ElementTableColumn[]) {
    const root = tableRoot(table);
    if (!root) {
        return;
    }
    let style = root.querySelector<HTMLStyleElement>('style[data-standard-table-visibility]');
    if (!style) {
        style = document.createElement('style');
        style.dataset.standardTableVisibility = 'true';
        root.appendChild(style);
    }
    style.textContent = columns
        .filter((column) => column.visible === false)
        .map((column) => {
            const id = CSS.escape(column.id);
            return `[data-standard-table-key="${CSS.escape(String(root.dataset.standardTableKey || ''))}"] .${id}, [data-standard-table-key="${CSS.escape(String(root.dataset.standardTableKey || ''))}"] col[name="${id}"] { display: none !important; }`;
        })
        .join('\n');
}

export function registerStandardTable(tableKey: string, table: ElementTableExpose, userKey?: string | number | null): StandardTableRegistration {
    const columnDefaults = new Map<string, StandardTableColumnDefaults>();

    function readStandardColumns() {
        return readColumns(table).map((column, index) => {
            const standardColumn = toStandardColumn(column, index);
            const stableDefaults = columnDefaults.get(standardColumn.key);
            if (stableDefaults) {
                return {
                    ...standardColumn,
                    ...stableDefaults,
                };
            }
            columnDefaults.set(standardColumn.key, {
                defaultWidth: standardColumn.defaultWidth,
                minWidth: standardColumn.minWidth,
            });
            return standardColumn;
        });
    }

    const defaultColumns = ref(readStandardColumns());
    const preference = useTableColumnPreference(tableKey, defaultColumns, userKey ?? undefined);

    const context: StandardTableContext = {
        tableKey,
        columns: preference.columns,
        fixedColumns: computed(() =>
            preference.columns.value
                .filter((column) => column.hideable === false)
                .map((column) => ({ key: column.key, label: column.label })),
        ),
        setColumnVisible: preference.setColumnVisible,
        moveColumn: preference.moveColumn,
        resetColumns: preference.resetColumns,
    };

    contexts[tableKey] = context;
    applyColumns(table, preference.columns.value);

    const stop = preference.watchColumns((columns) => {
        applyColumns(table, columns);
    });

    function handleHeaderDragend(newWidth: number, oldWidth: number, column: { property?: string; id?: string }) {
        const currentColumns = readColumns(table);
        const matchedIndex = currentColumns.findIndex(
            (item) => (column.property && item.property === column.property) || (column.id && item.id === column.id),
        );
        const key = matchedIndex >= 0 ? columnKey(currentColumns[matchedIndex], matchedIndex) : column.property || column.id;
        if (!key) {
            return;
        }
        preference.handleHeaderDragend(newWidth, oldWidth, {
            property: key,
        });
    }

    function refreshLayout() {
        applyColumns(table, preference.columns.value);
    }

    function reloadColumns() {
        const nextColumns = readStandardColumns();
        if (!nextColumns.length) {
            return;
        }
        defaultColumns.value = nextColumns;
        preference.reload();
        applyColumns(table, preference.columns.value);
    }

    function hasColumns() {
        return readColumns(table).length > 0;
    }

    function shouldFitContainer() {
        const stateByKey = new Map(preference.columns.value.map((column) => [column.key, column]));
        const layoutItems = readColumns(table).map((column, index) => {
            const key = columnKey(column, index);
            const state = stateByKey.get(key);
            const business = isBusinessColumn(column);
            return {
                column,
                state,
                index,
                key,
                visible: business ? state?.visible !== false : isVisibleColumn(column),
                business,
                fixed: Boolean(column.fixed),
                customWidth: state?.width !== undefined,
            };
        });
        return isFitContainer(table, layoutItems);
    }

    return {
        context,
        handleHeaderDragend,
        hasColumns,
        reloadColumns,
        refreshLayout,
        shouldFitContainer,
        dispose() {
            stop();
            if (contexts[tableKey] === context) {
                delete contexts[tableKey];
            }
        },
    };
}

export function bindToolbarContext(toolbarId: string, tableKey: string) {
    toolbarContexts[toolbarId] = tableKey;
}

export function unbindToolbarContext(toolbarId: string, tableKey: string) {
    if (toolbarContexts[toolbarId] === tableKey) {
        delete toolbarContexts[toolbarId];
    }
}

export function useToolbarStandardTable(toolbarId: string) {
    return computed(() => {
        const tableKey = toolbarContexts[toolbarId];
        return tableKey ? contexts[tableKey] : undefined;
    });
}
