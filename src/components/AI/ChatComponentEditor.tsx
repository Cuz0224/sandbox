"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Code2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Play,
  Save,
  Download,
  Copy,
  MessageSquare,
  Edit3,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
  FileText,
  Zap,
  Sparkles
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChatComponentEditorProps {
  projectId?: string;
  onFilesGenerated?: (files: GeneratedFile[]) => void;
  onPreview?: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  files?: GeneratedFile[];
}

interface GeneratedFile {
  path: string;
  content: string;
  type: string;
  size: number;
}

interface GenerationResult {
  success: boolean;
  message: string;
  data?: {
    filesGenerated: number;
    files: GeneratedFile[];
    description: string;
    features: string[];
    dependencies: string[];
    hasConfigChanges: boolean;
    conversationId?: string;
    componentInfo?: {
      name: string;
      path: string;
      previewUrl: string;
    };
  };
  error?: string;
}

const QUICK_SUGGESTIONS = [
  '让按钮更圆润',
  '添加动画效果',
  '改变颜色主题',
  '调整布局间距',
  '添加响应式设计',
  '优化移动端显示',
  '增加交互效果',
  '调整字体大小'
];

export default function ChatComponentEditor({
  projectId = 'default-project',
  onFilesGenerated,
  onPreview
}: ChatComponentEditorProps) {
  // 对话相关状态
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: '👋 你好！我是你的AI组件编辑助手。告诉我你想要创建或修改什么组件，我会帮你生成和优化代码。',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [currentFiles, setCurrentFiles] = useState<{ [path: string]: string }>({});

  // 预览相关状态
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // 代码编辑相关状态
  const [activeFile, setActiveFile] = useState<string>('');
  const [codeContent, setCodeContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动对话
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 发送对话消息
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatting) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatting(true);

    try {
      // 添加系统消息
      const systemMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: '🤖 AI 正在分析您的需求并生成/修改组件...',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, systemMessage]);

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: chatInput,
          projectId,
          conversationId: conversationId || undefined,
          currentFiles,
          context: ''
        })
      });

      const data = await response.json();

      // 移除系统消息
      setChatMessages(prev => prev.filter(msg => msg.id !== systemMessage.id));

      if (data.success) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          type: 'ai',
          content: data.data.response,
          timestamp: new Date(),
          files: data.data.files
        };

        setChatMessages(prev => [...prev, aiMessage]);

        // 更新对话ID
        if (data.data.conversationId) {
          setConversationId(data.data.conversationId);
        }

        // 更新当前文件状态
        if (data.data.files && data.data.files.length > 0) {
          const newFiles = { ...currentFiles };
          data.data.files.forEach((file: GeneratedFile) => {
            newFiles[file.path] = file.content;
          });
          setCurrentFiles(newFiles);

          // 设置第一个文件为活动文件
          if (data.data.files[0]) {
            setActiveFile(data.data.files[0].path);
            setCodeContent(data.data.files[0].content);
          }
        }

        // 如果有组件信息，更新预览
        if (data.data.componentInfo) {
          const baseUrl = '/sandbox';
          const componentPath = data.data.componentInfo.previewUrl.startsWith('/') 
            ? data.data.componentInfo.previewUrl.substring(1) 
            : data.data.componentInfo.previewUrl;
          const baseUrlClean = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
          const finalPreviewUrl = `${baseUrlClean}/${componentPath}`;
          
          setPreviewUrl(finalPreviewUrl);
          setPreviewStatus('ready');
        }

        // 触发文件生成回调
        if (onFilesGenerated && data.data.files) {
          onFilesGenerated(data.data.files);
        }
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          type: 'ai',
          content: `❌ 处理失败: ${data.error}`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 3).toString(),
        type: 'ai',
        content: `❌ 请求失败: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatting(false);
    }
  };

  // 清空对话
  const handleClearChat = () => {
    setChatMessages([{
      id: '1',
      type: 'ai',
      content: '👋 你好！我是你的AI组件编辑助手。告诉我你想要创建或修改什么组件，我会帮你生成和优化代码。',
      timestamp: new Date()
    }]);
    setChatInput('');
    setConversationId('');
    setCurrentFiles({});
    setActiveFile('');
    setCodeContent('');
    setPreviewStatus('idle');
    setPreviewUrl('');
  };

  // 保存代码
  const handleSaveCode = async () => {
    if (!activeFile || !codeContent) return;

    try {
      const response = await fetch('/api/sandbox/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          files: {
            [activeFile]: codeContent
          }
        })
      });

      if (response.ok) {
        // 更新当前文件状态
        setCurrentFiles(prev => ({
          ...prev,
          [activeFile]: codeContent
        }));

        // 刷新预览
        if (previewStatus === 'ready') {
          setPreviewStatus('loading');
          setTimeout(() => setPreviewStatus('ready'), 1000);
        }
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 启动预览
  const handleStartPreview = async () => {
    if (!Object.keys(currentFiles).length) return;

    setPreviewStatus('loading');

    try {
      const response = await fetch('/api/sandbox/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreviewUrl(data.url || '/sandbox');
          setPreviewStatus('ready');
        }
      }
    } catch (error) {
      setPreviewStatus('error');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">AI 组件编辑器</h1>
              <p className="text-sm text-gray-500">对话式组件生成与编辑</p>
            </div>
          </div>
          
          <Badge variant="outline" className="text-sm">
            <Monitor className="w-3 h-3 mr-1" />
            项目: {projectId}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            disabled={isChatting}
            className="hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            重置
          </Button>
          
          {previewStatus === 'idle' && (
            <Button
              onClick={handleStartPreview}
              disabled={!Object.keys(currentFiles).length}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              启动预览
            </Button>
          )}
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex min-h-0">
        {/* 左侧：对话区域 */}
        <div className="w-1/3 border-r bg-white flex flex-col">
          {/* 对话头部 */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">AI 对话助手</h3>
                <p className="text-xs text-gray-500">描述您的需求</p>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              {isChatting ? '🤖 思考中...' : '✨ 准备就绪'}
            </div>
          </div>

          {/* 对话消息列表 */}
          <div 
            ref={chatRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.type === 'ai'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                  {message.files && message.files.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">📁 生成的文件：</div>
                      {message.files.map((file, index) => (
                        <div key={index} className="text-xs text-gray-500">
                          • {file.path} ({file.size} 字符)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 快捷建议 */}
          {chatMessages.length <= 1 && (
            <div className="px-4 pb-2">
              <div className="text-xs text-gray-500 mb-2">💡 快速开始：</div>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setChatInput(suggestion)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 对话输入区域 */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex space-x-2">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="描述您想要创建或修改的组件..."
                className="flex-1 resize-none text-sm"
                rows={2}
                disabled={isChatting}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChatMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendChatMessage}
                disabled={!chatInput.trim() || isChatting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {isChatting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              按 Enter 发送，Shift + Enter 换行
            </div>
          </div>
        </div>

        {/* 右侧：代码编辑和预览区域 */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="code" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                代码编辑
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                实时预览
              </TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 flex flex-col">
                {/* 文件选择器 */}
                {Object.keys(currentFiles).length > 0 && (
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">当前文件:</span>
                      <select
                        value={activeFile}
                        onChange={(e) => {
                          setActiveFile(e.target.value);
                          setCodeContent(currentFiles[e.target.value] || '');
                        }}
                        className="flex-1 max-w-xs px-3 py-1 border rounded text-sm"
                      >
                        {Object.keys(currentFiles).map((path) => (
                          <option key={path} value={path}>
                            {path}
                          </option>
                        ))}
                      </select>
                      <Button
                        onClick={handleSaveCode}
                        disabled={!activeFile || !codeContent}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        保存
                      </Button>
                    </div>
                  </div>
                )}

                {/* 代码编辑器 */}
                <div className="flex-1 p-4">
                  {activeFile ? (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{activeFile}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {codeContent.length} 字符
                          </Badge>
                          <Button
                            onClick={() => navigator.clipboard.writeText(codeContent)}
                            size="sm"
                            variant="outline"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <textarea
                        ref={codeEditorRef}
                        value={codeContent}
                        onChange={(e) => setCodeContent(e.target.value)}
                        className="w-full h-full font-mono text-sm border rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="代码将在这里显示..."
                      />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <Code2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">开始对话生成组件</h3>
                        <p className="text-gray-500 text-sm">在左侧描述您的需求，AI 会生成代码并显示在这里</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 flex flex-col">
                {/* 预览工具栏 */}
                {previewStatus === 'ready' && (
                  <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">设备预览:</span>
                      <div className="flex items-center gap-1 bg-white rounded border">
                        <button
                          onClick={() => setPreviewDevice('desktop')}
                          className={`px-3 py-1 text-sm rounded transition-colors ${previewDevice === 'desktop'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                          <Monitor className="w-4 h-4 mr-1 inline" />
                          桌面端
                        </button>
                        <button
                          onClick={() => setPreviewDevice('tablet')}
                          className={`px-3 py-1 text-sm rounded transition-colors ${previewDevice === 'tablet'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                          <Tablet className="w-4 h-4 mr-1 inline" />
                          平板端
                        </button>
                        <button
                          onClick={() => setPreviewDevice('mobile')}
                          className={`px-3 py-1 text-sm rounded transition-colors ${previewDevice === 'mobile'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                          <Smartphone className="w-4 h-4 mr-1 inline" />
                          移动端
                        </button>
                      </div>
                    </div>

                    {previewUrl && (
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => window.open(previewUrl, '_blank')}
                          size="sm"
                          variant="outline"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          新窗口打开
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* 预览内容 */}
                <div className="flex-1 p-4">
                  {previewStatus === 'idle' && (
                    <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">准备预览组件</h3>
                        <p className="text-gray-500 text-sm mb-4">生成组件后点击"启动预览"查看效果</p>
                        <Button
                          onClick={handleStartPreview}
                          disabled={!Object.keys(currentFiles).length}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          启动预览
                        </Button>
                      </div>
                    </div>
                  )}

                  {previewStatus === 'loading' && (
                    <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border">
                      <div className="text-center">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">预览启动中...</h3>
                        <p className="text-gray-500 text-sm">正在构建和启动预览环境</p>
                      </div>
                    </div>
                  )}

                  {previewStatus === 'ready' && previewUrl && (
                    <div className="h-full border rounded-lg overflow-hidden bg-white shadow-sm">
                      <div
                        className="relative bg-gray-100 h-full"
                        style={{
                          maxWidth: previewDevice === 'desktop' ? '100%' :
                            previewDevice === 'tablet' ? '768px' : '375px',
                          margin: previewDevice === 'desktop' ? '0' : '0 auto'
                        }}
                      >
                        <iframe
                          src={previewUrl}
                          className="w-full h-full border-0"
                          title="组件预览"
                          sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                          style={{ backgroundColor: 'white' }}
                        />
                      </div>
                    </div>
                  )}

                  {previewStatus === 'error' && (
                    <div className="h-full flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
                      <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-red-800 mb-2">预览启动失败</h3>
                        <p className="text-red-600 text-sm mb-4">预览环境启动时遇到问题</p>
                        <Button
                          onClick={handleStartPreview}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          重试预览
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
