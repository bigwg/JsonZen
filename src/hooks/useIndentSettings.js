/**
 * 缩进设置Hook
 * 管理格式化缩进空格数的状态，支持localStorage持久化
 */

import { useState, useCallback, useEffect } from 'react';

const INDENT_STORAGE_KEY = 'json-tools-indent-size';

/**
 * 从localStorage获取缓存的缩进设置
 * @returns {number} 缓存的缩进大小，默认为4
 */
const getStoredIndentSize = () => {
  try {
    const stored = localStorage.getItem(INDENT_STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      return (parsed === 2 || parsed === 4) ? parsed : 4;
    }
  } catch (error) {
    console.warn('Failed to read indent size from localStorage:', error);
  }
  return 4; // 默认值
};

/**
 * 将缩进设置保存到localStorage
 * @param {number} size 缩进大小
 */
const storeIndentSize = (size) => {
  try {
    localStorage.setItem(INDENT_STORAGE_KEY, size.toString());
  } catch (error) {
    console.warn('Failed to save indent size to localStorage:', error);
  }
};

/**
 * 缩进设置Hook
 * @returns {Object} 缩进设置相关的状态和方法
 */
export const useIndentSettings = () => {
  // 从localStorage初始化缩进设置
  const [indentSize, setIndentSize] = useState(() => getStoredIndentSize());

  // 切换缩进大小
  const toggleIndentSize = useCallback(() => {
    setIndentSize(prev => {
      const newSize = prev === 2 ? 4 : 2;
      storeIndentSize(newSize);
      return newSize;
    });
  }, []);

  // 设置特定的缩进大小
  const setSpecificIndentSize = useCallback((size) => {
    if (size === 2 || size === 4) {
      setIndentSize(size);
      storeIndentSize(size);
    }
  }, []);

  // 组件挂载时确保从localStorage加载设置
  useEffect(() => {
    const storedSize = getStoredIndentSize();
    if (storedSize !== indentSize) {
      setIndentSize(storedSize);
    }
  }, []);

  return {
    indentSize,
    toggleIndentSize,
    setSpecificIndentSize
  };
};