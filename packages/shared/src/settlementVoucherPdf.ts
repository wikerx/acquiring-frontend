import { getSystemBrand } from './brand';
import { resolveCurrencyPresentation } from './currencyPresentation';
import { getPaymentLogo, resolvePaymentLogoKeys, type PaymentLogoKey } from './paymentBrand';
import type {
    SettlementVoucherAlignment,
    SettlementVoucherCell,
    SettlementVoucherCurrencyCell,
    SettlementVoucherDirectionCell,
    SettlementVoucherDocument,
    SettlementVoucherField,
    SettlementVoucherFieldGroup,
    SettlementVoucherMoneyCell,
    SettlementVoucherPaymentCell,
    SettlementVoucherTable,
} from './settlementVoucher';

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const PAGE_MARGIN = 64;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const TABLE_ROWS_PER_PAGE = 24;
const OVERVIEW_RATE_ROW_LIMIT = 4;
const OVERVIEW_SUMMARY_ROW_LIMIT = 20;

const COLORS = {
    ink: '#162033',
    muted: '#667085',
    line: '#bfd0df',
    soft: '#f7faff',
    tableHead: '#e6f0ff',
    accent: '#2563eb',
    accentDark: '#173f9f',
    zebra: '#f8fbff',
    white: '#ffffff',
} as const;

const STATUS_COLORS = {
    success: { main: '#067647', line: '#8fe0b1', tint: '#effbf4' },
    warning: { main: '#a45113', line: '#f1c98f', tint: '#fff8eb' },
    danger: { main: '#b42318', line: '#f2b8b5', tint: '#fff4f3' },
    info: { main: '#475467', line: '#cbd5dc', tint: '#f5f7f9' },
} as const;

const STATUS_STAMP_COLORS = {
    success: '#df523e',
    warning: '#bf7419',
    danger: '#bf3e3e',
    info: '#64748b',
} as const;

interface VoucherPalette {
    accent: string;
    accentDark: string;
    accentTint: string;
    accentLine: string;
    tableHead: string;
}

interface PaginatedVoucherTable {
    table: SettlementVoucherTable;
    kind: 'rates' | 'summaries';
    start: number;
    end: number;
    total: number;
}

interface OverviewTablePlan {
    rates: boolean;
    summaryRows: number;
}

/** 将权威结算快照逐页绘制为中文安全的 A4 PDF，避免大批次同时保留全部 Canvas。 */
export async function downloadSettlementVoucherPdf(
    document: SettlementVoucherDocument,
): Promise<void> {
    const brand = getSystemBrand(document.system);
    const fontFamily = document.locale.startsWith('zh')
        ? '"PingFang SC", "Microsoft YaHei", Arial, sans-serif'
        : 'Inter, Arial, sans-serif';
    const logo = await loadImage(brand.logos.horizontal);
    const watermarkLogo = await loadImage(brand.logos.icon);
    const paymentLogoImages = await loadPaymentLogoImages(document);
    const overviewTables = overviewTablePlan(document);
    const tablePages = [
        ...(overviewTables.rates ? [] : paginateTable(document.rates, 'rates')),
        ...paginateTable(document.summaries, 'summaries', overviewTables.summaryRows),
    ];
    const totalPages = 1 + tablePages.length;
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

    pdf.setProperties({
        title: document.title,
        subject: document.statusLabel,
        author: brand.name,
        creator: brand.name,
    });

    addCanvasPage(pdf, renderOverviewPage(
        document,
        fontFamily,
        logo,
        watermarkLogo,
        paymentLogoImages,
        overviewTables,
        1,
        totalPages,
    ));
    tablePages.forEach((tablePage, index) => {
        pdf.addPage('a4', 'portrait');
        addCanvasPage(pdf, renderTablePage(
            document,
            tablePage,
            fontFamily,
            logo,
            watermarkLogo,
            paymentLogoImages,
            index + 2,
            totalPages,
        ));
    });
    pdf.save(document.fileName);
}

function renderOverviewPage(
    document: SettlementVoucherDocument,
    fontFamily: string,
    logo: HTMLImageElement | null,
    watermarkLogo: HTMLImageElement | null,
    paymentLogoImages: Map<PaymentLogoKey, HTMLImageElement>,
    overviewTables: OverviewTablePlan,
    page: number,
    totalPages: number,
) {
    const canvas = createCanvas();
    const context = requireContext(canvas);
    const palette = voucherPalette(document);
    drawPageBase(context, watermarkLogo, palette);
    drawDocumentHeader(context, document, fontFamily, logo, palette, page, totalPages);

    let top = drawFieldGroups(context, document, document.fieldGroups, 190, fontFamily, palette);
    const auditFields = (document.auditFields || []).filter(isMeaningfulField);
    if (auditFields.length) {
        top += 24;
        drawSectionHeading(context, document.auditTitle || '-', top, fontFamily, palette);
        top = drawFieldMatrix(context, auditFields, top + 12, fontFamily, 3);
    }

    if (overviewTables.rates) {
        top += 24;
        top = drawRateEvidence(
            context,
            document.rates,
            top,
            fontFamily,
            palette,
            document.locale,
        );
    }

    if (overviewTables.summaryRows > 0) {
        const overviewSummary = {
            ...document.summaries,
            rows: document.summaries.rows.slice(0, overviewTables.summaryRows),
        };
        top += 24;
        drawSectionHeading(context, document.summaries.title, top, fontFamily, palette);
        drawTableRange(
            context,
            document,
            1,
            overviewSummary.rows.length,
            document.summaries.rows.length,
            top,
            fontFamily,
        );
        top = drawLedgerTable(
            context,
            overviewSummary,
            top + 8,
            fontFamily,
            paymentLogoImages,
            palette,
            document.locale,
            true,
            true,
        );
    }

    drawNotice(context, document, Math.min(top + 14, PAGE_HEIGHT - 174), fontFamily);
    drawPageFooter(context, document, fontFamily, page, totalPages);
    return canvas;
}

