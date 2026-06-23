"use client";

export default function PrintButton() {
  return (
    <div className="mt-12 text-center print:hidden">
      <button 
        onClick={() => window.print()}
        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition-colors"
      >
        Print / Save as PDF
      </button>
    </div>
  );
}
