"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit3, 
  Upload, 
  Save,
  X,
  Play,
  RefreshCw,
  ExternalLink,
  Monitor,
  Smartphone,
  Loader2,
  AlertCircle,
  Palette,
  MessageSquare,
  Send,
  Code2,
  Zap
} from 'lucide-react';
import { proxyRequest } from '@/utils/request';

export default function ComponentDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 从URL参数获取组件数据
  const [component, setComponent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 风格文件编辑状态
  const [styleEditStates, setStyleEditStates] = useState<{[key: string]: {
    isEditing: boolean;
    uploadFile: File | null;
    isSaving: boolean;
  }}>({});

  // 预览相关状态
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [componentFiles, setComponentFiles] = useState<any[]>([]);
  const [previewLogs, setPreviewLogs] = useState<string[]>([]);
  
  // 样式选择相关状态
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [availableStyles, setAvailableStyles] = useState<string[]>([]);
  const [currentComponentFiles, setCurrentComponentFiles] = useState<any[]>([]);

  // 对话相关状态
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [showChat, setShowChat] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  const [currentFiles, setCurrentFiles] = useState<{ [path: string]: string }>({});

  // 从URL参数获取组件详情
  useEffect(() => {
    const sceneEn = searchParams.get('scene_en');
    const scene = searchParams.get('scene');
    const componentName = searchParams.get('component_name');
    
    if (sceneEn && componentName) {
      fetchComponentDetails(decodeURIComponent(sceneEn), decodeURIComponent(componentName));
    }
  }, [searchParams]);

  // 获取组件详情数据
  const fetchComponentDetails = async (sceneEn: string, componentName: string) => {
    setIsLoading(true);
    try {
      const response = await proxyRequest(`/frontend_component/get_component_info`, {
        method: 'GET',
        headers: {
          scene_en: sceneEn,
          component_name: componentName
        },
        body: {
          scene_en: sceneEn,
          component_name: componentName
        }
      });

      if (!response.ok) {
        throw new Error(`获取组件详情失败: ${response.statusText}`);
      }

      // 检查响应类型
      const contentType = response.headers.get('content-type');
      let componentData;
      
      if (contentType?.includes('application/json')) {
        const jsonData = await response.json();
        // console.log('jeje', jsonData)
        if (jsonData.code !== 200) {
          throw new Error(jsonData.error || '获取组件详情失败');
        }
        componentData = jsonData.data.data;
      } else {
        // 如果返回的是文件流，构造组件数据
        const fileContent = await response.text();
        componentData = {
          scene_en: sceneEn,
          component_name: componentName,
          component_desc: '组件详情',
          scene_tag: '场景标签',
          stype_tag: '',
          function_tag: '',
          applied_components: '',
          applicable_pages: ''
        };
      }

      setComponent(componentData);
      
        // 处理样式数据
        if (componentData && componentData.files) {
        const styles = componentData.files.map((file: any) => file.stylize).filter(Boolean);
        setAvailableStyles(styles);
        if (styles.length > 0) {
          setSelectedStyle(styles[0]); // 默认选择第一个样式
        }
        setCurrentComponentFiles(componentData.files);
        
        // 初始化对话文件状态
        const filesState: { [path: string]: string } = {};
        componentData.files.forEach((file: any) => {
          const fileName = file.file_name || `${componentData.component_name}.tsx`;
          const filePath = fileName.startsWith('components/') 
            ? fileName 
            : `components/${fileName}`;
          filesState[filePath] = file.content;
        });
        setCurrentFiles(filesState);
        
        // 调试：显示原始文件数据
        // console.log(`🔍 原始文件数据:`, componentData.data.files);
        // componentData.data.files.forEach((file: any, index: number) => {
        //   console.log(`📁 文件 ${index + 1}: ${file.file_name} (样式: ${file.stylize})`);
        // });
      }
      
      // 初始化风格编辑状态
      if (componentData && componentData.files) {
        const styles = componentData.files.map((file: any) => file.stylize).filter(Boolean);
        const initialStyleStates: {[key: string]: {isEditing: boolean; uploadFile: File | null; isSaving: boolean}} = {};
        styles.forEach((style: string) => {
          initialStyleStates[style] = {
            isEditing: false,
            uploadFile: null,
            isSaving: false
          };
        });
        setStyleEditStates(initialStyleStates);
      }
    } catch (error) {
      // 可以在这里添加错误提示
    } finally {
      setIsLoading(false);
    }
  };

  // 切换风格编辑模式
  const toggleStyleEdit = (styleName: string) => {
    setStyleEditStates(prev => ({
      ...prev,
      [styleName]: {
        ...prev[styleName],
        isEditing: !prev[styleName]?.isEditing,
        uploadFile: null
      }
    }));
  };

  // 保存风格文件修改
  const saveStyleChanges = async (styleName: string) => {
    if (!component || !styleName) {
      alert('请选择要修改的风格');
      return;
    }

    const styleState = styleEditStates[styleName];
    if (!styleState?.uploadFile) {
      alert('请选择要上传的文件');
      return;
    }

    // 设置保存状态
    setStyleEditStates(prev => ({
      ...prev,
      [styleName]: { ...prev[styleName], isSaving: true }
    }));

    try {
      // 读取文件内容
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(styleState.uploadFile!);
      });
         
      const fileData = {
        file_name: `${component.component_name}$${styleName}.tsx`,
        stylize: styleName,
        content: fileContent
      };
      // 构建更新数据
      const updateData = {
        scene: searchParams.get('scene'),
        scene_en: searchParams.get('scene_en'),
        component_name: component.component_name,
        stylize: styleName,
        file: fileData.content
      };

      const response = await proxyRequest('/frontend_component/update_by_name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        bodys: updateData
      });

      if (response.ok) {
        alert(`${styleName} 风格文件修改成功！`);
        
        // 退出编辑模式
        setStyleEditStates(prev => ({
          ...prev,
          [styleName]: { isEditing: false, uploadFile: null, isSaving: false }
        }));
      } else {
        const data = await response.json();
        throw new Error(data.error || '修改风格文件失败');
      }
    } catch (error) {
      alert('❌ 保存风格文件失败: ' + error);
    } finally {
      setStyleEditStates(prev => ({
        ...prev,
        [styleName]: { ...prev[styleName], isSaving: false }
      }));
    }
  };

  // 添加日志
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setPreviewLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  // 获取组件代码并启动预览
  const startComponentPreview = useCallback(async () => {
    if (!component?.component_name) return;
    
    setPreviewStatus('loading');
    setPreviewLogs([]);
    addLog('🚀 开始启动组件预览...');
    
    try {
      // 1. 直接使用已有的组件数据
      addLog('📥 使用已有组件数据...');
      
        // 构造文件数据格式
        const filesToUse = currentComponentFiles.length > 0 ? currentComponentFiles : [];
      addLog(`🔍 当前组件文件数量: ${filesToUse.length}`);
      
      const codeData = {
        success: true,
        data: {
          files: filesToUse.map((file: any) => {
            // 确保组件文件放在 components 目录下
            const fileName = file.file_name || `${component.component_name}.tsx`;
            const filePath = fileName.startsWith('components/') 
              ? fileName 
              : `components/${fileName}`;
            
            addLog(`🔧 处理文件: ${fileName} -> ${filePath}`);
            
            return {
              path: filePath,
              content: file.content,
              type: 'component',
              stylize: file.stylize
            };
          })
        }
      };
      
      addLog(`✅ 使用 ${codeData.data.files.length} 个文件`);
      codeData.data.files.forEach((file: any) => {
        addLog(`📁 文件路径: ${file.path}`);
      });
      setComponentFiles(codeData.data.files);
      
      // 2. 调用现有的 AI 生成接口部署组件
      addLog('🏗️ 正在部署组件到 Sandbox...');
      
      // 构造部署用的文件结构 - sandbox API会自动加上sandbox/前缀
      const deployFiles: { [path: string]: string } = {};
      let files = codeData.data.files;
      
      // 如果有样式选择，过滤出对应样式的文件
      if (selectedStyle && currentComponentFiles.length > 0) {
        const selectedFile = currentComponentFiles.find((file: any) => file.stylize === selectedStyle);
        if (selectedFile) {
          // 确保组件文件放在 components 目录下
          const fileName = selectedFile.file_name || `${component.component_name}.tsx`;
          const filePath = fileName.startsWith('components/') 
            ? fileName 
            : `components/${fileName}`;
            
          files = [{
            path: filePath,
            content: selectedFile.content,
            type: 'component',
            stylize: selectedFile.stylize
          }];
          addLog(`🎨 已选择样式: ${selectedStyle}`);
        }
      }
      
      // 添加组件文件（路径相对于sandbox目录）
      addLog(`🔍 准备处理 ${files.length} 个文件`);
      
      if (files.length === 0) {
        addLog(`⚠️ 警告: 没有找到组件文件！`);
        addLog(`🔍 currentComponentFiles 长度: ${currentComponentFiles.length}`);
        addLog(`🔍 filesToUse 长度: ${filesToUse.length}`);
      }
      
      files.forEach((file: any, index: number) => {
        addLog(`📋 文件 ${index + 1}: path=${file.path}, content长度=${file.content?.length || 0}`);
        
        // 处理转义的字符串内容
        let content = file.content;
        
        // 如果是字符串形式的代码，需要解析转义字符
        if (typeof content === 'string' && content.includes('\\n')) {
          try {
            // 去掉开头和结尾的单引号
            content = content.replace(/^'/, '').replace(/'$/, '');
            
            // 解析转义字符
            content = content
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\r/g, '\r')
              .replace(/\\'/g, "'")
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            
            addLog(`🔧 已解析转义字符，内容长度: ${content.length}`);
            
            // 显示解析后的代码前几行用于调试
            const previewLines = content.split('\n').slice(0, 5).join('\n');
            addLog(`📝 代码预览:\n${previewLines}...`);
          } catch (error) {
            addLog(`⚠️ 解析转义字符失败: ${error}`);
          }
        }
        
        // 确保组件文件有正确的导出语句
        if (!content.includes('export default') && !content.includes('export {')) {
          // 如果没有导出语句，添加默认导出
          const componentName = component.component_name;
          content += `\n\nexport default ${componentName};`;
          addLog(`⚠️ 为 ${file.path} 添加默认导出语句`);
        }
        
        deployFiles[file.path] = content;
        addLog(`📄 添加文件: ${file.path}`);
      });
      
      // 创建页面文件用于预览
      const componentName = component.component_name;
      
      // 处理组件名称，移除可能的style后缀（如$default）
      const cleanComponentName = componentName.replace(/\$.*$/, '');
      const pageRouteName = cleanComponentName; // 用于URL路由的组件名
      
      // 根据实际文件路径生成正确的导入语句
      const componentFilePath = files[0]?.path || `components/${componentName}.tsx`;
      const importPath = componentFilePath.replace('.tsx', '').replace('.jsx', '');
      
      addLog(`📁 组件文件路径: ${componentFilePath}`);
      addLog(`📥 导入路径: @/${importPath}`);
      addLog(`🧹 清理后的组件名: ${cleanComponentName} (原始: ${componentName})`);
      
      const pageContent = `'use client';

import React from 'react';
import ${componentName} from '@/${importPath}';

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">${cleanComponentName} 组件预览</h1>
          <p className="text-gray-600">实时预览组件效果</p>
        </div>
        <${componentName} />
      </div>
    </div>
  );
}`;
      
      // 页面文件路径（相对于sandbox目录）- 使用清理后的组件名作为路由
      deployFiles[`app/${pageRouteName}/page.tsx`] = pageContent;
      
      // 使用sandbox API保存文件到sandbox目录
      addLog(`📤 准备发送 ${Object.keys(deployFiles).length} 个文件到 API`);
      Object.keys(deployFiles).forEach(filePath => {
        addLog(`📤 发送文件: ${filePath}`);
      });
      
      const saveResponse = await fetch('/api/sandbox/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: deployFiles
        })
      });
      
      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        addLog(`❌ API 响应错误: ${saveResponse.status} - ${errorText}`);
        throw new Error(`部署组件失败: ${saveResponse.status} - ${errorText}`);
      }
      
      const saveData = await saveResponse.json();
      addLog(`✅ 组件部署成功: ${saveData.message || '文件已保存'}`);
      
      // 调试：显示写入的文件路径
      addLog(`📋 准备部署的文件列表:`);
      Object.keys(deployFiles).forEach(filePath => {
        addLog(`📄 已写入: ${filePath}`);
      });
      
      // 特别检查 components 目录下的文件
      const componentFiles = Object.keys(deployFiles).filter(path => path.includes('components/'));
      addLog(`🔍 components 目录下的文件: ${componentFiles.length} 个`);
      componentFiles.forEach(filePath => {
        addLog(`📦 ${filePath}`);
      });
      
      // 3. 启动预览服务
      addLog('🚀 正在启动预览服务...');
      const previewResponse = await fetch('/api/sandbox/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!previewResponse.ok) {
        throw new Error(`启动预览失败: ${previewResponse.statusText}`);
      }
      
      const previewData = await previewResponse.json();
      
      if (previewData.success) {
        // 构建预览URL - 确保路径正确
        const baseUrl = previewData.url || 'http://localhost:3100';
        // 移除baseUrl末尾的斜杠，确保路径拼接正确
        const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
        // 使用清理后的组件名作为URL路径
        const cleanComponentName = componentName.replace(/\$.*$/, '');
        const finalPreviewUrl = `${cleanBaseUrl}/${cleanComponentName}`;
        
        addLog(`🔍 预览URL: ${finalPreviewUrl} (组件名: ${componentName} -> ${cleanComponentName})`);
        
        // 等待Next.js热重载完成
        addLog('⏳ 等待 Next.js 热重载完成...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 验证预览URL是否可访问
        try {
          addLog('🔍 验证预览服务是否可访问...');
          const testResponse = await fetch(finalPreviewUrl.replace(/^http:\/\/[^/]+/, 'http://localhost:3100'), {
            method: 'GET',
            mode: 'no-cors' // 避免CORS问题
          });
          addLog('✅ 预览服务响应正常');
        } catch (error) {
          addLog('⚠️ 预览服务可能仍在启动中，如果遇到404请稍后刷新');
        }
        
        setPreviewUrl(finalPreviewUrl);
        setPreviewStatus('ready');
        addLog(`✅ 预览启动成功: ${finalPreviewUrl}`);
        addLog('🎉 组件预览已就绪！如果显示404，请等待几秒钟后刷新预览');
      } else {
        throw new Error(previewData.error || '启动预览失败');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      addLog(`❌ 预览启动失败: ${errorMessage}`);
      setPreviewStatus('error');
    }
  }, [component, selectedStyle, currentComponentFiles, addLog]);

  // 当样式选择改变时，如果预览已启动则重新部署
  useEffect(() => {
    if (previewStatus === 'ready' && selectedStyle && currentComponentFiles.length > 0) {
      addLog(`🎨 样式已切换为: ${selectedStyle}，正在重新部署...`);
      // 使用 setTimeout 避免无限循环
      const timer = setTimeout(() => {
        startComponentPreview();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedStyle, currentComponentFiles.length, addLog, startComponentPreview]); // 添加所有必要的依赖

  // 刷新预览
  const refreshPreview = async () => {
    if (previewStatus !== 'ready' || !component?.component_name) return;
    
    setPreviewStatus('loading');
    addLog('🔄 正在刷新预览内容...');
    
    try {
      // 使用当前组件文件重新部署到 sandbox
      const filesToUse = currentComponentFiles.length > 0 ? currentComponentFiles : [];
      const deployFiles: { [path: string]: string } = {};
      
      // 添加组件文件
      filesToUse.forEach((file: any) => {
        const fileName = file.file_name || `${component.component_name}.tsx`;
        const filePath = fileName.startsWith('components/') 
          ? fileName 
          : `components/${fileName}`;
        
        let content = file.content;
        
        // 处理转义的字符串内容
        if (typeof content === 'string' && content.includes('\\n')) {
          content = content.replace(/^'/, '').replace(/'$/, '');
          content = content
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\r/g, '\r')
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        }
        
        // 确保组件文件有正确的导出语句
        if (!content.includes('export default') && !content.includes('export {')) {
          const componentName = component.component_name;
          content += `\n\nexport default ${componentName};`;
        }
        
        deployFiles[filePath] = content;
      });
      
      // 创建页面文件用于预览
      const componentName = component.component_name;
      const cleanComponentName = componentName.replace(/\$.*$/, '');
      const pageRouteName = cleanComponentName;
      const componentFilePath = filesToUse[0]?.path || `components/${componentName}.tsx`;
      const importPath = componentFilePath.replace('.tsx', '').replace('.jsx', '');
      
      const pageContent = `'use client';

import React from 'react';
import ${componentName} from '@/${importPath}';

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">${cleanComponentName} 组件预览</h1>
          <p className="text-gray-600">实时预览组件效果</p>
        </div>
        <${componentName} />
      </div>
    </div>
  );
}`;
      
      deployFiles[`app/${pageRouteName}/page.tsx`] = pageContent;
      
      // 保存文件到 sandbox
      const saveResponse = await fetch('/api/sandbox/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: deployFiles
        })
      });
      
      if (!saveResponse.ok) {
        throw new Error(`保存文件失败: ${saveResponse.statusText}`);
      }
      
      addLog('✅ 组件内容已更新，预览正在刷新...');
      
      // 等待 Next.js 热重载
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPreviewStatus('ready');
      addLog('✅ 预览内容已更新完成');
      
    } catch (error) {
      addLog(`❌ 刷新失败: ${error}`);
      setPreviewStatus('error');
    }
  };

  // 在新窗口打开预览
  const openPreviewInNewWindow = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  // 发送对话消息
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatting) return;

    const userMessage = {
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
      const systemMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: '🤖 AI 正在分析您的需求并修改组件...',
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
          projectId: 'component-detail',
          conversationId: conversationId || undefined,
          currentFiles,
          context: `当前组件: ${component?.component_name}, 样式: ${selectedStyle}`
        })
      });

      const data = await response.json();

      // 移除系统消息
      setChatMessages(prev => prev.filter(msg => msg.id !== systemMessage.id));

      if (data.success) {
        const aiMessage = {
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
          data.data.files.forEach((file: any) => {
            newFiles[file.path] = file.content;
          });
          setCurrentFiles(newFiles);

          // 更新组件文件状态
          const updatedComponentFiles = currentComponentFiles.map(compFile => {
            const updatedFile = data.data.files.find((file: any) => 
              file.path.includes(compFile.file_name) || 
              file.path.includes(component?.component_name)
            );
            if (updatedFile) {
              return {
                ...compFile,
                content: updatedFile.content
              };
            }
            return compFile;
          });
          setCurrentComponentFiles(updatedComponentFiles);

          // 直接更新预览内容，不需要重新启动预览
          if (previewStatus === 'ready') {
            addLog(`🔄 组件已更新，正在刷新预览内容...`);
            // 延迟一下确保文件已保存，然后刷新预览
            setTimeout(() => {
              refreshPreview();
            }, 500);
          }
        }
      } else {
        const errorMessage = {
          id: (Date.now() + 2).toString(),
          type: 'ai',
          content: `❌ 修改失败: ${data.error}`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
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
    setChatMessages([]);
    setChatInput('');
    setConversationId('');
  };

  if (isLoading || !component) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">正在获取组件详情...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                返回
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {component.component_name}
                </h1>
                <p className="text-sm text-gray-500">组件详情</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {previewStatus === 'idle' && (
                <Button
                  onClick={startComponentPreview}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Play size={16} className="mr-2" />
                  启动预览
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-6xl mx-auto py-8 px-6">
            {/* 风格管理 */}
            {availableStyles.length > 0 ? (
              <div className="space-y-6 mb-4">
                {availableStyles.map((styleName) => {
                  const styleState = styleEditStates[styleName] || { isEditing: false, uploadFile: null, isSaving: false };
                  const styleFile = currentComponentFiles.find(file => file.stylize === styleName);
                  
                  return (
                    <Card key={styleName} className="border-purple-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                              <Palette className="w-5 h-5 text-purple-600" />
                              {styleName} 风格
                              {styleState.isEditing && (
                                <Badge variant="secondary" className="text-xs">编辑模式</Badge>
                              )}
                            </CardTitle>
                            <CardDescription>
                              管理 {styleName} 风格的组件文件和预览
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-3">
                            {styleState.isEditing ? (
                              <>
                                <Button
                                  variant="outline"
                                  onClick={() => toggleStyleEdit(styleName)}
                                  disabled={styleState.isSaving}
                                >
                                  <X size={16} className="mr-2" />
                                  取消
                                </Button>
                                <Button
                                  onClick={() => saveStyleChanges(styleName)}
                                  disabled={styleState.isSaving || !styleState.uploadFile}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {styleState.isSaving ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      保存中...
                                    </>
                                  ) : (
                                    <>
                                      <Save size={16} className="mr-2" />
                                      保存修改
                                    </>
                                  )}
                                </Button>
                              </>
                            ) : (
                              <Button
                                onClick={() => toggleStyleEdit(styleName)}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <Edit3 size={16} className="mr-2" />
                                编辑风格
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* 风格预览区域 */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-medium text-gray-800">风格预览</h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-medium text-gray-700">当前样式: {styleName}</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedStyle(styleName);
                                    if (previewStatus === 'ready') {
                                      refreshPreview();
                                    } else {
                                      startComponentPreview();
                                    }
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Play size={14} className="mr-1" />
                                  预览此风格
                                </Button>
                              </div>
                            </div>
                            
                            {/* 文件信息 */}
                            {styleFile && (
                              <div className="bg-white rounded border p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{styleFile.file_name}</p>
                                    <p className="text-xs text-gray-500">
                                      文件大小: {Math.round(styleFile.content?.length / 1024 * 100) / 100} KB
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {styleFile.stylize}
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 文件上传区域（仅编辑模式显示） */}
                        {styleState.isEditing && (
                          <div className="space-y-4">
                            <h4 className="text-lg font-medium text-gray-800">文件上传</h4>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    模板文件 <span className="text-red-500">*</span>
                                    <span className="text-green-600 ml-2">(支持 .tsx, .ts, .jsx, .js 文件)</span>
                                  </label>
                                  <input
                                    type="file"
                                    accept=".tsx,.ts,.jsx,.js"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null;
                                      setStyleEditStates(prev => ({
                                        ...prev,
                                        [styleName]: { ...prev[styleName], uploadFile: file }
                                      }));
                                    }}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  />
                                  {styleState.uploadFile && (
                                    <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                                      <Upload size={16} className="text-green-600" />
                                      已选择文件: <span className="font-medium">{styleState.uploadFile.name}</span>
                                      <span className="text-blue-600">
                                        (将更新样式: {styleName})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">暂无风格数据</h3>
                  <p className="text-gray-500">该组件还没有配置任何风格变体</p>
                </CardContent>
              </Card>
            )}

                     {/* 全局预览区域 */}
         {previewStatus === 'ready' && previewUrl && (
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-3">
                    组件预览
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      运行中
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    实时预览组件效果，支持多设备适配
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 操作栏 */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-6">
                      {/* 设备选择器 */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">预览设备:</span>
                        <div className="flex items-center gap-1 bg-white rounded border">
                          <button
                            onClick={() => setPreviewDevice('desktop')}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                              previewDevice === 'desktop' 
                                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            title="桌面端 (1200px+)"
                          >
                            <Monitor className="w-4 h-4 mr-1 inline" />
                            桌面端
                          </button>
                          <button
                            onClick={() => setPreviewDevice('tablet')}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                              previewDevice === 'tablet'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            title="平板端 (768px - 1024px)"
                          >
                            <Smartphone className="w-4 h-4 mr-1 inline" />
                            平板端
                          </button>
                          <button
                            onClick={() => setPreviewDevice('mobile')}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                              previewDevice === 'mobile'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            title="移动端 (< 768px)"
                          >
                            <Smartphone className="w-4 h-4 mr-1 inline" />
                            移动端
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshPreview}
                        className="hover:bg-orange-50 hover:border-orange-200"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        刷新预览
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openPreviewInNewWindow}
                        className="hover:bg-purple-50 hover:border-purple-200"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        新窗口打开
                      </Button>
                    </div>
                  </div>
                  
                  {/* 预览iframe */}
                  <div className="relative h-[600px] lg:h-[700px] xl:h-[800px]">
                    <div
                      className="mx-auto bg-gray-100 h-full rounded-lg overflow-hidden shadow-sm border"
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
                      
                      {/* 设备边框装饰 */}
                      {previewDevice !== 'desktop' && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute inset-0 border-8 border-gray-800 rounded-3xl" />
                          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-800 rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 组件信息 */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-blue-100 rounded">
                        <Monitor className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-blue-900 mb-2">预览说明</h5>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• 预览显示组件的实时效果，支持响应式设计</li>
                          <li>• 可以切换不同设备尺寸查看适配效果</li>
                          <li>• 预览地址可以在新窗口中打开，方便分享</li>
                          <li>• 当前样式: {selectedStyle || 'default'}</li>
                          <li>• 组件文件: {componentFiles.length} 个</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 预览启动状态 */}
            {previewStatus === 'loading' && (
              <Card className="border-blue-200">
                <CardContent className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-lg font-medium">启动预览中...</p>
                  <p className="text-sm text-gray-500">正在部署组件到预览环境</p>
                  
                  {/* 预览日志 */}
                  {previewLogs.length > 0 && (
                    <div className="mt-6 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-32 overflow-y-auto space-y-1">
                      {previewLogs.map((log, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-blue-400 text-xs mt-1">→</span>
                          <span className="text-xs">{log}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 预览错误状态 */}
            {previewStatus === 'error' && (
              <Card className="border-red-200 bg-red-50/30">
                <CardContent className="text-center py-12">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-red-800 mb-2">预览启动失败</p>
                  <p className="text-sm text-red-600 mb-4">请检查组件代码或网络连接</p>
                  <Button
                    variant="outline"
                    onClick={startComponentPreview}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重试
                  </Button>
                  
                  {/* 错误日志 */}
                  {previewLogs.length > 0 && (
                    <div className="mt-6 bg-gray-900 text-red-400 p-4 rounded-lg font-mono text-sm max-h-32 overflow-y-auto space-y-1">
                      {previewLogs.map((log, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-yellow-400 text-xs mt-1">→</span>
                          <span className="text-xs">{log}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

      </main>

      {/* 浮窗对话组件 */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* 对话浮窗 */}
        {!isChatMinimized && (
          <div className="mb-4 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
            {/* 浮窗头部 */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">AI 助手</h3>
                  <p className="text-xs text-gray-500">智能修改组件</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearChat}
                  disabled={isChatting}
                  className="h-6 w-6 p-0 hover:bg-gray-200"
                  title="清空对话"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChatMinimized(true)}
                  className="h-6 w-6 p-0 hover:bg-gray-200"
                  title="最小化"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* 对话消息区域 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-6">
                  <div className="p-2 bg-gradient-to-br from-green-50 to-blue-50 rounded-full w-10 h-10 mx-auto mb-3 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-800 mb-2">开始对话修改组件</h4>
                  <p className="text-xs text-gray-500 mb-3">告诉我您想要如何修改这个组件</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {[
                      '让按钮更圆润',
                      '添加动画效果',
                      '改变颜色主题',
                      '调整布局间距',
                      '优化移动端'
                    ].map((suggestion, index) => (
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
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-2 text-xs ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.type === 'ai'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                      {message.files && message.files.length > 0 && (
                        <div className="mt-1 pt-1 border-t border-gray-200">
                          <div className="text-xs text-gray-600 mb-1">📁 修改的文件：</div>
                          {message.files.map((file: any, index: number) => (
                            <div key={index} className="text-xs text-gray-500">
                              • {file.path} ({file.size} 字符)
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 输入区域 */}
            <div className="p-3 border-t bg-gray-50 rounded-b-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="描述您想要如何修改组件..."
                  className="flex-1 px-3 py-2 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  {isChatting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                按 Enter 发送
              </div>
            </div>
          </div>
        )}

        {/* 浮窗开关按钮 */}
        <Button
          onClick={() => setIsChatMinimized(!isChatMinimized)}
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
            isChatMinimized 
              ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600' 
              : 'bg-gray-500 hover:bg-gray-600'
          }`}
        >
          {isChatMinimized ? (
            <MessageSquare className="w-6 h-6 text-white" />
          ) : (
            <X className="w-6 h-6 text-white" />
          )}
        </Button>

        {/* 未读消息提示 */}
        {chatMessages.length > 0 && isChatMinimized && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">
              {chatMessages.filter(msg => msg.type === 'ai').length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
