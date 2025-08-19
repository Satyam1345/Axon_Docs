"use client";
import { useEffect, useRef } from "react";
import { getRelated } from "../lib/api";
import { setApis as setViewerApis, setNumPages as setViewerNumPages, gotoPage as viewerGotoPage, hasViewer as viewerHas } from "../lib/pdfViewerApi";

// Replace with your Adobe PDF Embed API Client ID
const ADOBE_CLIENT_ID = process.env.NEXT_PUBLIC_ADOBE_EMBED_CLIENT_ID || "<YOUR_CLIENT_ID_HERE>";
// console.log("[Adobe PDF Embed] Adobe Client ID:", ADOBE_CLIENT_ID);
function AdobePDFViewer({ docUrl, pageNumber = 1 }) {
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!docUrl || !viewerRef.current) return;

    // Remove any previous viewer instance
    viewerRef.current.innerHTML = "";

    // Ensure any iframe created by the Adobe viewer has clipboard permissions
    const ensureIframePermissions = () => {
      const root = viewerRef.current;
      if (!root) return;
      const iframes = root.querySelectorAll('iframe');
      if (!iframes || !iframes.length) return;
      iframes.forEach((ifr) => {
        try {
          const allow = ifr.getAttribute('allow') || '';
          const needed = ['clipboard-read', 'clipboard-write'];
          const missing = needed.filter((t) => !allow.includes(t));
          if (missing.length) {
            const updated = (allow ? allow + '; ' : '') + missing.join('; ');
            ifr.setAttribute('allow', updated);
          }
        } catch (_) {}
      });
    };

    // Observe mutations because the iframe is created asynchronously by the SDK
    const mo = new MutationObserver(() => ensureIframePermissions());
    try {
      mo.observe(viewerRef.current, { childList: true, subtree: true });
    } catch (_) {}


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
        defaultViewMode: "FIT_PAGE", // ensure full page is visible initially
        showAnnotationTools: true,           // enable annotation tools
        showLeftHandPanel: true,            // show bookmarks/thumbnails
        showDownloadPDF: true,
        showPrintPDF: true,
      });
  // Try to set iframe permissions shortly after rendering kicks off
  setTimeout(ensureIframePermissions, 250);
      if (previewPromise && typeof previewPromise.then === "function") {
        previewPromise.then(
          (viewer) => {
            console.log("[Adobe PDF Embed] previewFile resolved (viewer):", viewer);
    ensureIframePermissions();
            // Navigate to requested page once APIs are available
            const getApisPromise = (viewer && typeof viewer.getAPIs === 'function')
              ? viewer.getAPIs()
              : (typeof adobeDCView.getAPIs === 'function' ? adobeDCView.getAPIs() : Promise.reject(new Error('getAPIs unavailable')));
            getApisPromise.then((apis) => {
                // Expose APIs to shared store for programmatic navigation
                try {
                  setViewerApis(apis);
                  // Fetch and store total pages for bounds checking
                  if (typeof apis.getPDFMetadata === 'function') {
                    apis.getPDFMetadata()
                      .then(meta => {
                        if (meta && typeof meta.numPages === 'number') {
                          setViewerNumPages(meta.numPages);
                        }
                      })
                      .catch(() => {});
                  }
                } catch (_) {}
                try {
                  const targetPage = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
                  apis.gotoLocation(targetPage);
                } catch (e) {
                  console.warn("[Adobe PDF Embed] Failed to navigate to page:", e);
                }
              }).catch(() => {});
            // Register event callbacks for user interactions
            adobeDCView.registerCallback(
              AdobeDC.View.Enum.CallbackType.TEXT_SELECTION,
              async function(event) {
                try {
                  const selected = (event && event.data && event.data.selectedText) || (event && event.selectedText) || '';
                  const text = String(selected || '').trim();
                  if (!text || text.length < 3) return;
                  console.log("[Adobe PDF Embed] Text selected:", text);
                  // Notify host app about selected text to enable top-level clipboard actions
                  try {
                    const selEvt = new CustomEvent('axon:selectedText', { detail: { text } });
                    window.dispatchEvent(selEvt);
                  } catch (_) {}
                  // Call backend to get related snippets
                  const related = await getRelated(text, 8).catch(() => null);
                  if (related && related.results) {
                    // Emit a custom event the page can listen for
                    const evt = new CustomEvent('axon:relatedResults', { detail: related });
                    window.dispatchEvent(evt);
                  }
                } catch (e) {
                  console.warn('Selection related fetch failed:', e);
                }
              },
              {}
            );
            adobeDCView.registerCallback(
              AdobeDC.View.Enum.CallbackType.ANNOTATION_ADDED,
              function(event) {
                console.log("[Adobe PDF Embed] Annotation added:", event);
              },
              {}
            );
            adobeDCView.registerCallback(
              AdobeDC.View.Enum.CallbackType.PAGE_COMPLETE,
              function(event) {
                console.log("[Adobe PDF Embed] Page loaded:", event);
              },
              {}
            );
          },
          (err) => console.error("[Adobe PDF Embed] previewFile error:", err)
        );
      }
    }

    // Clean up on unmount
    return () => {
      if (viewerRef.current) viewerRef.current.innerHTML = "";
      try { mo.disconnect(); } catch (_) {}
    };
  }, [docUrl]);

  // Respond to external page changes without reloading the viewer
  useEffect(() => {
    if (!pageNumber) return;
    let cancelled = false;
    const target = Number(pageNumber);
    let attempts = 0;
    const tryGoto = async () => {
      if (cancelled) return;
      attempts += 1;
      if (viewerHas()) {
        await viewerGotoPage(target).catch(() => {});
        return; // success or attempted; exit retry loop
      }
      if (attempts < 15) { // retry ~3s total
        setTimeout(tryGoto, 200);
      }
    };
    tryGoto();
    return () => { cancelled = true; };
  }, [pageNumber]);

  return (
    <div className="h-full w-full bg-white text-red-700">
      <div id="adobe-dc-view" ref={viewerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

export default AdobePDFViewer;
