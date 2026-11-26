import type { TransactionFeeFacts } from './transactionFeeFacts';

/** Write exact decimal text in the Excel XML format to preserve more than 15 significant digits. */
export function feeStatementWorkbook(facts: TransactionFeeFacts, transactionId: string, locale: string): string {
    const english = /^en/i.test(locale);
    const header = english
        ? ['Transaction ID', 'Stage', 'Category', 'Component / Role', 'Direction', 'Fee group', 'Source amount',
            'Source currency', 'Rate (%)', 'FX rate', 'Before settlement rounding', 'Amount', 'Currency', 'Limit',
            'Batch', 'Batch status']
        : ['交易号', '阶段', '费用类别', '组件／角色', '方向', '费用组', '原币金额', '原币币种',
            '费率 (%)', '换汇汇率', '结算舍入前金额', '金额', '币种', '费用限制', '结算批次', '批次状态'];
    const records = [
        ...facts.clearing.map(line => [transactionId, 'CLEARING', line.feeCategory, line.componentType,
            line.direction, line.groupNo, line.basisAmount, line.basisCurrency, line.percentageRate, '', '',
            line.amount, line.currency, line.appliedLimit, '', '']),
        ...facts.settlement.map(line => [transactionId, 'SETTLEMENT', line.feeCategory, line.resultRole,
            line.direction, line.groupNo, line.sourceAmount, line.sourceCurrency, '', line.rate, line.unroundedAmount,
            line.amount, line.currency, line.appliedLimit, line.batchNo, line.batchStatus]),
    ];
    const escape = (value: string) => value.replace(/[&<>]/g, character => (
        character === '&' ? '&amp;' : character === '<' ? '&lt;' : '&gt;'));
    const sheetRows = [header, ...records].map(row =>
        '<Row>' + row.map(field => '<Cell><Data ss:Type="String">' + escape(field ?? '') + '</Data></Cell>').join('') + '</Row>');
    return '<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n'
        + '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'
        + '<Worksheet ss:Name="Fees"><Table>' + sheetRows.join('') + '</Table></Worksheet></Workbook>';
}

export function downloadFeeStatement(facts: TransactionFeeFacts, transactionId: string, locale: string) {
    const blob = new Blob([feeStatementWorkbook(facts, transactionId, locale)], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transaction-${transactionId}-fees.xml`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
