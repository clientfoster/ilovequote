import { getAuthToken } from './auth';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

const CAPTURE_MAX_WIDTH_PX = 794;
const CAPTURE_MARGIN_PT = 18;

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
  element.style.width = `${CAPTURE_MAX_WIDTH_PX}px`;
  element.style.minWidth = `${CAPTURE_MAX_WIDTH_PX}px`;
  element.style.maxWidth = `${CAPTURE_MAX_WIDTH_PX}px`;
  element.style.boxSizing = 'border-box';
  element.style.position = 'relative';
  element.style.overflow = 'visible';
  element.style.isolation = 'isolate';
}

function normalizeScrollableRegions(root: HTMLElement) {
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];

  for (const node of elements) {
    const className = node.className;
    const isTableShell = typeof className === 'string' && className.includes('quote-table-shell');
    const isHorizontalScroll = typeof className === 'string' && className.includes('overflow-x-auto');

    if (node.tagName === 'TABLE') {
      node.style.width = '100%';
      node.style.minWidth = '0';
      node.style.maxWidth = '100%';
      node.style.tableLayout = 'fixed';
      node.style.borderCollapse = 'collapse';
    }

    if (node.tagName === 'TH' || node.tagName === 'TD') {
      node.style.overflowWrap = 'anywhere';
      node.style.wordBreak = 'break-word';
      node.style.whiteSpace = 'normal';
      node.style.boxSizing = 'border-box';
      node.style.minWidth = '0';
    }

    if (isTableShell || isHorizontalScroll) {
      node.style.overflow = 'visible';
      node.style.overflowX = 'visible';
      node.style.maxWidth = '100%';
      node.style.width = '100%';
    }
  }
}

function inlineComputedStyles(source: Element, target: HTMLElement) {
  const computedStyle = window.getComputedStyle(source);

  for (const propertyName of Array.from(computedStyle)) {
    const value = computedStyle.getPropertyValue(propertyName);
    if (value) {
      target.style.setProperty(propertyName, value, computedStyle.getPropertyPriority(propertyName));
    }
  }

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);

  sourceChildren.forEach((sourceChild, index) => {
    const targetChild = targetChildren[index];
    if (targetChild instanceof HTMLElement) {
      inlineComputedStyles(sourceChild, targetChild);
    }
  });
}

function getContentBounds(root: HTMLElement) {
  const rootRect = root.getBoundingClientRect();
  const bounds = {
    right: rootRect.right,
    bottom: rootRect.bottom,
  };

  for (const node of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      bounds.right = Math.max(bounds.right, rect.right);
      bounds.bottom = Math.max(bounds.bottom, rect.bottom);
    }
  }

  return {
    width: Math.ceil(bounds.right - rootRect.left),
    height: Math.ceil(bounds.bottom - rootRect.top),
  };
}

async function waitForImages(imageElements: HTMLImageElement[]) {
  if (imageElements.length === 0) return;

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
}

async function waitForCaptureAssets(element: HTMLElement) {
  await waitForImages(Array.from(element.querySelectorAll('img')));

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
  inlineComputedStyles(element, clone);
  applyCaptureStyles(clone);
  normalizeScrollableRegions(clone);
  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  try {
    await waitForImages(Array.from(clone.querySelectorAll('img')));
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // If font loading fails, continue with the best available rendering.
      }
    }

    const contentBounds = getContentBounds(clone);
    const captureWidth = Math.ceil(Math.max(
      CAPTURE_MAX_WIDTH_PX,
      clone.scrollWidth,
      clone.offsetWidth,
      contentBounds.width,
    ));
    const captureHeight = Math.ceil(Math.max(
      clone.scrollHeight,
      clone.offsetHeight,
      contentBounds.height,
    ));
    const deviceScale = window.devicePixelRatio || 1;
    const maxCanvasPixels = 16_000_000;
    const boundedScale = Math.sqrt(maxCanvasPixels / Math.max(1, captureWidth * captureHeight));
    const scale = Math.max(1, Math.min(2, deviceScale, boundedScale));
    return await html2canvas(clone, {
      backgroundColor: '#ffffff',
      scale,
      useCORS: true,
      allowTaint: false,
      imageTimeout: 15_000,
      scrollX: 0,
      scrollY: 0,
      windowWidth: captureWidth,
      windowHeight: captureHeight,
      width: captureWidth,
      height: captureHeight,
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
  const availableWidth = pageWidth - CAPTURE_MARGIN_PT * 2;
  const availableHeight = pageHeight - CAPTURE_MARGIN_PT * 2;
  const aspectRatio = canvas.width / canvas.height || 1;

  let renderWidth = availableWidth;
  let renderHeight = renderWidth / aspectRatio;

  if (renderHeight > availableHeight) {
    renderHeight = availableHeight;
    renderWidth = renderHeight * aspectRatio;
  }

  const left = (pageWidth - renderWidth) / 2;
  const top = (pageHeight - renderHeight) / 2;

  pdf.addImage(imgData, 'PNG', left, top, renderWidth, renderHeight, undefined, 'FAST');

  pdf.save(fileName);
}
