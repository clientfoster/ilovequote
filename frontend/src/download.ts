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

function applyCaptureStyles(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const width = Math.max(320, Math.ceil(rect.width || element.offsetWidth || element.scrollWidth || 0));

  element.style.width = `${width}px`;
  element.style.minWidth = `${width}px`;
  element.style.maxWidth = `${width}px`;
  element.style.boxSizing = 'border-box';
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.style.isolation = 'isolate';
}

async function waitForCaptureAssets(element: HTMLElement) {
  const imageElements = Array.from(element.querySelectorAll('img'));

  await Promise.all(
    imageElements.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) {
        return;
      }

      if (typeof image.decode === 'function') {
        try {
          await image.decode();
          return;
        } catch {
          // Fall back to load/error listeners below.
        }
      }

      await new Promise<void>((resolve) => {
        const finish = () => resolve();
        image.addEventListener('load', finish, { once: true });
        image.addEventListener('error', finish, { once: true });
      });
    }),
  );

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // If font loading fails, continue with the best available rendering.
    }
  }
}

async function renderElementToCanvas(element: HTMLElement) {
  await waitForCaptureAssets(element);

  const sandbox = document.createElement('div');
  sandbox.setAttribute('aria-hidden', 'true');
  sandbox.style.position = 'fixed';
  sandbox.style.left = '-100000px';
  sandbox.style.top = '0';
  sandbox.style.zIndex = '-1';
  sandbox.style.pointerEvents = 'none';
  sandbox.style.background = 'transparent';
  sandbox.style.overflow = 'visible';

  const clone = element.cloneNode(true) as HTMLElement;
  applyCaptureStyles(clone);
  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  try {
    return await html2canvas(clone, {
      backgroundColor: '#ffffff',
      scale: 3,
      useCORS: true,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.max(clone.scrollWidth, clone.clientWidth),
      windowHeight: Math.max(clone.scrollHeight, clone.clientHeight),
      width: Math.max(clone.scrollWidth, clone.clientWidth),
      height: Math.max(clone.scrollHeight, clone.clientHeight),
      removeContainer: true,
      ignoreElements: (node) =>
        node instanceof HTMLElement && node.classList.contains('no-print'),
    });
  } finally {
    sandbox.remove();
  }
}

export async function downloadElementAsPdf(element: HTMLElement, fileName: string) {
  const canvas = await renderElementToCanvas(element);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const availableWidth = pageWidth - margin * 2;
  const availableHeight = pageHeight - margin * 2;
  const scale = Math.min(availableWidth / canvas.width, availableHeight / canvas.height);
  const renderWidth = canvas.width * scale;
  const renderHeight = canvas.height * scale;
  const left = (pageWidth - renderWidth) / 2;
  const top = (pageHeight - renderHeight) / 2;

  pdf.addImage(imgData, 'PNG', left, top, renderWidth, renderHeight, undefined, 'FAST');

  pdf.save(fileName);
}
