import type {
    HostedCheckoutCardDataEnvelope,
    HostedCheckoutCardEncryption,
} from '../api/hostedCheckout';

const CARD_ENVELOPE_ALGORITHM = 'RSA-OAEP-256+A256GCM';
const AES_KEY_BYTES = 32;
const GCM_IV_BYTES = 12;

export interface CheckoutCardPlaintext {
    cardNo: string;
    expirationMonth: string;
    expirationYear: string;
    securityCode: string;
    cardholderName: string;
}

/**
 * 生产只使用浏览器原生 Web Crypto。开发环境通过 HTTP 局域网 IP 访问时，浏览器会隐藏 subtle，
 * 此时仅在私网地址启用相同 RSA-OAEP-256 + AES-256-GCM 协议的纯 JavaScript 兼容实现。
 */
export function cardEncryptionSupported(): boolean {
    return Boolean(globalThis.crypto?.subtle) || developmentLanFallbackAllowed();
}

export async function encryptCheckoutCardData(
    metadata: HostedCheckoutCardEncryption | undefined,
    checkoutSessionId: string,
    attemptRequestId: string,
    cardData: CheckoutCardPlaintext,
): Promise<HostedCheckoutCardDataEnvelope> {
    validateMetadata(metadata);
    if (globalThis.crypto?.subtle) {
        return encryptWithWebCrypto(metadata, checkoutSessionId, attemptRequestId, cardData);
    }
    if (!developmentLanFallbackAllowed()) {
        throw new Error('Checkout card encryption is unavailable');
    }
    return encryptWithDevelopmentFallback(metadata, checkoutSessionId, attemptRequestId, cardData);
}

function validateMetadata(
    metadata: HostedCheckoutCardEncryption | undefined,
): asserts metadata is HostedCheckoutCardEncryption {
    if (!metadata
        || metadata.algorithm !== CARD_ENVELOPE_ALGORITHM
        || !metadata.keyId
        || !metadata.publicKey
        || !metadata.nonce) {
        throw new Error('Checkout card encryption is unavailable');
    }
}

async function encryptWithWebCrypto(
    metadata: HostedCheckoutCardEncryption,
    checkoutSessionId: string,
    attemptRequestId: string,
    cardData: CheckoutCardPlaintext,
): Promise<HostedCheckoutCardDataEnvelope> {
    const subtle = globalThis.crypto.subtle;
    const publicKeyBytes = decodeBase64(metadata.publicKey);
    const publicKey = await subtle.importKey(
        'spki',
        publicKeyBytes.buffer as ArrayBuffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt'],
    );
    const contentKey = await subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt'],
    );
    const rawContentKey = await subtle.exportKey('raw', contentKey);
    const encryptedKey = await subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawContentKey);
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(GCM_IV_BYTES));
    const aad = envelopeAad(checkoutSessionId, attemptRequestId, metadata.nonce);
    const plaintext = new TextEncoder().encode(JSON.stringify(cardData));
    const ciphertext = await subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv.buffer as ArrayBuffer,
            additionalData: aad.buffer as ArrayBuffer,
            tagLength: 128,
        },
        contentKey,
        plaintext.buffer as ArrayBuffer,
    );
    return envelope(metadata, new Uint8Array(encryptedKey), iv, new Uint8Array(ciphertext));
}

async function encryptWithDevelopmentFallback(
    metadata: HostedCheckoutCardEncryption,
    checkoutSessionId: string,
    attemptRequestId: string,
    cardData: CheckoutCardPlaintext,
): Promise<HostedCheckoutCardDataEnvelope> {
    if (!import.meta.env.DEV) {
        throw new Error('Checkout card encryption is unavailable');
    }
    const forge = (await import('node-forge')).default;
    const contentKey = globalThis.crypto.getRandomValues(new Uint8Array(AES_KEY_BYTES));
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(GCM_IV_BYTES));
    const publicKey = forge.pki.publicKeyFromPem(toPublicKeyPem(metadata.publicKey));
    const encryptedKey = publicKey.encrypt(forge.util.binary.raw.encode(contentKey), 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: { md: forge.md.sha256.create() },
    });
    const cipher = forge.cipher.createCipher('AES-GCM', forge.util.binary.raw.encode(contentKey));
    cipher.start({
        iv: forge.util.binary.raw.encode(iv),
        additionalData: forge.util.binary.raw.encode(
            envelopeAad(checkoutSessionId, attemptRequestId, metadata.nonce),
        ),
        tagLength: 128,
    });
    cipher.update(forge.util.createBuffer(
        forge.util.binary.raw.encode(new TextEncoder().encode(JSON.stringify(cardData))),
        'raw',
    ));
    if (!cipher.finish()) {
        throw new Error('Checkout card encryption failed');
    }
    const ciphertextAndTag = cipher.output.getBytes() + cipher.mode.tag.getBytes();
    return envelope(
        metadata,
        forge.util.binary.raw.decode(encryptedKey),
        iv,
        forge.util.binary.raw.decode(ciphertextAndTag),
    );
}

function developmentLanFallbackAllowed(): boolean {
    if (!import.meta.env.DEV || !globalThis.crypto?.getRandomValues || typeof globalThis.location === 'undefined') {
        return false;
    }
    return globalThis.location.protocol === 'http:' && privateIpv4(globalThis.location.hostname);
}

function privateIpv4(hostname: string): boolean {
    const octets = hostname.split('.').map(Number);
    if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
        return false;
    }
    return octets[0] === 10
        || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
        || (octets[0] === 192 && octets[1] === 168);
}

function envelopeAad(checkoutSessionId: string, attemptRequestId: string, nonce: string): Uint8Array {
    return new TextEncoder().encode(`checkout-card-v1|${checkoutSessionId}|${attemptRequestId}|${nonce}`);
}

function envelope(
    metadata: HostedCheckoutCardEncryption,
    encryptedKey: Uint8Array,
    iv: Uint8Array,
    ciphertext: Uint8Array,
): HostedCheckoutCardDataEnvelope {
    return {
        algorithm: metadata.algorithm,
        keyId: metadata.keyId,
        encryptedKey: encodeBase64Url(encryptedKey),
        iv: encodeBase64Url(iv),
        ciphertext: encodeBase64Url(ciphertext),
        nonce: metadata.nonce,
    };
}

function toPublicKeyPem(publicKeyBase64: string): string {
    const normalized = publicKeyBase64.replace(/\s/g, '');
    const lines = normalized.match(/.{1,64}/g)?.join('\n') ?? normalized;
    return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
}

function decodeBase64(value: string): Uint8Array {
    const binary = globalThis.atob(value.replace(/\s/g, ''));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBase64Url(value: Uint8Array): string {
    let binary = '';
    value.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return globalThis.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