function renderTablePage(
    document: SettlementVoucherDocument,
    tablePage: PaginatedVoucherTable,
    fontFamily: string,
    logo: HTMLImageElement | null,
    watermarkLogo: HTMLImageElement | null,
    paymentLogoImages: Map<PaymentLogoKey, HTMLImageElement>,
    page: number,
    totalPages: number,
) {
    const canvas = createCanvas();
    const context = requireContext(canvas);
    const palette = voucherPalette(document);
    drawPageBase(context, watermarkLogo, palette);
    drawDocumentHeader(context, document, fontFamily, logo, palette, page, totalPages);

    drawSectionHeading(context, tablePage.table.title, 194, fontFamily, palette);
    drawTableRange(
        context,
        document,
        tablePage.start,
        tablePage.end,
        tablePage.total,
        194,
        fontFamily,
    );
    drawLedgerTable(
        context,
        tablePage.table,
        202,
        fontFamily,
        paymentLogoImages,
        palette,
        document.locale,
        false,
        tablePage.kind === 'summaries',
        tablePage.start,
    );

    drawPageFooter(context, document, fontFamily, page, totalPages);
    return canvas;
}

function paginateTable(
    table: SettlementVoucherTable,
    kind: PaginatedVoucherTable['kind'],
    startIndex = 0,
): PaginatedVoucherTable[] {
    if (startIndex >= table.rows.length) return [];
    const pages: PaginatedVoucherTable[] = [];
    for (let index = startIndex; index < table.rows.length; index += TABLE_ROWS_PER_PAGE) {
        const rows = table.rows.slice(index, index + TABLE_ROWS_PER_PAGE);
        pages.push({
            table: { ...table, rows },
            kind,
            start: index + 1,
            end: index + rows.length,
            total: table.rows.length,
        });
    }
    return pages;
}

function overviewTablePlan(document: SettlementVoucherDocument): OverviewTablePlan {
    const maxFieldRows = Math.max(...document.fieldGroups.map((group) => group.fields.length), 0);
    const auditFields = (document.auditFields || []).filter(isMeaningfulField);
    const baseFits = maxFieldRows <= 4
        && auditFields.length <= 6
        && document.rates.rows.length <= OVERVIEW_RATE_ROW_LIMIT;
    return {
        rates: baseFits,
        summaryRows: baseFits
            ? Math.min(document.summaries.rows.length, OVERVIEW_SUMMARY_ROW_LIMIT)
            : 0,
    };
}

function drawPageBase(
    context: CanvasRenderingContext2D,
    watermarkLogo: HTMLImageElement | null,
    palette: VoucherPalette,
) {
    context.fillStyle = COLORS.white;
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    context.strokeStyle = '#d5e0ec';
    context.lineWidth = 1;
    context.strokeRect(30, 30, PAGE_WIDTH - 60, PAGE_HEIGHT - 60);
    context.fillStyle = palette.accent;
    context.fillRect(30, 30, 390, 4);
    context.fillStyle = palette.accentTint;
    context.fillRect(420, 30, PAGE_WIDTH - 450, 4);
    if (watermarkLogo) drawWatermarks(context, watermarkLogo);
}

function drawWatermarks(context: CanvasRenderingContext2D, watermarkLogo: HTMLImageElement) {
    context.save();
    context.globalAlpha = 0.022;
    context.filter = 'grayscale(1)';
    context.translate(PAGE_WIDTH / 2, PAGE_HEIGHT / 2 + 40);
    context.rotate(-Math.PI / 15);
    drawCenteredContainedImage(context, watermarkLogo, 0, 0, 390, 390);
    context.restore();
}

