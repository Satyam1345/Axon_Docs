"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/app/components/Header.jsx";
import Sidebar from "@/app/components/Sidebar.jsx";
import PDFViewer from "@/app/components/PDFViewer.jsx";
import { Loader2 } from 'lucide-react';
import { getHistory } from '@/app/lib/api';

export default function DashboardPage() {
  const [analysisData, setAnalysisData] = useState(null);
  const [history, setHistory] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const storedData = sessionStorage.getItem('analysisData');
      if (storedData) {
        const data = JSON.parse(storedData);
        setAnalysisData(data);
        setSelectedDoc({ url: `/pdfs/${data.documents[0]}`, page: 1 });
        sessionStorage.removeItem('analysisData');
        getHistory().then(setHistory);
        return;
      }
      try {
        const userHistory = await getHistory();
        setHistory(userHistory);
        if (userHistory.length > 0) {
          const latest = userHistory[0];
          setAnalysisData(latest.analysisData);
          setSelectedDoc({ url: `/pdfs/${latest.analysisData.documents[0]}`, page: 1 });
        } else {
          router.push('/upload');
        }
      } catch (error) {
        router.push('/upload');
      }
    };
    loadData();
  }, [router]);

  const handleSectionSelect = (doc, page) => setSelectedDoc({ url: `/pdfs/${doc}`, page });
  const handleCollectionSelect = (collection) => {
    setAnalysisData(collection.analysisData);
    setSelectedDoc({ url: `/pdfs/${collection.analysisData.documents[0]}`, page: 1 });
  };

  if (!analysisData || !selectedDoc) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <main className="flex flex-grow overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} data={analysisData} history={history} onSectionSelect={handleSectionSelect} onCollectionSelect={handleCollectionSelect} />
        <div className="flex-grow h-full">
          <PDFViewer docUrl={selectedDoc.url} pageNumber={selectedDoc.page} />
        </div>
      </main>
    </div>
  );
}
