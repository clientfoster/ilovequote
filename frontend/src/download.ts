import { getAuthToken } from './auth';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

function pickErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const message = record.message || record.error;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export async function downloadFileFromUrl(url: string, fileName: string) {
  const headers = new Headers();
  const token = getAuthToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(pickErrorMessage(payload, 'Unable to download file'));
    }

    const text = await response.text().catch(() => '');
    throw new Error(text.trim() || 'Unable to download file');
  }

  const blob = await response.blob();
  downloadBlob(blob, fileName);
}

export function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export async function downloadElementAsPdf(element: HTMLElement, fileName: string) {
  const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale,
    useCORS: true,
    allowTaint: true,
    scrollX: 0,
    scrollY: -window.scrollY,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let renderedHeight = 0;
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
  renderedHeight += pageHeight;

  while (renderedHeight < imgHeight) {
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, -(renderedHeight), imgWidth, imgHeight, undefined, 'FAST');
    renderedHeight += pageHeight;
  }

  pdf.save(fileName);
}
