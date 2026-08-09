
export const normalizeDomain = (url: string) => {
  try {
    return new URL(url.includes('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^www\./, '');
  }
};