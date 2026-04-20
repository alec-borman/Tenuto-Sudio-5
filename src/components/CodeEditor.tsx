import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
}

export default function CodeEditor({ code, onChange }: CodeEditorProps) {
  return (
    <Editor
      height="100%"
      defaultLanguage="tenuto"
      theme="vs-dark"
      value={code}
      onChange={(val) => {
        if (val !== undefined) {
          onChange(val);
        }
      }}
      options={{
        minimap: { enabled: false },
        wordWrap: 'on',
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', monospace",
        padding: { top: 16 }
      }}
    />
  );
}
