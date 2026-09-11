import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const adminRoot = fileURLToPath(new URL('..', import.meta.url));
const configuredEnvironment = {
    VITE_ADMIN_EXTERNAL_FRAME_ALLOWED_HOSTS: 'monitor.example.com',
    VITE_ADMIN_EXTERNAL_FRAME_ALLOWED_ORIGINS: [
        'https://origin.example.com',
        'https://port.example.com:8443',
        'https://path-config.example.com/dashboard',
        'https://query-config.example.com?mode=full',
        'https://hash-config.example.com#dashboard',
        'https://user:password@userinfo-config.example.com',
        'https://*.wildcard-config.example.com',
        'http://insecure-config.example.com',
        'https:\\backslash-config.example.com',
    ].join(','),
};
const previousEnvironment = Object.fromEntries(
    Object.keys(configuredEnvironment).map((key) => [key, process.env[key]]),
);

Object.assign(process.env, configuredEnvironment);

const server = await createServer({
    configFile: false,
    root: adminRoot,
    server: { middlewareMode: true },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true },
    logLevel: 'error',
});

try {
    const { resolveExternalFrameUrl, resolveExternalUrl } = await server.ssrLoadModule(
        '/src/utils/external-menu.ts',
    );

    const allowed = (url) => assert.equal(resolveExternalFrameUrl(url), new URL(url).toString());
    const rejected = (url) => assert.equal(resolveExternalFrameUrl(url), undefined);

    allowed('https://monitor.example.com/dashboard');
    allowed('https://monitor.example.com:443/dashboard');
    rejected('https://monitor.example.com:8443/dashboard');

    allowed('https://origin.example.com/dashboard?view=full#summary');
    allowed('https://origin.example.com:443/dashboard');
    allowed('https://port.example.com:8443/dashboard');
    rejected('https://port.example.com/dashboard');
    rejected('https://port.example.com:9443/dashboard');

    rejected('http://origin.example.com/dashboard');
    rejected('https://user:password@origin.example.com/dashboard');
    rejected('javascript:alert(1)');
    rejected('data:text/html,unsafe');
    rejected('https://path-config.example.com/dashboard');
    rejected('https://query-config.example.com/dashboard');
    rejected('https://hash-config.example.com/dashboard');
    rejected('https://userinfo-config.example.com/dashboard');
    rejected('https://sub.wildcard-config.example.com/dashboard');
    rejected('https://insecure-config.example.com/dashboard');
    rejected('https://backslash-config.example.com/dashboard');

    assert.equal(resolveExternalFrameUrl('/dashboard/monitor'), '/dashboard/monitor');
    assert.equal(resolveExternalFrameUrl('//monitor.example.com/dashboard'), undefined);
    assert.equal(resolveExternalFrameUrl('/\\monitor.example.com/dashboard'), undefined);
    allowed('http://127.0.0.1:9090/dashboard');
    allowed('http://localhost:9090/dashboard');
    rejected('http://192.168.1.10:9090/dashboard');

    globalThis.window = { location: { origin: 'https://admin.example.com' } };
    allowed('https://admin.example.com/internal-monitor');
    rejected('https://admin.example.com:8443/internal-monitor');
    delete globalThis.window;

    assert.equal(
        resolveExternalUrl('https://unlisted.example.com/dashboard'),
        'https://unlisted.example.com/dashboard',
    );

    console.log('External iframe Origin policy: all assertions passed.');
} finally {
    delete globalThis.window;
    await server.close();
    for (const [key, value] of Object.entries(previousEnvironment)) {
        if (value === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = value;
        }
    }
}
