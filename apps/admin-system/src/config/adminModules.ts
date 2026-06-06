export interface AdminModuleMeta {
    title: string;
    category: string;
    permission: string;
    summary: string;
    focus: string[];
    dataSource: string;
}

export const adminModuleMetas: Record<string, AdminModuleMeta> = {
    '/system/users': {
        title: '用户管理',
        category: '系统管理',
        permission: 'admin:user:view',
        summary: '平台后台账号、状态、基础资料和角色授权入口。',
        focus: ['后台账号', '账号状态', '角色授权', '登录安全'],
        dataSource: 'sys_user / sys_account / sys_account_role',
    },
    '/system/roles': {
        title: '角色管理',
        category: '系统管理',
        permission: 'admin:role:view',
        summary: '维护平台角色、数据范围、菜单和接口权限。',
        focus: ['角色编码', '数据范围', '菜单授权', '接口权限'],
        dataSource: 'sys_role / sys_role_menu / sys_role_permission',
    },
    '/system/menus': {
        title: '菜单管理',
        category: '系统管理',
        permission: 'admin:menu:view',
        summary: '维护后台目录、菜单、按钮权限和前端路由映射。',
        focus: ['目录结构', '路由地址', '权限标识', '显示状态'],
        dataSource: 'sys_menu / sys_permission',
    },
    '/system/departments': {
        title: '部门管理',
        category: '系统管理',
        permission: 'admin:dept:view',
        summary: '平台组织架构和部门数据范围的管理入口。',
        focus: ['组织层级', '负责人', '数据范围', '启停状态'],
        dataSource: 'sys_dept',
    },
    '/system/posts': {
        title: '岗位管理',
        category: '系统管理',
        permission: 'admin:post:view',
        summary: '后台人员岗位、岗位编码和岗位状态管理。',
        focus: ['岗位编码', '岗位名称', '岗位排序', '启停状态'],
        dataSource: 'sys_post',
    },
    '/system/login-logs': {
        title: '登录日志',
        category: '系统管理',
        permission: 'admin:login-log:view',
        summary: '后台账号登录成功、失败、IP 和终端信息审计。',
        focus: ['登录账号', '登录状态', '客户端 IP', '失败原因'],
        dataSource: 'sys_login_log / sys_login_session',
    },
    '/merchants/list': {
        title: '商户列表',
        category: '商户管理',
        permission: 'admin:merchant:view',
        summary: '商户主体资料、状态、入网信息和运营备注管理。',
        focus: ['商户号', '商户名称', '入网状态', '联系人'],
        dataSource: 'base_merchant_info',
    },
    '/merchants/users': {
        title: '商户账号',
        category: '商户管理',
        permission: 'admin:merchant-user:view',
        summary: '商户端账号、商户角色和账号状态管理。',
        focus: ['商户号', '登录账号', '商户角色', '账号状态'],
        dataSource: 'sys_merchant_user / sys_merchant_user_role',
    },
    '/merchants/audit': {
        title: '商户审核',
        category: '商户管理',
        permission: 'admin:merchant:audit',
        summary: '商户入网、资料变更、风控复核等审核动作入口。',
        focus: ['待审商户', '审核结论', '审核意见', '操作记录'],
        dataSource: 'base_merchant_info / sys_oper_log',
    },
    '/merchants/api-keys': {
        title: '商户密钥',
        category: '商户管理',
        permission: 'admin:merchant-key:view',
        summary: '商户 OpenAPI 密钥、回调密钥和密钥轮换状态。',
        focus: ['商户号', '密钥版本', '生效状态', '轮换时间'],
        dataSource: 'base_merchant_key / base_merchant_response_key',
    },
    '/base/countries': {
        title: '国家地区代码',
        category: '基础数据管理',
        permission: 'admin:iso-country:view',
        summary: 'ISO 3166 国家地区代码、语言、默认币种和启用状态。',
        focus: ['Alpha-2', 'Alpha-3', '数字代码', '默认币种'],
        dataSource: 'base_iso_country',
    },
    '/base/currencies': {
        title: '币种代码',
        category: '基础数据管理',
        permission: 'admin:iso-currency:view',
        summary: 'ISO 4217 币种、数字代码、小数位和最小金额。',
        focus: ['币种代码', '数字代码', '小数位', '最小金额'],
        dataSource: 'base_iso_currency',
    },
    '/payments/orders': {
        title: '支付订单',
        category: '交易管理',
        permission: 'admin:payment-order:view',
        summary: '收单支付订单、渠道状态、金额和幂等请求查询。',
        focus: ['订单号', '商户号', '支付状态', '交易金额'],
        dataSource: 'payment_order',
    },
    '/payments/refunds': {
        title: '退款管理',
        category: '交易管理',
        permission: 'admin:refund:view',
        summary: '退款申请、退款状态、渠道退款号和失败原因查询。',
        focus: ['退款单号', '原支付单', '退款金额', '退款状态'],
        dataSource: 'payment_refund_order',
    },
    '/payout/orders': {
        title: '代付订单',
        category: '交易管理',
        permission: 'admin:payout-order:view',
        summary: '代付订单、出款渠道、金额、状态和回调结果查询。',
        focus: ['代付单号', '商户号', '渠道', '代付状态'],
        dataSource: 'payout_order',
    },
    '/payments/settlements': {
        title: '结算管理',
        category: '交易管理',
        permission: 'admin:settlement:view',
        summary: '商户结算批次、结算金额、手续费和结算状态。',
        focus: ['结算批次', '商户号', '结算金额', '结算状态'],
        dataSource: 'settlement_order',
    },
    '/payments/channels': {
        title: '通道管理',
        category: '交易管理',
        permission: 'admin:channel:view',
        summary: '支付与代付通道、路由规则、权重和启停控制。',
        focus: ['通道编码', '通道类型', '路由权重', '启停状态'],
        dataSource: 'payment_channel_route_rule / payout_channel_route_rule',
    },
    '/risk/rules': {
        title: '风控规则',
        category: '风控管理',
        permission: 'admin:risk-rule:view',
        summary: '交易限额、频控、名单规则和风险处置策略。',
        focus: ['规则编码', '规则条件', '处置动作', '生效状态'],
        dataSource: 'risk_rule',
    },
    '/risk/blacklist': {
        title: '黑名单管理',
        category: '风控管理',
        permission: 'admin:risk-blacklist:view',
        summary: '商户、卡、邮箱、IP 等风险名单管理。',
        focus: ['名单类型', '名单值', '风险等级', '过期时间'],
        dataSource: 'risk_blacklist',
    },
};

export function getAdminModuleMeta(path: string): AdminModuleMeta | undefined {
    return adminModuleMetas[path];
}
