// JSON工具函数库

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

/**
 * 解析JSON字符串并构建语义路径映射
 * @param {string} jsonStr - JSON字符串
 * @returns {Object} 语义路径到行号的映射
 */
const buildSemanticPathMap = (jsonStr) => {
  const lines = jsonStr.split('\n');
  const pathMap = new Map();
  const stack = []; // 路径栈
  let currentPath = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // 检测对象开始
    if (line.includes('{')) {
      if (currentPath) {
        pathMap.set(currentPath, i);
      }
    }
    
    // 检测属性名
    const propertyMatch = line.match(/^"([^"]+)"\s*:/);
    if (propertyMatch) {
      const key = propertyMatch[1];
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      pathMap.set(newPath, i);
      
      // 如果该行包含值，也记录完整的键值路径
      if (line.includes(':')) {
        const valueStartIndex = line.indexOf(':') + 1;
        const valueContent = line.substring(valueStartIndex).trim();
        if (valueContent && !valueContent.startsWith('{') && !valueContent.startsWith('[')) {
          pathMap.set(`${newPath}:value`, i);
        }
      }
    }
  }
  
  return pathMap;
};

/**
 * 从注释前的内容推断语义路径
 * @param {string} contentBefore - 注释前的内容
 * @returns {string} 推断的语义路径
 */
