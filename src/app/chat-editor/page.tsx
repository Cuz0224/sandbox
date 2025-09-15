"use client";

import React from 'react';
import ChatComponentEditor from '@/components/AI/ChatComponentEditor';

export default function ChatEditorPage() {
  return (
    <div className="h-screen">
      <ChatComponentEditor 
        projectId="chat-editor-project"
        onFilesGenerated={(files) => {
          console.log('文件已生成:', files);
        }}
        onPreview={() => {
          console.log('预览已启动');
        }}
      />
    </div>
  );
}
