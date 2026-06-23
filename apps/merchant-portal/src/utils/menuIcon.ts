import type { Component } from 'vue';
import * as ElementPlusIcons from '@element-plus/icons-vue';

const menuIcons = ElementPlusIcons as Record<string, Component>;
const fallbackIcon = ElementPlusIcons.Menu as Component;

export function resolveMenuIcon(name?: string): Component {
    if (!name) {
        return fallbackIcon;
    }
    return menuIcons[name] || fallbackIcon;
}
