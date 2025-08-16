"use client";

import React, { useEffect, useRef, useState } from 'react';
import WebViewer from '@pdftron/webviewer';

// --- Component Props ---
interface PDFViewerProps {
  docUrl: string;
  pageNumber: number;
}

// No global window script needed; we import WebViewer from the npm package

const PdfJsExpressViewer: React.FC<PDFViewerProps> = ({ docUrl, pageNumber }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const docViewerRef = useRef<any>(null);
  const [fallback, setFallback] = useState<boolean>(false);

  useEffect(() => {
    if (!docUrl || !viewerRef.current) return;

    const encodedUrl = encodeURI(docUrl);
    const LICENSE_KEY = process.env.NEXT_PUBLIC_WEBVIEWER_LICENSE_KEY || "lhtjC8RaxhywVxZsTvrC";

    const init = async () => {
      if (!viewerRef.current) return;
      try {
        const instance = await WebViewer(
          {
            // Serve assets locally from public/webviewer/lib
            path: '/webviewer/lib',
            licenseKey: LICENSE_KEY,
            initialDoc: encodedUrl,
            fullAPI: true,
          },
          viewerRef.current
        );
        instanceRef.current = instance;
        // Prefer new API; fallback to legacy
        const docViewer = instance?.Core?.documentViewer || instance?.docViewer;
        const UI = instance?.UI;
        docViewerRef.current = docViewer;

        // Hide download/print to match previous behavior
        try {
          UI?.disableElements?.(['downloadButton', 'printButton']);
        } catch {}

        // Navigate to page once the document is loaded
        const onDocLoaded = () => {
          if (pageNumber && pageNumber > 0) {
            try {
              docViewer.setCurrentPage(pageNumber);
            } catch {}
          }
        };
        if (docViewer?.addEventListener) {
          docViewer.addEventListener('documentLoaded', onDocLoaded);
        } else if (docViewer?.on) {
          docViewer.on('documentLoaded', onDocLoaded);
        }
      } catch (e) {
        console.error('WebViewer init failed:', e);
        setFallback(true);
      }
    };

    // Directly initialize; no external script tag needed when using the npm package
    init();

    // Cleanup: dispose viewer if available
    return () => {
      try {
        // Prefer UI.dispose when available
        if (instanceRef.current?.UI?.dispose) {
          instanceRef.current.UI.dispose();
        } else if (instanceRef.current?.dispose) {
          instanceRef.current.dispose();
        }
      } catch {}
      instanceRef.current = null;
      docViewerRef.current = null;
    };
    // Re-init when docUrl changes only
  }, [docUrl]);

  // Handle page updates after init
  useEffect(() => {
    if (docViewerRef.current && pageNumber && pageNumber > 0) {
      try {
        docViewerRef.current.setCurrentPage(pageNumber);
      } catch {}
    }
  }, [pageNumber]);

  return (
    <div className="h-full w-full bg-slate-950">
      {fallback ? (
        <iframe
          src={docUrl}
          title="PDF Preview"
          className="h-full w-full border-0 bg-white"
        />
      ) : (
        <div id="pdfjs-express-viewer" ref={viewerRef} className="h-full w-full" />
      )}
    </div>
  );
};

export default PdfJsExpressViewer;
