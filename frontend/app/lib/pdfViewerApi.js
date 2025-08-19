// Shared store for Adobe PDF Embed viewer APIs to enable programmatic navigation
// This lets other components call gotoPage(n) or stepPages(n)

let _apis = null;
let _numPages = null;

export function setApis(apis) {
  _apis = apis;
}

export function setNumPages(n) {
  _numPages = n;
}

export function hasViewer() {
  return !!_apis;
}

export async function getCurrentPage() {
  if (!_apis || typeof _apis.getCurrentPage !== 'function') return null;
  try {
    return await _apis.getCurrentPage();
  } catch {
    return null;
  }
}

export async function gotoPage(page) {
  if (!_apis || typeof _apis.gotoLocation !== 'function') return false;
  const p = Math.max(1, Math.min(Number(page) || 1, _numPages || Number(page) || 1));
  try {
    await _apis.gotoLocation(p);
    return true;
  } catch (e) {
    console.warn('[PDFViewerAPI] gotoPage failed', e);
    return false;
  }
}

// Step forward/backward N pages. Positive N moves forward, negative moves backward.
export async function stepPages(n = 1) {
  const cur = await getCurrentPage();
  if (cur == null) return false;
  const target = cur + Number(n || 0);
  return gotoPage(target);
}
