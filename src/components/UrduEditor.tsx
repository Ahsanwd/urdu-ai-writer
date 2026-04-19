"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Check, X, Copy, Download, Share2, Trash2, Wand2, RefreshCw, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { convertUnicodeToInpage } from "@/lib/inpageConverter";

interface Suggestion {
  id: string;
  original: string;
  suggestion: string;
  startIndex: number;
  endIndex: number;
}

export default function UrduEditor() {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [mode, setMode] = useState<"edit" | "review">("edit");
  const [inPageText, setInPageText] = useState("");
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Load from local storage
    const saved = localStorage.getItem("urdu-text");
    if (saved) setText(saved);

    // Setup speech recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "ur-PK";

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              setText((prev) => prev + " " + transcript);
            } else {
              currentTranscript += transcript;
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
          toast.error("مائکروفون میں مسئلہ ہے (" + event.error + ")");
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("urdu-text", text);
  }, [text]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      toast.success("ریکارڈنگ بند ہو گئی");
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
          toast.success("ریکارڈنگ شروع ہو گئی");
        } catch (e) {
          toast.error("مائکروفون شروع کرنے میں مسئلہ");
        }
      } else {
        toast.error("آپ کا براؤزر اس سہولت کو سپورٹ نہیں کرتا");
      }
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCountWithSpaces = text.length;
  const charCountWithoutSpaces = text.replace(/\s+/g, "").length;

  const fixPunctuation = () => {
    let newText = text;
    // Replace English punctuation with Urdu ones
    newText = newText.replace(/,/g, '،');
    newText = newText.replace(/\?/g, '؟');
    newText = newText.replace(/\./g, '۔');
    setText(newText);
    toast.success("وقف اور رموز ٹھیک کر دیے گئے");
  };

  const correctText = async () => {
    if (!text.trim()) {
      toast.error("پہلے کچھ لکھیں");
      return;
    }
    
    setIsCorrecting(true);
    try {
      const res = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setMode("review");
        toast.success("تجاویز موصول ہوئیں");
      } else {
        toast.success("کوئی غلطی نہیں ملی!");
      }
    } catch (err) {
      toast.error("سرور سے رابطہ نہیں ہو سکا");
    } finally {
      setIsCorrecting(false);
    }
  };

  const handleAcceptSuggestion = (suggestion: Suggestion) => {
    const newText = 
      text.substring(0, suggestion.startIndex) + 
      suggestion.suggestion + 
      text.substring(suggestion.endIndex);
    
    setText(newText);
    
    // Adjust indices for remaining suggestions
    const lengthDiff = suggestion.suggestion.length - suggestion.original.length;
    const updatedSuggestions = suggestions
      .filter((s) => s.id !== suggestion.id)
      .map((s) => {
        if (s.startIndex > suggestion.startIndex) {
          return {
            ...s,
            startIndex: s.startIndex + lengthDiff,
            endIndex: s.endIndex + lengthDiff
          };
        }
        return s;
      });
      
    setSuggestions(updatedSuggestions);
    if (updatedSuggestions.length === 0) {
      setMode("edit");
      toast.success("تمام ترامیم مکمل ہو گئیں");
    }
  };

  const handleIgnoreSuggestion = (id: string) => {
    const updatedSuggestions = suggestions.filter((s) => s.id !== id);
    setSuggestions(updatedSuggestions);
    if (updatedSuggestions.length === 0) {
      setMode("edit");
    }
  };

  const convertToInPage = () => {
    if (!text.trim()) {
      toast.error("پہلے کچھ لکھیں");
      return;
    }
    const converted = convertUnicodeToInpage(text);
    setInPageText(converted);
    toast.success("ان پیج فارمیٹ میں تبدیل کر دیا گیا");
  };

  // Actions
  const copyText = () => {
    navigator.clipboard.writeText(text);
    toast.success("ٹیکسٹ کاپی ہو گیا");
  };

  const downloadText = () => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "urdu_document.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("فائل ڈاؤنلوڈ ہو گئی");
  };

  const shareText = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Urdu Document',
        text: text,
      }).catch(console.error);
    } else {
      toast.error("Sharing browser میں سپورٹڈ نہیں ہے");
    }
  };

  const clearText = () => {
    if (confirm("کیا آپ واقعی سارا ٹیکسٹ مٹانا چاہتے ہیں؟")) {
      setText("");
      setInPageText("");
      setSuggestions([]);
      setMode("edit");
      toast.success("ٹیکسٹ صاف کر دیا گیا");
    }
  };

  const renderReviewText = () => {
    if (suggestions.length === 0) return text;

    let elements = [];
    let lastIndex = 0;

    // Sort to ensure we go left-to-right (well, index 0 to length)
    const sortedSuggestions = [...suggestions].sort((a, b) => a.startIndex - b.startIndex);

    sortedSuggestions.forEach((s) => {
      // Add text before suggestion
      elements.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, s.startIndex)}</span>);
      
      // Add suggestion highlighting
      elements.push(
        <div key={`sug-${s.id}`} className="relative inline-block group">
          <span className="suggestion-highlight px-1 rounded mx-1">{text.substring(s.startIndex, s.endIndex)}</span>
          {/* Popover */}
          <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg p-2 z-10 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <p className="text-sm text-gray-500 mb-1">تجویز:</p>
            <p className="text-lg text-emerald-600 font-bold mb-2 urdu-text">{s.suggestion}</p>
            <div className="flex justify-between gap-2">
              <button onClick={() => handleAcceptSuggestion(s)} className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-1 rounded flex items-center justify-center text-sm font-sans transition-colors">
                <Check size={16} className="mr-1"/> Accept
              </button>
              <button onClick={() => handleIgnoreSuggestion(s.id)} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-1 rounded flex items-center justify-center text-sm font-sans transition-colors">
                <X size={16} className="mr-1"/> Ignore
              </button>
            </div>
          </div>
        </div>
      );
      lastIndex = s.endIndex;
    });

    elements.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);

    return <div className="p-4 w-full h-[300px] border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 overflow-auto urdu-text text-xl sm:text-2xl whitespace-pre-wrap">{elements}</div>;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        {/* Toolbar Top */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700" dir="ltr">
          <button 
            onClick={toggleRecording} 
            className={`p-2 rounded-lg flex items-center gap-2 font-sans text-sm transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'}`}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            {isRecording ? 'Stop Recording' : 'Dictate'}
          </button>
          
          <button 
            onClick={correctText} disabled={isCorrecting}
            className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 font-sans text-sm transition-colors"
          >
            {isCorrecting ? <RefreshCw size={18} className="animate-spin" /> : <Wand2 size={18} />}
            Correct Text
          </button>

          <button 
            onClick={fixPunctuation}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center gap-2 font-sans text-sm transition-colors"
          >
            <RefreshCw size={18} />
            Fix Punctuation
          </button>
          
          <div className="flex-1"></div>

          {mode === "review" && (
            <button 
              onClick={() => setMode("edit")}
              className="p-2 rounded-lg bg-yellow-100 text-yellow-800 hover:bg-yellow-200 flex items-center gap-2 font-sans text-sm transition-colors font-semibold"
            >
              <X size={18} /> Exit Review
            </button>
          )}
        </div>

        {/* Editor Area */}
        {mode === "edit" ? (
          <textarea
            className="w-full h-[300px] sm:h-[400px] p-4 bg-white dark:bg-gray-800 focus:outline-none resize-none urdu-text text-xl sm:text-2xl placeholder:opacity-50"
            placeholder="یہاں اردولکھیں یا مائیکروفون کا استعمال کریں..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          renderReviewText()
        )}

        {/* Word Count Footer */}
        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs sm:text-sm font-sans text-gray-500 font-medium" dir="ltr">
          <div>Words: {wordCount}</div>
          <div className="flex gap-4">
            <span>Chars (no space): {charCountWithoutSpaces}</span>
            <span>Chars: {charCountWithSpaces}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" dir="ltr">
        <button onClick={copyText} className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm font-sans">
          <Copy size={20} className="text-gray-600 dark:text-gray-300" />
          <span>Copy</span>
        </button>
        <button onClick={downloadText} className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm font-sans">
          <Download size={20} className="text-gray-600 dark:text-gray-300" />
          <span>Download</span>
        </button>
        <button onClick={shareText} className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm font-sans">
          <Share2 size={20} className="text-gray-600 dark:text-gray-300" />
          <span>Share</span>
        </button>
        <button onClick={clearText} className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors shadow-sm font-sans">
          <Trash2 size={20} />
          <span>Clear</span>
        </button>
      </div>

      {/* Convert to InPage Section */}
      <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4" dir="ltr">
          <div>
            <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 font-sans flex items-center gap-2">
              <FileText size={20}/>
              InPage Converter
            </h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-400 font-sans">Convert Unicode Urdu text for InPage compatibility.</p>
          </div>
          <button 
            onClick={convertToInPage}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-sans font-medium transition-colors whitespace-nowrap shadow-sm"
          >
            Convert to InPage
          </button>
        </div>

        {inPageText && (
          <div className="space-y-2" dir="ltr">
            <div className="flex justify-between items-center bg-indigo-100 dark:bg-indigo-800/50 p-2 rounded-t-lg">
              <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-200 font-sans px-2">Output (Phonetic Mapped)</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(inPageText);
                  toast.success("InPage متبادل کاپی ہو گیا");
                }}
                className="flex items-center gap-1 text-xs bg-white dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded hover:bg-indigo-50 transition-colors font-sans"
              >
                <Copy size={14} /> Copy for InPage
              </button>
            </div>
            <textarea 
              readOnly 
              className="w-full h-32 p-3 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-b-lg focus:outline-none resize-none text-left font-sans text-gray-800 dark:text-gray-200"
              value={inPageText}
            />
          </div>
        )}
      </div>

    </div>
  );
}
