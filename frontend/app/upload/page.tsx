// app/upload/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import { uploadDocumentCollection } from '@/app/lib/api';

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [collectionName, setCollectionName] = useState('');
  const [persona, setPersona] = useState('Undergraduate Chemistry Student');
  const [jobToBeDone, setJobToBeDone] = useState('Identify key concepts for exam preparation');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please select at least one PDF file.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const analysisData = await uploadDocumentCollection(files, collectionName, persona, jobToBeDone);
      sessionStorage.setItem('analysisData', JSON.stringify(analysisData));
      // Redirect to PDF viewer for the first uploaded file
      if (files.length > 0) {
        router.push(`/pdfviewer?file=${encodeURIComponent(files[0].name)}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Failed to upload and process the collection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-slate-800 rounded-xl">
        <h1 className="text-3xl font-bold text-center text-red-700">Create New Analysis</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={collectionName} onChange={(e) => setCollectionName(e.target.value)} placeholder="Collection Name" required className="w-full bg-red-100 p-2 rounded-md border border-red-700 text-red-700"/>
          <input value={persona} onChange={(e) => setPersona(e.target.value)} placeholder="Persona" required className="w-full bg-red-100 p-2 rounded-md border border-red-700 text-red-700"/>
          <textarea value={jobToBeDone} onChange={(e) => setJobToBeDone(e.target.value)} placeholder="Job to be Done" required className="w-full bg-red-100 p-2 rounded-md border border-red-700 text-red-700 h-20"/>
          <div className="mt-1 flex justify-center p-6 border-2 border-slate-600 border-dashed rounded-md">
              <input id="file-upload" type="file" className="sr-only" multiple accept=".pdf" onChange={handleFileChange} />
              <label htmlFor="file-upload" className="cursor-pointer text-red-700 hover:underline">Upload PDF files</label>
          </div>
          {files.length > 0 && <ul className="text-sm text-red-700">{files.map((f,i) => <li key={i}>{f.name}</li>)}</ul>}
          <button type="submit" disabled={isLoading} className="w-full py-2 bg-red-700 hover:bg-red-800 rounded-md disabled:bg-red-200">
            {isLoading ? <Loader2 className="mx-auto animate-spin"/> : 'Analyze Collection'}
          </button>
          {error && <p className="text-red-700 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}
