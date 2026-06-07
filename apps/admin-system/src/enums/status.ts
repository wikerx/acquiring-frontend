export enum CommonStatus {
    Enabled = 'ENABLED',
    Disabled = 'DISABLED',
    Locked = 'LOCKED',
}

export enum LoginStatus {
    Success = 'SUCCESS',
    Failed = 'FAILED',
}

export enum KeyStatus {
    Active = 'ACTIVE',
    Inactive = 'INACTIVE',
    Rotating = 'ROTATING',
}

export const commonStatusOptions = [
    { label: '启用', value: CommonStatus.Enabled },
    { label: '停用', value: CommonStatus.Disabled },
    { label: '锁定', value: CommonStatus.Locked },
];

export const loginStatusOptions = [
    { label: '成功', value: LoginStatus.Success },
    { label: '失败', value: LoginStatus.Failed },
];

export const keyStatusOptions = [
    { label: '生效中', value: KeyStatus.Active },
    { label: '未生效', value: KeyStatus.Inactive },
    { label: '轮换中', value: KeyStatus.Rotating },
];
