import React from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
}

export default function CodeEditor({ code, onChange }: CodeEditorProps) {
  return (
    <textarea
      aria-label="Tenuto Source Editor"
      value={code}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-full bg-slate-900 text-slate-200 font-mono text-sm p-4 outline-none border-none resize-none"
      spellCheck={false}
    />
  );
}
