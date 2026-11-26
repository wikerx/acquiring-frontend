export const alertPlatformPermissions = {
    list: 'channel:alert-platform:list',
    add: 'channel:alert-platform:add',
    edit: 'channel:alert-platform:edit',
    account: 'channel:alert-platform:account',
    credential: 'channel:alert-platform:credential',
} as const;

export const disputeAlertPermissions = {
    list: 'channel:dispute-alert:list',
    add: 'channel:dispute-alert:add',
    edit: 'channel:dispute-alert:edit',
    status: 'channel:dispute-alert:status',
} as const;

export const alertConfigurationCatalog = {
    menuCode: 'risk_dispute_alert_catalog',
    routePath: '/risk/dispute-alert',
} as const;

/** Existing Admin menu entries under the dispute alert catalog retain their routes and permissions. */
export const alertConfigurationMenus = {
    platform: {
        menuCode: 'admin_channel_alert_platform_v1',
        routePath: '/channel/alert-platform',
        componentPath: 'channel/alert-platform',
        permissionCode: alertPlatformPermissions.list,
        icon: 'Connection',
    },
    mid: {
        menuCode: 'admin_channel_dispute_alert_v1',
        routePath: '/channel/dispute-alert',
        componentPath: 'channel/dispute-alert',
        permissionCode: disputeAlertPermissions.list,
        icon: 'Bell',
    },
} as const;