const inferSemanticPath = (contentBefore) => {
  if (!contentBefore) return '';
  
  // 匹配属性名模式 "key": 或 "key":value
  const propertyMatch = contentBefore.match(/"([^"]+)"\s*:/);
  if (propertyMatch) {
    const key = propertyMatch[1];
    
    // 检查是否有值
    const colonIndex = contentBefore.indexOf(':');
    const afterColon = contentBefore.substring(colonIndex + 1).trim();
    
    if (afterColon && !afterColon.startsWith('{') && !afterColon.startsWith('[')) {
      return `${key}:value`; // 属性值注释
    } else {
      return key; // 属性名注释
    }
  }
  
  // 如果包含对象结构标识符，返回通用路径
  if (contentBefore.includes('{') || contentBefore.includes('}')) {
    return 'object';
  }
  
  if (contentBefore.includes('[') || contentBefore.includes(']')) {
    return 'array';
  }
  
  return 'unknown';
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
      const semanticPath = inferSemanticPath(contentBefore);
      
      comments.push({
        originalLineIndex: i,
        commentText: commentInfo.commentText,
        contentBefore: contentBefore,
        hasContentBefore: contentBefore.length > 0,
        semanticPath: semanticPath, // 添加语义路径
        commentType: commentInfo.commentType
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

/**
 * 在格式化的JSON中找到最匹配的行位置
 * @param {Array} formattedLines - 格式化后的JSON行数组
 * @param {Object} comment - 注释对象
 * @returns {number} 最匹配的行索引，-1表示未找到
 */
const findBestMatchLine = (formattedLines, comment) => {
  if (!comment.hasContentBefore || !comment.semanticPath) {
    return -1;
  }
  
  const { semanticPath, contentBefore } = comment;
  
  // 如果是属性值注释，查找对应的属性行
  if (semanticPath.endsWith(':value')) {
    const key = semanticPath.replace(':value', '');
    for (let i = 0; i < formattedLines.length; i++) {
      const line = formattedLines[i];
      const propertyMatch = line.match(/"([^"]+)"\s*:/);
      if (propertyMatch && propertyMatch[1] === key) {
        // 检查该行是否包含值（不是对象或数组）
        const colonIndex = line.indexOf(':');
        const afterColon = line.substring(colonIndex + 1).trim();
        if (afterColon && !afterColon.startsWith('{') && !afterColon.startsWith('[')) {
          return i;
        }
      }
    }
  }
  
  // 如果是属性名注释，查找对应的属性行
  if (semanticPath && semanticPath !== 'object' && semanticPath !== 'array' && semanticPath !== 'unknown') {
    const key = semanticPath.split(':')[0];
    for (let i = 0; i < formattedLines.length; i++) {
      const line = formattedLines[i];
      const propertyMatch = line.match(/"([^"]+)"\s*:/);
      if (propertyMatch && propertyMatch[1] === key) {
        return i;
      }
    }
  }
  
  // 回退到内容匹配
  const cleanContentBefore = contentBefore.replace(/[{}\[\],"\s]/g, '').toLowerCase();
  let bestMatch = -1;
  let bestScore = 0;
  
  for (let i = 0; i < formattedLines.length; i++) {
    const line = formattedLines[i].trim();
    if (!line) continue;
    
    const cleanLine = line.replace(/[{}\[\],"\s]/g, '').toLowerCase();
    
    // 计算相似度分数
    let score = 0;
    if (cleanContentBefore === cleanLine) {
      score = 100; // 完全匹配
    } else if (cleanLine.includes(cleanContentBefore) || cleanContentBefore.includes(cleanLine)) {
      score = 80; // 包含关系
    } else {
      // 计算公共子字符串长度
      const commonLength = longestCommonSubstring(cleanContentBefore, cleanLine);
      if (commonLength > 0) {
        score = (commonLength / Math.max(cleanContentBefore.length, cleanLine.length)) * 60;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = i;
    }
  }
  
  // 只有当分数足够高时才返回匹配
  return bestScore > 50 ? bestMatch : -1;
};

/**
 * 计算最长公共子字符串长度
 * @param {string} str1 - 字符串1
 * @param {string} str2 - 字符串2
 * @returns {number} 最长公共子字符串长度
 */
const longestCommonSubstring = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  let maxLength = 0;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        maxLength = Math.max(maxLength, dp[i][j]);
      }
    }
  }
  
  return maxLength;
};

// 将格式化的JSON与注释合并（基于语义结构）
export const mergeJsonWithComments = (formattedJson, originalData) => {
  const { comments } = originalData;
  const formattedLines = formattedJson.split('\n');
  const result = [...formattedLines]; // 复制格式化的行
  const processedComments = new Set(); // 记录已处理的注释
  
  // 按原始行号排序注释，保持相对顺序
  const sortedComments = [...comments].sort((a, b) => a.originalLineIndex - b.originalLineIndex);
  
  // 第一轮：精确匹配有内容的注释
  for (let i = 0; i < sortedComments.length; i++) {
    const comment = sortedComments[i];
    
    if (processedComments.has(i)) continue;
    
    if (comment.hasContentBefore) {
      const matchIndex = findBestMatchLine(formattedLines, comment);
      if (matchIndex !== -1) {
        // 在匹配的行后添加注释
        result[matchIndex] = `${result[matchIndex]} ${comment.commentText}`;
        processedComments.add(i);
      }
    }
  }
  
  // 第二轮：处理独立行注释（没有前置内容的注释）
  let insertIndex = 0;
  for (let i = 0; i < sortedComments.length; i++) {
    const comment = sortedComments[i];
    
    if (processedComments.has(i)) continue;
    
    if (!comment.hasContentBefore) {
      // 找到合适的插入位置
      while (insertIndex < result.length && result[insertIndex].trim() !== '') {
        insertIndex++;
      }
      
      if (insertIndex < result.length) {
        result.splice(insertIndex, 0, comment.commentText);
        insertIndex++;
      } else {
        result.push(comment.commentText);
      }
      processedComments.add(i);
    }
  }
  
  // 第三轮：处理剩余未匹配的注释，添加到合适位置
  const remainingComments = sortedComments.filter((_, index) => !processedComments.has(index));
  
  if (remainingComments.length > 0) {
    // 尝试根据原始行号比例找到插入位置
    const originalTotalLines = Math.max(...sortedComments.map(c => c.originalLineIndex)) + 1;
    const formattedTotalLines = result.length;
    
    for (const comment of remainingComments) {
      const relativePosition = comment.originalLineIndex / originalTotalLines;
      const targetIndex = Math.floor(relativePosition * formattedTotalLines);
      const insertPosition = Math.min(targetIndex, result.length);
      
      if (comment.hasContentBefore) {
        // 尝试添加到最近的非空行
        let nearestLineIndex = insertPosition;
        while (nearestLineIndex < result.length && result[nearestLineIndex].trim() === '') {
          nearestLineIndex++;
        }
        if (nearestLineIndex < result.length) {
          result[nearestLineIndex] = `${result[nearestLineIndex]} ${comment.commentText}`;
        } else {
          result.push(comment.commentText);
        }
      } else {
        result.splice(insertPosition, 0, comment.commentText);
      }
    }
  }
  
  return result.join('\n');
};

// 降级复制方法
export const fallbackCopyTextToClipboard = (text) => {
  return new Promise((resolve, reject) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        resolve();
      } else {
        reject(new Error('复制失败'));
      }
    } catch (error) {
      reject(error);
    }
  });
}; 