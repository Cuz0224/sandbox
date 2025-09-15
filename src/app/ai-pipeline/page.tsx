"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResetConfirmationDialog } from '@/components/ui/reset-confirmation-dialog';
import { 
  RotateCcw, Home, Code, Settings, BarChart3, Zap, Sparkles, Github,
  Workflow, GitBranch, CheckCircle, Clock, AlertCircle, Download,
  Upload, FileText, Plus, Edit3, Package, Layers, History, Eye, 
  ChevronRight
} from 'lucide-react';
import StyleManagement from './components/StyleManagement';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { proxyRequest } from '@/utils/request';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


export default function AIPipelinePage() {
  // 重置功能状态
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // 页面状态
  const [activeTab, setActiveTab] = useState('templates');
  const [stats, setStats] = useState({
    totalPipelines: 0,
    activePipelines: 0,
    successfulBuilds: 0,
    lastExecution: null as string | null,
    popularTemplates: [] as string[]
  });

  // 模板管理状态
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedScene, setSelectedScene] = useState('');
  const [selectedSceneEn, setSelectedSceneEn] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [templateForm, setTemplateForm] = useState({
    scene: '',
    component_name: '',
    stype_tag: '',
    function_tag: ''
  });

  // 历史场景管理状态
  const [historyScenes, setHistoryScenes] = useState<any[]>([]);
  const [selectedHistoryScene, setSelectedHistoryScene] = useState<any>(null);
  const [historyComponents, setHistoryComponents] = useState<any[]>([]);
  const [isLoadingScenes, setIsLoadingScenes] = useState(false);
  const [isLoadingComponents, setIsLoadingComponents] = useState(false);
  const [isDownloadingHistory, setIsDownloadingHistory] = useState(false);
  
  // 风格管理状态
  const [styles, setStyles] = useState<any[]>([]);
  const [isLoadingStyles, setIsLoadingStyles] = useState(false);
  const [styleMessage, setStyleMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // 导航路由
  const router = useRouter();
  

  // Pipeline 状态
  const [pipelineStatus, setPipelineStatus] = useState({
    stage: 'idle', // idle, analyzing, generating, building, testing, deploying, completed, failed
    progress: 0,
    currentStep: '',
    logs: []
  });

  // 处理 Pipeline 执行
  const handleExecutePipeline = async (config: any) => {
    console.log('执行 Pipeline:', config);
    
    // 模拟 Pipeline 执行流程
    const stages = [
      { name: '分析需求', duration: 2000 },
      { name: '生成组件', duration: 3000 },
      { name: '构建项目', duration: 2500 },
      { name: '运行测试', duration: 2000 },
      { name: '部署预览', duration: 1500 }
    ];

    setPipelineStatus({ stage: 'analyzing', progress: 0, currentStep: '准备执行...', logs: [] });
    
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      setPipelineStatus(prev => ({
        ...prev,
        stage: stage.name.toLowerCase().replace(' ', ''),
        currentStep: stage.name,
        progress: Math.round((i / stages.length) * 100)
      }));
      
      await new Promise(resolve => setTimeout(resolve, stage.duration));
    }
    
    setPipelineStatus(prev => ({
      ...prev,
      stage: 'completed',
      progress: 100,
      currentStep: 'Pipeline 执行完成'
    }));
    
    updateStats();
    showSuccessNotification('Pipeline 执行成功！', '前端组件已生成并部署');
  };

  // 更新统计信息
  const updateStats = async () => {
    try {
      setStats(prev => ({
        ...prev,
        totalPipelines: prev.totalPipelines + 1,
        successfulBuilds: prev.successfulBuilds + 1,
        lastExecution: new Date().toISOString()
      }));
    } catch (error) {
      console.error('更新统计信息失败:', error);
    }
  };

  // 显示成功通知
  const showSuccessNotification = (title: string, message: string) => {
    console.log(`${title}: ${message}`);
  };

  // API 接口调用函数
  
  // 按场景创建模板
  const createTemplateByScene = async (scene: string, scene_en?: string, stylize?: string) => {
    setIsCreatingTemplate(true);
    try {
      const formData = new FormData();
      formData.append('scene', scene);
      if (scene_en && scene_en.trim()) {
        formData.append('scene_en', scene_en);
      }
      if (stylize && stylize.trim()) {
        formData.append('stylize', stylize);
      }
      
      const response = await proxyRequest('/frontend_component/create_by_scene', {
        method: 'POST',
        bodys: formData,
        isFormData: true
      });

      const dataRaw = await response.json();
      const { data } = dataRaw
      
      if (data.status == 0) {
        // 解析返回的模板数据
        const templateData = data.data.data.map((item: any[], index: number) => {
          const keys = data.data.keys;
          const template: any = {};
          keys.forEach((key: string, keyIndex: number) => {
            template[key] = item[keyIndex];
          });
          template.id = `template_${index}_${Date.now()}`;
          return template;
        });
        
        setTemplates(templateData);
        showSuccessNotification('模板创建成功！', `${templateData.length} 个组件模板已生成`);
        return templateData;
      } else {
        throw new Error('创建模板失败');
      }
    } catch (error) {
      console.error('创建模板错误:', error);
      alert('❌ 创建模板失败: ' + error);
      return null;
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  // 下载模板
  const downloadTemplate = async (scene: string, scene_en?: string) => {
    setIsDownloading(true);
    try {
      const params = new URLSearchParams();
      params.append('scene', scene);
      if (scene_en && scene_en.trim()) {
        params.append('scene_en', scene_en);
      }
      
      const response = await proxyRequest(`/frontend_component/download?${params.toString()}`, {
        method: 'GET'
      });

      if (response.ok) {
        // 获取文件名
        const disposition = response.headers.get('Content-Disposition');
        const filename = disposition 
          ? disposition.split('filename=')[1]?.replace(/"/g, '') 
          : `${scene}_templates.zip`;
        
        // 下载文件
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccessNotification('下载完成！', `${filename} 已保存到本地`);
      } else {
        throw new Error('下载失败');
      }
    } catch (error) {
      console.error('下载模板错误:', error);
      alert('❌ 下载模板失败: ' + error);
    } finally {
      setIsDownloading(false);
    }
  };

  // 处理模板选中
  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    // 自动填充表单信息
    setTemplateForm({
      scene: template.scene_tag || selectedScene,
      component_name: template.component_name || '',
      stype_tag: template.stype_tag || '',
      function_tag: template.function_tag || ''
    });
  };

  // 清除选中的模板
  const clearSelectedTemplate = () => {
    setSelectedTemplate(null);
    setTemplateForm({ scene: '', component_name: '', stype_tag: '', function_tag: '' });
    setUploadFile(null);
    // 注意：这里不清空selectedScene和selectedSceneEn，因为用户可能还想继续使用这些值
  };

  // 修改模板
  const modifyTemplate = async () => {
    if (!uploadFile) {
      alert('请选择要上传的模板文件');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('scene', templateForm.scene);
      formData.append('component_name', templateForm.component_name);
      formData.append('stype_tag', templateForm.stype_tag);
      formData.append('function_tag', templateForm.function_tag);
      formData.append('file', uploadFile);
      
      // 添加 stylize 参数 - 自动获取所有风格的 name_en
      if (styles && styles.length > 0) {
        const stylizeValue = styles.map(style => style.name_en).join(',');
        formData.append('stylize', stylizeValue);
      }

      const response = await proxyRequest('/frontend_component/modify', {
        method: 'POST',
        bodys: formData,
        isFormData: true
      });

      const dataRaw = await response.json();
      const { data } = dataRaw
      
      if (response.ok) {
        showSuccessNotification('模板修改成功！', '组件模板已更新');
        // 重新获取模板列表
        if (templateForm.scene) {
          await createTemplateByScene(templateForm.scene, selectedSceneEn);
        }
        // 重置表单和选中状态
        clearSelectedTemplate();
      } else {
        throw new Error(data.error || '修改模板失败');
      }
    } catch (error) {
      console.error('修改模板错误:', error);
      alert('❌ 修改模板失败: ' + error);
    }
  };

  // 重置sandbox功能
  const resetSandbox = async () => {
    setIsResetting(true);
    try {
      const response = await proxyRequest('/api/sandbox/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        bodys: { confirmReset: true }
      });

      const dataRaw = await response.json();
      const { data } = dataRaw

      if (data.success) {
        setShowSuccessMessage(true);
        setShowResetDialog(false);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        throw new Error(data.error || '重置失败');
      }
    } catch (error) {
      console.error('重置错误:', error);
      alert('❌ 重置失败: ' + error);
    } finally {
      setIsResetting(false);
    }
  };

  // 获取历史场景列表
  const getSceneList = async () => {
    setIsLoadingScenes(true);
    try {
      const response = await proxyRequest('/frontend_component/get_scene_list', {
        method: 'GET'
      });

      const dataRaw = await response.json();
      const { data } = dataRaw
      if (data.status == 0) {
        console.log('dada', data)
        setHistoryScenes(data.data || []);
        return data.data;
      } else {
        throw new Error('获取场景列表失败');
      }
    } catch (error) {
      console.error('获取场景列表错误:', error);
      alert('❌ 获取场景列表失败: ' + error);
      return null;
    } finally {
      setIsLoadingScenes(false);
    }
  };

  // 根据场景查询组件列表
  const queryComponentsByScene = async (scene_en: string) => {
    setIsLoadingComponents(true);
    try {
      const response = await proxyRequest(`/frontend_component/query_by_scene`, {
        method: 'GET',
        headers: {
          scene_en: encodeURIComponent(scene_en)
        }
      });

      const dataRaw = await response.json();
      const { data } = dataRaw
      
      if (data.status == 0) {
        // 解析返回的组件数据，直接使用数组结构
        const componentData = data.data?.map((component: any, index: number) => ({
          ...component,
          id: `history_component_${index}_${Date.now()}`
        })) || [];
        
        setHistoryComponents(componentData);
        return componentData;
      } else {
        throw new Error('查询组件列表失败');
      }
    } catch (error) {
      console.error('查询组件列表错误:', error);
      alert('❌ 查询组件列表失败: ' + error);
      return null;
    } finally {
      setIsLoadingComponents(false);
    }
  };

  // 下载历史场景组件
  const downloadHistoryScene = async (scene: string, scene_en?: string) => {
    setIsDownloadingHistory(true);
    try {
      const params = new URLSearchParams();
      params.append('scene', scene);
      if (scene_en && scene_en.trim()) {
        params.append('scene_en', scene_en);
      }
      
      const response = await proxyRequest(`/frontend_component/download?${params.toString()}`, {
        method: 'GET'
      });

      if (response.ok) {
        // 获取文件名
        const disposition = response.headers.get('Content-Disposition');
        const filename = disposition 
          ? disposition.split('filename=')[1]?.replace(/"/g, '') 
          : `${scene}_history_templates.zip`;
        
        // 下载文件
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccessNotification('下载完成！', `${filename} 已保存到本地`);
      } else {
        throw new Error('下载失败');
      }
    } catch (error) {
      console.error('下载历史场景错误:', error);
      alert('❌ 下载历史场景失败: ' + error);
    } finally {
      setIsDownloadingHistory(false);
    }
  };

  // 处理历史场景选择
  const handleSelectHistoryScene = async (scene: any) => {
    console.log('sese', scene)
    setSelectedHistoryScene(scene);
    setHistoryComponents([]); // 清空之前的组件列表
    
    // 获取该场景下的组件列表
    if (scene.scene_en) {
      await queryComponentsByScene(scene.scene_en);
    }
  };

  // 处理组件详情查看 - 跳转到详情页面
  const handleViewComponentDetails = (component: any) => {
    const sceneEn = selectedHistoryScene?.scene_en;
    const scene = selectedHistoryScene?.scene;
    console.log('enen', selectedHistoryScene)
    const componentName = component.component_name;
    router.push(`/component-detail/${component.id || 'unknown'}?scene_en=${encodeURIComponent(sceneEn)}&component_name=${encodeURIComponent(componentName)}&scene=${encodeURIComponent(scene)}`);
  };


  // 加载风格列表
  const loadStyles = async () => {
    setIsLoadingStyles(true);
    try {
      const response = await proxyRequest('/frontend_component/get_stylize_list', {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code === 200 && data.data?.data) {
        setStyles(data.data.data);
      } else {
        throw new Error(data.msg || '获取风格列表失败');
      }
    } catch (error) {
      // 记录错误日志
      if (process.env.NODE_ENV === 'development') {
        console.error('加载风格列表失败:', error);
      }
      setStyleMessage({ type: 'error', text: `加载失败: ${error instanceof Error ? error.message : '未知错误'}` });
    } finally {
      setIsLoadingStyles(false);
    }
  };

  // 保存风格（创建或更新）
  const saveStyle = async (styleData: any) => {
    console.log('styleData', styleData)
    try {
      const response = await proxyRequest('/frontend_component/upsert_stylize', {
        method: 'POST',
        bodys: {
          name: styleData.name,
          name_en: styleData.name_en,
          description: styleData.description,
          prompt_text: styleData.prompt_text
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code === 200) {
        setStyleMessage({ type: 'success', text: '保存成功' });
        await loadStyles(); // 重新加载列表
        return true;
      } else {
        throw new Error(data.msg || '保存失败');
      }
    } catch (error) {
      // 记录错误日志
      if (process.env.NODE_ENV === 'development') {
        console.error('保存风格失败:', error);
      }
      setStyleMessage({ type: 'error', text: `保存失败: ${error instanceof Error ? error.message : '未知错误'}` });
      return false;
    }
  };

  // 删除风格
  const deleteStyle = async (style: any) => {
    try {
      // 这里需要根据实际API实现删除逻辑
      // 假设有删除接口
      const response = await proxyRequest('/frontend_component/delete_stylize', {
        method: 'POST',
        bodys: {
          name_en: style.name_en
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code === 200) {
        setStyleMessage({ type: 'success', text: '删除成功' });
        await loadStyles(); // 重新加载列表
      } else {
        throw new Error(data.msg || '删除失败');
      }
    } catch (error) {
      // 记录错误日志
      if (process.env.NODE_ENV === 'development') {
        console.error('删除风格失败:', error);
      }
      setStyleMessage({ type: 'error', text: `删除失败: ${error instanceof Error ? error.message : '未知错误'}` });
    }
  };

  // 清空风格消息
  useEffect(() => {
    if (styleMessage) {
      const timer = setTimeout(() => setStyleMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [styleMessage]);

  // 页面加载时获取统计信息和历史场景
  useEffect(() => {
    updateStats();
    getSceneList();
    loadStyles(); // 加载风格列表
  }, []);

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'analyzing': return <Clock className="w-4 h-4" />;
      case 'generating': return <Code className="w-4 h-4" />;
      case 'building': return <Settings className="w-4 h-4" />;
      case 'testing': return <CheckCircle className="w-4 h-4" />;
      case 'deploying': return <Zap className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Workflow className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* 成功消息提示 */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <span className="text-2xl">🎉</span>
          <div>
            <div className="font-semibold">Sandbox 重置成功！</div>
            <div className="text-sm opacity-90">Pipeline 环境已重置</div>
          </div>
        </div>
      )}

      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-8xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                  <Workflow className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    V0 Pipeline
                  </h1>
                  <p className="text-sm text-gray-500">前端组件自动化构建流水线</p>
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Pipeline 就绪</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>构建环境运行中</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              
              <Button
                onClick={() => setShowResetDialog(true)}
                disabled={isResetting}
                variant="outline"
                size="sm"
                className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
                title="重置 Pipeline 环境"
              >
                <RotateCcw size={16} className={`mr-2 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? '重置中...' : '重置环境'}
              </Button>
              
              <Button variant="outline" size="sm" asChild>
                <a href="/">
                  <Home size={16} className="mr-2" />
                  返回主页
                </a>
              </Button>
              
              <Button size="sm" asChild>
                <a href="/editor/sandbox-project">
                  <Code size={16} className="mr-2" />
                  打开编辑器
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-8xl mx-auto py-8 px-6">

        {/* Pipeline 执行状态 */}
        {pipelineStatus.stage !== 'idle' && (
          <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStageIcon(pipelineStatus.stage)}
                  <CardTitle className="text-xl">Pipeline 执行状态</CardTitle>
                </div>
                <Badge variant={pipelineStatus.stage === 'completed' ? 'default' : 'secondary'}>
                  {pipelineStatus.currentStep}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={pipelineStatus.progress} className="h-2" />
                <div className="text-sm text-gray-600">
                  进度: {pipelineStatus.progress}% - {pipelineStatus.currentStep}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 功能标签页 */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                <Workflow className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  前端组件 Pipeline
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 mt-2">
                  自动化的前端组件构建、测试和部署流水线，支持持续集成和持续交付
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Workflow className="w-4 h-4" />
                <span>自动化流水线</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>质量检测</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>快速部署</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-gray-100/50 p-1 rounded-xl">
                <TabsTrigger 
                  value="templates" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-green-600 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Package className="w-4 h-4" />
                    </div>
                    <span className="font-medium">📦 场景/模板管理</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <History className="w-4 h-4" />
                    </div>
                    <span className="font-medium">🎨 风格管理</span>
                  </div>
                </TabsTrigger>
              </TabsList>
              
              
              <TabsContent value="templates" className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">新增场景</h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    按场景创建、下载和修改前端组件模板。支持批量生成组件、下载压缩包和上传自定义模板文件
                  </p>
                </div>

                {/* 场景模板生成卡片 */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-green-600" />
                      场景模板生成
                    </CardTitle>
                    <CardDescription>
                      输入场景描述，AI 自动生成对应的组件模板列表
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          场景描述 *
                        </label>
                        <input
                          type="text"
                          value={selectedScene}
                          onChange={(e) => setSelectedScene(e.target.value)}
                          placeholder="例如: 电商平台、后台管理系统、数据分析平台..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          场景英文描述
                        </label>
                        <input
                          type="text"
                          value={selectedSceneEn}
                          onChange={(e) => setSelectedSceneEn(e.target.value)}
                          placeholder="例如: E-commerce Platform, Admin Dashboard, Data Analytics Platform..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          // 自动获取所有风格的 name_en 用逗号分隔
                          const stylizeValue = styles.length > 0 
                            ? styles.map(style => style.name_en).join(',')
                            : '';
                          createTemplateByScene(selectedScene, selectedSceneEn, stylizeValue);
                        }}
                        disabled={!selectedScene.trim() || isCreatingTemplate}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        {isCreatingTemplate ? (
                          <>
                            <Layers className="w-4 h-4 mr-2 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            生成模板
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 生成的模板列表 */}
                {templates.length > 0 && (
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        生成的模板列表
                      </CardTitle>
                      <CardDescription>
                        点击模板卡片选中并编辑模板，已选中的模板会显示蓝色边框
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map((template: any, index) => (
                          <div 
                            key={template.id || index} 
                            onClick={() => handleSelectTemplate(template)}
                            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                              selectedTemplate?.id === template.id
                                ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">{template.component_name}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {template.scene_tag}
                                </Badge>
                                {selectedTemplate?.id === template.id && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {template.component_desc}
                            </p>
                            
                            <div className="space-y-2 text-xs text-gray-500">
                              <div>
                                <span className="font-medium">适用组件:</span> {template.applied_components}
                              </div>
                              <div>
                                <span className="font-medium">适用页面:</span> {template.applicable_pages}
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="secondary" className="text-xs">{template.stype_tag}</Badge>
                                <Badge variant="secondary" className="text-xs">{template.function_tag}</Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">已生成的场景</h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    查看已生成的场景列表，选择场景查看其组件详情，并支持下载历史场景的组件包。
                  </p>
                </div>

                {/* 历史场景列表 */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5 text-blue-600" />
                      已生成的场景列表
                    </CardTitle>
                    <CardDescription>
                      点击场景卡片查看该场景下的组件列表
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingScenes ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">加载场景列表...</p>
                      </div>
                    ) : historyScenes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>暂无已生成的场景数据</p>
                        <Button 
                          onClick={getSceneList}
                          variant="outline" 
                          className="mt-4"
                        >
                          刷新列表
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {historyScenes.map((scene: any, index) => (
                          <div 
                            key={scene.scene_en || index} 
                            onClick={() => handleSelectHistoryScene(scene)}
                            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                              selectedHistoryScene?.scene_en === scene.scene_en || selectedHistoryScene === scene
                                ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">
                                {scene.scene || scene.scene_cn || '未命名场景'}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {scene.scene_en || 'EN'}
                                </Badge>
                                {(selectedHistoryScene?.scene_en === scene.scene_en || selectedHistoryScene === scene) && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">
                              {scene.description || scene.scene_en || '该场景的组件模板集合'}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500">
                                <span className="font-medium">场景标识:</span> {scene.scene_en || 'N/A'}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadHistoryScene(scene.scene || scene.scene_cn, scene.scene_en);
                                }}
                                disabled={isDownloadingHistory}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                {isDownloadingHistory ? (
                                  <Download className="w-3 h-3 animate-bounce" />
                                ) : (
                                  <>
                                    <Download className="w-3 h-3 mr-1" />
                                    下载
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 选中场景的组件列表 */}
                {selectedHistoryScene && (
                  <Card className="animate-in slide-in-from-bottom-2 duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5 text-blue-600" />
                          <CardTitle>
                            {selectedHistoryScene.scene || selectedHistoryScene.scene_cn || '场景'} - 组件列表
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {selectedHistoryScene.scene_en}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => downloadHistoryScene(
                              selectedHistoryScene.scene || selectedHistoryScene.scene_cn, 
                              selectedHistoryScene.scene_en
                            )}
                            disabled={isDownloadingHistory}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                            {isDownloadingHistory ? (
                              <>
                                <Download className="w-4 h-4 mr-2 animate-bounce" />
                                下载中...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                下载场景
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        该场景下包含的所有组件模板，点击组件卡片查看详细信息
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingComponents ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <p className="mt-2 text-gray-600">加载组件列表...</p>
                        </div>
                      ) : historyComponents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p>该场景下暂无组件数据</p>
                        </div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead className="font-semibold">组件名称</TableHead>
                                <TableHead className="font-semibold">场景标签</TableHead>
                                <TableHead className="font-semibold">组件描述</TableHead>
                                <TableHead className="font-semibold">风格标签</TableHead>
                                <TableHead className="font-semibold">功能标签</TableHead>
                                <TableHead className="font-semibold text-center">详情</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {historyComponents.map((component: any, index) => (
                                <TableRow
                                  key={component.id || index}
                                  className="cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                                  onClick={() => handleViewComponentDetails(component)}
                                >
                                  <TableCell className="font-medium">
                                    {component.component_name}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {component.scene_tag || 'N/A'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="max-w-md">
                                    <div className="truncate" title={component.component_desc}>
                                      {component.component_desc}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {component.stype_tag && (
                                      <Badge variant="secondary" className="text-xs">{component.stype_tag}</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {component.function_tag && (
                                      <Badge variant="secondary" className="text-xs">{component.function_tag}</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewComponentDetails(component);
                                      }}
                                      className="h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      详情
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              </TabsContent>
              
              <TabsContent value="history" className="space-y-6">
                <StyleManagement 
                  styles={styles}
                  loading={isLoadingStyles}
                  message={styleMessage}
                  onLoadStyles={loadStyles}
                  onSaveStyle={saveStyle}
                  onDeleteStyle={deleteStyle}
                />
              </TabsContent>
              
            </Tabs>
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <div className="mt-12 text-center text-gray-500">
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Pipeline 引擎运行中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>构建环境就绪</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>部署服务正常</span>
            </div>
          </div>
          <p className="text-sm">
            基于 Docker 和 Kubernetes • 支持多环境部署 • 自动化测试集成
          </p>
        </div>
      </main>

      {/* 重置确认对话框 */}
      <ResetConfirmationDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onConfirm={resetSandbox}
        isResetting={isResetting}
      />

    </div>
  );
}