function drawDocumentHeader(
    context: CanvasRenderingContext2D,
    document: SettlementVoucherDocument,
    fontFamily: string,
    logo: HTMLImageElement | null,
    palette: VoucherPalette,
    page: number,
    totalPages: number,
) {
    if (logo) drawContainedImage(context, logo, PAGE_MARGIN, 48, 235, 52);

    context.fillStyle = palette.accentTint;
    context.fillRect(326, 48, 1, 62);
    context.textAlign = 'left';
    setFont(context, 12, 600, fontFamily);
    context.fillStyle = COLORS.muted;
    context.fillText(document.subtitle, 348, 61);
    setFont(context, 28, 800, fontFamily);
    context.fillStyle = COLORS.ink;
    context.fillText(document.title, 348, 94);

    drawStatusStamp(context, document.statusLabel, document.statusTone, 668, 62, 124, 48, fontFamily);

    const metaLeft = 820;
    context.fillStyle = COLORS.line;
    context.fillRect(metaLeft - 18, 50, 1, 79);
    context.textAlign = 'left';
    setFont(context, 11, 550, fontFamily);
    context.fillStyle = COLORS.muted;
    context.fillText(document.referenceLabel, metaLeft, 60);
    setFont(context, 15, 720, fontFamily);
    context.fillStyle = COLORS.ink;
    const referenceLines = fitTextLines(context, document.referenceNo, 350, 2);
    drawLines(context, referenceLines, metaLeft, 82, 18);
    setFont(context, 11, 550, fontFamily);
    context.fillStyle = COLORS.muted;
    context.fillText(document.generatedAtLabel, metaLeft, 110);
    setFont(context, 12, 650, fontFamily);
    context.fillStyle = COLORS.ink;
    context.fillText(document.generatedAt, metaLeft, 128);

    context.fillStyle = palette.accent;
    context.fillRect(PAGE_MARGIN, 151, 360, 3);
    context.fillStyle = palette.accentTint;
    context.fillRect(PAGE_MARGIN + 360, 151, CONTENT_WIDTH - 360, 3);
    context.textAlign = 'right';
    setFont(context, 12, 500, fontFamily);
    context.fillStyle = COLORS.muted;
    context.fillText(`${page} / ${totalPages}`, PAGE_WIDTH - PAGE_MARGIN, 146);
    context.textAlign = 'left';
}

function drawFieldGroups(
    context: CanvasRenderingContext2D,
    document: SettlementVoucherDocument,
    groups: SettlementVoucherFieldGroup[],
    top: number,
    fontFamily: string,
    palette: VoucherPalette,
) {
    const gap = 16;
    const columns = Math.max(groups.length, 1);
    const weights = groups.map((_, index) => index === groups.length - 1 ? 1.16 : 1);
    const totalWeight = weights.reduce((sum, value) => sum + value, 0);
    const usableWidth = CONTENT_WIDTH - gap * (columns - 1);
    const widths = weights.map((weight) => usableWidth * weight / totalWeight);
    const totalHeight = 184;
    let nextX = PAGE_MARGIN;

    groups.forEach((group, groupIndex) => {
        const groupWidth = widths[groupIndex];
        const x = nextX;
        const isAmount = groupIndex === groups.length - 1;
        roundedBox(
            context,
            x,
            top,
            groupWidth,
            totalHeight,
            5,
            isAmount ? palette.accentTint : COLORS.white,
            isAmount ? palette.accentLine : COLORS.line,
        );
        context.fillStyle = palette.accent;
        context.fillRect(x + 14, top + 14, 4, 20);
        setFont(context, 14, 720, fontFamily);
        context.fillStyle = palette.accentDark;
        context.textAlign = 'left';
        context.fillText(group.title, x + 27, top + 29);
        context.fillStyle = COLORS.line;
        context.fillRect(x + 14, top + 44, groupWidth - 28, 1);

        let contentTop = top + 68;
        if (isAmount) {
            setFont(context, 11, 550, fontFamily);
            context.fillStyle = COLORS.muted;
            context.fillText(document.netAmountLabel, x + 14, contentTop);
            drawCurrencyMark(context, document.netCurrency, x + 29, contentTop + 29, 13, document.locale, palette);
            setFont(context, 11, 800, fontFamily);
            context.fillStyle = COLORS.ink;
            context.fillText(document.netCurrency || '-', x + 49, contentTop + 33);
            setFont(context, 23, 800, fontFamily);
            context.fillStyle = palette.accentDark;
            const amountLines = fitTextLines(context, document.netAmount, groupWidth - 145, 2);
            drawLines(context, amountLines, x + 103, contentTop + 34, 25);
            contentTop += 59;
        }

        const rowHeight = isAmount ? 21 : 27;
        const labelWidth = Math.min(105, groupWidth * .36);
        group.fields.forEach((field, rowIndex) => {
            const baseline = contentTop + rowIndex * rowHeight;
            setFont(context, 10, 550, fontFamily);
            context.fillStyle = COLORS.muted;
            context.fillText(field.label, x + 14, baseline);
            drawFieldValue(
                context,
                field.value,
                x + 14 + labelWidth,
                baseline,
                groupWidth - labelWidth - 28,
                fontFamily,
                document.locale,
                palette,
            );
        });
        nextX += groupWidth + gap;
    });
    context.textAlign = 'left';
    return top + totalHeight;
}

function drawFieldMatrix(
    context: CanvasRenderingContext2D,
    fields: SettlementVoucherField[],
    top: number,
    fontFamily: string,
    columns: number,
) {
    const cellWidth = CONTENT_WIDTH / columns;
    const rowHeight = 52;
    fields.forEach((field, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const x = PAGE_MARGIN + column * cellWidth;
        const y = top + row * rowHeight;
        context.textAlign = 'center';
        setFont(context, 11, 550, fontFamily);
        context.fillStyle = COLORS.muted;
        context.fillText(field.label, x + cellWidth / 2, y + 16);
        setFont(context, 13, 650, fontFamily);
        context.fillStyle = COLORS.ink;
        const lines = fitTextLines(context, voucherCellText(field.value), cellWidth - 34, 2);
        drawCenteredLines(context, lines, x + cellWidth / 2, y + 37, 17);

        if (column > 0) {
            context.save();
            context.setLineDash([3, 4]);
            context.strokeStyle = COLORS.line;
            context.beginPath();
            context.moveTo(x, y + 5);
            context.lineTo(x, y + rowHeight - 5);
            context.stroke();
            context.restore();
        }
    });
    context.textAlign = 'left';
    return top + Math.ceil(fields.length / columns) * rowHeight;
}

