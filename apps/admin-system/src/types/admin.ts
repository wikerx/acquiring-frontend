import type { Component } from 'vue';

export type CrudFieldType = 'text' | 'select' | 'dateRange';
export type CrudColumnType = 'text' | 'status' | 'datetime' | 'amount' | 'masked';

export interface CrudSearchField {
    prop: string;
    label: string;
    type?: CrudFieldType;
    placeholder?: string;
    options?: Array<{ label: string; value: string | number | boolean }>;
}

export interface CrudTableColumn {
    prop: string;
    label: string;
    width?: number;
    minWidth?: number;
    type?: CrudColumnType;
}

export interface CrudModuleConfig {
    key: string;
    title: string;
    menuTitle: string;
    category: string;
    path: string;
    routeName: string;
    icon: string;
    permission: string;
    component: string;
    tableName: string;
    summary: string;
    searchFields: CrudSearchField[];
    columns: CrudTableColumn[];
    seedRows: Array<Record<string, string | number | boolean | null>>;
    dialogWidth?: string;
    sensitive?: boolean;
}

export interface AdminMenuItem {
    title: string;
    titleKey?: string;
    path?: string;
    icon: string;
    permission?: string;
    menuType?: string;
    externalLink?: number;
    routePath?: string;
    componentPath?: string;
    runtimePath?: string;
    children?: AdminMenuItem[];
}

export type IconMap = Record<string, Component>;
