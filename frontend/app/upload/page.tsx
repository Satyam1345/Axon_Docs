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
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to upload and process the collection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-slate-800 rounded-xl">
        <h1 className="text-3xl font-bold text-center">Create New Analysis</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={collectionName} onChange={(e) => setCollectionName(e.target.value)} placeholder="Collection Name" required className="w-full bg-slate-900 p-2 rounded-md"/>
          <input value={persona} onChange={(e) => setPersona(e.target.value)} placeholder="Persona" required className="w-full bg-slate-900 p-2 rounded-md"/>
          <textarea value={jobToBeDone} onChange={(e) => setJobToBeDone(e.target.value)} placeholder="Job to be Done" required className="w-full bg-slate-900 p-2 rounded-md h-20"/>
          <div className="mt-1 flex justify-center p-6 border-2 border-slate-600 border-dashed rounded-md">
              <input id="file-upload" type="file" className="sr-only" multiple accept=".pdf" onChange={handleFileChange} />
              <label htmlFor="file-upload" className="cursor-pointer text-blue-400 hover:underline">Upload PDF files</label>
          </div>
          {files.length > 0 && <ul className="text-sm text-slate-400">{files.map((f,i) => <li key={i}>{f.name}</li>)}</ul>}
          <button type="submit" disabled={isLoading} className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-slate-500">
            {isLoading ? <Loader2 className="mx-auto animate-spin"/> : 'Analyze Collection'}
          </button>
          {error && <p className="text-red-400 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}