function drawSectionHeading(
    context: CanvasRenderingContext2D,
    title: string,
    baseline: number,
    fontFamily: string,
    palette: VoucherPalette,
) {
    fillBox(
        context,
        PAGE_MARGIN,
        baseline - 20,
        CONTENT_WIDTH,
        28,
        palette.accentTint,
        COLORS.line,
    );
    context.fillStyle = palette.accent;
    context.fillRect(PAGE_MARGIN, baseline - 20, 5, 28);
    setFont(context, 14, 800, fontFamily);
    context.fillStyle = palette.accentDark;
    context.fillText(title, PAGE_MARGIN + 16, baseline - 1);
}

function drawRateEvidence(
    context: CanvasRenderingContext2D,
    table: SettlementVoucherTable,
    top: number,
    fontFamily: string,
    palette: VoucherPalette,
    locale: string,
) {
    drawSectionHeading(context, table.title, top, fontFamily, palette);
    setFont(context, 11, 550, fontFamily);
    context.fillStyle = COLORS.muted;
    context.textAlign = 'right';
    context.fillText(String(table.rows.length), PAGE_WIDTH - PAGE_MARGIN - 12, top - 1);
    context.textAlign = 'left';

    const bodyTop = top + 8;
    if (!table.rows.length) {
        fillBox(context, PAGE_MARGIN, bodyTop, CONTENT_WIDTH, 58, COLORS.white, COLORS.line);
        setFont(context, 11, 550, fontFamily);
        context.fillStyle = COLORS.muted;
        context.textAlign = 'center';
        context.fillText(table.emptyText, PAGE_WIDTH / 2, bodyTop + 34);
        context.textAlign = 'left';
        return bodyTop + 58;
    }

    const gap = 12;
    const columns = table.rows.length === 1 ? 1 : 2;
    const itemWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
    const itemHeight = 84;
    table.rows.forEach((row, index) => {
        const columnIndex = index % columns;
        const rowIndex = Math.floor(index / columns);
        const x = PAGE_MARGIN + columnIndex * (itemWidth + gap);
        const y = bodyTop + rowIndex * (itemHeight + gap);
        roundedBox(context, x, y, itemWidth, itemHeight, 4, COLORS.white, COLORS.line);
        context.fillStyle = palette.accentTint;
        context.fillRect(x + 1, y + 1, itemWidth * .43, itemHeight - 2);

        const source = currencyCode(row.sourceCurrency);
        const target = currencyCode(row.targetCurrency);
        const flowCenter = x + itemWidth * .215;
        drawCurrencySummary(context, source, flowCenter - 58, y + 13, fontFamily, locale, palette);
        drawCurrencySummary(context, target, flowCenter + 58, y + 13, fontFamily, locale, palette);
        setFont(context, 19, 750, fontFamily);
        context.fillStyle = palette.accent;
        context.textAlign = 'center';
        context.fillText('→', flowCenter, y + 48);

        const evidenceColumns = table.columns.filter((column) => !['sourceCurrency', 'targetCurrency'].includes(column.key));
        const evidenceLeft = x + itemWidth * .46;
        const evidenceWidth = itemWidth * .51;
        const evidenceColumnWidth = evidenceWidth / Math.min(evidenceColumns.length, 2);
        evidenceColumns.forEach((column, evidenceIndex) => {
            const evidenceColumn = evidenceIndex % 2;
            const evidenceRow = Math.floor(evidenceIndex / 2);
            const cellX = evidenceLeft + evidenceColumn * evidenceColumnWidth;
            const cellY = y + 20 + evidenceRow * 35;
            setFont(context, 8.5, 550, fontFamily);
            context.fillStyle = COLORS.muted;
            context.textAlign = 'left';
            context.fillText(column.label, cellX, cellY);
            setFont(context, column.align === 'right' ? 11 : 9.5, column.align === 'right' ? 800 : 650, fontFamily);
            context.fillStyle = column.align === 'right' ? palette.accentDark : COLORS.ink;
            const lines = fitTextLines(context, voucherCellText(row[column.key]), evidenceColumnWidth - 12, 1);
            drawLines(context, lines, cellX, cellY + 16, 14);
        });
    });
    context.textAlign = 'left';
    const rows = Math.ceil(table.rows.length / columns);
    return bodyTop + rows * itemHeight + Math.max(0, rows - 1) * gap;
}

