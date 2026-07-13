const LINE_RECIPIENT_STORAGE_KEY = 'jass.lineRecipientId';

export function captureLineRecipientFromUrl(): void {
  const url = new URL(window.location.href);
  const lineUserId = url.searchParams.get('lineUserId')?.trim();

  if (!lineUserId) return;

  sessionStorage.setItem(LINE_RECIPIENT_STORAGE_KEY, lineUserId);
  url.searchParams.delete('lineUserId');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function getLineRecipientId(): string | null {
  return sessionStorage.getItem(LINE_RECIPIENT_STORAGE_KEY);
}

export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const lineRecipientId = getLineRecipientId();
  if (!lineRecipientId) return fetch(input, init);

  const headers = new Headers(init?.headers);
  headers.set('x-line-recipient-id', lineRecipientId);
  return fetch(input, { ...init, headers });
}
