export interface DashboardTrendPoint {
    date: string;
    loginCount: number;
    operCount: number;
}

export interface DashboardMonitorSummary {
    systemAlertCount: number;
    resourceStatus: 'healthy' | 'warning';
}

export const dashboardTrendMock: DashboardTrendPoint[] = [
    { date: '2026-06-15', loginCount: 34, operCount: 126 },
    { date: '2026-06-16', loginCount: 41, operCount: 152 },
    { date: '2026-06-17', loginCount: 29, operCount: 118 },
    { date: '2026-06-18', loginCount: 46, operCount: 173 },
    { date: '2026-06-19', loginCount: 52, operCount: 188 },
    { date: '2026-06-20', loginCount: 48, operCount: 164 },
    { date: '2026-06-21', loginCount: 36, operCount: 142 },
];

export const dashboardMonitorMock: DashboardMonitorSummary = {
    systemAlertCount: 3,
    resourceStatus: 'healthy',
};
