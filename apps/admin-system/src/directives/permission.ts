import type { App, DirectiveBinding } from 'vue';
import { useUserStore } from '@/store';
import { hasAnyPermission, hasAnyRole } from '@/utils/permission';

function removeElement(el: HTMLElement) {
    el.parentNode?.removeChild(el);
}

function normalizeBinding(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
    }
    if (typeof value === 'string' && value.length > 0) {
        return [value];
    }
    return [];
}

function checkPermission(el: HTMLElement, binding: DirectiveBinding<unknown>) {
    const required = normalizeBinding(binding.value);
    if (required.length === 0) {
        throw new Error('v-hasPermi requires a permission string or string array');
    }
    const user = useUserStore();
    if (!hasAnyPermission(user.permissions, required)) {
        removeElement(el);
    }
}

function checkRole(el: HTMLElement, binding: DirectiveBinding<unknown>) {
    const required = normalizeBinding(binding.value);
    if (required.length === 0) {
        throw new Error('v-hasRole requires a role string or string array');
    }
    const user = useUserStore();
    if (!hasAnyRole(user.roles, required)) {
        removeElement(el);
    }
}

export function setupPermissionDirectives(app: App) {
    app.directive('hasPermi', {
        mounted: checkPermission,
    });
    app.directive('hasRole', {
        mounted: checkRole,
    });
}
