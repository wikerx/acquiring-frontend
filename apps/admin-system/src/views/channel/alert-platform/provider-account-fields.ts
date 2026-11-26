import type { ProviderAccountConfig } from '@/api/channel/disputeAlert';

export const providerAccountCodes = ['AUSTREME', 'NUVEI', 'CHARGEFLOW', 'CHARGEBACKHIT'] as const;
export type ProviderAccountCode = (typeof providerAccountCodes)[number];

interface AccountField {
    key: string;
    kind?: 'secret' | 'url' | 'options' | 'multiple';
    options?: readonly string[];
    required?: boolean;
}

const austremeMethods = ['httpsPush', 'sftp', 'api'];
const austremeAuth = ['apiKey', 'sftpPassword', 'sshPrivateKey'];
const nuveiModes = ['dmn', 'ethocaOutcome'];
const chargeflowModes = ['api', 'signedApi', 'webhook'];
const chargebackhitModes = ['api', 'webhook'];

export function isProviderAccountCode(code: string): code is ProviderAccountCode {
    return providerAccountCodes.some((provider) => provider === code);
}

export function providerAccountFields(code: ProviderAccountCode, values: ProviderAccountConfig['values']): AccountField[] {
    const modes = (key: string) => Array.isArray(values[key]) ? values[key] : [];
    const required = (key: string, kind?: AccountField['kind']): AccountField => ({ key, kind, required: true });
    const optional = (key: string, kind?: AccountField['kind']): AccountField => ({ key, kind });
    switch (code) {
        case 'AUSTREME':
            return [
                { ...optional('deliveryMethod', 'options'), options: austremeMethods },
                { ...optional('authMethod', 'options'), options: values.deliveryMethod === 'sftp' ? austremeAuth.slice(1) : austremeAuth.slice(0, 1) },
                ...(values.deliveryMethod === 'httpsPush' ? [optional('notificationUrl', 'url')] : []),
                ...(values.deliveryMethod === 'sftp' ? [optional('sftpHost'), optional('sftpPort'), optional('sftpDirectory'), optional('sftpUsername')] : []),
                ...(austremeAuth.includes(String(values.authMethod)) ? [optional(String(values.authMethod), 'secret')] : []),
            ];
        case 'NUVEI': {
            const selected = modes('usage');
            return [
                { ...required('usage', 'multiple'), options: nuveiModes },
                ...(selected.includes('ethocaOutcome') ? [required('merchantId'), required('merchantSiteId')] : []),
                ...(selected.includes('dmn') ? [
                    required('dmnUrl', 'url'),
                    { ...required('dmnEvents', 'multiple'), options: ['ethocaAlert', 'externalEthoca', 'externalRdr'] },
                    { key: 'dmnScope', kind: 'options' as const, options: ['client', 'multiClient'] },
                    ...(values.dmnScope ? [required('dmnScopeId')] : []),
                ] : []),
                ...(selected.length ? [required('merchantSecretKey', 'secret')] : []),
            ];
        }
        case 'CHARGEFLOW': {
            const legacy = values.apiVersion === '2025-04-01';
            const selected = modes('usage');
            const api = selected.includes('api') || (legacy && selected.includes('signedApi'));
            const webhook = selected.includes('webhook');
            return [
                { ...required('apiVersion', 'options'), options: ['2025-04-01', 'v3'] },
                ...(values.apiVersion ? [
                    { ...required('usage', 'multiple'), options: legacy ? chargeflowModes : ['api', 'webhook'] },
                    ...(webhook ? [required('webhookUrl', 'url'), { ...required('webhookEvents', 'multiple'),
                        options: ['alerts.created', 'alerts.updated', 'alerts.transaction.linked'] }] : []),
                    ...(api ? [required(legacy ? 'apiAccessKey' : 'bearerKey', 'secret')] : []),
                    ...(legacy && (webhook || selected.includes('signedApi')) ? [required('apiSecretKey', 'secret')] : []),
                    ...(!legacy && webhook ? [required('webhookSigningSecret', 'secret')] : []),
                ] : []),
            ];
        }
        case 'CHARGEBACKHIT': {
            const selected = modes('usage');
            return [
                { ...required('usage', 'multiple'), options: chargebackhitModes },
                ...(selected.includes('webhook') ? [required('notificationUrl', 'url')] : []),
                ...(selected.length ? [required('publicKey', 'secret'), required('secretKey', 'secret')] : []),
            ];
        }
    }
}
