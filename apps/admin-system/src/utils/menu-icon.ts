import type { Component } from 'vue';
import * as ElementPlusIcons from '@element-plus/icons-vue';

const menuIcons = ElementPlusIcons as Record<string, Component>;
const fallbackIcon = ElementPlusIcons.House as Component;

/**
 * 解析后端菜单配置的 Element Plus 图标，供侧边栏、顶部菜单和页签共用。
 */
export function resolveMenuIcon(name?: string): Component {
    if (!name) {
        return fallbackIcon;
    }
    return menuIcons[name] || fallbackIcon;
}
