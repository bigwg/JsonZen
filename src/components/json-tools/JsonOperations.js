/**
 * JSON操作函数模块
 * 包含所有JSON处理相关的业务逻辑
 */

import { toast } from "sonner";

// 检查内容是否为空或默认提示
export const isEmptyOrDefault = (jsonContent) => {
  return !jsonContent || jsonContent.trim() === "" || jsonContent === "//请输入JSON，支持//或/**/形式的单行注释";
};

// 更可靠地查找行中的注释（考虑字符串内的注释符号，支持//和/* */两种形式）
export const findCommentsInLine = (line) => {
  let inString = false;
  let escapeNext = false;
  let commentStart = -1;
  let commentType = null; // 'line' 表示 // 注释, 'block' 表示 /* */ 注释

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (escapeNext) {
      // 如果前一个字符是转义字符，跳过当前字符的特殊处理
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      // 标记下一个字符为转义字符
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      // 切换字符串状态
      inString = !inString;
      continue;
    }

    // 只有在字符串外部才检测注释
    if (!inString) {
      // 检测 // 注释
      if (char === '/' && i + 1 < line.length && line[i + 1] === '/') {
        commentStart = i;
        commentType = 'line';
        break;
      }

      // 检测 /* 注释开始
      if (char === '/' && i + 1 < line.length && line[i + 1] === '*') {
        commentStart = i;
        commentType = 'block';
        break;
      }
    }
  }

  // 如果找到了块注释，查找对应的结束符号
  let commentEnd = -1;
  if (commentType === 'block' && commentStart !== -1) {
    // 从注释开始位置查找结束符号
    for (let i = commentStart + 2; i < line.length - 1; i++) {
      if (line[i] === '*' && line[i + 1] === '/') {
        commentEnd = i + 2; // 包含结束符号
        break;
      }
    }

    // 如果没有找到结束符号，视为无效注释
    if (commentEnd === -1) {
      commentStart = -1;
      commentType = null;
    }
  }

  return {
    hasComment: commentStart !== -1,
    commentStart: commentStart,
    commentEnd: commentEnd, // 仅对块注释有效
    commentType: commentType,
    commentText: commentStart !== -1
      ? (commentType === 'line'
        ? line.substring(commentStart)
        : line.substring(commentStart, commentEnd))
      : ''
  };
};

// 检查JSON是否包含注释
export const hasComments = (jsonStr) => {
  const lines = jsonStr.split('\n');

  for (let line of lines) {
    const commentInfo = findCommentsInLine(line);
    if (commentInfo.hasComment) {
      return true;
    }
  }

  return false;
};

// 处理注释的JSON解析（支持//和/* */两种注释形式）
export const parseJsonWithComments = (jsonStr) => {
  try {
    // 保留注释的格式化处理
    const lines = jsonStr.split('\n');
    const result = [];

    for (let line of lines) {
      // 使用更可靠的方法检测注释
      const commentInfo = findCommentsInLine(line);

      if (commentInfo.hasComment) {
        // 如果有注释，保留完整行
        result.push(line);
      } else {
        // 如果没有注释，保留原始行
        result.push(line);
      }
    }

    // 解析JSON（仅对非注释部分）
    const jsonOnly = result
      .map(line => {
        const commentInfo = findCommentsInLine(line);
        return commentInfo.hasComment
          ? line.substring(0, commentInfo.commentStart).trim()
          : line.trim();
      })
      .filter(line => line)
      .join('\n');

    console.log("准备解析的JSON:", jsonOnly);
    const parsed = JSON.parse(jsonOnly);
    console.log("解析后的对象:", parsed);
    return { parsed, formatted: result.join('\n') };
  } catch (error) {
    console.error("解析错误详情:", error);
    throw new Error("JSON解析错误：" + error.message);
  }
};

// 提取注释信息和JSON结构信息
export const extractCommentsAndStructure = (jsonStr) => {
  const lines = jsonStr.split('\n');
  const comments = [];
  const cleanLines = [];
  
  // 逐行处理，保持原始行号关系
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const commentInfo = findCommentsInLine(line);
    
    if (commentInfo.hasComment) {
      // 保存注释信息，包含原始行号和注释内容
      const contentBefore = line.substring(0, commentInfo.commentStart).trim();
      comments.push({
        originalLineIndex: i,
        commentText: commentInfo.commentText,
        contentBefore: contentBefore,
        hasContentBefore: contentBefore.length > 0
      });
      
      // 如果注释前有内容，保留内容部分
      if (contentBefore) {
        cleanLines.push(contentBefore);
      }
    } else {
      // 非注释行直接保留
      const trimmedLine = line.trim();
      if (trimmedLine) {
        cleanLines.push(line);
      }
    }
  }
  
  return { comments, cleanLines };
};

// 将格式化的JSON与注释合并（简化版）
export const mergeJsonWithComments = (formattedJson, originalData) => {
  const { comments } = originalData;
  const formattedLines = formattedJson.split('\n');
  const result = [];
  
  let commentIndex = 0;
  
  for (let i = 0; i < formattedLines.length; i++) {
    const line = formattedLines[i];
    const trimmedLine = line.trim();
    
    // 添加当前行
    result.push(line);
    
    // 检查是否有注释需要添加到这一行后面
    if (commentIndex < comments.length) {
      const comment = comments[commentIndex];
      
      // 如果注释原本有内容在前面，尝试匹配相似的内容行
      if (comment.hasContentBefore && trimmedLine) {
        // 简化匹配：检查是否包含关键字符
        const commentContent = comment.contentBefore.replace(/[{}[\],"\s]/g, '').toLowerCase();
        const currentContent = trimmedLine.replace(/[{}[\],"\s]/g, '').toLowerCase();
        
        // 如果内容相似或包含关系，添加注释
        if (commentContent && currentContent && 
            (commentContent.includes(currentContent) || 
             currentContent.includes(commentContent) ||
             commentContent === currentContent)) {
          result[result.length - 1] = `${line} ${comment.commentText}`;
          commentIndex++;
        }
      } else if (!comment.hasContentBefore) {
        // 如果注释原本是独立行，作为独立行添加
        result.push(comment.commentText);
        commentIndex++;
      }
    }
  }
  
  // 如果还有未处理的注释，添加到最后
  while (commentIndex < comments.length) {
    result.push(comments[commentIndex].commentText);
    commentIndex++;
  }
  
  return result.join('\n');
}; 