import type { Component } from 'vue';

/** 表格行操作定义。权限过滤由业务页面完成，组件只负责一致展示。 */
export interface TableRowAction {
    key: string;
    label: string;
    icon?: Component;
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    visible?: boolean;
    disabled?: boolean;
    disabledReason?: string;
    loading?: boolean;
    danger?: boolean;
    divided?: boolean;
}

/** 根据动作数量确定直接展示数量，避免操作列随功能增长持续变宽。 */
export function directTableRowActionCount(actionCount: number) {
    if (actionCount <= 2) return actionCount;
    if (actionCount === 3) return 2;
    return actionCount > 0 ? 1 : 0;
}
