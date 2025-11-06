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
    // 使用更精确的数字key检测：确保数字前面不是引号，后面跟着冒号
    const hasNumericKeys = /(?<!")(\s*)(\d+)(\s*):(?!\s*")/g.test(jsonStr);
    
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
        // 使用相同的精确正则表达式进行替换
        const processedJson = jsonStr.replace(/(^|[^"])(\s*)(\d+)(\s*):/gm, (match, before, space1, num, space2) => {
          // 如果前面是引号，不替换
          if (before === '"') {
            return match;
          }
          return `${before}${space1}"${num}"${space2}:`;
        });
        JSON.parse(processedJson);
        return { isValid: true, hasNumericKeys: true, hasComments: false };
      } catch (preprocessError) {
        // 预处理失败，可能是重复key等问题
        // 这里不应该简单返回错误，而是让AST系统来处理，它能提供更详细的错误信息
        return { 
          isValid: true, // 暂时标记为有效，让AST系统处理
          hasNumericKeys: true, 
          hasComments: false,
          needsASTValidation: true // 标记需要AST验证
        };
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