export function hasPermission(permissions: string[], permission?: string) {
    if (!permission) {
        return true;
    }
    return permissions.includes('*:*:*') || permissions.includes(permission);
}
