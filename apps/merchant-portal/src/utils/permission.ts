import { useAuthStore } from '@/stores/authStore';

export function hasPermission(permission?: string) {
    if (!permission) {
        return true;
    }
    const permissions = useAuthStore().session?.permissions || [];
    return permissions.includes('*:*:*') || permissions.includes(permission);
}

export function hasAnyPermission(required?: string | string[]) {
    if (!required || (Array.isArray(required) && required.length === 0)) {
        return true;
    }
    const values = Array.isArray(required) ? required : [required];
    const permissions = useAuthStore().session?.permissions || [];
    return permissions.includes('*:*:*') || values.some((permission) => permissions.includes(permission));
}
