/**
 * JSON操作相关的自定义Hook
 */

import { toast } from "sonner";
import { 
  formatJson,
  compressJson,
  removeComments as removeCommentsAST,
  hasComments,
  convertCommentStyle,
  escapeJson as escapeJsonAST,
  unescapeJson as unescapeJsonAST,
  validateJson,
  detectBigNumbers,
  getJsonStats
} from '../utils/jsonAstUtils.js';
import { javaToStringToObject } from '../utils/jsonParser.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { isEmptyOrDefault } from '../utils/validation.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/index.js';

/**
 * JSON操作Hook
 * @param {string} jsonContent - JSON内容
 * @param {Function} setJsonContent - 设置JSON内容的函数
 * @param {Function} resetEditorPosition - 重置编辑器位置的函数
 * @param {number} indentSize - 缩进大小，默认为4
 * @returns {Object} JSON操作方法
 */
export const useJsonOperations = (jsonContent, setJsonContent, resetEditorPosition, indentSize = 4) => {
  
  // 统一的错误处理函数
  const handleJsonError = (error, defaultMessage = '') => {
    if (error.duplicateKeyInfo) {
      const info = error.duplicateKeyInfo;
      
      // 简化路径显示
      let pathDisplay = info.path;
      if (pathDisplay && pathDisplay !== 'root') {
        // 如果路径太长，只显示最后几层
        const pathParts = pathDisplay.split('.');
        if (pathParts.length > 3) {
          pathDisplay = '...' + pathParts.slice(-2).join('.');
        }
      } else {
        pathDisplay = '根对象';
      }
      
      toast.error(
        `发现重复的key "${info.duplicateKey}"\n` + 
        `首次出现: 第${info.firstOccurrence.line}行\n` +
        `重复位置: 第${info.secondOccurrence.line}行\n` +
        (pathDisplay !== '根对象' ? `位置: ${pathDisplay}` : '')
      );
    } else {
      toast.error(defaultMessage + error.message);
    }
  };
  
  // 格式化JSON
  const formatJsonOperation = () => {
    try {
      console.log("原始JSON内容:", jsonContent);

      // 检查是否为空或默认提示
      if (isEmptyOrDefault(jsonContent)) {
        toast.error(ERROR_MESSAGES.EMPTY_INPUT);
        return;
      }

      // 检测大数字情况
      const bigNumberInfo = detectBigNumbers(jsonContent);
      if (bigNumberInfo.hasBigNumbers) {
        console.log("检测到大数字:", bigNumberInfo.bigNumbers);
      }

      // 使用新的AST格式化系统
      const formattedJson = formatJson(jsonContent, {
        indent: indentSize,
        preserveComments: true
      });
      
      console.log("格式化后的JSON:", formattedJson);

      // 更新内容
      setJsonContent(formattedJson);

      toast.success(SUCCESS_MESSAGES.FORMAT_SUCCESS);
    } catch (error) {
      console.error("格式化错误:", error);
      handleJsonError(error);
    }
  };

  // 压缩JSON
  const compressJsonOperation = () => {
    try {
      console.log("原始JSON内容:", jsonContent);

      // 检查是否为空或默认提示
      if (isEmptyOrDefault(jsonContent)) {
        toast.error(ERROR_MESSAGES.EMPTY_INPUT);
        return;
      }

      // 检查是否包含注释
      if (hasComments(jsonContent)) {
        toast.error(ERROR_MESSAGES.HAS_COMMENTS_COMPRESS);
        return;
      }

      // 使用新的AST压缩系统
      const compressedJson = compressJson(jsonContent);
      
      console.log("压缩后的JSON:", compressedJson);

      // 更新内容
      setJsonContent(compressedJson);

      // 重置编辑器位置
      resetEditorPosition();

      toast.success(SUCCESS_MESSAGES.COMPRESS_SUCCESS);
    } catch (error) {
      console.error("压缩错误:", error);
      handleJsonError(error, ERROR_MESSAGES.COMPRESS_FAILED);
    }
  };

  // 去除注释
  const removeCommentsOperation = () => {
    try {
      console.log("原始JSON内容:", jsonContent);

      // 检查是否为空或默认提示
      if (isEmptyOrDefault(jsonContent)) {
        toast.error(ERROR_MESSAGES.EMPTY_INPUT);
        return;
      }

      // 使用新的AST去除注释系统
      const cleanJson = removeCommentsAST(jsonContent, {
        indent: indentSize
      });
      
      console.log("去除注释后的JSON:", cleanJson);

      // 更新内容
      setJsonContent(cleanJson);

      // 重置编辑器位置
      resetEditorPosition();

      toast.success(SUCCESS_MESSAGES.REMOVE_COMMENTS_SUCCESS);
    } catch (error) {
      console.error("移除注释错误:", error);
      toast.error(error.message);
    }
  };

  // 转换注释格式（在//和/* */之间互相转换）
  const convertCommentStyleOperation = () => {
    try {
      console.log("原始JSON内容:", jsonContent);

      // 检查是否为空或默认提示
      if (isEmptyOrDefault(jsonContent)) {
        toast.error(ERROR_MESSAGES.EMPTY_INPUT);
        return;
      }

      // 检查是否包含注释
      if (!hasComments(jsonContent)) {
        toast.error(ERROR_MESSAGES.NO_COMMENTS);
        return;
      }

      // 使用新的AST注释转换系统
      const convertedContent = convertCommentStyle(jsonContent);
      
      console.log("转换后的JSON:", convertedContent);

      // 更新内容
      setJsonContent(convertedContent);

      // 重置编辑器位置
      resetEditorPosition();

      toast.success(SUCCESS_MESSAGES.CONVERT_COMMENTS_SUCCESS);
    } catch (error) {
      console.error("注释转换错误:", error);
      toast.error(ERROR_MESSAGES.COMMENT_CONVERT_FAILED + error.message);
    }
  };

  // 添加转义
  const escapeJsonOperation = () => {
    try {
      // 检查是否为空或默认提示
      if (isEmptyOrDefault(jsonContent)) {
        toast.error(ERROR_MESSAGES.EMPTY_INPUT);
        return;
      }

      const escaped = escapeJsonAST(jsonContent);
      setJsonContent(escaped);
      // 重置编辑器位置
      resetEditorPosition();
      toast.success(SUCCESS_MESSAGES.ESCAPE_SUCCESS);
    } catch (error) {
      toast.error(ERROR_MESSAGES.ESCAPE_FAILED + error.message);
    }
  };

  // 移除转义
  const unescapeJsonOperation = () => {
    try {
      // 检查是否为空或默认提示
      if (isEmptyOrDefault(jsonContent)) {
        toast.error(ERROR_MESSAGES.EMPTY_INPUT);
        return;
      }

      const unescaped = unescapeJsonAST(jsonContent);
      setJsonContent(unescaped);
      // 重置编辑器位置
      resetEditorPosition();
      toast.success(SUCCESS_MESSAGES.UNESCAPE_SUCCESS);
    } catch (error) {
      toast.error(ERROR_MESSAGES.UNESCAPE_FAILED + error.message);
    }
  };

  // 复制JSON内容
  const copyJson = async () => {
    try {
      // 检查是否为空或默认提示
      if (isEmptyOrDefault(jsonContent)) {
        toast.error(ERROR_MESSAGES.EMPTY_INPUT);
        return;
      }

      const success = await copyToClipboard(jsonContent);
      if (success) {
        toast.success(SUCCESS_MESSAGES.COPY_SUCCESS);
      } else {
        toast.error(ERROR_MESSAGES.COPY_FAILED);
      }
    } catch (error) {
      console.error("复制错误:", error);
      toast.error(ERROR_MESSAGES.COPY_FAILED + error.message);
    }
  };

  // Convert Java toString to JSON
  const convertToStringToJson = () => {
    if (isEmptyOrDefault(jsonContent)) {
      toast.error(ERROR_MESSAGES.EMPTY_INPUT);
      return;
    }
    try {
      const { result, warnings } = javaToStringToObject(jsonContent);
      if (warnings.length > 0) {
        toast.warning(warnings.join('\n'));
      }
      // 处理可能的大数字，使用自定义的JSON.stringify替换器
      const jsonString = JSON.stringify(result, (key, value) => {
        // 如果值是字符串且看起来像大整数，保持原样
        if (typeof value === 'string' && /^\d{16,}$/.test(value)) {
          return value;
        }
        return value;
      }, indentSize);
      setJsonContent(jsonString);
      resetEditorPosition();
      toast.success('成功转换为JSON');
    } catch (e) {
      toast.error('转换失败，不支持的数据格式');
    }
  };

  return {
    formatJson: formatJsonOperation,
    compressJson: compressJsonOperation,
    removeComments: removeCommentsOperation,
    convertCommentStyle: convertCommentStyleOperation,
    escapeJson: escapeJsonOperation,
    unescapeJson: unescapeJsonOperation,
    copyJson,
    convertToStringToJson,
  };
}; 