function drawLedgerTable(
    context: CanvasRenderingContext2D,
    table: SettlementVoucherTable,
    top: number,
    fontFamily: string,
    paymentLogoImages: Map<PaymentLogoKey, HTMLImageElement>,
    palette: VoucherPalette,
    locale: string,
    compact = false,
    showSequence = false,
    sequenceStart = 1,
) {
    const columns = table.columns;
    const totalWeight = columns.reduce((sum, column) => sum + (column.width || 1), 0);
    const sequenceWidth = showSequence ? 54 : 0;
    const dataWidth = CONTENT_WIDTH - sequenceWidth;
    const widths = columns.map((column) => dataWidth * (column.width || 1) / totalWeight);
    const headerHeight = compact ? 38 : 52;
    const rowHeight = compact ? 34 : 50;
    let x = PAGE_MARGIN;

    if (showSequence) {
        fillBox(context, x, top, sequenceWidth, headerHeight, palette.tableHead, COLORS.line);
        drawCellText(
            context,
            tableSequenceLabel(table),
            x,
            top,
            sequenceWidth,
            headerHeight,
            'center',
            fontFamily,
            compact ? 11 : 12,
            750,
        );
        x += sequenceWidth;
    }

    columns.forEach((column, index) => {
        fillBox(context, x, top, widths[index], headerHeight, palette.tableHead, COLORS.line);
        drawCellText(
            context,
            column.label,
            x,
            top,
            widths[index],
            headerHeight,
            column.align || 'center',
            fontFamily,
            compact ? 11 : 12,
            750,
        );
        x += widths[index];
    });

    table.rows.forEach((row, rowIndex) => {
        const y = top + headerHeight + rowHeight * rowIndex;
        x = PAGE_MARGIN;
        if (showSequence) {
            fillBox(
                context,
                x,
                y,
                sequenceWidth,
                rowHeight,
                rowIndex % 2 ? COLORS.zebra : COLORS.white,
                COLORS.line,
            );
            drawCellText(
                context,
                String(sequenceStart + rowIndex),
                x,
                y,
                sequenceWidth,
                rowHeight,
                'center',
                fontFamily,
                compact ? 10 : 11,
                550,
            );
            x += sequenceWidth;
        }
        columns.forEach((column, columnIndex) => {
            fillBox(
                context,
                x,
                y,
                widths[columnIndex],
                rowHeight,
                rowIndex % 2 ? COLORS.zebra : COLORS.white,
                COLORS.line,
            );
            const value = row[column.key];
            if (column.kind === 'payment' && isPaymentCell(value)) {
                drawPaymentCell(
                    context,
                    value,
                    x,
                    y,
                    widths[columnIndex],
                    rowHeight,
                    fontFamily,
                    paymentLogoImages,
                );
            } else if (column.kind === 'currency' && isCurrencyCell(value)) {
                drawCurrencyCell(context, value, x, y, widths[columnIndex], rowHeight, fontFamily, locale, palette);
            } else if (column.kind === 'money' && isMoneyCell(value)) {
                drawMoneyCell(context, value, x, y, widths[columnIndex], rowHeight, fontFamily, locale, palette, compact);
            } else if (column.kind === 'direction' && isDirectionCell(value)) {
                drawDirectionCell(context, value, x, y, widths[columnIndex], rowHeight, fontFamily, compact);
            } else {
                drawCellText(
                    context,
                    voucherCellText(value),
                    x,
                    y,
                    widths[columnIndex],
                    rowHeight,
                    column.align || 'center',
                    fontFamily,
                    compact ? 10 : 11,
                    550,
                );
            }
            x += widths[columnIndex];
        });
    });
    return top + headerHeight + rowHeight * table.rows.length;
}

function tableSequenceLabel(table: SettlementVoucherTable) {
    return /[\u3400-\u9fff]/u.test(table.title) ? '序号' : 'No.';
}

async function loadPaymentLogoImages(
    document: SettlementVoucherDocument,
): Promise<Map<PaymentLogoKey, HTMLImageElement>> {
    const logoKeys = [document.rates, document.summaries].flatMap((table) => {
        const paymentColumns = table.columns.filter((column) => column.kind === 'payment');
        return table.rows.flatMap((row) => paymentColumns.flatMap((column) => {
            const cell = row[column.key];
            return isPaymentCell(cell)
                ? resolvePaymentLogoKeys(cell.paymentType, cell.paymentMethod)
                : [];
        }));
    }).filter((key, index, keys) => keys.indexOf(key) === index);

    const loaded = await Promise.all(logoKeys.map(async (key) => {
        const asset = getPaymentLogo(key).asset;
        return [key, asset ? await loadImage(asset) : null] as const;
    }));
    return new Map(loaded.filter(
        (entry): entry is readonly [PaymentLogoKey, HTMLImageElement] => entry[1] !== null,
    ));
}

function isPaymentCell(value: SettlementVoucherCell | undefined): value is SettlementVoucherPaymentCell {
    return Boolean(value && typeof value === 'object' && value.cellType === 'payment');
}

function isCurrencyCell(value: SettlementVoucherCell | undefined): value is SettlementVoucherCurrencyCell {
    return Boolean(value && typeof value === 'object' && value.cellType === 'currency');
}

function isMoneyCell(value: SettlementVoucherCell | undefined): value is SettlementVoucherMoneyCell {
    return Boolean(value && typeof value === 'object' && value.cellType === 'money');
}

function isDirectionCell(value: SettlementVoucherCell | undefined): value is SettlementVoucherDirectionCell {
    return Boolean(value && typeof value === 'object' && value.cellType === 'direction');
}

