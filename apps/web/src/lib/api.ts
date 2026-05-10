let _lineUserId: string | null = null;

export function setLineUserId(id: string): void {
  _lineUserId = id;
}

export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (_lineUserId) headers.set('x-line-user-id', _lineUserId);
  return fetch(input, { ...init, headers });
}
