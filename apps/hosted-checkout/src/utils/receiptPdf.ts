export type ReceiptStatus = 'success' | 'failed' | 'processing';

export interface ReceiptRow {
  label: string;
  value: string;
}

export interface ReceiptPdfContent {
  locale: string;
  status: ReceiptStatus;
  brandName: string;
  brandSubtitle: string;
  logoUrl?: string;
  title: string;
  statusLabel: string;
  amountLabel: string;
  amount: string;
  rows: ReceiptRow[];
  noticeTitle: string;
  notice: string;
  generatedAtLabel: string;
  generatedAt: string;
  footer: string;
  fileName: string;
}

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const PAGE_MARGIN = 96;

const STATUS_COLORS: Record<ReceiptStatus, { main: string; tint: string }> = {
  success: { main: '#15803d', tint: '#f0fdf4' },
  failed: { main: '#b91c1c', tint: '#fef2f2' },
  processing: { main: '#1d4ed8', tint: '#eff6ff' },
};

/** 将经过筛选的交易状态字段绘制成固定 A4 回执并直接下载。 */
export async function downloadReceiptPdf(content: ReceiptPdfContent): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas rendering is unavailable');
  }

  const fontFamily = content.locale.startsWith('zh')
    ? '"PingFang SC", "Microsoft YaHei", Arial, sans-serif'
    : 'Inter, Arial, sans-serif';
  const colors = STATUS_COLORS[content.status];

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  context.fillStyle = '#0f172a';

  const logo = content.logoUrl ? await loadImage(content.logoUrl) : null;
  if (logo) {
    drawContainedImage(context, logo, PAGE_MARGIN, 74, 330, 74);
  } else {
    setFont(context, 42, 800, fontFamily);
    context.fillText(content.brandName, PAGE_MARGIN, 126);
  }
  setFont(context, 22, 500, fontFamily);
  context.fillStyle = '#64748b';
  context.textAlign = 'right';
  context.fillText(content.brandSubtitle, PAGE_WIDTH - PAGE_MARGIN, 112);
  context.textAlign = 'left';

  context.strokeStyle = '#e2e8f0';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(PAGE_MARGIN, 176);
  context.lineTo(PAGE_WIDTH - PAGE_MARGIN, 176);
  context.stroke();

  setFont(context, 44, 800, fontFamily);
  context.fillStyle = '#0f172a';
  context.fillText(content.title, PAGE_MARGIN, 254);

  roundRect(context, PAGE_WIDTH - PAGE_MARGIN - 300, 209, 300, 64, 12);
  context.fillStyle = colors.tint;
  context.fill();
  setFont(context, 24, 800, fontFamily);
  context.fillStyle = colors.main;
  context.textAlign = 'center';
  context.fillText(content.statusLabel, PAGE_WIDTH - PAGE_MARGIN - 150, 251);
  context.textAlign = 'left';

  roundRect(context, PAGE_MARGIN, 324, PAGE_WIDTH - PAGE_MARGIN * 2, 178, 12);
  context.fillStyle = '#f8fafc';
  context.fill();
  context.strokeStyle = '#e2e8f0';
  context.stroke();
  setFont(context, 23, 600, fontFamily);
  context.fillStyle = '#64748b';
  context.fillText(content.amountLabel, PAGE_MARGIN + 42, 382);
  setFont(context, 54, 800, fontFamily);
  context.fillStyle = '#0f172a';
  context.fillText(content.amount, PAGE_MARGIN + 42, 459);

  let rowTop = 554;
  for (const row of content.rows) {
    setFont(context, 23, 600, fontFamily);
    const labelLines = wrapText(context, row.label || '-', 290);
    setFont(context, 25, 700, fontFamily);
    const valueLines = wrapText(context, row.value || '-', 700);
    const lineCount = Math.max(labelLines.length, valueLines.length);
    const rowHeight = Math.max(76, lineCount * 34 + 30);

    context.strokeStyle = '#e2e8f0';
    context.beginPath();
    context.moveTo(PAGE_MARGIN, rowTop + rowHeight);
    context.lineTo(PAGE_WIDTH - PAGE_MARGIN, rowTop + rowHeight);
    context.stroke();

    setFont(context, 23, 600, fontFamily);
    context.fillStyle = '#64748b';
    drawLines(context, labelLines, PAGE_MARGIN, rowTop + 36, 34);
    setFont(context, 25, 700, fontFamily);
    context.fillStyle = '#1e293b';
    drawLines(context, valueLines, PAGE_MARGIN + 346, rowTop + 36, 34);
    rowTop += rowHeight;
  }

  const noticeTop = Math.min(Math.max(rowTop + 52, 1120), 1340);
  roundRect(context, PAGE_MARGIN, noticeTop, PAGE_WIDTH - PAGE_MARGIN * 2, 190, 12);
  context.fillStyle = colors.tint;
  context.fill();
  setFont(context, 24, 800, fontFamily);
  context.fillStyle = colors.main;
  context.fillText(content.noticeTitle, PAGE_MARGIN + 38, noticeTop + 54);
  setFont(context, 22, 500, fontFamily);
  context.fillStyle = '#334155';
  const noticeLines = wrapText(context, content.notice, PAGE_WIDTH - PAGE_MARGIN * 2 - 76).slice(
    0,
    3,
  );
  drawLines(context, noticeLines, PAGE_MARGIN + 38, noticeTop + 100, 33);

  setFont(context, 20, 500, fontFamily);
  context.fillStyle = '#64748b';
  context.fillText(
    `${content.generatedAtLabel}: ${content.generatedAt}`,
    PAGE_MARGIN,
    PAGE_HEIGHT - 116,
  );
  context.textAlign = 'right';
  context.fillText(content.footer, PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 116);
  context.textAlign = 'left';

  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({
    title: content.title,
    subject: content.statusLabel,
    author: content.brandName,
    creator: content.brandName,
  });
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  pdf.save(content.fileName);
}

function setFont(context: CanvasRenderingContext2D, size: number, weight: number, family: string) {
  context.font = `${weight} ${size}px ${family}`;
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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
  if (current || lines.length === 0) {
    lines.push(current.trimEnd() || '-');
  }
  return lines;
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

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function loadImage(source: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
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
  const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, x, y + (maxHeight - height) / 2, width, height);
}
