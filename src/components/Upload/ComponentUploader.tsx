"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

interface ComponentInfo {
  name: string;
  fileName: string;
  imported: boolean;
}

interface ComponentUploaderProps {
  isVisible: boolean;
  onClose: () => void;
  onUploadComplete?: (components: ComponentInfo[]) => void;
}

export default function ComponentUploader({ isVisible, onClose, onUploadComplete }: ComponentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    components?: ComponentInfo[];
    error?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // 创建进度模拟
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/components', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (result.success) {
        let pageUpdateSuccess = true;
        let pageUpdateMessage = '';
        
        // 自动更新页面
        try {
          const updateResponse = await fetch('/api/upload/components/update-page', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              components: result.componentList || []
            }),
          });
          
          const updateResult = await updateResponse.json();
          console.log('页面更新结果:', updateResult);
          
          if (!updateResult.success) {
            pageUpdateSuccess = false;
            pageUpdateMessage = updateResult.error || '页面更新失败';
          }
        } catch (updateError) {
          console.error('页面更新失败:', updateError);
          pageUpdateSuccess = false;
          pageUpdateMessage = `页面更新失败: ${(updateError as Error).message}`;
        }

        setUploadResult({
          success: true,
          message: pageUpdateSuccess 
            ? `${result.message}，页面已更新` 
            : `${result.message}，但页面更新失败: ${pageUpdateMessage}`,
          components: result.componentList || [],
          error: pageUpdateSuccess ? undefined : pageUpdateMessage
        });
        
        // 调用回调函数
        if (onUploadComplete && result.componentList) {
          onUploadComplete(result.componentList);
        }
      } else {
        setUploadResult({
          success: false,
          message: '上传失败',
          error: result.error
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: '上传过程中发生错误',
        error: (error as Error).message
      });
    } finally {
      setIsUploading(false);
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.zip')) {
        handleUpload(file);
      } else {
        setUploadResult({
          success: false,
          message: '文件格式错误',
          error: '请上传zip格式的文件'
        });
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border shadow-xl">
        <CardHeader className="bg-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 text-gray-900">
                <Upload className="h-5 w-5 text-gray-700" />
                <span>上传组件包</span>
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                上传包含React组件的zip文件，系统将自动解析并保存到项目中
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 bg-white">
          {/* 上传区域 */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">选择或拖拽zip文件</h3>
            <p className="text-gray-600 mb-4">
              支持包含.tsx组件文件的zip压缩包
            </p>
            <Button variant="outline" disabled={isUploading}>
              {isUploading ? '上传中...' : '选择文件'}
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* 上传进度 */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-700">
                <span>上传进度</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* 上传结果 */}
          {uploadResult && (
            <div className="space-y-4">
              <div className={`flex items-center space-x-2 ${
                uploadResult.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {uploadResult.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-medium">{uploadResult.message}</span>
              </div>

              {uploadResult.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-red-600 text-sm">{uploadResult.error}</p>
                </div>
              )}

              {uploadResult.success && uploadResult.components && uploadResult.components.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">
                    提取的组件 ({uploadResult.components.length}个):
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {uploadResult.components.map((component) => (
                      <div
                        key={component.name}
                        className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
                      >
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-mono">{component.fileName}</span>
                        <Badge variant="secondary" className="text-xs">
                          {component.name}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-blue-600 text-sm">
                      组件已保存到 <code className="bg-blue-100 px-1 rounded">sandbox/components/</code> 目录中
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
            {uploadResult?.success && (
              <Button 
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700"
              >
                完成
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}