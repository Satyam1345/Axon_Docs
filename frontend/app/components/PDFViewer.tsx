"use client";

import React, { useEffect, useRef } from 'react';

// --- Type Definitions for Adobe's View SDK ---
// This provides more specific types than 'any' to satisfy TypeScript.
interface AdobeViewer {
  getAPIs: () => Promise<{ gotoLocation: (page: number) => void;[key: string]: any; }>;
  previewFile: (config: any, viewerConfig: any) => Promise<any>;
}

interface AdobeDC {
  View: new (config: { clientId: string; divId: string }) => AdobeViewer;
}

// Extend the Window interface to include the AdobeDC object
declare global {
  interface Window {
    AdobeDC?: AdobeDC;
  }
}

// --- Component Props ---
interface PDFViewerProps {
  docUrl: string;
  pageNumber: number;
}

const AdobePDFViewer: React.FC<PDFViewerProps> = ({ docUrl, pageNumber }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const adobeApiRef = useRef<AdobeViewer | null>(null);

  useEffect(() => {
    if (!docUrl) return;

    // IMPORTANT: Replace with your actual Adobe PDF Embed API Client ID
    const ADOBE_CLIENT_ID = "ebb174b7782440a9a445ff7c27fefbd9";

    // Function to initialize the viewer once the SDK is ready
    const initializeViewer = () => {
      if (window.AdobeDC && viewerRef.current) {
        const adobeDCView = new window.AdobeDC.View({
          clientId: ADOBE_CLIENT_ID,
          divId: viewerRef.current.id,
        });

        const previewFilePromise = adobeDCView.previewFile(
          {
            content: { location: { url: docUrl } },
            metaData: { fileName: docUrl.split('/').pop() },
          },
          {
            embedMode: 'SIZED_CONTAINER',
            showFullScreen: false,
            showDownloadPDF: false,
            showPrintPDF: false,
            showAnnotationTools: false,
          }
        );
        previewFilePromise.then((adobeViewer) => {
          adobeApiRef.current = adobeViewer;
        });
      }
    };
    
    // If the SDK is already ready, initialize the viewer
    if (window.AdobeDC) {
      initializeViewer();
    } else {
      // Otherwise, add the event listener for when the SDK becomes ready
      document.addEventListener('adobe_dc_view_sdk.ready', initializeViewer);
    }
    
    // Load the Adobe script if it's not already on the page
    if (!document.querySelector('script[src="https://acrobatservices.adobe.com/view-sdk/viewer.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://acrobatservices.adobe.com/view-sdk/viewer.js';
      script.async = true;
      document.body.appendChild(script);
    }

    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener('adobe_dc_view_sdk.ready', initializeViewer);
    };
  }, [docUrl]);

  // Effect to handle page navigation
  useEffect(() => {
    if (adobeApiRef.current && pageNumber) {
      adobeApiRef.current.getAPIs().then((apis) => {
        apis.gotoLocation(pageNumber);
      });
    }
  }, [pageNumber]);

  return (
    <div className="h-full w-full bg-slate-950">
      <div id="adobe-pdf-viewer-container" ref={viewerRef} className="h-full w-full" />
    </div>
  );
};

export default AdobePDFViewer;
