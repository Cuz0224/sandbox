"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Edit3, 
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { proxyRequest } from '@/utils/request';

interface StyleItem {
  id?: string;
  name: string;
  name_en: string;
  description: string;
  prompt_text: string;
  created_at?: string;
  updated_at?: string;
}

export default function StyleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const nameEn = params.name_en as string;
  
  // 状态管理
  const [style, setStyle] = useState<StyleItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    name: '',
    name_en: '',
    description: '',
    prompt_text: ''
  });

  // 加载风格详情
  const loadStyleDetail = async () => {
    setLoading(true);
    try {
      // 先获取风格列表，然后找到对应的风格
      const response = await proxyRequest('/frontend_component/get_stylize_list', {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code === 200 && data.data?.data) {
        const styles = data.data.data;
        const targetStyle = styles.find((s: StyleItem) => s.name_en === decodeURIComponent(nameEn));
        
        if (targetStyle) {
          setStyle(targetStyle);
          setEditForm({
            name: targetStyle.name,
            name_en: targetStyle.name_en,
            description: targetStyle.description,
            prompt_text: targetStyle.prompt_text
          });
        } else {
          throw new Error('风格不存在');
        }
      } else {
        throw new Error(data.msg || '获取风格详情失败');
      }
    } catch (error) {
      console.error('加载风格详情失败:', error);
      setMessage({ type: 'error', text: `加载失败: ${error instanceof Error ? error.message : '未知错误'}` });
    } finally {
      setLoading(false);
    }
  };

  // 保存风格
  const saveStyle = async () => {
    if (!editForm.name.trim() || !editForm.name_en.trim()) {
      setMessage({ type: 'error', text: '请填写完整信息' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await proxyRequest('/frontend_component/upsert_stylize', {
        method: 'POST',
        body: {
          name: editForm.name,
          name_en: editForm.name_en,
          description: editForm.description,
          prompt_text: editForm.prompt_text
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code === 200) {
        setMessage({ type: 'success', text: '保存成功' });
        setStyle(prev => prev ? { ...prev, ...editForm } : null);
        setIsEditing(false);
      } else {
        throw new Error(data.msg || '保存失败');
      }
    } catch (error) {
      console.error('保存风格失败:', error);
      setMessage({ type: 'error', text: `保存失败: ${error instanceof Error ? error.message : '未知错误'}` });
    } finally {
      setIsSaving(false);
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    if (style) {
      setEditForm({
        name: style.name,
        name_en: style.name_en,
        description: style.description,
        prompt_text: style.prompt_text
      });
    }
    setIsEditing(false);
  };

  // 初始化加载
  useEffect(() => {
    if (nameEn) {
      loadStyleDetail();
    }
  }, [nameEn]);

  // 清空消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (!style) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">风格不存在</h2>
              <p className="text-gray-600 mb-4">请求的风格配置不存在或已被删除</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 消息提示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-md flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {/* 头部导航 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold">风格详情</h1>
              <p className="text-gray-600">查看和编辑风格化配置</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={cancelEdit}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-2" />
                  取消
                </Button>
                <Button 
                  onClick={saveStyle}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  保存
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                编辑
              </Button>
            )}
          </div>
        </div>

        {/* 风格信息卡片 */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>风格的基本配置信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">中文名称</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="请输入中文名称"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <span className="font-medium">{style.name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en">英文名称</Label>
                  {isEditing ? (
                    <Input
                      id="name_en"
                      value={editForm.name_en}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name_en: e.target.value }))}
                      placeholder="请输入英文名称"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <Badge variant="outline">{style.name_en}</Badge>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="请输入描述信息"
                    rows={3}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border min-h-[80px]">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {style.description || '暂无描述'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>提示词配置</CardTitle>
              <CardDescription>用于AI生成的提示词内容</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="prompt_text">提示词</Label>
                {isEditing ? (
                  <Textarea
                    id="prompt_text"
                    value={editForm.prompt_text}
                    onChange={(e) => setEditForm(prev => ({ ...prev, prompt_text: e.target.value }))}
                    placeholder="请输入提示词"
                    rows={6}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-md border min-h-[120px]">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {style.prompt_text || '暂无提示词'}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 元数据信息 */}
          <Card>
            <CardHeader>
              <CardTitle>元数据</CardTitle>
              <CardDescription>风格的创建和更新时间信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">创建时间</Label>
                  <p className="mt-1 text-gray-700">
                    {style.created_at ? new Date(style.created_at).toLocaleString('zh-CN') : '未知'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">更新时间</Label>
                  <p className="mt-1 text-gray-700">
                    {style.updated_at ? new Date(style.updated_at).toLocaleString('zh-CN') : '未知'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
