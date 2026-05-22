import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Impression — Brainy Kids",
};

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            @page { margin: 15mm; size: A4 portrait; }
          }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 0; }
        `}</style>
      </head>
      <body className="bg-gray-100">
        {children}
      </body>
    </html>
  );
}