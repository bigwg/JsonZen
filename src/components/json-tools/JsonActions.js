/**
 * JSON动作函数模块
 * 包含所有具体的JSON操作方法
 */
import { toast } from "sonner";
import {
  isEmptyOrDefault,
  findCommentsInLine,
  hasComments,
  parseJsonWithComments,
  extractCommentsAndStructure,
  mergeJsonWithComments
} from "./JsonOperations.js";

// 创建动作函数的工厂函数
export const createJsonActions = (jsonContent, setJsonContent, resetEditorPosition) => {
  
  // 转换注释格式（在//和/* */之间互相转换）
  const convertCommentStyle = () => {
    try {
      console.log("原始JSON内容:", jsonContent);

      // 检查是否为空或默认提示
      if (isEmptyOrDefault(jsonContent)) {
        toast.error("请输入JSON，支持//或/**/形式的单行注释");
        return;
      }

      // 检查是否包含注释
      if (!hasComments(jsonContent)) {
        toast.error("JSON不包含注释，无法转换注释格式");
        return;
      }

      const lines = jsonContent.split('\n');
      const result = [];

      for (let line of lines) {
        const commentInfo = findCommentsInLine(line);

        if (!commentInfo.hasComment) {
          // 如果没有注释，保持原样
          result.push(line);
          continue;
        }

        // 根据注释类型进行转换
        if (commentInfo.commentType === 'line') {
          // 将 // 注释转换为 /* */ 注释
          const commentText = line.substring(commentInfo.commentStart + 2).trim(); // 去掉 //
          const beforeComment = line.substring(0, commentInfo.commentStart);
          result.push(`${beforeComment}/* ${commentText} */`);
        } else if (commentInfo.commentType === 'block') {
          // 将 /* */ 注释转换为 // 注释
          // 提取注释内容（去掉 /* 和 */）
          const commentText = line.substring(commentInfo.commentStart + 2, commentInfo.commentEnd - 2).trim();
          const beforeComment = line.substring(0, commentInfo.commentStart);
          const afterComment = line.substring(commentInfo.commentEnd).trim();
          result.push(`${beforeComment}// ${commentText}${afterComment ? ' ' + afterComment : ''}`);
        }
      }

      const convertedContent = result.join('\n');
      console.log("转换后的JSON:", convertedContent);

      // 更新内容
      setJsonContent(convertedContent);

      // 重置编辑器位置
      resetEditorPosition();

      toast.success("注释格式已转换");
    } catch (error) {
      console.error("注释转换错误:", error);
      toast.error("注释格式转换失败：" + error.message);
    }
  };

  // 压缩JSON
  const compressJson = () => {
    try {
      console.log("原始JSON内容:", jsonContent);

      // 检查是否为空或默认提示
      if (isEmptyOrDefault(jsonContent)) {
        toast.error("请输入JSON，支持//或/**/形式的单行注释");
        return;
      }

      // 检查是否包含注释
      if (hasComments(jsonContent)) {
        toast.error("JSON包含注释，无法压缩，请去除注释后重试");
        return;
      }

      // 解析JSON
      const parsed = JSON.parse(jsonContent);

      // 使用JSON.stringify压缩（不带缩进和空格）
      const compressedJson = JSON.stringify(parsed);
      console.log("压缩后的JSON:", compressedJson);

      // 更新内容
      setJsonContent(compressedJson);

      // 重置编辑器位置
      resetEditorPosition();

      toast.success("JSON已压缩");
    } catch (error) {
      console.error("压缩错误:", error);
      toast.error("JSON压缩失败：" + error.message);
    }
  };

  // 去除注释
  const removeComments = () => {
    try {
      console.log("原始JSON内容:", jsonContent);

      // 检查是否为空或默认提示
      if (isEmptyOrDefault(jsonContent)) {
        toast.error("请输入JSON，支持//或/**/形式的单行注释");
        return;
      }

      // 解析JSON（移除注释）
      const { parsed } = parseJsonWithComments(jsonContent);

      // 使用JSON.stringify格式化（带缩进）
      const cleanJson = JSON.stringify(parsed, null, 2);
      console.log("去除注释后的JSON:", cleanJson);

      // 更新内容
      setJsonContent(cleanJson);

      // 重置编辑器位置
      resetEditorPosition();

      toast.success("注释已移除");
    } catch (error) {
      console.error("移除注释错误:", error);
      toast.error(error.message);
    }
  };

  // 格式化JSON
  const formatJson = () => {
    try {
      console.log("原始JSON内容:", jsonContent);

      // 检查是否为空或默认提示
      if (isEmptyOrDefault(jsonContent)) {
        toast.error("请输入JSON，支持//或/**/形式的单行注释");
        return;
      }

      // 提取注释和结构信息
      const structureData = extractCommentsAndStructure(jsonContent);

      // 解析JSON（移除注释）
      const { parsed } = parseJsonWithComments(jsonContent);

      // 使用JSON.stringify格式化（带缩进）
      const formattedJson = JSON.stringify(parsed, null, 2);
      console.log("格式化后的JSON:", formattedJson);

      // 尝试将注释合并回格式化后的JSON
      const finalResult = mergeJsonWithComments(formattedJson, structureData);
      console.log("最终结果（带注释）:", finalResult);

      // 更新内容
      setJsonContent(finalResult);

      toast.success("格式化成功");
    } catch (error) {
      console.error("格式化错误:", error);
      toast.error(error.message);
    }
  };

  // 添加转义
  const escapeJson = () => {
    try {
      // 检查是否为空或默认提示
      if (isEmptyOrDefault(jsonContent)) {
        toast.error("请输入JSON，支持//或/**/形式的单行注释");
        return;
      }

      const escaped = jsonContent.replace(/(?<!\\)"/g, '\\"');
      setJsonContent(escaped);
      // 重置编辑器位置
      resetEditorPosition();
      toast.success("转义添加成功");
    } catch (error) {
      toast.error("转义失败：" + error.message);
    }
  };

  // 移除转义
  const unescapeJson = () => {
    try {
      // 检查是否为空或默认提示
      if (isEmptyOrDefault(jsonContent)) {
        toast.error("请输入JSON，支持//或/**/形式的单行注释");
        return;
      }

      const unescaped = jsonContent.replace(/\\"/g, '"');
      setJsonContent(unescaped);
      // 重置编辑器位置
      resetEditorPosition();
      toast.success("转义移除成功");
    } catch (error) {
      toast.error("转义移除失败：" + error.message);
    }
  };

  // 复制JSON内容
  const copyJson = () => {
    try {
      // 检查是否为空或默认提示
      if (isEmptyOrDefault(jsonContent)) {
        toast.error("请输入JSON，支持//或/**/形式的单行注释");
        return;
      }

      // 复制当前编辑器内容到剪贴板
      navigator.clipboard.writeText(jsonContent).then(() => {
        toast.success("JSON内容已复制到剪贴板");
      }).catch((error) => {
        console.error("复制失败:", error);
        // 降级方案：使用传统的复制方法
        const textArea = document.createElement('textarea');
        textArea.value = jsonContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success("JSON内容已复制到剪贴板");
      });
    } catch (error) {
      console.error("复制错误:", error);
      toast.error("复制失败：" + error.message);
    }
  };

  // 返回所有动作函数
  return {
    convertCommentStyle,
    compressJson,
    removeComments,
    formatJson,
    escapeJson,
    unescapeJson,
    copyJson
  };
}; 