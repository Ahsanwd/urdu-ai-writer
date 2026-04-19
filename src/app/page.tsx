import UrduEditor from "@/components/UrduEditor";
import { PenTool } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1 w-full flex flex-col items-center">
      
      {/* Header */}
      <header className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <PenTool size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent" dir="ltr">
                Urdu AI Assistant
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-sans">Write perfect Urdu with AI</p>
            </div>
          </div>
          
          <div className="hidden sm:block text-sm text-gray-500 font-sans">
            Version 1.0 (Beta)
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full flex-1 bg-gray-50 dark:bg-gray-950 px-4 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto mb-8 text-center" dir="ltr">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Smart Urdu Editor
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Dictate, write, and correct your Urdu text seamlessly. Get instant grammar suggestions and convert your documents to InPage compatibility in one click.
          </p>
        </div>

        <UrduEditor />
      </div>

    </main>
  );
}
