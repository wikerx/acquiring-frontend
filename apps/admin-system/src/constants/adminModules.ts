import { commonStatusOptions, keyStatusOptions, loginStatusOptions } from '@/enums/status';
import { auditRows, commonRows, keyRows, merchantRows, userRows } from '@/fixtures/crudData';
import type { AdminMenuItem, CrudModuleConfig } from '@/types/admin';

const statusField = {
    prop: 'status',
    label: '状态',
    type: 'select' as const,
    options: commonStatusOptions,
};

const keyStatusField = {
    prop: 'status',
    label: '状态',
    type: 'select' as const,
    options: keyStatusOptions,
};

const loginStatusField = {
    prop: 'status',
    label: '状态',
    type: 'select' as const,
    options: loginStatusOptions,
};

const commonColumns = [
    { prop: 'code', label: '编码', minWidth: 150 },
    { prop: 'name', label: '名称', minWidth: 180 },
    { prop: 'status', label: '状态', type: 'status' as const, width: 110 },
    { prop: 'createdAt', label: '创建时间', type: 'datetime' as const, minWidth: 180 },
    { prop: 'updatedAt', label: '更新时间', type: 'datetime' as const, minWidth: 180 },
];

const auditColumns = [
    { prop: 'account', label: '账号', minWidth: 150 },
    { prop: 'clientIp', label: '客户端 IP', minWidth: 150 },
    { prop: 'status', label: '状态', type: 'status' as const, width: 110 },
    { prop: 'message', label: '说明', minWidth: 180 },
    { prop: 'createdAt', label: '发生时间', type: 'datetime' as const, minWidth: 180 },
];

const keyColumns = [
    { prop: 'keyId', label: '密钥 ID', minWidth: 180 },
    { prop: 'merchantNo', label: '商户号', minWidth: 160 },
    { prop: 'fingerprint', label: '指纹', minWidth: 200 },
    { prop: 'status', label: '状态', type: 'status' as const, width: 110 },
    { prop: 'updatedAt', label: '更新时间', type: 'datetime' as const, minWidth: 180 },
];

const baseSearchFields = [
    { prop: 'keyword', label: '关键词', placeholder: '请输入编码或名称' },
    statusField,
];

const createCommonModule = (
    key: string,
    title: string,
    category: string,
    path: string,
    routeName: string,
    icon: string,
    permission: string,
    component: string,
    tableName: string,
    summary: string,
    rows: Array<Record<string, string | number | boolean | null>> = commonRows,
): CrudModuleConfig => ({
    key,
    title,
    menuTitle: title,
    category,
    path,
    routeName,
    icon,
    permission,
    component,
    tableName,
    summary,
    searchFields: baseSearchFields,
    columns: commonColumns,
    seedRows: rows,
});

