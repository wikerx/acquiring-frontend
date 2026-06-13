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
    { label: 'status.enabled', value: CommonStatus.Enabled },
    { label: 'status.disabled', value: CommonStatus.Disabled },
    { label: 'status.locked', value: CommonStatus.Locked },
];

export const loginStatusOptions = [
    { label: 'status.success', value: LoginStatus.Success },
    { label: 'status.failed', value: LoginStatus.Failed },
];

export const keyStatusOptions = [
    { label: 'status.active', value: KeyStatus.Active },
    { label: 'status.inactive', value: KeyStatus.Inactive },
    { label: 'status.rotating', value: KeyStatus.Rotating },
];
