"use client";
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import Header from "../components/Header.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { uploadDocumentCollection, getLatestOutput } from '../lib/api';
import { getRelated } from '../lib/api';
import PdfJsExpressViewer from '../components/PDFViewer';
import PodcastSidebar from "../components/PodcastSidebar";
import InsightsSidebar from "../components/InsightsSidebar";
import { Loader2, X } from 'lucide-react';
import { getHistory } from '../lib/api';

export default function PdfViewerPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const file = searchParams.get('file');
	const pageParam = Number(searchParams.get('page')) || 1;
			const [analysisData, setAnalysisData] = useState(null);
			const [documents, setDocuments] = useState([]);
			const [isAdding, setIsAdding] = useState(false);
		const [isSidebarOpen, setIsSidebarOpen] = useState(true);
		const [isPodcastSidebarOpen, setIsPodcastSidebarOpen] = useState(false);
		const [isInsightsSidebarOpen, setIsInsightsSidebarOpen] = useState(false);
		const [selectedFile, setSelectedFile] = useState(file);
	const [selectedPage, setSelectedPage] = useState(pageParam);
	const [isBottomOpen, setIsBottomOpen] = useState(true);
	const [related, setRelated] = useState(null);
	const [lastSelectedText, setLastSelectedText] = useState('');
	const [showCopy, setShowCopy] = useState(false);
	const [queryText, setQueryText] = useState('');
	const [relatedLoading, setRelatedLoading] = useState(false);

	// Listen for related results from PDF selection
	useEffect(() => {
		function onRelated(e) {
			setRelated(e.detail);
		}
		window.addEventListener('axon:relatedResults', onRelated);
		function onSelected(e) {
			const text = (e && e.detail && e.detail.text) || '';
			setLastSelectedText(text);
			setShowCopy(!!text);
			if (text) setQueryText(text);
		}
		window.addEventListener('axon:selectedText', onSelected);
		return () => window.removeEventListener('axon:relatedResults', onRelated);
	}, []);

	const runRelatedSearch = async () => {
		const text = String(queryText || '').trim();
		if (!text || text.length < 3) return;
		setRelatedLoading(true);
		try {
			const resp = await getRelated(text, 20);
			setRelated(resp || { results: [] });
		} catch (e) {
			console.warn('Related search failed:', e);
			setRelated({ results: [] });
		} finally {
			setRelatedLoading(false);
		}
	};

	const handleCopySelected = async () => {
		const text = String(lastSelectedText || '').trim();
		if (!text) return;
		try {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(text);
			} else {
				// Fallback to hidden textarea
				const ta = document.createElement('textarea');
				ta.value = text;
				ta.style.position = 'fixed';
				ta.style.left = '-9999px';
				document.body.appendChild(ta);
				ta.focus();
				ta.select();
				document.execCommand('copy');
				document.body.removeChild(ta);
			}
		} catch (e) {
			console.warn('Top-level copy failed:', e);
		} finally {
			setShowCopy(false);
		}
	};

	const groupedRelated = useMemo(() => {
		const out = { similar: [], contradictory: [], extends: [], problems: [] };
		if (!related || !Array.isArray(related.results)) return out;
		for (const r of related.results) {
			const key = r.relation || 'similar';
			(out[key] || out.similar).push(r);
		}
		return out;
	}, [related]);

	useEffect(() => {
		// Try to get analysisData from sessionStorage
		const storedData = sessionStorage.getItem('analysisData');
					if (storedData) {
						const data = JSON.parse(storedData);
						const docs = (data && data.metadata && data.metadata.input_documents) || data.documents || [];
						setAnalysisData(data);
						setDocuments(docs);
						sessionStorage.removeItem('analysisData');
						return;
					}

		// Fallback: fetch latest output from backend
		getLatestOutput()
			.then((data) => {
				if (!data) return;
				const docs = (data && data.metadata && data.metadata.input_documents) || [];
				setAnalysisData(data);
				setDocuments(docs);
			})
			.catch(() => {});
	}, []);

	if (!file) return <div className="text-red-500">No PDF specified.</div>;
		const docUrl = `/pdfs/${encodeURIComponent(file)}`;

		// Normalize helper: decode, lowercase, trim, strip optional .pdf suffix
		const normalizeName = (name) => {
			if (!name) return "";
			const decoded = decodeURIComponent(String(name)).trim().toLowerCase();
			return decoded.endsWith('.pdf') ? decoded.slice(0, -4) : decoded;
		};

		// Handler to switch PDFs by updating the query param
			const handlePdfSelect = (pdfName) => {
				if (pdfName && pdfName !== selectedFile) {
					setSelectedFile(pdfName);
					router.replace(`/pdfviewer?file=${encodeURIComponent(pdfName)}`);
				}
			};
				const handleAddFiles = async (files) => {
					if (!analysisData) return;
					setIsAdding(true);
					try {
						// process new files through backend
						const newData = await uploadDocumentCollection(
							files,
							analysisData.collectionName,
							analysisData.personaRole,
							analysisData.jobTask
						);
						setAnalysisData(newData);
						setDocuments(newData.documents || []);
						// if first file of newData differs, navigate to it
						if (newData.documents && newData.documents.length) {
							const latest = newData.documents[newData.documents.length - 1];
							router.replace(`/pdfviewer?file=${encodeURIComponent(latest)}`);
						}
					} catch (err) {
						console.error('Error adding files:', err);
					} finally {
						setIsAdding(false);
					}
				};

		return (
			<div className="flex flex-col h-screen bg-white text-red-700">
				<Header 
					isSidebarOpen={isSidebarOpen} 
					toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
					onTogglePodcast={() => {
						setIsPodcastSidebarOpen((prev) => {
							const next = !prev;
							if (next) setIsInsightsSidebarOpen(false);
							return next;
						});
					}}
					onToggleInsights={() => {
						setIsInsightsSidebarOpen((prev) => {
							const next = !prev;
							if (next) setIsPodcastSidebarOpen(false);
							return next;
						});
					}}
					onToggleBottom={() => setIsBottomOpen((v) => !v)}
					isBottomOpen={isBottomOpen}
				/>
				<main className="flex flex-grow overflow-hidden">
									<Sidebar
										isOpen={isSidebarOpen}
										documents={documents.length > 0 ? documents : [file]}
										onPdfSelect={handlePdfSelect}
										selectedPdf={selectedFile}
										onAddFiles={handleAddFiles}
										isAdding={isAdding}  // indicate processing state
									/>
					<div className="relative flex-grow h-full min-h-0 p-4 flex flex-col">
						<div className="border border-red-700 bg-white flex-none" style={{ height: isBottomOpen ? '68%' : '93%' }}>
							<PdfJsExpressViewer docUrl={docUrl} pageNumber={selectedPage} />
							{showCopy && (
								<div className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-red-700 text-white px-3 py-1.5 rounded shadow">
									<span className="text-xs max-w-[40vw] truncate" title={lastSelectedText}>Copy selected</span>
									<button onClick={handleCopySelected} className="text-xs font-semibold underline">Copy</button>
									<button onClick={() => setShowCopy(false)} className="text-xs">×</button>
								</div>
							)}
						</div>
												{isBottomOpen ? (
												<div className="mt-2 h-[32%] flex flex-col min-h-0 bg-red-50/70 backdrop-blur-sm border border-red-300/70 rounded-md p-2 shadow-lg">
														<div className="grid grid-cols-3 items-center mb-2 flex-none">
																<div />
																<h2 className="font-bold text-center">Highlighted Sections & Subsection Analysis</h2>
																<div className="flex justify-end">
																	<button
																		onClick={() => setIsBottomOpen(false)}
																		className="p-1 rounded hover:bg-red-100"
																		aria-label="Close highlights and subsection analysis"
																	>
																		<X size={16} />
																	</button>
																</div>
														</div>
														<div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
								{/* Left column: Highlighted Sections */}
																<div className="h-full min-h-0 overflow-y-auto">
									<h2 className="font-bold mb-2">Highlighted Sections</h2>
									<ul className="space-y-2">
										{((analysisData && (analysisData.extracted_sections || analysisData.highlightedSections)) || [])
											.sort((a, b) => (a.importance_rank || 0) - (b.importance_rank || 0))
											.map((s) => (
												<li key={`${s.document}-${s.page_number}-${s.importance_rank}`}>
													<button className="w-full text-left p-3 rounded-md border border-red-300/80 bg-red-50/90 backdrop-blur-sm shadow-md hover:shadow-lg hover:bg-red-100/90 transition cursor-pointer" onClick={() => {
														const targetPage = Number(s.page_number) || 1;
														setSelectedPage(targetPage);
														if (s.document !== selectedFile) {
															setSelectedFile(s.document);
															// Preserve page in URL so the viewer effect can navigate when ready
															router.replace(`/pdfviewer?file=${encodeURIComponent(s.document)}&page=${targetPage}`);
														}
													}}>
														<div className="text-xs text-gray-500">Rank #{s.importance_rank} • {s.document}{String(s.document).toLowerCase().endsWith('.pdf') ? '' : '.pdf'} • Page {s.page_number}</div>
														<div className="text-sm font-medium line-clamp-2">{s.section_title}</div>
													</button>
												</li>
											))}
									</ul>
								</div>
								{/* Middle column: Subsection Analysis */}
														<div className="h-full min-h-0 overflow-y-auto">
									{(() => {
										const allSubs = Array.isArray(analysisData?.subsection_analysis) ? analysisData.subsection_analysis : [];
										const currentDoc = normalizeName(selectedFile || file);
										const perDoc = allSubs.filter((x) => normalizeName(x.document) === currentDoc);
										const items = (perDoc.length ? perDoc : allSubs).slice(0, 100); // cap to avoid heavy DOM
										return items.length ? (
											<>
												<h3 className="font-semibold mb-2">Subsection Analysis{perDoc.length ? '' : ' (all documents)'} </h3>
												<ul className="space-y-2">
													{items.map((x, idx) => (
														<li key={`sub-${idx}`} className="text-xs text-gray-700 p-3 rounded-md border border-red-300/80 bg-red-50/90 backdrop-blur-sm shadow-md">
															<div className="text-gray-500">{x.document}{String(x.document).toLowerCase().endsWith('.pdf') ? '' : '.pdf'} • Page {x.page_number}</div>
																<div className="mt-1 whitespace-pre-wrap break-words">{x.refined_text}</div>
														</li>
													))}
												</ul>
											</>
										) : (
											<>
												<h3 className="font-semibold mb-2">Subsection Analysis</h3>
												<div className="text-xs text-gray-500">No items available.</div>
											</>
										);
									})()}
								</div>
								{/* Right column: Related Findings */}
								<div className="h-full min-h-0 overflow-y-auto">
									<h3 className="font-semibold mb-2">Related Findings</h3>
								<div className="mb-3 p-2 border border-red-300/80 bg-white rounded">
									<label className="block text-xs text-gray-600 mb-1">Paste text and click Search</label>
									<textarea
										value={queryText}
										onChange={(e) => setQueryText(e.target.value)}
										rows={3}
										className="w-full text-xs p-2 border border-red-200 rounded focus:outline-none focus:ring-1 focus:ring-red-400"
										placeholder="Paste the paragraph or query here..."
									/>
									<div className="mt-2 flex items-center gap-2">
										<button
											onClick={runRelatedSearch}
											disabled={relatedLoading || !queryText.trim()}
											className={`px-3 py-1.5 text-xs rounded border ${relatedLoading || !queryText.trim() ? 'bg-red-200 text-white border-red-200' : 'bg-red-600 text-white border-red-600 hover:bg-red-700'}`}
										>
											{relatedLoading ? 'Searching…' : 'Search'}
										</button>
										{!!related && Array.isArray(related.results) && (
											<span className="text-[11px] text-gray-600">{related.results.length} results</span>
										)}
									</div>
								</div>
									{related && related.results && related.results.length ? (
										<div className="space-y-4 text-xs">
											{['similar','contradictory','extends','problems']
												.filter((k) => (groupedRelated[k] || []).length > 0)
												.map((k) => (
													<div key={k}>
														<div className="text-red-700 font-medium capitalize">{k}</div>
														<ul className="space-y-2 mt-1">
															{(groupedRelated[k] || []).slice(0,3).map((r, idx) => (
																<li key={k+idx}>
																	<button
																		className="w-full text-left p-3 rounded-md border border-red-300/80 bg-red-50/90 backdrop-blur-sm shadow-md hover:shadow-lg hover:bg-red-100/90 transition cursor-pointer"
																		onClick={() => {
																			const targetPage = Number(r.page_number) || 1;
																			setSelectedPage(targetPage);
																			if (r.document && r.document !== selectedFile) {
																				setSelectedFile(r.document);
																				router.replace(`/pdfviewer?file=${encodeURIComponent(r.document)}&page=${targetPage}`);
																			}
																		}}
																	>
																		<div className="text-gray-500">{r.document}{String(r.document).toLowerCase().endsWith('.pdf') ? '' : '.pdf'} • Page {r.page_number}</div>
																		<div className="mt-1 whitespace-pre-wrap break-words">{r.snippet}</div>
																	</button>
																</li>
															))}
														</ul>
													</div>
												))}
											{['similar','contradictory','extends','problems'].every((k) => (groupedRelated[k] || []).length === 0) && (
												<div className="text-gray-500">No related items found.</div>
											)}
										</div>
									) : (
										<div className="text-gray-500 text-xs">Paste text above and click Search to see related findings across your papers.</div>
									)}
								</div>
																					</div>
																			</div>
																									) : (
																										<div className="absolute left-4 right-4 bottom-4 h-8 flex items-center justify-center md:justify-between px-3 bg-red-50 border border-red-200 text-red-700 rounded cursor-pointer shadow"
																												 onClick={() => setIsBottomOpen(true)}
																												 aria-label="Show highlights and subsection analysis">
																											<span className="text-xs font-medium">Highlighted Section & Sub-Section Analysis</span>
																										</div>
																									)}
					</div>
					<PodcastSidebar 
						isOpen={isPodcastSidebarOpen} 
						onClose={() => setIsPodcastSidebarOpen(false)} 
					/>
					<InsightsSidebar 
						isOpen={isInsightsSidebarOpen} 
						onClose={() => setIsInsightsSidebarOpen(false)} 
					/>
				</main>
			</div>
		);
}