export const crudModules: CrudModuleConfig[] = [
    {
        key: 'system.user',
        title: '用户管理',
        menuTitle: '用户管理',
        category: '系统管理',
        path: '/system/user',
        routeName: 'SystemUser',
        icon: 'User',
        permission: 'system:user:list',
        component: 'system/user',
        tableName: 'sys_user',
        summary: '管理系统用户主体、基础资料、启停状态和角色授权入口。',
        searchFields: [
            { prop: 'keyword', label: '用户关键词', placeholder: '用户编号/姓名/邮箱' },
            statusField,
        ],
        columns: [
            { prop: 'userNo', label: '用户编号', minWidth: 150 },
            { prop: 'userName', label: '姓名', minWidth: 150 },
            // { prop: 'phone', label: '手机号', type: 'masked', minWidth: 140 },
            // { prop: 'email', label: '邮箱', type: 'masked', minWidth: 180 },
            { prop: 'phone', label: '手机号', minWidth: 140 },
            { prop: 'email', label: '邮箱', minWidth: 180 },
            { prop: 'status', label: '状态', type: 'status', width: 110 },
            { prop: 'createdAt', label: '创建时间', type: 'datetime', minWidth: 180 },
        ],
        seedRows: userRows,
        dialogWidth: '820px',
    },
    createCommonModule('system.role', '角色管理', '系统管理', '/system/role', 'SystemRole', 'Lock', 'system:role:list', 'system/role', 'sys_role / sys_role_permission', '维护系统角色、角色授权和数据权限入口。'),
    createCommonModule('system.menu', '菜单管理', '系统管理', '/system/menu', 'SystemMenu', 'Menu', 'system:menu:list', 'system/menu', 'sys_menu / sys_permission', '维护后台菜单、路由、排序和权限标识。'),
    createCommonModule('system.org', '部门岗位', '系统管理', '/system/org', 'SystemOrg', 'OfficeBuilding', 'system:org:list', 'system/org', 'sys_dept / sys_post', '整合部门与岗位维护能力，避免左侧菜单过细。'),
    createCommonModule('system.configCenter', '字典参数', '系统管理', '/system/config-center', 'SystemConfigCenter', 'Tickets', 'system:dict:list', 'system/config-center', 'sys_dict_type / sys_dict_data / sys_config', '整合字典和参数设置能力。'),
    createCommonModule('system.log', '日志管理', '系统管理', '/system/log', 'SystemLog', 'DocumentChecked', 'system:login-log:list', 'system/log', 'sys_login_log / sys_oper_log', '整合登录日志和操作日志查询。', auditRows),

    {
        key: 'merchant.info',
        title: '商户信息管理',
        menuTitle: '商户信息管理',
        category: '商户管理',
        path: '/merchant/info',
        routeName: 'MerchantInfo',
        icon: 'Shop',
        permission: 'merchant:info:list',
        component: 'merchant/info',
        tableName: 'base_merchant_info',
        summary: '维护商户基础资料，并预留账号、角色、密钥和操作日志 Tab 能力。',
        searchFields: [{ prop: 'keyword', label: '商户关键词', placeholder: '商户号/名称' }, statusField],
        columns: [
            { prop: 'merchantNo', label: '商户号', minWidth: 160 },
            { prop: 'merchantName', label: '商户名称', minWidth: 200 },
            { prop: 'countryCode', label: '国家/地区', width: 120 },
            { prop: 'currencyCode', label: '默认币种', width: 120 },
            { prop: 'status', label: '状态', type: 'status', width: 110 },
            { prop: 'createdAt', label: '创建时间', type: 'datetime', minWidth: 180 },
        ],
        seedRows: merchantRows,
        dialogWidth: '900px',
    },

    createCommonModule('base.country', '国家/地区', '基础数据', '/base/country', 'BaseCountry', 'Location', 'base:country:list', 'base/country', 'base_iso_country', '维护 ISO 3166 国家地区基础字典和启用状态。'),
    createCommonModule('base.currency', '币种管理', '基础数据', '/base/currency', 'BaseCurrency', 'Coin', 'base:currency:list', 'base/currency', 'base_iso_currency', '维护 ISO 4217 币种基础字典、小数位和启用状态。'),
    createCommonModule('base.regionCurrency', '地区币种配置', '基础数据', '/base/region-currency', 'BaseRegionCurrency', 'Connection', 'base:countryCurrency:list', 'base/region-currency', 'base_iso_country / base_iso_currency', '维护国家地区与支持币种之间的启用关系。'),

    createCommonModule('permission.app', '应用权限', '权限中心', '/permission/app', 'PermissionApp', 'Key', 'permission:app:list', 'permission/app', 'sys_app / sys_permission', '维护应用、资源权限和角色授权入口。'),
    createCommonModule('permission.dataScope', '数据权限', '权限中心', '/permission/data-scope', 'PermissionDataScope', 'Connection', 'permission:data-scope:list', 'permission/data-scope', 'sys_role_data_scope', '维护角色数据范围和后续数据隔离策略。'),

    {
        key: 'security.session',
        title: '会话管理',
        menuTitle: '会话管理',
        category: '安全中心',
        path: '/security/session',
        routeName: 'SecuritySession',
        icon: 'Monitor',
        permission: 'security:session:list',
        component: 'security/session',
        tableName: 'sys_login_session',
        summary: '查询当前登录会话、会话状态和访问终端。',
        searchFields: [
            { prop: 'keyword', label: '账号关键词', placeholder: '登录账号/IP' },
            loginStatusField,
        ],
        columns: auditColumns,
        seedRows: auditRows,
    },
    {
        key: 'security.apiSecurity',
        title: '密钥与 API 安全',
        menuTitle: '密钥与 API 安全',
        category: '安全中心',
        path: '/security/api-security',
        routeName: 'SecurityApiSecurity',
        icon: 'Lock',
        permission: 'security:jwt-key:list',
        component: 'security/api-security',
        tableName: 'base_merchant_jwt_key / sys_permission / sys_oper_log',
        summary: '整合 JWT 密钥、API 访问控制和操作审计入口。',
        searchFields: [
            { prop: 'keyword', label: '关键词', placeholder: '密钥 ID/商户号/API 资源' },
            keyStatusField,
        ],
        columns: keyColumns,
        seedRows: keyRows,
        dialogWidth: '900px',
        sensitive: true,
    },
];

export const moduleMap = new Map(crudModules.map((module) => [module.key, module]));

export const adminMenus: AdminMenuItem[] = [
    { title: '首页', path: '/dashboard', icon: 'House' },
    ...['系统管理', '商户管理', '基础数据', '权限中心', '安全中心'].map((category) => ({
        title: category,
        icon: categoryIcon(category),
        children: crudModules.filter((module) => module.category === category).map(toMenuItem),
    })),
];

function categoryIcon(category: string) {
    return (
        {
            系统管理: 'Setting',
            商户管理: 'Shop',
            基础数据: 'DataLine',
            权限中心: 'Key',
            安全中心: 'Lock',
        } as Record<string, string>
    )[category];
}

function toMenuItem(module: CrudModuleConfig): AdminMenuItem {
    return {
        title: module.menuTitle,
        path: module.path,
        icon: module.icon,
        permission: module.permission,
    };
}

export function getCrudModule(key: string) {
    const module = moduleMap.get(key);
    if (!module) {
        throw new Error(`Unknown admin module: ${key}`);
    }
    return module;
}
