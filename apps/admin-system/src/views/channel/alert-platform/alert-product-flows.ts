type FlowRoute = 'left-center' | 'center-right' | 'right-center' | 'center-left' | 'center' | 'right';

export interface AlertFlowStep {
    key: string;
    route: FlowRoute;
    points: readonly string[];
    branch?: 'A' | 'B';
    response?: boolean;
    dashed?: boolean;
}

interface AlertProductFlow {
    defaultStep: string;
    rows: readonly (readonly [AlertFlowStep, ...AlertFlowStep[]])[];
}

export const alertProductFlows: Record<'ethoca' | 'rdr' | 'cdrn' | 'amexInquiry', AlertProductFlow> = {
    ethoca: {
        defaultStep: 'outcome',
        rows: [
            [{ key: 'report', route: 'left-center', points: ['case', 'coverage'] }],
            [{ key: 'deliver', route: 'center-right', points: ['register', 'acknowledge'] }],
            [{ key: 'review', route: 'right', points: ['match', 'disposition'] }],
            [{ key: 'outcome', route: 'right-center', response: true, points: ['alert', 'result', 'refund', 'context'] }],
            [{ key: 'receipt', route: 'center-right', response: true, dashed: true, points: ['correlate', 'retry'] }],
            [{ key: 'relay', route: 'center-left', response: true, points: ['relay', 'close'] }],
        ],
    },
    rdr: {
        defaultStep: 'matched',
        rows: [
            [{ key: 'submit', route: 'left-center', points: ['case', 'enrollment'] }],
            [{ key: 'decision', route: 'center', points: ['rules', 'paths'] }],
            [
                { key: 'matched', route: 'center-right', branch: 'A', response: true, points: ['credit', 'notice'] },
                { key: 'unmatched', route: 'center-left', branch: 'B', response: true, dashed: true, points: ['declined', 'chargeback'] },
            ],
            [{ key: 'reconcile', route: 'right', points: ['records', 'scope'] }],
        ],
    },
    cdrn: {
        defaultStep: 'respond',
        rows: [
            [{ key: 'submit', route: 'left-center', points: ['entry', 'coverage'] }],
            [{ key: 'notify', route: 'center-right', points: ['case', 'deadline'] }],
            [{ key: 'review', route: 'right', points: ['transaction', 'credit'] }],
            [{ key: 'respond', route: 'right-center', response: true, points: ['result', 'reference'] }],
            [{ key: 'relay', route: 'center-left', response: true, points: ['resolution', 'followUp'] }],
        ],
    },
    amexInquiry: {
        defaultStep: 'respond',
        rows: [
            [{ key: 'dispute', route: 'left-center', points: ['case', 'inquiry'] }],
            [{ key: 'request', route: 'center-right', points: ['required', 'deadline'] }],
            [{ key: 'prepare', route: 'right', points: ['evidence', 'credit'] }],
            [{ key: 'respond', route: 'right-center', response: true, points: ['channel', 'receipt'] }],
            [{ key: 'review', route: 'center', points: ['complete', 'further'] }],
            [{ key: 'result', route: 'center-right', response: true, points: ['status', 'noReply'] }],
        ],
    },
};

export type AlertFlowProduct = keyof typeof alertProductFlows;
