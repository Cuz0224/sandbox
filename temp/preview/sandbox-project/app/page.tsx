
"use client";

import { useState } from 'react';
import TestCard from '../components/TestCard';
import InteractiveDemo from '../components/InteractiveDemo';

export default function HomePage() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('欢迎来到 Sandbox 测试环境！');

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* 标题区域 */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">
            🚀 Sandbox 测试环境
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            这是一个功能完整的测试环境，支持实时编辑、预览和调试
          </p>
        </div>

        {/* 交互演示区域 */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* 计数器组件 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 text-center">
              📊 计数器演示
            </h2>
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600 mb-4">
                {count}
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setCount(count - 1)}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                >
                  -1
                </button>
                <button
                  onClick={() => setCount(0)}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  重置
                </button>
                <button
                  onClick={() => setCount(count + 1)}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                >
                  +1
                </button>
              </div>
            </div>
          </div>

          {/* 消息输入组件 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 text-center">
              💬 消息编辑器
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入您的消息..."
              />
              <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] flex items-center justify-center">
                <p className="text-gray-700 text-center">
                  {message || '在这里显示您的消息...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 功能特性展示 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
            ✨ 功能特性
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <TestCard
              icon="⚡"
              title="实时预览"
              description="代码修改后立即看到效果，无需手动刷新页面，提升开发效率"
              color="blue"
            />
            <TestCard
              icon="🎨"
              title="语法高亮"
              description="支持多种编程语言的语法高亮和智能提示，让代码更易读"
              color="green"
            />
            <TestCard
              icon="🔧"
              title="调试工具"
              description="内置终端和日志查看功能，方便调试和开发过程中的问题排查"
              color="purple"
            />
          </div>
        </div>

        {/* 交互式演示区域 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
            🎮 交互式演示
          </h2>
          <InteractiveDemo />
        </div>

        {/* 状态信息 */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-lg p-6 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
            <span className="font-medium">系统状态: 运行中</span>
          </div>
          <p className="text-green-100">
            环境已就绪，您可以开始编辑代码或添加新功能
          </p>
        </div>
      </div>
    </main>
  );
}
