export function joinUrlPath(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

export function appendQueryParam(url: string, key: string, value?: string): string {
  if (!value) return url;
  const parsed = new URL(url);
  parsed.searchParams.set(key, value);
  return parsed.toString();
}
