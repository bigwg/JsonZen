/**
 * 特性说明侧边栏组件
 * 可以滑出/滑入，不影响编辑器宽度
 */

import { useState, useEffect } from 'react';
import { ChevronRight, Sparkles, Zap, Shield, Code, AlertCircle, Wand2, X } from 'lucide-react';

const FeaturesSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  // 从 localStorage 读取用户的选择
  useEffect(() => {
    const saved = localStorage.getItem('json-tools-sidebar-open');
    if (saved !== null) {
      setIsOpen(JSON.parse(saved));
    }
  }, []);

  // 保存用户的选择到 localStorage
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem('json-tools-sidebar-open', JSON.stringify(newState));
  };

  const features = [
    {
      icon: <Sparkles className="w-5 h-5 text-blue-500" />,
      title: '支持 JSON 注释',
      description: '支持 // 和 /* */ 两种注释格式'
    },
    {
      icon: <Code className="w-5 h-5 text-purple-500" />,
      title: '10+ 强大功能',
      description: '格式化、压缩、转换、转义等'
    },
    {
      icon: <Shield className="w-5 h-5 text-green-500" />,
      title: '大数字精度保护',
      description: '完美保留大整数精度'
    },
    {
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      title: '数字 Key 支持',
      description: '支持 {1: "value"} 格式'
    },
    {
      icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
      title: '实时错误检测',
      description: '自动检测重复 Key 和语法错误'
    },
    {
      icon: <Wand2 className="w-5 h-5 text-pink-500" />,
      title: 'Java toString 转换',
      description: '一键转换为标准 JSON'
    }
  ];

  return (
    <>
      {/* 侧边栏 - 从左边滑出 */}
      <div
        className={`fixed left-0 top-0 h-screen w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 侧边栏头部 */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">
              工具特性
            </h2>
          </div>
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
            title="关闭"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* 特性列表 */}
        <div className="p-4 space-y-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-white dark:from-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              💡 <strong>提示：</strong>点击左上角按钮可以打开/关闭此面板。
            </p>
          </div>
        </div>
      </div>

       {/* 打开按钮 - 固定在左上角 */}
       {!isOpen && (
         <button
           onClick={handleToggle}
           className="fixed left-6 top-24 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl z-30 group flex items-center gap-2 font-medium text-sm"
           title="打开特性说明"
         >
           <Sparkles className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
           <span>特性说明</span>
           <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
         </button>
       )}

      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 transition-opacity duration-300"
          onClick={handleToggle}
        />
      )}
    </>
  );
};

export default FeaturesSidebar;