function voucherCellText(value: SettlementVoucherCell | undefined) {
    if (typeof value === 'string') return value || '-';
    if (isPaymentCell(value)) {
        return [
            value.paymentTypeLabel || value.paymentType || '',
            value.paymentMethodLabel || value.paymentMethod || '',
        ].filter(Boolean).join(' / ') || '-';
    }
    if (isCurrencyCell(value)) return value.currency || '-';
    if (isMoneyCell(value)) return [value.currency, value.amount].filter(Boolean).join(' ') || '-';
    if (isDirectionCell(value)) return value.label || value.direction || '-';
    return '-';
}

function currencyCode(value: SettlementVoucherCell | undefined) {
    if (isCurrencyCell(value)) return value.currency || '';
    return typeof value === 'string' ? value : '';
}

function drawPaymentCell(
    context: CanvasRenderingContext2D,
    cell: SettlementVoucherPaymentCell,
    x: number,
    y: number,
    width: number,
    height: number,
    fontFamily: string,
    paymentLogoImages: Map<PaymentLogoKey, HTMLImageElement>,
) {
    const images = resolvePaymentLogoKeys(cell.paymentType, cell.paymentMethod)
        .map((key) => paymentLogoImages.get(key))
        .filter((image): image is HTMLImageElement => Boolean(image));
    if (!images.length) {
        drawCellText(
            context,
            voucherCellText(cell),
            x,
            y,
            width,
            height,
            'center',
            fontFamily,
            12,
            600,
        );
        return;
    }

    const gap = 8;
    const maxLogoHeight = 25;
    const availableWidth = Math.max(width - 22 - gap * (images.length - 1), 24);
    const maxLogoWidth = Math.min(60, availableWidth / images.length);
    const sizes = images.map((image) => containedSize(image, maxLogoWidth, maxLogoHeight));
    const contentWidth = sizes.reduce((sum, size) => sum + size.width, 0)
        + gap * (sizes.length - 1);
    let drawX = x + (width - contentWidth) / 2;
    sizes.forEach((size, index) => {
        context.drawImage(
            images[index],
            drawX,
            y + (height - size.height) / 2,
            size.width,
            size.height,
        );
        drawX += size.width + gap;
    });
}

function drawStatusStamp(
    context: CanvasRenderingContext2D,
    label: string,
    tone: SettlementVoucherDocument['statusTone'],
    x: number,
    y: number,
    width: number,
    height: number,
    fontFamily: string,
) {
    const color = STATUS_STAMP_COLORS[tone];
    context.save();
    context.translate(x + width / 2, y + height / 2);
    context.rotate(-Math.PI / 18);
    context.fillStyle = 'rgba(255,255,255,.82)';
    context.fillRect(-width / 2, -height / 2, width, height);
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.strokeRect(-width / 2, -height / 2, width, height);
    context.lineWidth = 1.2;
    context.strokeRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10);
    setFont(context, 18, 820, fontFamily);
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, 0, 1, width - 18);
    context.restore();
}

function drawFieldValue(
    context: CanvasRenderingContext2D,
    value: SettlementVoucherCell,
    x: number,
    baseline: number,
    width: number,
    fontFamily: string,
    locale: string,
    palette: VoucherPalette,
) {
    if (isCurrencyCell(value)) {
        const presentation = resolveCurrencyPresentation(value.currency, locale);
        drawCurrencyMark(context, presentation.alphabeticCode, x + 8, baseline - 4, 8, locale, palette);
        const text = value.showName && presentation.displayName !== presentation.alphabeticCode
            ? `${presentation.alphabeticCode} ${presentation.displayName}`
            : presentation.alphabeticCode;
        setFont(context, 10.5, 680, fontFamily);
        context.fillStyle = COLORS.ink;
        context.textAlign = 'left';
        drawLines(context, fitTextLines(context, text, width - 22, 1), x + 21, baseline, 14);
        return;
    }
    setFont(context, 11, 650, fontFamily);
    context.fillStyle = COLORS.ink;
    context.textAlign = 'left';
    drawLines(context, fitTextLines(context, voucherCellText(value), width, 2), x, baseline, 14);
}

function drawCurrencySummary(
    context: CanvasRenderingContext2D,
    currency: string,
    centerX: number,
    top: number,
    fontFamily: string,
    locale: string,
    palette: VoucherPalette,
) {
    const presentation = resolveCurrencyPresentation(currency, locale);
    drawCurrencyMark(context, presentation.alphabeticCode, centerX, top + 13, 12, locale, palette);
    context.textAlign = 'center';
    setFont(context, 12, 800, fontFamily);
    context.fillStyle = COLORS.ink;
    context.fillText(presentation.alphabeticCode, centerX, top + 37);
    setFont(context, 8.5, 550, fontFamily);
    context.fillStyle = COLORS.muted;
    context.fillText(presentation.displayName, centerX, top + 52, 76);
    context.textAlign = 'left';
}

