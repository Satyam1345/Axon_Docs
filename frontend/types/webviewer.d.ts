declare module '@pdftron/webviewer' {
  interface WebViewerOptions {
    path?: string;
    licenseKey?: string;
    initialDoc?: string | ArrayBuffer;
    fullAPI?: boolean;
    [key: string]: any;
  }
  type WebViewerInstance = any;
  function WebViewer(options: WebViewerOptions, element: HTMLDivElement): Promise<WebViewerInstance> | WebViewerInstance;
  export default WebViewer;
}
