/**
 * 输入验证相关的工具函数
 */

import { APP_CONFIG } from '../constants/index.js';

/**
 * 检查内容是否为空或默认提示
 * @param {string} content - 要检查的内容
 * @returns {boolean} 是否为空或默认提示
 */
export const isEmptyOrDefault = (content) => {
  return !content || 
         content.trim() === "" || 
         content === APP_CONFIG.DEFAULT_CONTENT;
};

/**
 * 验证JSON字符串格式（兼容数字key）
 * @param {string} jsonStr - JSON字符串
 * @returns {Object} 验证结果 { isValid: boolean, error?: string, hasNumericKeys?: boolean, hasComments?: boolean }
 */
export const validateJsonFormat = (jsonStr) => {
  try {
    // 首先尝试标准JSON解析
    JSON.parse(jsonStr);
    return { isValid: true, hasNumericKeys: false, hasComments: false };
  } catch (error) {
    // 检测是否包含注释和数字key
    const hasComments = jsonStr.includes('//') || jsonStr.includes('/*');
    const hasNumericKeys = /(\s*)(\d+)(\s*):/g.test(jsonStr);
    
    // 如果包含注释，认为可能是有效的JSON（由AST系统处理）
    if (hasComments) {
      return { 
        isValid: true, // 暂时认为有效，具体验证交给AST系统
        hasNumericKeys,
        hasComments: true 
      };
    }
    
    // 如果只是数字key问题，尝试简单处理
    if (hasNumericKeys) {
      try {
        const processedJson = jsonStr.replace(/(\s*)(\d+)(\s*):/g, '$1"$2"$3:');
        JSON.parse(processedJson);
        return { isValid: true, hasNumericKeys: true, hasComments: false };
      } catch (preprocessError) {
        // 预处理失败，使用原始错误
      }
    }
    
    return { 
      isValid: false, 
      error: error.message,
      hasNumericKeys,
      hasComments
    };
  }
}; 