import React from "react";

export interface PdfExportButtonProps {
  [key: string]: any;
  scans?: any;
  history?: any;
  data?: any;
  onExport?: () => void;
  className?: string;
}

export function PdfExportButton(props: PdfExportButtonProps) {
  const handleExport = () => {
    if (props && typeof props.onExport === "function") {
      props.onExport();
    }
    window.print();
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className={props?.className || "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow transition-colors flex items-center gap-2"}
    >
      Export PDF Report
    </button>
  );
}

export function exportPDFReport() {
  window.print();
}

export default PdfExportButton;
