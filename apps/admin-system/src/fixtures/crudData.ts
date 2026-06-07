import { CommonStatus, KeyStatus, LoginStatus } from '@/enums/status';

export const commonRows = [
    {
        id: 1001,
        code: 'ACQ-001',
        name: 'Acquiring Platform',
        status: CommonStatus.Enabled,
        createdAt: '2026-06-01T09:12:00+08:00',
        updatedAt: '2026-06-06T10:22:00+08:00',
    },
    {
        id: 1002,
        code: 'OPS-002',
        name: 'Operations Console',
        status: CommonStatus.Disabled,
        createdAt: '2026-05-18T14:30:00+08:00',
        updatedAt: '2026-06-03T18:06:00+08:00',
    },
];

export const userRows = [
    {
        id: 1,
        userNo: 'U202606001',
        userName: 'Scott Admin',
        phone: '138****8888',
        email: 'sc***@example.com',
        status: CommonStatus.Enabled,
        createdAt: '2026-06-01T09:12:00+08:00',
        updatedAt: '2026-06-05T18:22:00+08:00',
    },
    {
        id: 2,
        userNo: 'U202606002',
        userName: 'Risk Operator',
        phone: '139****6666',
        email: 'ri***@example.com',
        status: CommonStatus.Disabled,
        createdAt: '2026-05-26T11:34:00+08:00',
        updatedAt: '2026-06-02T15:12:00+08:00',
    },
];

export const merchantRows = [
    {
        id: 2001,
        merchantNo: 'M2026060001',
        merchantName: 'Shanghai Demo Trading',
        countryCode: 'CN',
        currencyCode: 'CNY',
        status: CommonStatus.Enabled,
        createdAt: '2026-05-21T10:00:00+08:00',
        updatedAt: '2026-06-04T17:10:00+08:00',
    },
    {
        id: 2002,
        merchantNo: 'M2026060002',
        merchantName: 'Global Pay Sample',
        countryCode: 'SG',
        currencyCode: 'USD',
        status: CommonStatus.Disabled,
        createdAt: '2026-05-28T13:45:00+08:00',
        updatedAt: '2026-06-05T09:18:00+08:00',
    },
];

export const keyRows = [
    {
        id: 3001,
        keyId: 'key_2026060001',
        merchantNo: 'M2026060001',
        fingerprint: 'SHA256:9A:B2:31:76:AF',
        status: KeyStatus.Active,
        createdAt: '2026-06-01T09:00:00+08:00',
        updatedAt: '2026-06-05T16:20:00+08:00',
    },
    {
        id: 3002,
        keyId: 'key_2026060002',
        merchantNo: 'M2026060002',
        fingerprint: 'SHA256:4F:D1:A0:8C:52',
        status: KeyStatus.Rotating,
        createdAt: '2026-05-29T08:30:00+08:00',
        updatedAt: '2026-06-06T09:40:00+08:00',
    },
];

export const auditRows = [
    {
        id: 4001,
        account: 'admin',
        clientIp: '10.12.8.21',
        status: LoginStatus.Success,
        message: '登录成功',
        createdAt: '2026-06-06T08:12:00+08:00',
        updatedAt: '2026-06-06T08:12:00+08:00',
    },
    {
        id: 4002,
        account: 'risk.ops',
        clientIp: '10.12.8.32',
        status: LoginStatus.Failed,
        message: '验证码错误',
        createdAt: '2026-06-06T08:40:00+08:00',
        updatedAt: '2026-06-06T08:40:00+08:00',
    },
];
