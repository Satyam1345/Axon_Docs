// app/dashboard/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/app/components/Header";
import Sidebar from "@/app/components/Sidebar";
import PDFViewer from "@/app/components/PDFViewer";
import { AnalysisData } from '@/app/types';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { getHistory } from '@/app/lib/api';

export default function DashboardPage() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [selectedDoc, setSelectedDoc] = useState<{ url: string; page: number } | null>(null);
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated) {
        const storedData = sessionStorage.getItem('analysisData');
        if (storedData) {
          const data: AnalysisData = JSON.parse(storedData);
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
      }
    };
    if(!loading && isAuthenticated) loadData();
  }, [isAuthenticated, loading, router]);

  const handleSectionSelect = (doc: string, page: number) => setSelectedDoc({ url: `/pdfs/${doc}`, page });
  const handleCollectionSelect = (collection: any) => {
    setAnalysisData(collection.analysisData);
    setSelectedDoc({ url: `/pdfs/${collection.analysisData.documents[0]}`, page: 1 });
  };

  if (loading || !isAuthenticated || !analysisData || !selectedDoc) {
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
