/**
 * JSON编辑器相关的自定义Hook
 */

import { useState, useEffect, useRef } from 'react';
import { APP_CONFIG } from '../constants/index.js';

/**
 * JSON编辑器状态管理Hook
 * @returns {Object} 编辑器状态和操作方法
 */
export const useJsonEditor = () => {
  // 从缓存中获取初始内容
  const getInitialContent = () => {
    try {
      const cachedContent = localStorage.getItem(APP_CONFIG.CACHE_KEY);
      if (cachedContent && cachedContent !== APP_CONFIG.DEFAULT_CONTENT) {
        return cachedContent;
      }
    } catch (error) {
      console.error("读取缓存失败:", error);
    }
    return APP_CONFIG.DEFAULT_CONTENT;
  };

  const [jsonContent, setJsonContent] = useState(getInitialContent);
  const [shouldResetPosition, setShouldResetPosition] = useState(false);
  const editorRef = useRef(null);

  // 缓存内容到localStorage
  const saveToCache = (content) => {
    try {
      // 只有当内容不是默认提示且不为空时才缓存
      if (content && content.trim() !== "" && content !== APP_CONFIG.DEFAULT_CONTENT) {
        localStorage.setItem(APP_CONFIG.CACHE_KEY, content);
      }
    } catch (error) {
      console.error("保存缓存失败:", error);
    }
  };

  // 重置编辑器滚动位置
  const resetEditorPosition = () => {
    setShouldResetPosition(true);
  };

  // 回到顶部功能
  const scrollToTop = () => {
    if (editorRef.current) {
      editorRef.current.revealPosition({ lineNumber: 1, column: 1 });
      editorRef.current.setPosition({ lineNumber: 1, column: 1 });
    }
  };

  // 监听jsonContent变化，只在需要时重置编辑器滚动位置
  useEffect(() => {
    if (editorRef.current && shouldResetPosition) {
      // 使用setTimeout确保DOM已更新
      setTimeout(() => {
        // 重置滚动位置到左上角
        editorRef.current.revealPosition({ lineNumber: 1, column: 1 });
        // 可选：强制编辑器重新布局
        editorRef.current.layout();
      }, APP_CONFIG.EDITOR_RESET_DELAY);

      // 重置标志
      setShouldResetPosition(false);
    }
  }, [jsonContent, shouldResetPosition]);

  // 监听内容变化并保存到缓存
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToCache(jsonContent);
    }, APP_CONFIG.DEBOUNCE_DELAY); // 防抖：1秒后保存

    return () => clearTimeout(timeoutId);
  }, [jsonContent]);

  // 处理内容变化
  const handleEditorChange = (value) => {
    setJsonContent(value);
    // 用户正常编辑时不重置位置
  };

  // 编辑器挂载完成后的回调
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;

    // 添加焦点事件监听
    editor.onDidFocusEditorText(() => {
      const currentValue = editor.getValue();
      if (currentValue === APP_CONFIG.DEFAULT_CONTENT) {
        setJsonContent("");
      }
    });

    // 添加失去焦点事件监听
    editor.onDidBlurEditorText(() => {
      // 获取当前编辑器的值
      const currentValue = editor.getValue();
      if (!currentValue || currentValue.trim() === "") {
        setJsonContent(APP_CONFIG.DEFAULT_CONTENT);
        setShouldResetPosition(true); // 设置默认内容时才重置位置
      } else {
        // 失去焦点时立即保存到缓存
        saveToCache(currentValue);
      }
    });
  };

  return {
    jsonContent,
    setJsonContent,
    editorRef,
    shouldResetPosition,
    setShouldResetPosition,
    resetEditorPosition,
    scrollToTop,
    handleEditorChange,
    handleEditorDidMount,
  };
}; 