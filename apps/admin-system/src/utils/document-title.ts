import { VEXRA_BRAND } from '@acquiring/shared';
import type { RouteMeta } from 'vue-router';
import { i18n } from '@/i18n';

/** 根据当前语言和路由元数据更新管理后台浏览器标题。 */
export function updateAdminDocumentTitle(meta: RouteMeta) {
  const titleKey = typeof meta.titleKey === 'string' ? `route.${meta.titleKey}` : '';
  const fallbackTitle = typeof meta.title === 'string' ? meta.title : '';
  const routeTitle =
    titleKey && i18n.global.te(titleKey) ? String(i18n.global.t(titleKey)) : fallbackTitle;
  const defaultTitle = VEXRA_BRAND.systems.admin.title;
  const titleSuffix = VEXRA_BRAND.systems.admin.name;
  document.title = routeTitle ? `${routeTitle} - ${titleSuffix}` : defaultTitle;
}
