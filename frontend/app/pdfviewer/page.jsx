"use client";
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import Header from "../components/Header.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { uploadDocumentCollection, getLatestOutput } from '../lib/api';
import PdfJsExpressViewer from '../components/PDFViewer';
import PodcastSidebar from "../components/PodcastSidebar";
import InsightsSidebar from "../components/InsightsSidebar";
import { Loader2, X } from 'lucide-react';
import { getHistory } from '../lib/api';

export default function PdfViewerPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const file = searchParams.get('file');
			const [analysisData, setAnalysisData] = useState(null);
			const [documents, setDocuments] = useState([]);
			const [isAdding, setIsAdding] = useState(false);
		const [isSidebarOpen, setIsSidebarOpen] = useState(true);
		const [isPodcastSidebarOpen, setIsPodcastSidebarOpen] = useState(false);
		const [isInsightsSidebarOpen, setIsInsightsSidebarOpen] = useState(false);
		const [selectedFile, setSelectedFile] = useState(file);
		const [selectedPage, setSelectedPage] = useState(1);
	const [isBottomOpen, setIsBottomOpen] = useState(true);

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
						<div className="border border-red-700 bg-white flex-none" style={{ height: isBottomOpen ? '75%' : '100%' }}>
							<PdfJsExpressViewer docUrl={docUrl} pageNumber={selectedPage} />
						</div>
												{isBottomOpen ? (
												<div className="mt-4 h-[25%] flex flex-col min-h-0">
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
														<div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
								{/* Left column: Highlighted Sections */}
																<div className="h-full min-h-0 overflow-y-auto">
									<h2 className="font-bold mb-2">Highlighted Sections</h2>
									<ul className="space-y-2">
										{((analysisData && (analysisData.extracted_sections || analysisData.highlightedSections)) || [])
											.sort((a, b) => (a.importance_rank || 0) - (b.importance_rank || 0))
											.map((s) => (
												<li key={`${s.document}-${s.page_number}-${s.importance_rank}`}>
													<button className="w-full text-left p-2 rounded hover:bg-red-100 cursor-pointer" onClick={() => {
														setSelectedPage(Number(s.page_number) || 1);
														if (s.document !== selectedFile) {
															setSelectedFile(s.document);
															router.replace(`/pdfviewer?file=${encodeURIComponent(s.document)}`);
														}
													}}>
														<div className="text-xs text-gray-500">Rank #{s.importance_rank} • {s.document}{String(s.document).toLowerCase().endsWith('.pdf') ? '' : '.pdf'} • Page {s.page_number}</div>
														<div className="text-sm font-medium line-clamp-2">{s.section_title}</div>
													</button>
												</li>
											))}
									</ul>
								</div>
								{/* Right column: Subsection Analysis */}
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
														<li key={`sub-${idx}`} className="text-xs text-gray-700">
															<div className="text-gray-500">{x.document}{String(x.document).toLowerCase().endsWith('.pdf') ? '' : '.pdf'} • Page {x.page_number}</div>
															<div className="line-clamp-3">{x.refined_text}</div>
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
																					</div>
																			</div>
																									) : (
																										<div className="absolute left-4 right-4 bottom-4 h-8 flex items-center justify-center md:justify-between px-3 bg-red-50 border border-red-200 text-red-700 rounded cursor-pointer shadow"
																												 onClick={() => setIsBottomOpen(true)}
																												 aria-label="Show highlights and subsection analysis">
																											<span className="text-xs font-medium">Show Highlights & Subsection Analysis</span>
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
