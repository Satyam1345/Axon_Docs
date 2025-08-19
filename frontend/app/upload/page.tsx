// app/upload/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { uploadDocumentCollection } from "@/app/lib/api";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [collectionName, setCollectionName] = useState("");
  const [persona, setPersona] = useState("");
  const [jobToBeDone, setJobToBeDone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("Please select at least one PDF file.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const analysisData = await uploadDocumentCollection(
        files,
        collectionName,
        persona,
        jobToBeDone
      );
      sessionStorage.setItem("analysisData", JSON.stringify(analysisData));
      sessionStorage.setItem("podcastContext", JSON.stringify({ persona, jobTask: jobToBeDone }));
      // Redirect to PDF viewer for the first uploaded file
      if (files.length > 0) {
        router.push(`/pdfviewer?file=${encodeURIComponent(files[0].name)}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Failed to upload and process the collection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-200">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-red-200 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-20 h-20 bg-red-500 rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-red-400 rounded-full animate-bounce delay-300"></div>
          <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-red-600 rounded-full animate-ping delay-700"></div>
          <div className="absolute bottom-20 right-1/3 w-8 h-8 bg-red-300 rounded-full animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          <div className="text-center">
            {/* Animated title */}
            <div className="mb-6">
              <h1 className="text-5xl md:text-6xl font-bold text-red-800 mb-2 animate-fade-in-up">
                <span className="inline-block animate-bounce-subtle delay-100">A</span>
                <span className="inline-block animate-bounce-subtle delay-200">D</span>
                <span className="inline-block animate-bounce-subtle delay-300">O</span>
                <span className="inline-block animate-bounce-subtle delay-400">B</span>
                <span className="inline-block animate-bounce-subtle delay-500">E</span>
                <span className="mx-3"></span>
                <span className="inline-block animate-bounce-subtle delay-600">P</span>
                <span className="inline-block animate-bounce-subtle delay-700">D</span>
                <span className="inline-block animate-bounce-subtle delay-800">F</span>
                <span className="mx-3"></span>
                <span className="inline-block animate-bounce-subtle delay-900">L</span>
                <span className="inline-block animate-bounce-subtle delay-1000">I</span>
                <span className="inline-block animate-bounce-subtle delay-1100">F</span>
                <span className="inline-block animate-bounce-subtle delay-1200">E</span>
              </h1>
              {/* Animated underline */}
              <div className="w-32 h-1 bg-gradient-to-r from-red-600 to-red-800 mx-auto rounded-full animate-scale-x"></div>
            </div>
            
            {/* Animated description */}
            <p className="text-xl text-red-700 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-500">
              Upload your PDF documents and let our{" "}
              <span className="font-semibold text-red-800 animate-pulse">AI-powered analysis</span>{" "}
              extract meaningful insights tailored to your specific role and objectives.
            </p>
            
            {/* Animated decorative elements */}
            <div className="mt-8 flex justify-center space-x-4 animate-fade-in-up delay-700">
              <div className="w-3 h-3 bg-red-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce delay-150"></div>
              <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce delay-300"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-red-200 overflow-hidden">
          {/* Progress Header */}
          <div className="bg-gradient-to-r from-red-700 to-red-400 px-8 py-6">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Create New Analysis Collection
            </h2>
            <p className="text-red-100">
              Step 1 of 2: Configure your document analysis parameters
            </p>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Collection Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                    Collection Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-red-800 mb-2">
                        Collection Name
                      </label>
                      <input
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        placeholder="e.g., Marketing Research Q1 2025"
                        required
                        className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-red-900 placeholder-red-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Analysis Context */}
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                    Analysis Context
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-red-800 mb-2">
                        Your Role/Persona
                      </label>
                      <textarea
                        value={persona}
                        onChange={(e) => setPersona(e.target.value)}
                        placeholder="e.g., Marketing Manager, Data Scientist"
                        required
                        className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-red-900 placeholder-red-400 resize-none overflow-y-scroll"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-red-800 mb-2">
                        Objective
                      </label>
                      <textarea
                        value={jobToBeDone}
                        onChange={(e) => setJobToBeDone(e.target.value)}
                        placeholder="What specific task are you trying to accomplish?"
                        required
                        // rows={3}
                        className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-red-900 placeholder-red-400 resize-none overflow-y-scroll"
                      />
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                    Document Upload
                  </h3>
                  <div className="border-2 border-dashed border-red-300 rounded-xl p-4 text-center hover:border-red-400 transition-colors duration-200">
                    <input
                      id="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer block"
                    >
                      <UploadCloud className="mx-auto h-12 w-12 text-red-400 mb-4" />
                      <div className="text-lg font-medium text-red-900 mb-2">
                        Click to upload PDF documents
                      </div>
                      <div className="text-sm text-red-600">
                        Support for multiple files • Analyse them in seconds 
                      </div>
                    </label>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-red-900 mb-3">
                        Uploaded Files ({files.length})
                      </h4>
                      <div className="space-y-2">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-red-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-red-600">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6 border-t border-red-200">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      Processing Documents...
                    </>
                  ) : (
                    <>
                      Start Analysis
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">AI-Powered Analysis</h3>
            <p className="text-red-700 text-sm">
              Advanced machine learning algorithms extract key insights and patterns from your documents.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Secure Processing</h3>
            <p className="text-red-700 text-sm">
              Your documents are processed securely on your local system, no data is shared with third party.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Instant Results</h3>
            <p className="text-red-700 text-sm">
              Get comprehensive analysis results and actionable insights within minutes of upload.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