function drawCurrencyMark(
    context: CanvasRenderingContext2D,
    currency: string,
    centerX: number,
    centerY: number,
    radius: number,
    locale: string,
    palette: VoucherPalette,
) {
    const presentation = resolveCurrencyPresentation(currency, locale);
    context.save();
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fillStyle = presentation.iconType === 'flag' ? '#ffffff' : palette.accentTint;
    context.fill();
    context.strokeStyle = presentation.iconType === 'flag' ? '#d5dfeb' : palette.accentLine;
    context.lineWidth = 1;
    context.stroke();
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = palette.accentDark;
    context.font = presentation.iconType === 'flag'
        ? `${Math.max(12, radius * 1.45)}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
        : `800 ${Math.max(7, radius * .72)}px Inter, Arial, sans-serif`;
    context.fillText(presentation.iconText, centerX, centerY + .5, radius * 1.7);
    context.restore();
}

function drawCurrencyCell(
    context: CanvasRenderingContext2D,
    cell: SettlementVoucherCurrencyCell,
    x: number,
    y: number,
    width: number,
    height: number,
    fontFamily: string,
    locale: string,
    palette: VoucherPalette,
) {
    const presentation = resolveCurrencyPresentation(cell.currency, locale);
    const centerY = y + height / 2;
    const contentWidth = 54;
    const startX = x + (width - contentWidth) / 2;
    drawCurrencyMark(context, presentation.alphabeticCode, startX + 10, centerY, 9, locale, palette);
    setFont(context, 10.5, 750, fontFamily);
    context.fillStyle = COLORS.ink;
    context.textAlign = 'left';
    context.fillText(presentation.alphabeticCode, startX + 25, centerY + 4);
}

function drawMoneyCell(
    context: CanvasRenderingContext2D,
    cell: SettlementVoucherMoneyCell,
    x: number,
    y: number,
    width: number,
    height: number,
    fontFamily: string,
    locale: string,
    palette: VoucherPalette,
    compact: boolean,
) {
    const centerY = y + height / 2;
    drawCurrencyMark(context, cell.currency || '', x + 15, centerY, compact ? 8 : 9, locale, palette);
    setFont(context, compact ? 8.5 : 9.5, 700, fontFamily);
    context.fillStyle = COLORS.muted;
    context.textAlign = 'left';
    context.fillText(cell.currency || '-', x + 28, centerY + 3);
    setFont(context, compact ? 9.5 : 10.5, 700, fontFamily);
    context.fillStyle = COLORS.ink;
    context.textAlign = 'right';
    context.fillText(cell.amount || '-', x + width - 9, centerY + 4, Math.max(width - 58, 20));
    context.textAlign = 'left';
}

function drawDirectionCell(
    context: CanvasRenderingContext2D,
    cell: SettlementVoucherDirectionCell,
    x: number,
    y: number,
    width: number,
    height: number,
    fontFamily: string,
    compact: boolean,
) {
    const direction = String(cell.direction || '').toUpperCase();
    const isCredit = direction === 'CREDIT';
    const isDebit = direction === 'DEBIT';
    const fill = isCredit ? '#eefaf3' : isDebit ? '#fff3f2' : '#f5f7f9';
    const stroke = isCredit ? '#b9dfca' : isDebit ? '#efc2bf' : '#d8dee8';
    const ink = isCredit ? '#15803d' : isDebit ? '#c2413b' : '#667085';
    const tagWidth = Math.min(width - 12, compact ? 50 : 62);
    const tagHeight = compact ? 21 : 26;
    const tagX = x + (width - tagWidth) / 2;
    const tagY = y + (height - tagHeight) / 2;
    roundedBox(context, tagX, tagY, tagWidth, tagHeight, 4, fill, stroke);
    setFont(context, compact ? 9 : 10, 720, fontFamily);
    context.fillStyle = ink;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(cell.label || cell.direction || '-', x + width / 2, y + height / 2 + .5, tagWidth - 8);
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
}

function drawCellText(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    align: SettlementVoucherAlignment,
    fontFamily: string,
    size: number,
    weight: number,
) {
    setFont(context, size, weight, fontFamily);
    context.fillStyle = COLORS.ink;
    context.textAlign = align;
    const padding = 10;
    const drawX = align === 'left'
        ? x + padding
        : align === 'right'
            ? x + width - padding
            : x + width / 2;
    const lines = fitTextLines(context, text, width - padding * 2, 2);
    const firstBaseline = y + height / 2 - (lines.length - 1) * 9 + 4;
    drawLines(context, lines, drawX, firstBaseline, 19);
    context.textAlign = 'left';
}

function drawNotice(
    context: CanvasRenderingContext2D,
    document: SettlementVoucherDocument,
    top: number,
    fontFamily: string,
) {
    const colors = STATUS_COLORS[document.statusTone];
    const height = 68;
    roundedBox(context, PAGE_MARGIN, top, CONTENT_WIDTH, height, 4, colors.tint, colors.line);
    setFont(context, 13, 750, fontFamily);
    context.fillStyle = colors.main;
    context.fillText(document.noticeTitle, PAGE_MARGIN + 18, top + 23);
    setFont(context, 12, 500, fontFamily);
    context.fillStyle = COLORS.ink;
    const lines = fitTextLines(context, document.notice, CONTENT_WIDTH - 36, 3);
    drawLines(context, lines, PAGE_MARGIN + 18, top + 46, 17);
}

function drawPageFooter(
    context: CanvasRenderingContext2D,
    document: SettlementVoucherDocument,
    fontFamily: string,
    page: number,
    totalPages: number,
) {
    const lineTop = PAGE_HEIGHT - 104;
    context.fillStyle = COLORS.line;
    context.fillRect(PAGE_MARGIN, lineTop, CONTENT_WIDTH, 1);
    setFont(context, 13, 500, fontFamily);
    context.fillStyle = COLORS.muted;
    context.fillText(`${document.generatedAtLabel}: ${document.generatedAt}`, PAGE_MARGIN, lineTop + 34);
    context.textAlign = 'right';
    context.fillText(
        `${document.footer}  ${page} / ${totalPages}`,
        PAGE_WIDTH - PAGE_MARGIN,
        lineTop + 34,
    );
    context.textAlign = 'left';
}

function drawTableRange(
    context: CanvasRenderingContext2D,
    document: SettlementVoucherDocument,
    start: number,
    end: number,
    total: number,
    baseline: number,
    fontFamily: string,
) {
    setFont(context, 12, 600, fontFamily);
    context.fillStyle = COLORS.muted;
    context.textAlign = 'right';
    context.fillText(
        tableRangeText(document, start, end, total),
        PAGE_WIDTH - PAGE_MARGIN,
        baseline,
    );
    context.textAlign = 'left';
}

function tableRangeText(
    document: SettlementVoucherDocument,
    start: number,
    end: number,
    total: number,
) {
    return document.locale.startsWith('zh')
        ? `第 ${start}-${end} 条 / 共 ${total} 条`
        : `Rows ${start}-${end} of ${total}`;
}

function isMeaningfulField(field: SettlementVoucherField) {
    const value = voucherCellText(field.value).trim();
    return Boolean(value && value !== '-');
}

function voucherPalette(document: SettlementVoucherDocument): VoucherPalette {
    if (document.system === 'merchant') {
        return {
            accent: '#0f766e',
            accentDark: '#115e59',
            accentTint: '#edf9f7',
            accentLine: '#91cfc8',
            tableHead: '#e5f4f2',
        };
    }
    return {
        accent: COLORS.accent,
        accentDark: COLORS.accentDark,
        accentTint: '#eff6ff',
        accentLine: '#a9c8f5',
        tableHead: '#e8f1ff',
    };
}

function addCanvasPage(
    pdf: InstanceType<(typeof import('jspdf'))['jsPDF']>,
    canvas: HTMLCanvasElement,
) {
    pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.94),
        'JPEG',
        0,
        0,
        210,
        297,
        undefined,
        'FAST',
    );
}

function createCanvas() {
    const canvas = window.document.createElement('canvas');
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    return canvas;
}

function requireContext(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas rendering is unavailable');
    return context;
}

function fillBox(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string,
    stroke: string,
) {
    context.fillStyle = fill;
    context.fillRect(x, y, width, height);
    context.strokeStyle = stroke;
    context.strokeRect(x, y, width, height);
}

function roundedBox(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill: string,
    stroke: string,
) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = stroke;
    context.stroke();
}

function setFont(
    context: CanvasRenderingContext2D,
    size: number,
    weight: number,
    family: string,
) {
    context.font = `${weight} ${size}px ${family}`;
}

function fitTextLines(
    context: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines: number,
) {
    const lines = wrapText(context, text, maxWidth);
    if (lines.length <= maxLines) return lines;
    const visible = lines.slice(0, maxLines);
    let last = visible[maxLines - 1];
    while (last.length > 1 && context.measureText(`${last}...`).width > maxWidth) {
        last = last.slice(0, -1);
    }
    visible[maxLines - 1] = `${last.trimEnd()}...`;
    return visible;
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
    const value = text || '-';
    const lines: string[] = [];
    let current = '';
    for (const character of value) {
        const candidate = current + character;
        if (current && context.measureText(candidate).width > maxWidth) {
            lines.push(current.trimEnd());
            current = character.trimStart();
        } else {
            current = candidate;
        }
    }
    lines.push(current.trimEnd() || '-');
    return lines;
}

function drawCenteredLines(
    context: CanvasRenderingContext2D,
    lines: string[],
    x: number,
    centerBaseline: number,
    lineHeight: number,
) {
    const firstBaseline = centerBaseline - (lines.length - 1) * lineHeight / 2;
    drawLines(context, lines, x, firstBaseline, lineHeight);
}

function drawLines(
    context: CanvasRenderingContext2D,
    lines: string[],
    x: number,
    y: number,
    lineHeight: number,
) {
    lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
}

function loadImage(source: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = source;
    });
}

function drawContainedImage(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    maxWidth: number,
    maxHeight: number,
) {
    const { width, height } = containedSize(image, maxWidth, maxHeight);
    context.drawImage(image, x, y + (maxHeight - height) / 2, width, height);
}

function drawCenteredContainedImage(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    centerX: number,
    centerY: number,
    maxWidth: number,
    maxHeight: number,
) {
    const { width, height } = containedSize(image, maxWidth, maxHeight);
    context.drawImage(image, centerX - width / 2, centerY - height / 2, width, height);
}

function containedSize(image: HTMLImageElement, maxWidth: number, maxHeight: number) {
    const sourceWidth = image.naturalWidth || image.width || 1;
    const sourceHeight = image.naturalHeight || image.height || 1;
    const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
    return {
        width: sourceWidth * scale,
        height: sourceHeight * scale,
    };
}
