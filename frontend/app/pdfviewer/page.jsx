"use client";
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import Header from "../components/Header.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { uploadDocumentCollection } from '../lib/api';
import PdfJsExpressViewer from '../components/PDFViewer';
import { Loader2 } from 'lucide-react';
import { getHistory } from '../lib/api';

export default function PdfViewerPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const file = searchParams.get('file');
			const [analysisData, setAnalysisData] = useState(null);
			const [documents, setDocuments] = useState([]);
			const [isAdding, setIsAdding] = useState(false);
		const [isSidebarOpen, setIsSidebarOpen] = useState(true);
		const [selectedFile, setSelectedFile] = useState(file);

	useEffect(() => {
		// Try to get analysisData from sessionStorage
		const storedData = sessionStorage.getItem('analysisData');
					if (storedData) {
						const data = JSON.parse(storedData);
						setAnalysisData(data);
						setDocuments(data.documents || []);
						sessionStorage.removeItem('analysisData');
						return;
					}
	}, []);

	if (!file) return <div className="text-red-500">No PDF specified.</div>;
	const docUrl = `/pdfs/${encodeURIComponent(file)}`;

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
				<Header isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
				<main className="flex flex-grow overflow-hidden">
									<Sidebar
										isOpen={isSidebarOpen}
										documents={documents.length > 0 ? documents : [file]}
										onPdfSelect={handlePdfSelect}
										selectedPdf={selectedFile}
										onAddFiles={handleAddFiles}
										isAdding={isAdding}  // indicate processing state
									/>
					<div className="flex-grow h-full p-4">
						<div className="border border-red-700 bg-white h-full">
							<PdfJsExpressViewer docUrl={docUrl} />
						</div>
					</div>
				</main>
			</div>
		);
}
