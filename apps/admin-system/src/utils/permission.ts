export function hasPermission(permissions: string[], permission?: string) {
    if (!permission) {
        return true;
    }
    return permissions.includes('*:*:*') || permissions.includes(permission);
}

export function hasAnyPermission(permissions: string[], required?: string | string[]) {
    if (!required || (Array.isArray(required) && required.length === 0)) {
        return true;
    }
    const values = Array.isArray(required) ? required : [required];
    return permissions.includes('*:*:*') || values.some((permission) => permissions.includes(permission));
}

export function hasEveryPermission(permissions: string[], required?: string | string[]) {
    if (!required || (Array.isArray(required) && required.length === 0)) {
        return true;
    }
    const values = Array.isArray(required) ? required : [required];
    return permissions.includes('*:*:*') || values.every((permission) => permissions.includes(permission));
}

export function hasRole(roles: string[], role?: string) {
    if (!role) {
        return true;
    }
    return roles.includes(role);
}

export function hasAnyRole(roles: string[], required?: string | string[]) {
    if (!required || (Array.isArray(required) && required.length === 0)) {
        return true;
    }
    const values = Array.isArray(required) ? required : [required];
    return values.some((role) => roles.includes(role));
}
