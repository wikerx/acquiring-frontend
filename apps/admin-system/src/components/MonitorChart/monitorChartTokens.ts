/** 系统监控图表唯一颜色与表面 Token，禁止页面自行声明替代调色板。 */
export const monitorChartTokens = {
    surface: {
        page: '#F7F9FC',
        card: '#FFFFFF',
        border: '#E6ECF5',
        grid: '#EDF1F7',
    },
    text: {
        title: '#1F2937',
        axis: '#7B8794',
        muted: '#8A97A8',
    },
    semantic: {
        primary: '#246BFD',
        secondary: '#36A3FF',
        tertiary: '#78B8FF',
        success: '#22A06B',
        warning: '#F59E0B',
        error: '#E5484D',
        critical: '#C62828',
        neutral: '#8A97A8',
    },
    category: ['#246BFD', '#36A3FF', '#78B8FF', '#5B7CFA', '#8A97A8'],
} as const;

/** 统一图表语义色名称，只允许从集中 Token 中选择。 */
export type MonitorSemantic = keyof typeof monitorChartTokens.semantic;

/** 将监控语义映射为统一颜色。 */
export function monitorSemanticColor(semantic: MonitorSemantic): string {
    return monitorChartTokens.semantic[semantic];
}
