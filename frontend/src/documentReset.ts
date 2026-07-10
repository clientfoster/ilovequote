export const NEW_DOCUMENT_EVENT = 'ilovequote:new-document';

export type NewDocumentModule = 'quote' | 'invoice';

export type NewDocumentEventDetail = {
  module: NewDocumentModule;
};

export function dispatchNewDocumentEvent(module: NewDocumentModule) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<NewDocumentEventDetail>(NEW_DOCUMENT_EVENT, {
      detail: { module },
    }),
  );
}
