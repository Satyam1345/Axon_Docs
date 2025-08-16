"use client";
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from "../components/Header.jsx";
import Sidebar from "../components/Sidebar.jsx";
import PdfJsExpressViewer from '../components/PDFViewer';
import { Loader2 } from 'lucide-react';
import { getHistory } from '../lib/api';

export default function PdfViewerPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const file = searchParams.get('file');
	const [analysisData, setAnalysisData] = useState(null);
	const [history, setHistory] = useState([]);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);

	useEffect(() => {
		// Try to get analysisData from sessionStorage
		const storedData = sessionStorage.getItem('analysisData');
		if (storedData) {
			const data = JSON.parse(storedData);
			setAnalysisData(data);
			sessionStorage.removeItem('analysisData');
			getHistory().then(setHistory);
			return;
		}
		// Fallback: try to get history
		getHistory().then(userHistory => {
			setHistory(userHistory);
			if (userHistory.length > 0) {
				setAnalysisData(userHistory[0].analysisData);
			}
		});
	}, []);

	if (!file) return <div className="text-red-500">No PDF specified.</div>;
	const docUrl = `/pdfs/${encodeURIComponent(file)}`;

	return (
		<div className="flex flex-col h-screen">
			<Header isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
			<main className="flex flex-grow overflow-hidden">
				<Sidebar isOpen={isSidebarOpen} data={analysisData || { collectionName: file }} history={history} onSectionSelect={() => {}} onCollectionSelect={() => {}} />
				<div className="flex-grow h-full">
					<PdfJsExpressViewer docUrl={docUrl} />
				</div>
			</main>
		</div>
	);
}
