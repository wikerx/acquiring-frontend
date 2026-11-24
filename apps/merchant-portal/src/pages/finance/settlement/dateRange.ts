export function defaultSettlementDateRange(): [string, string] {
    const end = new Date();
    const begin = new Date(end);
    begin.setDate(begin.getDate() - 30);
    const dateText = (date: Date) => [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
    return [dateText(begin), dateText(end)];
}
