type ReceiptStatus = 'success' | 'failed' | 'processing';

interface ReceiptPdfOptions {
  title: string;
  brandName: string;
  orderReference: string;
  noticeTitle: string;
  notices: Record<ReceiptStatus, string>;
}

const RESULT_SELECTOR = '[data-checkout-receipt-result]';
const CAPTURE_SCALE = 2;

/** 复用结果页的实际布局，只在导出副本中追加回执说明。 */
export async function downloadReceiptPdf(page: HTMLElement, options: ReceiptPdfOptions): Promise<void> {
  const [{ default: capture }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const headerWidth = page.querySelector('header')?.getBoundingClientRect().width ?? page.clientWidth;
  const pagePadding = Number.parseFloat(getComputedStyle(page).paddingInlineStart);
  const width = Math.min(page.clientWidth, Math.ceil(headerWidth + 2 * pagePadding));
  let receiptStatus: ReceiptStatus | undefined;

  // html2canvas 用隐藏的一像素图片量文字基线。Tailwind 将图片置为块级，导致基线偏下。
  const fontMetricsStyle = page.ownerDocument.createElement('style');
  fontMetricsStyle.textContent = `
    body > div[style*="visibility: hidden"][style*="white-space: nowrap"] > img[width="1"][height="1"] {
      display: inline;
    }
  `;
  page.ownerDocument.head.append(fontMetricsStyle);
  const canvas = await capture(page, {
    width,
    x: Math.floor((page.clientWidth - width) / 2),
    scrollY: 0,
    scale: CAPTURE_SCALE,
    useCORS: true,
    logging: false,
    onclone(document, clonedPage) {
      const result = clonedPage.querySelector<HTMLElement>(RESULT_SELECTOR);
      const view = result?.dataset.checkoutReceiptResult;
      if (!result || (view !== 'success' && view !== 'failed' && view !== 'pending' && view !== 'processing')) {
        // 下载期间如果切回填单页，清空副本并终止生成，防止截取付款表单。
        clonedPage.replaceChildren();
        return;
      }
      receiptStatus = view === 'pending' ? 'processing' : view;
      clonedPage.style.background = document.defaultView?.getComputedStyle(document.body).background || '#fff';
      clonedPage.style.minHeight = '0';

      const note = document.createElement('aside');
      note.className = 'checkout-status-detail';
      const heading = document.createElement('strong');
      heading.textContent = options.noticeTitle;
      const description = document.createElement('p');
      description.textContent = options.notices[receiptStatus];
      note.append(heading, description);
      result.append(note);
    },
  }).finally(() => fontMetricsStyle.remove());
  if (!receiptStatus) {
    throw new Error('Checkout result is unavailable');
  }

  const pageWidth = canvas.width / CAPTURE_SCALE;
  const pageHeight = canvas.height / CAPTURE_SCALE;
  const pdf = new jsPDF({
    orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
    unit: 'px',
    format: [pageWidth, pageHeight],
    hotfixes: ['px_scaling'],
    compress: true,
  });
  pdf.setProperties({ title: options.title, author: options.brandName, creator: options.brandName });
  pdf.addImage(canvas, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
  pdf.save(`Vexra-Receipt-${options.orderReference}-${receiptStatus}.pdf`);
}
