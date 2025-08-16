"use client"
import React, { useEffect, useRef, useState } from 'react';
import WebViewer from '@pdftron/webviewer';

function PdfJsExpressViewer(props) {
  const { docUrl, pageNumber } = props;
  const viewerRef = useRef(null);
  const instanceRef = useRef(null);
  const docViewerRef = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!docUrl || !viewerRef.current) return;

    const encodedUrl = encodeURI(docUrl);
    const LICENSE_KEY = process.env.NEXT_PUBLIC_WEBVIEWER_LICENSE_KEY || "lhtjC8RaxhywVxZsTvrC";

    const init = async () => {
      if (!viewerRef.current) return;
      try {
        const instance = await WebViewer(
          {
            path: '/webviewer/lib',
            licenseKey: LICENSE_KEY,
            initialDoc: encodedUrl,
            fullAPI: true,
          },
          viewerRef.current
        );
        instanceRef.current = instance;
        const docViewer = instance && instance.Core && instance.Core.documentViewer ? instance.Core.documentViewer : instance.docViewer;
        const UI = instance.UI;
        docViewerRef.current = docViewer;
        try {
          if (UI && UI.disableElements) UI.disableElements(['downloadButton', 'printButton']);
        } catch {}
        const onDocLoaded = () => {
          if (pageNumber && pageNumber > 0) {
            try {
              docViewer.setCurrentPage(pageNumber);
            } catch {}
          }
        };
        if (docViewer && docViewer.addEventListener) {
          docViewer.addEventListener('documentLoaded', onDocLoaded);
        } else if (docViewer && docViewer.on) {
          docViewer.on('documentLoaded', onDocLoaded);
        }
      } catch (e) {
        console.error('WebViewer init failed:', e);
        setFallback(true);
      }
    };
    init();
    return () => {
      try {
        if (instanceRef.current && instanceRef.current.UI && instanceRef.current.UI.dispose) {
          instanceRef.current.UI.dispose();
        } else if (instanceRef.current && instanceRef.current.dispose) {
          instanceRef.current.dispose();
        }
      } catch {}
      instanceRef.current = null;
      docViewerRef.current = null;
    };
  }, [docUrl]);

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
}

export default PdfJsExpressViewer;
