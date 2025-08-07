"use client";

import { useState } from 'react';
import Header from "@/app/components/Header";
import Sidebar from "@/app/components/Sidebar";
import PDFViewer from "@/app/components/PDFViewer";
import { mockAnalysisData } from "@/app/lib/mock-data";

interface SelectedDocState {
  url: string;
  page: number;
}

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [selectedDoc, setSelectedDoc] = useState<SelectedDocState>({
    url: `/pdfs/${mockAnalysisData.documents[0]}`,
    page: 1,
  });

  const handleSectionSelect = (doc: string, page: number) => {
    setSelectedDoc({
      url: `/pdfs/${doc}`,
      page: page,
    });
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-slate-900 text-white">
      <Header 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      <main className="flex flex-grow overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          data={mockAnalysisData}
          onSectionSelect={handleSectionSelect}
        />
        <div className="flex-grow h-full">
          <PDFViewer 
            docUrl={selectedDoc.url}
            pageNumber={selectedDoc.page}
          />
        </div>
      </main>
    </div>
  );
}
