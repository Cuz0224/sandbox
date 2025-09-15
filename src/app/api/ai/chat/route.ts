import { NextResponse } from 'next/server';
import { ProjectManager } from '@/lib/project-manager';
import { DifyClient } from '@/lib/ai/dify-client';

const projectManager = ProjectManager.getInstance();

// 初始化 Dify 客户端
function getDifyClient(): DifyClient {
    const apiEndpoint = process.env.DIFY_API_ENDPOINT;

    if (!apiEndpoint) {
        throw new Error('请设置 DIFY_API_ENDPOINT 环境变量');
    }

    return DifyClient.getInstance(apiEndpoint);
}

export async function POST(request: Request) {
    try {
        const { 
            message, 
            projectId = 'default-project', 
            conversationId,
            currentFiles = {},
            context = ''
        } = await request.json();

        if (!message) {
            return NextResponse.json({
                success: false,
                error: '请提供对话消息'
            }, { status: 400 });
        }

        console.log(`💬 开始 Dify 对话: ${message}`);
        console.log(`📁 项目ID: ${projectId}`);
        console.log(`🆔 对话ID: ${conversationId || 'new'}`);

        // 1. 构建对话上下文
        let enhancedContext = `项目ID: ${projectId}, 目标框架: nextjs`;
        
        if (context) {
            enhancedContext += `\n\n上下文信息: ${context}`;
        }

        // 如果有当前文件，添加到上下文中
        if (Object.keys(currentFiles).length > 0) {
            enhancedContext += `\n\n当前项目文件:\n`;
            Object.entries(currentFiles).forEach(([path, content]) => {
                enhancedContext += `\n文件: ${path}\n\`\`\`tsx\n${content}\n\`\`\`\n`;
            });
        }

        // 2. 初始化 Dify 客户端
        const difyClient = getDifyClient();

        // 3. 调用 Dify 进行对话
        const chatResult = await difyClient.generateUI(message, {
            projectType: 'nextjs',
            component_type: 'component'
        });

        console.log(`✅ Dify 对话完成，生成了 ${chatResult.files.length} 个文件`);

        // 4. 如果有新文件生成，写入到 sandbox
        let updatedFiles: Array<{
            path: string;
            content: string;
            size: number;
            type: string;
        }> = [];
        if (chatResult.files && chatResult.files.length > 0) {
            const fileOperations = chatResult.files.map(async (file) => {
                console.log(`📝 写入文件: ${file.path}`);
                await projectManager.saveProjectFiles(projectId, {
                    [file.path]: file.content
                });
                return {
                    path: file.path,
                    content: file.content,
                    size: file.content.length,
                    type: file.type
                };
            });

            updatedFiles = await Promise.all(fileOperations);
        }

        // 5. 检查是否有组件需要预览
        let componentInfo = null;
        const mainComponent = chatResult.files?.find(file =>
            file.path.endsWith('.tsx') &&
            !file.path.includes('layout') &&
            !file.path.includes('globals')
        );

        if (mainComponent) {
            const componentName = mainComponent.path
                .replace(/^components\//, '')
                .replace(/\.tsx?$/, '');

            const importPath = mainComponent.path.replace(/\.tsx?$/, '');
            const componentPath = `app/${componentName}/page.tsx`;

            // 创建页面文件用于预览
            const pageContent = `'use client';

import React from 'react';
import ${componentName} from '@/${importPath}';

export default function Page() {
  return <${componentName} />;
}`;

            try {
                await projectManager.saveProjectFiles(projectId, {
                    [componentPath]: pageContent
                });

                componentInfo = {
                    name: componentName,
                    path: componentPath,
                    previewUrl: `/${componentName}`
                };
            } catch (error) {
                console.error('❌ 写入组件页面失败:', error);
            }
        }

        // 6. 检查配置文件变化
        const hasConfigChanges = chatResult.files?.some(file =>
            file.path.includes('package.json') ||
            file.path.includes('next.config') ||
            file.path.includes('tailwind.config')
        ) || false;

        return NextResponse.json({
            success: true,
            message: '对话处理完成',
            data: {
                response: chatResult.description || '已根据您的需求生成/修改了组件',
                filesGenerated: chatResult.files?.length || 0,
                files: updatedFiles,
                features: chatResult.features || [],
                dependencies: chatResult.dependencies || [],
                hasConfigChanges,
                conversationId: difyClient.getCurrentConversationId(),
                componentInfo,
                // 对话相关
                chat: {
                    message: message,
                    response: chatResult.description || '已根据您的需求生成/修改了组件',
                    timestamp: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Dify 对话失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '对话处理失败'
        }, { status: 500 });
    }
}

// 获取对话历史
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');
        const projectId = searchParams.get('projectId') || 'default-project';

        // 这里可以实现从数据库获取对话历史
        // 目前返回模拟数据
        return NextResponse.json({
            success: true,
            data: {
                conversationId: conversationId || `chat-${Date.now()}`,
                messages: [
                    {
                        id: '1',
                        type: 'ai',
                        content: '👋 你好！我是你的AI组件编辑助手。告诉我你想要创建或修改什么组件，我会帮你生成和优化代码。',
                        timestamp: new Date().toISOString()
                    }
                ],
                projectId
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: '获取对话历史失败'
        }, { status: 500 });
    }
}
