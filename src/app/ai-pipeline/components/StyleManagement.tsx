"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface StyleItem {
  id?: string;
  name: string;
  name_en: string;
  description: string;
  prompt_text: string;
  created_at?: string;
  updated_at?: string;
}

interface StyleManagementProps {
  styles: StyleItem[];
  loading: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  onLoadStyles: () => Promise<void>;
  onSaveStyle: (styleData: StyleItem) => Promise<boolean>;
  onDeleteStyle: (style: StyleItem) => Promise<void>;
}

const StyleManagement = ({ 
  styles, 
  loading, 
  message, 
  onLoadStyles, 
  onSaveStyle, 
  onDeleteStyle 
}: StyleManagementProps) => {
  const router = useRouter();
  
  // 本地状态管理
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<StyleItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<StyleItem | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    prompt_text: ''
  });



  // 处理创建
  const handleCreate = () => {
    setFormData({ name: '', name_en: '', description: '', prompt_text: '' });
    setIsCreateDialogOpen(true);
  };

  // 处理编辑
  const handleEdit = (style: StyleItem) => {
    setEditingStyle(style);
    setFormData({
      name: style.name,
      name_en: style.name_en,
      description: style.description,
      prompt_text: style.prompt_text
    });
    setIsEditDialogOpen(true);
  };

  // 处理删除确认
  const handleDelete = (style: StyleItem) => {
    setDeleteConfirm(style);
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.name_en.trim()) {
      return;
    }
    console.log('fofo', formData)

    const success = await onSaveStyle(formData);
    if (success) {
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingStyle(null);
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (deleteConfirm) {
      await onDeleteStyle(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  // 跳转到详情页
  const handleViewDetails = (style: StyleItem) => {
    router.push(`/style-detail/${encodeURIComponent(style.name_en)}`);
  };

  // 过滤数据
  const filteredStyles = styles.filter(style =>
    style.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    style.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    style.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 消息提示 */}
      {message && (
        <div className={`p-4 rounded-md flex items-center gap-2 ${
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

      {/* 头部操作区 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>风格管理</CardTitle>
              <CardDescription>管理组件风格化配置，支持创建、编辑和删除操作</CardDescription>
            </div>
            <Button onClick={handleCreate} className="flex items-center gap-2 bg-white border">
              <Plus className="w-4 h-4" />
              新建风格
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索风格..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={onLoadStyles}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              搜索
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 风格列表表格 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>中文名称</TableHead>
                <TableHead>英文名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>提示词</TableHead>
                <TableHead className="text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      加载中...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStyles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {searchTerm ? '没有找到匹配的风格' : '暂无风格数据'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStyles.map((style, index) => (
                  <TableRow 
                    key={style.name_en || index}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleViewDetails(style)}
                  >
                    <TableCell className="font-medium">
                      {style.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{style.name_en}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate" title={style.description}>
                        {style.description}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate" title={style.prompt_text}>
                        {style.prompt_text}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(style);
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(style);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(style);
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 创建/编辑对话框 */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setEditingStyle(null);
        }
      }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>
              {isCreateDialogOpen ? '新建风格' : '编辑风格'}
            </DialogTitle>
            <DialogDescription>
              {isCreateDialogOpen ? '创建一个新的风格化配置' : '修改现有的风格化配置'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">中文名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入中文名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_en">英文名称 *</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                  placeholder="请输入英文名称"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入描述信息"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prompt_text">提示词</Label>
              <Textarea
                id="prompt_text"
                value={formData.prompt_text}
                onChange={(e) => setFormData(prev => ({ ...prev, prompt_text: e.target.value }))}
                placeholder="请输入提示词"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                setEditingStyle(null);
              }}
            >
              取消
            </Button>
            <Button onClick={handleSubmit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => {
        if (!open) setDeleteConfirm(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除风格 "{deleteConfirm?.name}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirm(null)}
            >
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StyleManagement;
