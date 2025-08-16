"use client";
import { useEffect, useRef } from "react";

// Replace with your Adobe PDF Embed API Client ID
const ADOBE_CLIENT_ID = process.env.NEXT_PUBLIC_ADOBE_EMBED_CLIENT_ID || "<YOUR_CLIENT_ID_HERE>";
console.log("[Adobe PDF Embed] Adobe Client ID:", ADOBE_CLIENT_ID);
function AdobePDFViewer({ docUrl }) {
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!docUrl || !viewerRef.current) return;

    // Remove any previous viewer instance
    viewerRef.current.innerHTML = "";


    // Dynamically load the Adobe Embed API script if not already loaded
    const scriptId = "adobe-pdf-embed-api";
    const existingScript = document.getElementById(scriptId);
    function waitForAdobeDCAndRender(retries = 20) {
      if (window.AdobeDC) {
        console.log("[Adobe PDF Embed] AdobeDC available. Rendering PDF...");
        renderPDF();
      } else if (retries > 0) {
        setTimeout(() => waitForAdobeDCAndRender(retries - 1), 150);
      } else {
        console.error("[Adobe PDF Embed] AdobeDC not available after waiting.");
      }
    }

    if (!window.AdobeDC && !existingScript) {
      console.log("[Adobe PDF Embed] Loading Adobe Embed API script...");
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://acrobatservices.adobe.com/view-sdk/viewer.js";
      script.onload = () => {
        console.log("[Adobe PDF Embed] Script loaded. Waiting for AdobeDC...");
        waitForAdobeDCAndRender();
      };
      document.body.appendChild(script);
    } else if (window.AdobeDC) {
      console.log("[Adobe PDF Embed] AdobeDC already available. Rendering PDF...");
      renderPDF();
    } else if (existingScript) {
      console.log("[Adobe PDF Embed] Script already loading. Waiting for AdobeDC...");
      existingScript.addEventListener("load", () => {
        waitForAdobeDCAndRender();
      });
    }

    function renderPDF() {
      if (!window.AdobeDC) {
        console.log("[Adobe PDF Embed] AdobeDC not available yet.");
        return;
      }
      const fileName = decodeURIComponent(docUrl.split("/").pop() || "Document.pdf");
      console.log(`[Adobe PDF Embed] Rendering PDF: ${docUrl} as ${fileName}`);
      const adobeDCView = new window.AdobeDC.View({
        clientId: ADOBE_CLIENT_ID,
        divId: "adobe-dc-view",
      });
      const previewPromise = adobeDCView.previewFile({
        content: { location: { url: docUrl } },
        metaData: { fileName },
      }, {
        embedMode: "FULL_WINDOW",
        showDownloadPDF: true,
        showPrintPDF: true,
      });
      if (previewPromise && typeof previewPromise.then === "function") {
        previewPromise.then(
          (res) => console.log("[Adobe PDF Embed] previewFile resolved:", res),
          (err) => console.error("[Adobe PDF Embed] previewFile error:", err)
        );
      }
    }

    // Clean up on unmount
    return () => {
      if (viewerRef.current) viewerRef.current.innerHTML = "";
    };
  }, [docUrl]);

  return (
    <div className="h-full w-full bg-white text-red-700">
      <div id="adobe-dc-view" ref={viewerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

export default AdobePDFViewer;
