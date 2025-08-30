/**
 * 更可靠地查找行中的注释
 *{string} line - 要检查的行
 * @returns {Object} 注释信息对象
 */
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

/**
 * 检查JSON是否包含注释
 * @param {string} jsonStr - JSON字符串
 * @returns {boolean} 是否包含注释
 */
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

/**
 * 保持大数字精度的JSON格式化函数
 * @param {string} jsonStr - 原始JSON字符串
 * @param {number} indent - 缩进空格数
 * @returns {string} 格式化后的JSON字符串，保持大数字精度
 */
const formatJsonPreservingBigNumbers = (jsonStr, indent = 4) => {
  // 首先移除注释，只保留纯JSON内容
  const lines = jsonStr.split('\n');
  const cleanJsonLines = lines.map(line => {
    const commentInfo = findCommentsInLine(line);
    return commentInfo.hasComment
      ? line.substring(0, commentInfo.commentStart).trim()
      : line.trim();
  }).filter(line => line);
  
  const cleanJson = cleanJsonLines.join('\n');
  
  // 使用字符串操作来格式化，避免JSON.parse的精度丢失
  try {
    // 验证JSON语法是否正确
    JSON.parse(cleanJson);
    
    // 手动格式化JSON，保持大数字不变
    return formatJsonString(cleanJson, indent);
  } catch (error) {
    throw new Error("JSON格式错误：" + error.message);
  }
};

/**
 * 手动格式化JSON字符串，保持数字精度
 * @param {string} jsonStr - 压缩的JSON字符串
 * @param {number} indent - 缩进空格数
 * @returns {string} 格式化后的JSON字符串
 */
const formatJsonString = (jsonStr, indent = 4) => {
  let result = '';
  let indentLevel = 0;
  let inString = false;
  let escapeNext = false;
  
  const addIndent = (level) => ' '.repeat(level * indent);
  
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    const nextChar = jsonStr[i + 1];
    
    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      result += char;
      inString = !inString;
      continue;
    }
    
    if (inString) {
      result += char;
      continue;
    }
    
    switch (char) {
      case '{':
      case '[':
        result += char;
        if (nextChar !== '}' && nextChar !== ']') {
          result += '\n';
          indentLevel++;
          result += addIndent(indentLevel);
        }
        break;
        
      case '}':
      case ']':
        if (result.trim().endsWith('{') || result.trim().endsWith('[')) {
          // 空对象或数组
          result += char;
        } else {
          result = result.trimEnd();
          result += '\n';
          indentLevel--;
          result += addIndent(indentLevel);
          result += char;
        }
        break;
        
      case ',':
        result += char;
        result += '\n';
        result += addIndent(indentLevel);
        break;
        
      case ':':
        result += char + ' ';
        break;
        
      case ' ':
      case '\t':
      case '\n':
      case '\r':
        // 跳过空白字符，我们自己控制格式
        break;
        
      default:
        result += char;
    }
  }
  
  return result;
};

/**
 * 导出保持大数字精度的格式化函数
 */
export { formatJsonPreservingBigNumbers };

/**
 * 处理注释的JSON解析
 * @param {string} jsonStr - 包含注释的JSON字符串
 * @returns {Object} 解析结果对象
 */
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
    
    // 对于格式化，我们需要返回原始字符串以保持大数字精度
    // 只在需要验证语法时才使用JSON.parse
    JSON.parse(jsonOnly); // 验证语法
    
    return { 
      parsed: null, // 不再返回解析后的对象，避免精度丢失
      jsonOnly: jsonOnly, // 返回清理后的JSON字符串
      formatted: result.join('\n') 
    };
  } catch (error) {
    console.error("解析错误详情:", error);
    throw new Error("JSON解析错误：" + error.message);
  }
};


/**
 * 基于穷举的注释定位算法 - 覆盖所有可能的注释情况
 * @param {string} contentBefore - 注释前的内容
 * @param {Array} lines - 原始JSON的所有行  
 * @param {number} originalLineIndex - 原始行号
 * @returns {Object} 包含定位信息的对象
 */
const analyzeCommentPosition = (contentBefore, lines, originalLineIndex) => {
  if (!contentBefore) return { type: 'standalone' };
  
  const trimmed = contentBefore.trim();
  
  // 类型1: "key": value //注释
  if (trimmed.match(/"[^"]+"\s*:\s*[^,}{\[\]]+$/)) {
    return analyzeFieldValueComment(trimmed, lines, originalLineIndex, false);
  }
  
  // 类型2: "key": value, //注释  
  if (trimmed.match(/"[^"]+"\s*:\s*[^,}{\[\]]+,$/)) {
    return analyzeFieldValueComment(trimmed, lines, originalLineIndex, true);
  }
  
  // 类型3: } //注释
  if (trimmed.endsWith('}') && !trimmed.endsWith(',')) {
    return analyzeBracketComment(trimmed, lines, originalLineIndex, '}', false);
  }
  
  // 类型4: }, //注释
  if (trimmed.endsWith('},')) {
    return analyzeBracketComment(trimmed, lines, originalLineIndex, '}', true);
  }
  
  // 类型5: ] //注释
  if (trimmed.endsWith(']') && !trimmed.endsWith(',')) {
    return analyzeBracketComment(trimmed, lines, originalLineIndex, ']', false);
  }
  
  // 类型6: ], //注释
  if (trimmed.endsWith('],')) {
    return analyzeBracketComment(trimmed, lines, originalLineIndex, ']', true);
  }
  
  // 类型7: { //注释 (较少见，但可能存在)
  if (trimmed.endsWith('{') && !trimmed.endsWith(',')) {
    return analyzeOpeningBracketComment(trimmed, lines, originalLineIndex, '{', false);
  }
  
  // 类型8: [ //注释 (较少见，但可能存在)
  if (trimmed.endsWith('[') && !trimmed.endsWith(',')) {
    return analyzeOpeningBracketComment(trimmed, lines, originalLineIndex, '[', false);
  }
  
  return { type: 'unknown' };
};

/**
 * 分析字段值后的注释
 */
const analyzeFieldValueComment = (trimmed, lines, originalLineIndex, hasComma) => {
  const match = trimmed.match(/"([^"]+)"\s*:\s*(.+?)(?:,)?$/);
  if (!match) return { type: 'unknown' };
  
  const key = match[1];
  const value = match[2].trim();
  
  return {
    type: 'field_value',
    key: key,
    hasComma: hasComma,
    anchor: {
      type: 'key_value',
      key: key,
      searchPattern: `"${key}"\\s*:`
    }
  };
};

/**
 * 分析右括号后的注释
 */
const analyzeBracketComment = (trimmed, lines, originalLineIndex, bracket, hasComma) => {
  // 找到对应的开括号和其key（支持数组索引）
  const openingInfo = findMatchingOpeningBracket(lines, originalLineIndex, bracket);
  
  // 构建搜索模式
  let searchPattern = null;
  if (openingInfo.isInArray && openingInfo.arrayIndex >= 0) {
    // 数组元素的搜索模式：找到数组key，然后定位到特定索引的元素
    searchPattern = `"${openingInfo.key}"\\s*:\\s*\\[`;
  } else if (openingInfo.key) {
    // 普通对象的搜索模式
    searchPattern = `"${openingInfo.key}"\\s*:\\s*[\\{\\[]`;
  }
  
  return {
    type: 'closing_bracket',
    bracket: bracket,
    hasComma: hasComma,
    openingInfo: openingInfo,
    anchor: {
      type: 'bracket_pair',
      openingKey: openingInfo.key,
      bracket: bracket,
      arrayIndex: openingInfo.arrayIndex,
      isInArray: openingInfo.isInArray,
      searchPattern: searchPattern
    }
  };
};

/**
 * 分析左括号后的注释
 */
const analyzeOpeningBracketComment = (trimmed, lines, originalLineIndex, bracket, hasComma) => {
  // 找到当前行或前几行的key
  const keyInfo = findKeyForOpeningBracket(lines, originalLineIndex);
  
  return {
    type: 'opening_bracket', 
    bracket: bracket,
    hasComma: hasComma,
    keyInfo: keyInfo,
    anchor: {
      type: 'opening_bracket',
      key: keyInfo.key,
      bracket: bracket,
      searchPattern: keyInfo.key ? `"${keyInfo.key}"\\s*:\\s*\\${bracket}` : null
    }
  };
};

/**
 * 找到右括号对应的开括号和key（支持数组索引）
 */
const findMatchingOpeningBracket = (lines, closingLineIndex, closingBracket) => {
  const openingBracket = closingBracket === '}' ? '{' : '[';
  let bracketCount = 1;
  
  // 向上搜索匹配的开括号
  for (let i = closingLineIndex - 1; i >= 0; i--) {
    const line = lines[i];
    
    // 从右到左扫描，正确处理括号匹配
    for (let j = line.length - 1; j >= 0; j--) {
      if (line[j] === closingBracket) {
        bracketCount++;
      } else if (line[j] === openingBracket) {
        bracketCount--;
        if (bracketCount === 0) {
          // 找到匹配的开括号，提取key和数组索引
          const bracketInfo = analyzeOpeningBracketContext(lines, i, closingLineIndex);
          return {
            key: bracketInfo.key,
            arrayIndex: bracketInfo.arrayIndex,
            isInArray: bracketInfo.isInArray,
            fullPath: bracketInfo.fullPath,
            lineIndex: i,
            line: line.trim()
          };
        }
      }
    }
  }
  
  return { key: '', arrayIndex: -1, isInArray: false, fullPath: [], lineIndex: -1, line: '' };
};

/**
 * 分析开括号的上下文，包括是否在数组中以及数组索引
 */
const analyzeOpeningBracketContext = (lines, openingLineIndex, closingLineIndex) => {
  const openingLine = lines[openingLineIndex];
  
  // 检查是否有直接的key
  const directKeyMatch = openingLine.match(/"([^"]+)"\s*:\s*[{\[]/);
  if (directKeyMatch) {
    // 有直接key，不在数组中
    return {
      key: directKeyMatch[1],
      arrayIndex: -1,
      isInArray: false,
      fullPath: [directKeyMatch[1]]
    };
  }
  
  // 没有直接key，可能是数组元素
  // 检查是否是独立的括号（数组元素）
  const trimmedOpeningLine = openingLine.trim();
  if (trimmedOpeningLine === '{' || trimmedOpeningLine === '[') {
    // 这是一个数组元素，需要找到父数组的key和当前元素的索引
    const arrayInfo = findParentArrayInfo(lines, openingLineIndex, closingLineIndex);
    return {
      key: arrayInfo.arrayKey,
      arrayIndex: arrayInfo.elementIndex,
      isInArray: true,
      fullPath: arrayInfo.fullPath
    };
  }
  
  return {
    key: '',
    arrayIndex: -1,
    isInArray: false,
    fullPath: []
  };
};

/**
 * 找到父数组信息和当前元素索引
 */
const findParentArrayInfo = (lines, openingLineIndex, closingLineIndex) => {
  // 向上找到包含当前元素的数组
  let currentIndent = getLineIndent(lines[openingLineIndex]);
  
  for (let i = openingLineIndex - 1; i >= 0; i--) {
    const line = lines[i];
    const lineIndent = getLineIndent(line);
    
    // 找到缩进更少的行
    if (lineIndent < currentIndent) {
      // 检查是否是数组的开始
      const arrayMatch = line.match(/"([^"]+)"\s*:\s*\[/);
      if (arrayMatch) {
        const arrayKey = arrayMatch[1];
        
        // 计算当前元素在数组中的索引
        const elementIndex = calculateArrayElementIndex(lines, i + 1, openingLineIndex, closingLineIndex);
        
        return {
          arrayKey: arrayKey,
          elementIndex: elementIndex,
          fullPath: [arrayKey, elementIndex.toString()]
        };
      }
    }
  }
  
  return {
    arrayKey: '',
    elementIndex: -1,
    fullPath: []
  };
};

/**
 * 计算数组元素索引
 */
const calculateArrayElementIndex = (lines, arrayStartLine, targetOpeningLine, targetClosingLine) => {
  let elementIndex = 0;
  let currentBraceLevel = 0;
  let inCurrentElement = false;
  
  for (let i = arrayStartLine; i <= targetOpeningLine; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // 跳过空行
    if (!trimmedLine) continue;
    
    // 统计括号
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '{' || char === '[') {
        if (currentBraceLevel === 0 && i === targetOpeningLine) {
          // 这是我们要找的开括号
          inCurrentElement = true;
        }
        currentBraceLevel++;
      } else if (char === '}' || char === ']') {
        currentBraceLevel--;
        if (currentBraceLevel === 0 && inCurrentElement) {
          // 完成了一个元素
          if (i < targetOpeningLine) {
            elementIndex++;
          }
          inCurrentElement = false;
        }
      }
    }
    
    // 如果当前行是目标开括号行，记录索引
    if (i === targetOpeningLine && !inCurrentElement) {
      break;
    }
  }
  
  return elementIndex;
};

/**
 * 为开括号找到对应的key
 */
const findKeyForOpeningBracket = (lines, bracketLineIndex) => {
  // 先检查当前行
  const currentLine = lines[bracketLineIndex];
  const currentKeyMatch = currentLine.match(/"([^"]+)"\s*:\s*[{\[]/);
  if (currentKeyMatch) {
    return {
      key: currentKeyMatch[1],
      lineIndex: bracketLineIndex,
      line: currentLine.trim()
    };
  }
  
  // 检查前几行
  for (let i = bracketLineIndex - 1; i >= Math.max(0, bracketLineIndex - 3); i--) {
    const line = lines[i];
    const keyMatch = line.match(/"([^"]+)"\s*:\s*$/);
    if (keyMatch) {
      return {
        key: keyMatch[1],
        lineIndex: i,
        line: line.trim()
      };
    }
  }
  
  return { key: '', lineIndex: -1, line: '' };
};

/**
 * 简化的父级路径构建
 * @param {Array} lines - 所有行
 * @param {number} targetLineIndex - 目标行索引
 * @returns {Array} 从根到父级的路径数组
 */
const buildSimpleParentPath = (lines, targetLineIndex) => {
  const path = [];
  let currentIndent = getLineIndent(lines[targetLineIndex]);
  
  // 向上查找，寻找缩进更少的行中的key
  for (let i = targetLineIndex - 1; i >= 0; i--) {
    const line = lines[i];
    const lineIndent = getLineIndent(line);
    
    // 只考虑缩进更少的行
    if (lineIndent < currentIndent) {
      const keyMatch = line.match(/"([^"]+)"\s*:\s*[{\[]/);
      if (keyMatch) {
        path.unshift(keyMatch[1]);
        currentIndent = lineIndent;
      }
    }
  }
  
  return path;
};

/**
 * 简化的括号上下文查找
 * @param {Array} lines - 所有行
 * @param {number} targetLineIndex - 目标行索引
 * @param {string} bracket - 括号字符
 * @returns {Object} 括号上下文信息
 */
const findSimpleBracketContext = (lines, targetLineIndex, bracket) => {
  const matchingOpen = bracket === '}' ? '{' : '[';
  let braceCount = 1;
  
  // 向上查找对应的开括号
  for (let i = targetLineIndex - 1; i >= 0; i--) {
    const line = lines[i];
    
    // 计算当前行的括号数量
    for (let j = line.length - 1; j >= 0; j--) {
      if (line[j] === bracket) {
        braceCount++;
      } else if (line[j] === matchingOpen) {
        braceCount--;
        if (braceCount === 0) {
          // 找到对应的开括号，查找key
          const keyMatch = line.match(/"([^"]+)"\s*:\s*[{\[]/);
          if (keyMatch) {
            const key = keyMatch[1];
            const parentPath = buildSimpleParentPath(lines, i);
            return {
              key: key,
              parentPath: parentPath,
              fullPath: [...parentPath, key],
              openingLineIndex: i
            };
          }
          // 如果没有key，可能是数组元素
          return {
            key: '',
            parentPath: buildSimpleParentPath(lines, i),
            fullPath: buildSimpleParentPath(lines, i),
            openingLineIndex: i
          };
        }
      }
    }
  }
  
  return { key: '', parentPath: [], fullPath: [], openingLineIndex: -1 };
};

/**
 * 找到括号对应的上下文信息（改进版）
 * @param {Array} lines - 所有行
 * @param {number} targetLineIndex - 目标行索引
 * @param {string} bracket - 括号字符
 * @param {string} fullLine - 完整的行内容
 * @returns {Object} 括号上下文信息
 */
const findBracketContext = (lines, targetLineIndex, bracket, fullLine) => {
  const isClosingBracket = bracket === '}' || bracket === ']';
  
  if (isClosingBracket) {
    // 对于右括号，使用更精确的匹配方法
    return findClosingBracketContextImproved(lines, targetLineIndex, bracket, fullLine);
  } else {
    // 对于左括号，找到当前行或前面行的key
    for (let i = targetLineIndex; i >= Math.max(0, targetLineIndex - 3); i--) {
      const line = lines[i];
      const keyMatch = line.match(/"([^"]+)"\s*:\s*[{\[]/);
      if (keyMatch) {
        const key = keyMatch[1];
        const parentPath = findParentPath(lines, i, key);
        return {
          key: key,
          parentPath: parentPath,
          fullPath: [...parentPath, key],
          bracketType: bracket === '{' ? 'object' : 'array'
        };
      }
    }
  }
  
  return { key: '', parentPath: [], fullPath: [], bracketType: 'unknown' };
};

/**
 * 改进的右括号上下文查找
 * @param {Array} lines - 所有行  
 * @param {number} targetLineIndex - 目标行索引
 * @param {string} closingBracket - 右括号
 * @param {string} fullLine - 完整的行内容
 * @returns {Object} 括号上下文信息
 */
const findClosingBracketContextImproved = (lines, targetLineIndex, closingBracket, fullLine) => {
  const matchingOpen = closingBracket === '}' ? '{' : '[';
  let braceStack = []; // 使用栈来精确追踪括号匹配
  
  // 从目标行开始向上查找，建立括号栈
  for (let i = targetLineIndex; i >= 0; i--) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // 当前行是目标行，添加目标括号到栈
    if (i === targetLineIndex) {
      braceStack.push({
        bracket: closingBracket,
        lineIndex: i,
        type: 'closing'
      });
      continue;
    }
    
    // 检查行中的所有括号（从右到左，因为我们在向上查找）
    for (let j = line.length - 1; j >= 0; j--) {
      const char = line[j];
      if (char === closingBracket || char === matchingOpen) {
        if (char === closingBracket) {
          // 遇到同类型的右括号，入栈
          braceStack.push({
            bracket: char,
            lineIndex: i,
            type: 'closing'
          });
        } else if (char === matchingOpen) {
          // 遇到匹配的左括号
          if (braceStack.length > 0 && braceStack[braceStack.length - 1].bracket === closingBracket) {
            // 找到匹配的左括号
            braceStack.pop();
            
            if (braceStack.length === 0) {
              // 这就是我们要找的开括号
              const keyMatch = line.match(/"([^"]+)"\s*:\s*[{\[]/);
              if (keyMatch) {
                const key = keyMatch[1];
                const parentPath = findParentPath(lines, i, key);
                return {
                  key: key,
                  parentPath: parentPath,
                  fullPath: [...parentPath, key],
                  bracketType: closingBracket === '}' ? 'object' : 'array',
                  openingLineIndex: i,
                  matchingLine: line.trim()
                };
              }
              
              // 如果没有找到key，可能是数组元素的括号
              return {
                key: '',
                parentPath: [],
                fullPath: [],
                bracketType: closingBracket === '}' ? 'object' : 'array',
                openingLineIndex: i,
                matchingLine: line.trim()
              };
            }
          }
        }
      }
    }
  }
  
  return { key: '', parentPath: [], fullPath: [], bracketType: 'unknown' };
};

/**
 * 获取行的缩进长度
 * @param {string} line - 行内容
 * @returns {number} 缩进长度
 */
const getLineIndent = (line) => {
  return line.length - line.trimStart().length;
};

/**
 * 构建完整的JSON路径树（全新简化版本，基于实际JSON结构分析）
 * @param {Array} lines - 所有行
 * @param {number} targetLineIndex - 目标行索引
 * @returns {Object} 包含完整路径和符号类型的对象
 */
const buildFullJsonPath = (lines, targetLineIndex) => {
  console.log(`\n=== 构建路径，目标行 ${targetLineIndex} ===`);
  
  // 先解析整个JSON结构，获取每一行的路径
  const linePathMap = parseJsonStructure(lines);
  
  // 获取目标行的路径信息
  const targetLineInfo = linePathMap.get(targetLineIndex);
  if (targetLineInfo) {
    console.log(`目标行路径: ${targetLineInfo.path}, 类型: ${targetLineInfo.type}`);
    return targetLineInfo;
  }
  
  return { path: 'unknown', type: 'unknown' };
};

/**
 * 解析JSON结构，为每一行构建路径映射
 * @param {Array} lines - 所有行
 * @returns {Map} 行号到路径信息的映射
 */
const parseJsonStructure = (lines) => {
  // 第一步：解析所有非注释行，建立基础结构
  const cleanLines = [];
  const commentLineMapping = new Map(); // 注释行到清理后行的映射
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    const commentInfo = findCommentsInLine(line);
    if (commentInfo.hasComment) {
      const contentBefore = line.substring(0, commentInfo.commentStart).trim();
      if (contentBefore) {
        // 有前置内容的注释行
        commentLineMapping.set(i, cleanLines.length);
        cleanLines.push(contentBefore);
      } else {
        // 独立注释行，记录但不添加到cleanLines
        commentLineMapping.set(i, -1);
      }
    } else {
      // 非注释行
      commentLineMapping.set(i, cleanLines.length);
      cleanLines.push(line);
    }
  }
  
  // 第二步：解析清理后的JSON结构
  const cleanLinePathMap = parseCleanJsonStructure(cleanLines);
  
  // 第三步：将路径信息映射回原始行号
  const linePathMap = new Map();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    const commentInfo = findCommentsInLine(line);
    if (commentInfo.hasComment) {
      const contentBefore = line.substring(0, commentInfo.commentStart).trim();
      const cleanLineIndex = commentLineMapping.get(i);
      
      if (cleanLineIndex >= 0 && cleanLinePathMap.has(cleanLineIndex)) {
        // 有前置内容的注释行
        const pathInfo = cleanLinePathMap.get(cleanLineIndex);
        
        // 确定注释类型
        let type = pathInfo.type;
        let symbol = '';
        
        if (contentBefore.endsWith('{')) {
          type = 'brace_open';
          symbol = '{';
        } else if (contentBefore.endsWith('[')) {
          type = 'bracket_open';
          symbol = '[';
        } else if (contentBefore === '}' || contentBefore === '},') {
          type = 'brace_close';
          symbol = contentBefore;
        } else if (contentBefore === ']' || contentBefore === '],') {
          type = 'bracket_close';
          symbol = contentBefore;
        }
        
        linePathMap.set(i, {
          path: pathInfo.path,
          type: type,
          symbol: symbol
        });
        
        console.log(`行 ${i}: "${contentBefore}" -> ${pathInfo.path} (${type})`);
      } else {
        // 独立注释行
        linePathMap.set(i, {
          path: '',
          type: 'comment_only',
          symbol: ''
        });
        console.log(`行 ${i}: 独立注释`);
      }
    } else {
      // 非注释行
      const cleanLineIndex = commentLineMapping.get(i);
      if (cleanLineIndex >= 0 && cleanLinePathMap.has(cleanLineIndex)) {
        const pathInfo = cleanLinePathMap.get(cleanLineIndex);
        linePathMap.set(i, pathInfo);
        console.log(`行 ${i}: "${trimmedLine}" -> ${pathInfo.path} (${pathInfo.type})`);
      }
    }
  }
  
  return linePathMap;
};

/**
 * 解析清理后的JSON结构（不包含注释）
 * @param {Array} cleanLines - 清理后的JSON行
 * @returns {Map} 行号到路径信息的映射
 */
const parseCleanJsonStructure = (cleanLines) => {
  const linePathMap = new Map();
  const contextStack = [];
  
  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    const currentIndent = line.length - line.trimStart().length;
    
    // 根据缩进调整上下文栈
    while (contextStack.length > 0 && currentIndent <= contextStack[contextStack.length - 1].indent) {
      contextStack.pop();
    }
    
    // 处理属性定义
    const propertyMatch = trimmedLine.match(/^"([^"]+)"\s*:\s*(.*)/);
    if (propertyMatch) {
      const key = propertyMatch[1];
      const value = propertyMatch[2].trim();
      
      // 构建当前路径
      const parentPath = contextStack.length > 0 ? contextStack[contextStack.length - 1].path : '';
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      
      linePathMap.set(i, { path: currentPath, type: 'property' });
      
      // 如果值是对象或数组，更新上下文栈
      if (value === '{' || value.startsWith('{')) {
        contextStack.push({
          path: currentPath,
          indent: currentIndent,
          type: 'object'
        });
      } else if (value === '[' || value.startsWith('[')) {
        contextStack.push({
          path: currentPath,
          indent: currentIndent,
          type: 'array',
          arrayIndex: 0
        });
      }
      
      console.log(`行 ${i}: "${trimmedLine}" -> ${currentPath} (property)`);
      continue;
    }
    
    // 处理独立的大括号（数组元素）
    if (trimmedLine === '{') {
      if (contextStack.length > 0) {
        const parentContext = contextStack[contextStack.length - 1];
        
        if (parentContext.type === 'array') {
          // 这是数组元素
          const currentArrayIndex = parentContext.arrayIndex;
          const arrayElementPath = `${parentContext.path}[${currentArrayIndex}]`;
          
          linePathMap.set(i, { 
            path: arrayElementPath, 
            type: 'brace_open', 
            symbol: '{' 
          });
          
          // 创建新的对象上下文
          contextStack.push({
            path: arrayElementPath,
            indent: currentIndent,
            type: 'object'
          });
          
          // 增加父数组的索引
          parentContext.arrayIndex++;
          
          console.log(`行 ${i}: "${trimmedLine}" -> ${arrayElementPath} (array element)`);
        } else {
          // 普通对象开始
          const currentPath = parentContext.path;
          linePathMap.set(i, { 
            path: currentPath, 
            type: 'brace_open', 
            symbol: '{' 
          });
          console.log(`行 ${i}: "${trimmedLine}" -> ${currentPath} (object start)`);
        }
      }
      continue;
    }
    
    // 处理结束符号
    if (trimmedLine === '}' || trimmedLine === '},' || 
        trimmedLine === ']' || trimmedLine === '],') {
      
      if (contextStack.length > 0) {
        const currentContext = contextStack[contextStack.length - 1];
        const symbolType = trimmedLine.startsWith('}') ? 'brace_close' : 'bracket_close';
        
        linePathMap.set(i, { 
          path: currentContext.path, 
          type: symbolType, 
          symbol: trimmedLine 
        });
        
        console.log(`行 ${i}: "${trimmedLine}" -> ${currentContext.path} (${symbolType})`);
      }
    }
  }
  
  return linePathMap;
};


/**
 * 提取注释信息和JSON结构信息（使用新的定位算法）
 * @param {string} jsonStr - JSON字符串
 * @returns {Object} 包含注释和清理后的行的对象
 */
export const extractCommentsAndStructure = (jsonStr) => {
  const lines = jsonStr.split('\n');
  const comments = [];
  const cleanLines = [];
  
  console.log("开始提取注释信息，使用新的定位算法...");
  
  // 逐行处理，保持原始行号关系
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const commentInfo = findCommentsInLine(line);
    
    if (commentInfo.hasComment) {
      // 保存注释信息，包含原始行号和注释内容
      const contentBefore = line.substring(0, commentInfo.commentStart).trim();
      
      // 使用新的定位算法分析注释位置
      const positionInfo = analyzeCommentPosition(contentBefore, lines, i);
      
      console.log(`行 ${i}: "${contentBefore}" -> 类型: "${positionInfo.type}", 位置: "${positionInfo.position}"`);
      
      // 构建基于穷举的唯一标识符（支持数组索引）
      let uniqueId = '';
      switch (positionInfo.type) {
        case 'field_value':
          uniqueId = `field_value:${positionInfo.key}:${positionInfo.hasComma}`;
          break;
        case 'closing_bracket':
          const arrayInfo = positionInfo.openingInfo.isInArray ? `:array:${positionInfo.openingInfo.arrayIndex}` : '';
          uniqueId = `closing_bracket:${positionInfo.openingInfo.key}:${positionInfo.bracket}:${positionInfo.hasComma}${arrayInfo}`;
          break;
        case 'opening_bracket':
          uniqueId = `opening_bracket:${positionInfo.keyInfo.key}:${positionInfo.bracket}:${positionInfo.hasComma}`;
          break;
        default:
          uniqueId = `${positionInfo.type}:${i}`;
      }
      
      comments.push({
        originalLineIndex: i,
        commentText: commentInfo.commentText,
        contentBefore: contentBefore,
        hasContentBefore: contentBefore.length > 0,
        positionInfo: positionInfo, // 新的位置信息
        uniqueId: uniqueId, // 唯一标识符
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
 * 构建格式化JSON的完整路径映射（支持大括号/方括号）
 * @param {Array} formattedLines - 格式化后的JSON行数组
 * @returns {Map} 行号到路径信息的映射
 */
const buildFormattedJsonPathMap = (formattedLines) => {
  const pathMap = new Map();
  
  console.log("构建格式化JSON的路径映射（支持大括号/方括号）...");
  
  // 重用parseJsonStructure的逻辑来解析格式化的JSON
  const formattedLinePathMap = parseJsonStructure(formattedLines);
  
  // 转换为所需的格式
  for (let [lineIndex, pathInfo] of formattedLinePathMap) {
    const line = formattedLines[lineIndex];
    const trimmedLine = line.trim();
    
    // 生成唯一标识符
    let uniqueId = pathInfo.path;
    if (pathInfo.type && pathInfo.type !== 'property') {
      uniqueId += `:${pathInfo.type}`;
      if (pathInfo.symbol) {
        uniqueId += `:${pathInfo.symbol}`;
      }
    }
    
    // 提取属性名
    let key = '';
    const propertyMatch = trimmedLine.match(/^"([^"]+)"\s*:/);
    if (propertyMatch) {
      key = propertyMatch[1];
    }
    
    // 判断是否有值
    const hasValue = pathInfo.type === 'property' && 
                     propertyMatch && 
                     propertyMatch.input.includes(':') &&
                     !propertyMatch.input.match(/:\s*[\[\{]/);
    
    pathMap.set(lineIndex, {
      path: pathInfo.path,
      pathType: pathInfo.type,
      symbol: pathInfo.symbol,
      uniqueId: uniqueId,
      key: key,
      hasValue: hasValue,
      type: hasValue ? 'property_value' : (pathInfo.type === 'property' ? 'property_name' : 'symbol'),
      line: trimmedLine
    });
    
    console.log(`格式化行 ${lineIndex}: "${trimmedLine}" -> 路径: "${pathInfo.path}", 类型: "${pathInfo.type}", 唯一ID: "${uniqueId}"`);
  }
  
  return pathMap;
};


/**
 * 简化版：基于内容相似度的精确匹配
 * @param {Array} formattedLines - 格式化后的JSON行数组
 * @param {Object} comment - 注释对象
 * @returns {number} 最匹配的行索引，-1表示未找到
 */
const findBestMatchLine = (formattedLines, comment) => {
  console.log(`\n匹配注释: "${comment.commentText}"`);
  console.log(`前置内容: "${comment.contentBefore}"`);
  
  if (!comment.hasContentBefore) {
    console.log("跳过：没有前置内容");
    return -1;
  }
  
  const originalContent = comment.contentBefore;
  
  // 提取原始内容的关键信息
  let originalKey = '';
  let originalValue = '';
  let hasValue = false;
  
  const propertyMatch = originalContent.match(/"([^"]+)"\s*:\s*(.*)/);
  if (propertyMatch) {
    originalKey = propertyMatch[1];
    originalValue = propertyMatch[2].trim();
    hasValue = originalValue && !originalValue.startsWith('{') && !originalValue.startsWith('[');
  }
  
  console.log(`提取的属性: "${originalKey}", 值: "${originalValue}", 有值: ${hasValue}`);
  
  let bestMatch = -1;
  let bestScore = 0;
  let usedLines = new Set(); // 记录已使用的行，避免重复匹配
  
  for (let i = 0; i < formattedLines.length; i++) {
    if (usedLines.has(i)) continue;
    
    const line = formattedLines[i];
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // 检查是否是属性行
    const formattedPropertyMatch = trimmedLine.match(/"([^"]+)"\s*:\s*(.*)/);
    if (!formattedPropertyMatch) continue;
    
    const formattedKey = formattedPropertyMatch[1];
    const formattedValue = formattedPropertyMatch[2].trim();
    const formattedHasValue = formattedValue && !formattedValue.startsWith('{') && !formattedValue.startsWith('[');
    
    // 属性名必须匹配
    if (formattedKey !== originalKey) continue;
    
    // 计算匹配分数
    let score = 50; // 基础分：属性名匹配
    
    // 值类型匹配加分
    if (hasValue === formattedHasValue) {
      score += 30;
    }
    
    // 如果都有值，比较值的相似度
    if (hasValue && formattedHasValue) {
      const cleanOriginalValue = originalValue.replace(/[,\s]/g, '').toLowerCase();
      const cleanFormattedValue = formattedValue.replace(/[,\s]/g, '').toLowerCase();
      
      if (cleanOriginalValue === cleanFormattedValue) {
        score += 20; // 值完全匹配
      } else if (cleanOriginalValue.includes(cleanFormattedValue) || cleanFormattedValue.includes(cleanOriginalValue)) {
        score += 10; // 值部分匹配
      }
    }
    
    // 上下文匹配：检查前后几行的内容相似度
    const contextScore = calculateContextSimilarity(formattedLines, i, originalContent, comment.originalLineIndex);
    score += contextScore;
    
    console.log(`行 ${i}: "${trimmedLine}" - 分数: ${score}`);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = i;
    }
  }
  
  if (bestMatch !== -1) {
    usedLines.add(bestMatch);
    console.log(`最佳匹配: 行 ${bestMatch}, 分数: ${bestScore}`);
    return bestMatch;
  }
  
  console.log(`匹配失败`);
  return -1;
};

/**
 * 计算上下文相似度
 * @param {Array} formattedLines - 格式化后的JSON行
 * @param {number} lineIndex - 当前行索引
 * @param {string} originalContent - 原始内容
 * @param {number} originalLineIndex - 原始行索引
 * @returns {number} 上下文相似度分数
 */
const calculateContextSimilarity = (formattedLines, lineIndex, originalContent, originalLineIndex) => {
  // 简单的上下文检查：看前后行的缩进层级
  const currentIndent = formattedLines[lineIndex] ? formattedLines[lineIndex].length - formattedLines[lineIndex].trimStart().length : 0;
  
  // 检查前一行是否有相似的结构
  if (lineIndex > 0) {
    const prevLine = formattedLines[lineIndex - 1].trim();
    if (prevLine.includes('{') || prevLine.includes('[')) {
      return 5; // 前一行是对象/数组开始
    }
  }
  
  return 0;
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

/**
 * 确定性的注释合并算法（保证幂等性）
 * @param {string} formattedJson - 格式化后的JSON
 * @param {Object} originalData - 原始数据包含注释信息
 * @returns {string} 合并后的JSON字符串
 */
export const mergeJsonWithComments = (formattedJson, originalData) => {
  const { comments } = originalData;
  if (!comments || comments.length === 0) {
    return formattedJson;
  }
  
  const formattedLines = formattedJson.split('\n');
  
  console.log(`\n开始确定性注释合并，处理 ${comments.length} 个注释`);
  
  // 第1步：为格式化的JSON的每一行建立稳定的指纹
  const lineFingerprints = buildLineFingerprints(formattedLines);
  
  // 第2步：为每个注释建立匹配候选列表
  const commentMatches = comments.map((comment, index) => {
    const candidates = findAllPossibleMatches(formattedLines, lineFingerprints, comment);
    return {
      ...comment,
      candidates: candidates,
      originalIndex: index, // 保持原始顺序
      originalLineIndex: comment.originalLineIndex // 原始行号
    };
  });
  
  // 第3步：解决相同注释内容冲突，使用最优分配算法
  const finalAssignments = resolveCommentConflicts(commentMatches);
  
  // 第4步：按分配结果构建最终JSON
  const result = [...formattedLines];
  
  // 按目标行排序，确保输出稳定
  const validAssignments = finalAssignments
    .filter(assignment => assignment.targetLine !== -1)
    .sort((a, b) => {
      if (a.targetLine !== b.targetLine) {
        return a.targetLine - b.targetLine;
      }
      return a.originalIndex - b.originalIndex;
    });
  
  // 合并相同行的多个注释
  const lineComments = new Map();
  for (const assignment of validAssignments) {
    const line = assignment.targetLine;
    if (!lineComments.has(line)) {
      lineComments.set(line, []);
    }
    lineComments.get(line).push(assignment.commentText);
  }
  
  // 应用注释到对应行
  for (const [lineIndex, comments] of lineComments) {
    const allComments = comments.join(' ');
    result[lineIndex] = `${result[lineIndex]} ${allComments}`;
    console.log(`行 ${lineIndex} 添加注释: ${allComments}`);
  }
  
  // 第5步：处理未匹配的注释
  const unmatchedComments = finalAssignments
    .filter(assignment => assignment.targetLine === -1)
    .sort((a, b) => a.originalIndex - b.originalIndex);
  
  for (const assignment of unmatchedComments) {
    result.push(assignment.commentText);
    console.log(`未匹配注释添加到末尾: "${assignment.commentText}"`);
  }
  
  console.log("确定性合并完成");
  return result.join('\n');
};

/**
 * 为格式化的JSON行建立稳定指纹
 * @param {Array} formattedLines - 格式化后的JSON行
 * @returns {Array} 行指纹数组
 */
const buildLineFingerprints = (formattedLines) => {
  return formattedLines.map((line, index) => {
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;
    
    // 提取行的关键特征
    let type = 'unknown';
    let key = '';
    let value = '';
    let symbol = '';
    
    // 识别不同类型的行
    if (trimmed.match(/^"[^"]+"\s*:\s*[\{\[]/)) {
      type = 'key_object_start';
      const match = trimmed.match(/^"([^"]+)"\s*:\s*([\{\[])/);
      key = match[1];
      symbol = match[2];
    } else if (trimmed.match(/^"[^"]+"\s*:/)) {
      type = 'key_value';
      const match = trimmed.match(/^"([^"]+)"\s*:\s*(.*?)(?:,|$)/);
      key = match[1];
      value = match[2] ? match[2].replace(/,\s*$/, '') : '';
    } else if (trimmed.match(/^[\}\]],?$/)) {
      type = 'closing_bracket';
      symbol = trimmed.replace(',', '');
    } else if (trimmed.match(/^[\{\[],?$/)) {
      type = 'opening_bracket';
      symbol = trimmed.replace(',', '');
    }
    
    return {
      index,
      line: trimmed,
      indent,
      type,
      key,
      value,
      symbol,
      hash: `${type}:${key}:${symbol}:${indent}` // 稳定哈希
    };
  });
};

/**
 * 找到所有可能的匹配候选
 * @param {Array} formattedLines - 格式化后的JSON行
 * @param {Array} lineFingerprints - 行指纹
 * @param {Object} comment - 注释对象
 * @returns {Array} 候选匹配列表
 */
const findAllPossibleMatches = (formattedLines, lineFingerprints, comment) => {
  const { positionInfo } = comment;
  
  console.log(`查找所有候选: 类型=${positionInfo.type}`, positionInfo);
  
  let candidates = [];
  
  switch (positionInfo.type) {
    case 'field_value':
      candidates = findFieldValueAllCandidates(lineFingerprints, positionInfo);
      break;
      
    case 'closing_bracket':
      candidates = findClosingBracketAllCandidates(formattedLines, lineFingerprints, positionInfo);
      break;
      
    case 'opening_bracket':
      candidates = findOpeningBracketAllCandidates(lineFingerprints, positionInfo);
      break;
      
    default:
      candidates = [];
  }
  
  // 为每个候选添加距离分数
  return candidates.map(candidate => ({
    ...candidate,
    distanceScore: calculateDistanceScore(comment.originalLineIndex, candidate.targetLine, formattedLines.length)
  })).sort((a, b) => {
    // 按置信度和距离排序
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence; // 高置信度优先
    }
    return b.distanceScore - a.distanceScore; // 距离更近优先
  });
};

/**
 * 解决注释冲突的最优分配算法
 * @param {Array} commentMatches - 注释匹配列表
 * @returns {Array} 最终分配结果
 */
const resolveCommentConflicts = (commentMatches) => {
  console.log("开始解决注释冲突...");
  
  // 使用贪心算法进行最优分配
  const assignments = [];
  const usedLines = new Set();
  
  // 按原始行号排序，保持相对位置
  const sortedComments = [...commentMatches].sort((a, b) => a.originalLineIndex - b.originalLineIndex);
  
  for (const comment of sortedComments) {
    let bestMatch = null;
    
    // 从候选中找到最佳未使用的匹配
    for (const candidate of comment.candidates) {
      if (!usedLines.has(candidate.targetLine)) {
        bestMatch = candidate;
        break; // 候选已按优先级排序，取第一个可用的
      }
    }
    
    if (bestMatch) {
      assignments.push({
        commentText: comment.commentText,
        targetLine: bestMatch.targetLine,
        originalIndex: comment.originalIndex,
        originalLineIndex: comment.originalLineIndex,
        confidence: bestMatch.confidence,
        method: bestMatch.method
      });
      usedLines.add(bestMatch.targetLine);
      console.log(`注释 "${comment.commentText}" 分配到行 ${bestMatch.targetLine} (${bestMatch.method})`);
    } else {
      // 无可用匹配
      assignments.push({
        commentText: comment.commentText,
        targetLine: -1,
        originalIndex: comment.originalIndex,
        originalLineIndex: comment.originalLineIndex,
        confidence: 0,
        method: 'no_match'
      });
      console.log(`注释 "${comment.commentText}" 无可用匹配`);
    }
  }
  
  return assignments;
};

/**
 * 计算距离分数（原始位置和目标位置的相对距离）
 * @param {number} originalLine - 原始行号
 * @param {number} targetLine - 目标行号  
 * @param {number} totalLines - 总行数
 * @returns {number} 距离分数 (0-100)
 */
const calculateDistanceScore = (originalLine, targetLine, totalLines) => {
  if (targetLine === -1) return 0;
  
  const distance = Math.abs(targetLine - originalLine);
  const maxDistance = totalLines;
  
  // 距离越近，分数越高
  return Math.max(0, 100 - (distance / maxDistance * 100));
};

/**
 * 字段值的所有候选匹配
 */
const findFieldValueAllCandidates = (lineFingerprints, positionInfo) => {
  const { key } = positionInfo;
  
  // 查找所有匹配key的行
  const exactMatches = lineFingerprints
    .filter(fp => fp.type === 'key_value' && fp.key === key)
    .map(fp => ({
      targetLine: fp.index,
      confidence: 100, // 完全匹配
      method: 'exact_key_match'
    }));
  
  // 如果没有精确匹配，尝试部分匹配
  const partialMatches = exactMatches.length === 0 ? 
    lineFingerprints
      .filter(fp => fp.type === 'key_value' && fp.key.includes(key))
      .map(fp => ({
        targetLine: fp.index,
        confidence: 60, // 部分匹配
        method: 'partial_key_match'
      })) : [];
  
  console.log(`字段值候选: key="${key}" -> ${exactMatches.length} 精确匹配, ${partialMatches.length} 部分匹配`);
  
  return [...exactMatches, ...partialMatches];
};

/**
 * 右括号的所有候选匹配
 */
const findClosingBracketAllCandidates = (formattedLines, lineFingerprints, positionInfo) => {
  const { bracket, openingInfo } = positionInfo;
  const { key, isInArray, arrayIndex } = openingInfo;
  
  console.log(`右括号候选查找: key="${key}", bracket="${bracket}", isInArray=${isInArray}, arrayIndex=${arrayIndex}`);
  
  const candidates = [];
  
  if (key) {
    if (isInArray && arrayIndex >= 0) {
      // 数组元素匹配
      const arrayMatch = findArrayElementClosingBracketDeterministic(formattedLines, lineFingerprints, key, arrayIndex, bracket);
      if (arrayMatch.targetLine !== -1) {
        candidates.push(arrayMatch);
      }
    } else {
      // 普通对象匹配
      const objectMatch = findObjectClosingBracketDeterministic(formattedLines, lineFingerprints, key, bracket);
      if (objectMatch.targetLine !== -1) {
        candidates.push(objectMatch);
      }
    }
  }
  
  // 回退匹配：所有相同类型的括号
  const fallbackMatches = lineFingerprints
    .filter(fp => fp.type === 'closing_bracket' && fp.symbol === bracket)
    .map(fp => ({
      targetLine: fp.index,
      confidence: 30, // 低置信度回退匹配
      method: 'bracket_fallback'
    }));
  
  candidates.push(...fallbackMatches);
  
  console.log(`右括号候选: ${candidates.length} 个候选`);
  return candidates;
};

/**
 * 左括号的所有候选匹配
 */
const findOpeningBracketAllCandidates = (lineFingerprints, positionInfo) => {
  const { bracket, keyInfo } = positionInfo;
  const { key } = keyInfo;
  
  const candidates = [];
  
  if (key) {
    // 精确匹配
    const exactMatches = lineFingerprints
      .filter(fp => fp.type === 'key_object_start' && fp.key === key && fp.symbol === bracket)
      .map(fp => ({
        targetLine: fp.index,
        confidence: 100,
        method: 'exact_opening_match'
      }));
    
    candidates.push(...exactMatches);
  }
  
  // 回退匹配：所有相同类型的开括号
  const fallbackMatches = lineFingerprints
    .filter(fp => fp.type === 'key_object_start' && fp.symbol === bracket)
    .map(fp => ({
      targetLine: fp.index,
      confidence: 40,
      method: 'opening_bracket_fallback'
    }));
  
  candidates.push(...fallbackMatches);
  
  console.log(`左括号候选: key="${key}" -> ${candidates.length} 个候选`);
  return candidates;
};

/**
 * 普通对象右括号确定性匹配
 */
const findObjectClosingBracketDeterministic = (formattedLines, lineFingerprints, key, bracket) => {
  // 找到key对应的开括号行
  const openingLine = lineFingerprints.find(fp => 
    fp.type === 'key_object_start' && fp.key === key
  );
  
  if (!openingLine) return { targetLine: -1, confidence: 0, method: 'no_opening' };
  
  // 从开括号行找到匹配的右括号
  const closingLineIndex = findMatchingClosingBracketDeterministic(
    formattedLines, openingLine.index, bracket
  );
  
  if (closingLineIndex !== -1) {
    console.log(`对象右括号确定性匹配: key="${key}" -> 开括号行 ${openingLine.index}, 右括号行 ${closingLineIndex}`);
    return { targetLine: closingLineIndex, confidence: 100, method: 'object_bracket_match' };
  }
  
  return { targetLine: -1, confidence: 0, method: 'no_closing' };
};

/**
 * 数组元素右括号确定性匹配
 */
const findArrayElementClosingBracketDeterministic = (formattedLines, lineFingerprints, arrayKey, elementIndex, bracket) => {
  // 找到数组开始行
  const arrayStartLine = lineFingerprints.find(fp => 
    fp.type === 'key_object_start' && fp.key === arrayKey && fp.symbol === '['
  );
  
  if (!arrayStartLine) return { targetLine: -1, confidence: 0, method: 'no_array_start' };
  
  // 在数组中找到指定索引的元素
  const elementStartLine = findArrayElementStartDeterministic(
    formattedLines, arrayStartLine.index, elementIndex
  );
  
  if (elementStartLine === -1) return { targetLine: -1, confidence: 0, method: 'no_element' };
  
  // 从元素开始行找到右括号
  const closingLineIndex = findMatchingClosingBracketDeterministic(
    formattedLines, elementStartLine, bracket
  );
  
  if (closingLineIndex !== -1) {
    console.log(`数组元素右括号确定性匹配: 数组="${arrayKey}", 索引=${elementIndex} -> 元素开始行 ${elementStartLine}, 右括号行 ${closingLineIndex}`);
    return { targetLine: closingLineIndex, confidence: 100, method: 'array_element_match' };
  }
  
  return { targetLine: -1, confidence: 0, method: 'no_element_closing' };
};

/**
 * 确定性的括号匹配
 */
const findMatchingClosingBracketDeterministic = (formattedLines, startLine, targetBracket) => {
  const openingBracket = targetBracket === '}' ? '{' : '[';
  let braceCount = 0;
  
  for (let i = startLine; i < formattedLines.length; i++) {
    const line = formattedLines[i];
    
    for (let j = 0; j < line.length; j++) {
      if (line[j] === openingBracket) {
        braceCount++;
      } else if (line[j] === targetBracket) {
        braceCount--;
        if (braceCount === 0) {
          return i;
        }
      }
    }
  }
  
  return -1;
};

/**
 * 确定性的数组元素查找
 */
const findArrayElementStartDeterministic = (formattedLines, arrayStartLine, targetIndex) => {
  let currentIndex = 0;
  let braceLevel = 0;
  
  for (let i = arrayStartLine + 1; i < formattedLines.length; i++) {
    const line = formattedLines[i];
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '{' || char === '[') {
        if (braceLevel === 0 && currentIndex === targetIndex) {
          return i;
        }
        braceLevel++;
      } else if (char === '}' || char === ']') {
        braceLevel--;
        if (braceLevel === 0) {
          currentIndex++;
        }
      } else if (char === ']' && braceLevel === 0) {
        break; // 数组结束
      }
    }
  }
  
  return -1;
};

/**
 * 计算匹配优先级
 */
const calculateMatchPriority = (matchInfo) => {
  if (matchInfo.targetLine === -1) return 0;
  
  switch (matchInfo.method) {
    case 'exact_key_match':
    case 'exact_opening_match':
    case 'object_bracket_match':
    case 'array_element_match':
      return 100;
    case 'bracket_fallback':
      return 50;
    default:
      return 10;
  }
};

/**
 * 字段值注释匹配
 */
const findFieldValueCommentMatch = (formattedLines, positionInfo, usedLines) => {
  const { key, anchor } = positionInfo;
  
  console.log(`查找字段值注释: key="${key}"`);
  
  // 使用正则搜索匹配的key
  const regex = new RegExp(anchor.searchPattern);
  
  for (let i = 0; i < formattedLines.length; i++) {
    if (usedLines.has(i)) continue;
    
    const line = formattedLines[i];
    if (regex.test(line)) {
      console.log(`找到字段值匹配: 行 ${i}, 内容: "${line.trim()}"`);
      return i;
    }
  }
  
  return -1;
};

/**
 * 右括号注释匹配（支持数组索引）
 */
const findClosingBracketCommentMatch = (formattedLines, positionInfo, usedLines) => {
  const { bracket, openingInfo, anchor } = positionInfo;
  
  console.log(`查找右括号注释: bracket="${bracket}", openingKey="${openingInfo.key}", arrayIndex=${openingInfo.arrayIndex}, isInArray=${openingInfo.isInArray}`);
  
  if (openingInfo.key && anchor.searchPattern) {
    if (openingInfo.isInArray && openingInfo.arrayIndex >= 0) {
      // 数组元素的匹配
      return findArrayElementClosingBracket(formattedLines, anchor, bracket, openingInfo.arrayIndex, usedLines);
    } else {
      // 普通对象的匹配
      return findObjectClosingBracket(formattedLines, anchor, bracket, usedLines);
    }
  }
  
  // 回退匹配：找任何包含目标括号的行
  for (let i = 0; i < formattedLines.length; i++) {
    if (usedLines.has(i)) continue;
    
    const line = formattedLines[i].trim();
    if (line.includes(bracket)) {
      console.log(`找到右括号回退匹配: 行 ${i}`);
      return i;
    }
  }
  
  return -1;
};

/**
 * 查找数组元素的右括号
 */
const findArrayElementClosingBracket = (formattedLines, anchor, bracket, targetArrayIndex, usedLines) => {
  const { openingKey } = anchor;
  const arrayRegex = new RegExp(`"${openingKey}"\\s*:\\s*\\[`);
  
  // 先找到数组的开始行
  let arrayStartLine = -1;
  for (let i = 0; i < formattedLines.length; i++) {
    if (usedLines.has(i)) continue;
    
    const line = formattedLines[i];
    if (arrayRegex.test(line)) {
      arrayStartLine = i;
      break;
    }
  }
  
  if (arrayStartLine === -1) return -1;
  
  // 在数组中找到目标索引的元素
  const elementInfo = findArrayElementByIndex(formattedLines, arrayStartLine, targetArrayIndex);
  if (elementInfo.openingLine === -1) return -1;
  
  // 从元素开始行找到对应的右括号
  const closingLineIndex = findExactMatchingClosingBracket(formattedLines, elementInfo.openingLine, bracket, usedLines);
  if (closingLineIndex !== -1) {
    console.log(`找到数组元素右括号: 数组="${openingKey}", 索引=${targetArrayIndex}, 开括号行=${elementInfo.openingLine}, 右括号行=${closingLineIndex}`);
    return closingLineIndex;
  }
  
  return -1;
};

/**
 * 查找普通对象的右括号
 */
const findObjectClosingBracket = (formattedLines, anchor, bracket, usedLines) => {
  const openingRegex = new RegExp(anchor.searchPattern);
  let openingLineIndex = -1;
  
  for (let i = 0; i < formattedLines.length; i++) {
    if (usedLines.has(i)) continue;
    
    const line = formattedLines[i];
    if (openingRegex.test(line)) {
      openingLineIndex = i;
      break;
    }
  }
  
  if (openingLineIndex !== -1) {
    const closingLineIndex = findExactMatchingClosingBracket(formattedLines, openingLineIndex, bracket, usedLines);
    if (closingLineIndex !== -1) {
      console.log(`找到对象右括号: 开括号行=${openingLineIndex}, 右括号行=${closingLineIndex}`);
      return closingLineIndex;
    }
  }
  
  return -1;
};

/**
 * 在数组中找到指定索引的元素
 */
const findArrayElementByIndex = (formattedLines, arrayStartLine, targetIndex) => {
  let currentIndex = 0;
  let braceLevel = 0;
  let elementStartLine = -1;
  
  for (let i = arrayStartLine; i < formattedLines.length; i++) {
    const line = formattedLines[i];
    
    // 统计括号
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '{' || char === '[') {
        if (braceLevel === 0) {
          // 新元素开始
          if (currentIndex === targetIndex) {
            elementStartLine = i;
            return { openingLine: elementStartLine, index: currentIndex };
          }
        }
        braceLevel++;
      } else if (char === '}' || char === ']') {
        braceLevel--;
        if (braceLevel === 0) {
          // 元素结束
          currentIndex++;
        }
      } else if (char === ']' && braceLevel === 0) {
        // 数组结束
        break;
      }
    }
  }
  
  return { openingLine: -1, index: -1 };
};

/**
 * 左括号注释匹配  
 */
const findOpeningBracketCommentMatch = (formattedLines, positionInfo, usedLines) => {
  const { bracket, keyInfo, anchor } = positionInfo;
  
  console.log(`查找左括号注释: bracket="${bracket}", key="${keyInfo.key}"`);
  
  if (keyInfo.key && anchor.searchPattern) {
    const regex = new RegExp(anchor.searchPattern);
    
    for (let i = 0; i < formattedLines.length; i++) {
      if (usedLines.has(i)) continue;
      
      const line = formattedLines[i];
      if (regex.test(line)) {
        console.log(`找到左括号匹配: 行 ${i}, 内容: "${line.trim()}"`);
        return i;
      }
    }
  }
  
  // 回退匹配
  for (let i = 0; i < formattedLines.length; i++) {
    if (usedLines.has(i)) continue;
    
    const line = formattedLines[i].trim();
    if (line.includes(bracket)) {
      console.log(`找到左括号回退匹配: 行 ${i}`);
      return i;
    }
  }
  
  return -1;
};

/**
 * 为格式化行构建完整路径
 * @param {Array} formattedLines - 格式化后的JSON行
 * @param {number} lineIndex - 行索引
 * @returns {Array} 完整路径数组
 */
const buildPathForFormattedLine = (formattedLines, lineIndex) => {
  const path = [];
  const line = formattedLines[lineIndex];
  
  // 先添加当前行的key（如果有）
  const currentKeyMatch = line.match(/"([^"]+)"\s*:/);
  if (currentKeyMatch) {
    const currentKey = currentKeyMatch[1];
    
    // 构建父路径
    const parentPath = buildSimpleParentPathForFormatted(formattedLines, lineIndex);
    path.push(...parentPath, currentKey);
  }
  
  return path;
};

/**
 * 为格式化的JSON行构建父路径
 * @param {Array} formattedLines - 格式化后的JSON行
 * @param {number} lineIndex - 行索引
 * @returns {Array} 父路径数组
 */
const buildSimpleParentPathForFormatted = (formattedLines, lineIndex) => {
  const path = [];
  let currentIndent = getLineIndent(formattedLines[lineIndex]);
  
  // 向上查找，寻找缩进更少的行中的key
  for (let i = lineIndex - 1; i >= 0; i--) {
    const line = formattedLines[i];
    const lineIndent = getLineIndent(line);
    
    // 只考虑缩进更少的行
    if (lineIndent < currentIndent) {
      const keyMatch = line.match(/"([^"]+)"\s*:\s*[{\[]/);
      if (keyMatch) {
        path.unshift(keyMatch[1]);
        currentIndent = lineIndent;
      }
    }
  }
  
  return path;
};

/**
 * 精确匹配右括号（不考虑已使用行限制）
 */
const findExactMatchingClosingBracket = (formattedLines, openingLineIndex, targetBracket, usedLines) => {
  const openingBracket = targetBracket === '}' ? '{' : '[';
  let braceCount = 0;
  
  for (let i = openingLineIndex; i < formattedLines.length; i++) {
    // 注意：这里不检查usedLines，因为我们需要找到真正匹配的括号
    const line = formattedLines[i];
    
    // 计算括号数量
    for (let j = 0; j < line.length; j++) {
      if (line[j] === openingBracket) {
        braceCount++;
      } else if (line[j] === targetBracket) {
        braceCount--;
        if (braceCount === 0) {
          // 找到匹配的右括号，但要检查是否已被使用
          if (!usedLines.has(i)) {
            return i;
          }
          // 如果已被使用，继续寻找下一个匹配的括号
          braceCount = 1; // 重置计数，继续寻找
        }
      }
    }
  }
  
  return -1;
};

/**
 * 查找括号注释的匹配行（改进版）
 * @param {Array} formattedLines - 格式化后的JSON行
 * @param {Object} positionInfo - 位置信息
 * @param {Set} usedLines - 已使用的行
 * @returns {number} 匹配的行索引
 */
const findBracketMatch = (formattedLines, positionInfo, usedLines) => {
  const { bracket, bracketInfo, fullLine } = positionInfo;
  const { key, fullPath, bracketType } = bracketInfo;
  
  console.log(`查找括号匹配: bracket="${bracket}", key="${key}", fullPath=[${fullPath.join(', ')}]`);
  
  if (bracket === '{' || bracket === '[') {
    // 左括号：查找对象/数组的开始
    return findOpeningBracketMatch(formattedLines, positionInfo, usedLines);
  } else {
    // 右括号：查找对象/数组的结束
    return findClosingBracketMatch(formattedLines, positionInfo, usedLines);
  }
};

/**
 * 查找左括号的匹配行
 */
const findOpeningBracketMatch = (formattedLines, positionInfo, usedLines) => {
  const { bracketInfo } = positionInfo;
  const { key, fullPath } = bracketInfo;
  
  for (let i = 0; i < formattedLines.length; i++) {
    if (usedLines.has(i)) continue;
    
    const line = formattedLines[i].trim();
    const openMatch = line.match(/"([^"]+)"\s*:\s*[\{\[]/);
    
    if (openMatch && openMatch[1] === key) {
      const lineParentPath = findParentPathForFormattedLine(formattedLines, i, key);
      if (arraysEqual(lineParentPath, fullPath.slice(0, -1))) {
        console.log(`找到左括号匹配: 行 ${i}`);
        return i;
      }
    }
  }
  
  return -1;
};

/**
 * 查找右括号的匹配行（改进版）
 */
const findClosingBracketMatch = (formattedLines, positionInfo, usedLines) => {
  const { bracket, bracketInfo, fullLine } = positionInfo;
  const { key, fullPath, openingLineIndex, matchingLine } = bracketInfo;
  
  console.log(`查找右括号匹配，原始开括号行: ${openingLineIndex}, 匹配行内容: "${matchingLine}"`);
  
  // 策略1: 如果有明确的key信息，精确匹配
  if (key && fullPath.length > 0) {
    // 首先查找对应的开括号
    const openingLineMatch = findCorrespondingOpeningLine(formattedLines, key, fullPath, usedLines);
    if (openingLineMatch !== -1) {
      // 找到开括号后，查找对应的右括号
      const closingLineMatch = findCorrespondingClosingLine(formattedLines, openingLineMatch, bracket, usedLines);
      if (closingLineMatch !== -1) {
        console.log(`精确匹配右括号: 行 ${closingLineMatch}`);
        return closingLineMatch;
      }
    }
  }
  
  // 策略2: 回退到模糊匹配
  for (let i = 0; i < formattedLines.length; i++) {
    if (usedLines.has(i)) continue;
    
    const line = formattedLines[i].trim();
    
    if (line.includes(bracket)) {
      // 检查这个右括号的上下文是否合理
      const context = findClosingBracketContext(formattedLines, i, bracket);
      if (context) {
        // 如果有路径信息，尝试匹配
        if (fullPath.length > 0 && context.fullPath && arraysEqual(context.fullPath, fullPath)) {
          console.log(`找到右括号匹配（路径匹配）: 行 ${i}`);
          return i;
        }
        // 如果没有路径信息或路径不匹配，检查是否是合理的候选
        if (fullPath.length === 0 || !context.fullPath) {
          console.log(`找到右括号匹配（回退匹配）: 行 ${i}`);
          return i;
        }
      }
    }
  }
  
  return -1;
};

/**
 * 查找对应的开括号行
 */
const findCorrespondingOpeningLine = (formattedLines, key, fullPath, usedLines) => {
  for (let i = 0; i < formattedLines.length; i++) {
    if (usedLines.has(i)) continue;
    
    const line = formattedLines[i].trim();
    const openMatch = line.match(/"([^"]+)"\s*:\s*[\{\[]/);
    
    if (openMatch && openMatch[1] === key) {
      const lineParentPath = findParentPathForFormattedLine(formattedLines, i, key);
      if (arraysEqual(lineParentPath, fullPath.slice(0, -1))) {
        return i;
      }
    }
  }
  
  return -1;
};

/**
 * 从开括号行查找对应的右括号行
 */
const findCorrespondingClosingLine = (formattedLines, openingLineIndex, targetBracket, usedLines) => {
  const openingLine = formattedLines[openingLineIndex];
  const openingBracket = targetBracket === '}' ? '{' : '[';
  
  let braceCount = 0;
  let foundOpening = false;
  
  for (let i = openingLineIndex; i < formattedLines.length; i++) {
    if (usedLines.has(i)) continue;
    
    const line = formattedLines[i];
    
    // 计算这一行的括号数量
    for (let j = 0; j < line.length; j++) {
      if (line[j] === openingBracket) {
        braceCount++;
        foundOpening = true;
      } else if (line[j] === targetBracket) {
        if (foundOpening) {
          braceCount--;
          if (braceCount === 0) {
            // 找到匹配的右括号
            return i;
          }
        }
      }
    }
  }
  
  return -1;
};

/**
 * 为格式化行查找父路径
 * @param {Array} formattedLines - 格式化后的JSON行
 * @param {number} lineIndex - 行索引
 * @param {string} currentKey - 当前key
 * @returns {Array} 父路径数组
 */
const findParentPathForFormattedLine = (formattedLines, lineIndex, currentKey) => {
  const path = [];
  let currentIndent = getLineIndent(formattedLines[lineIndex]);
  
  // 向上查找，寻找缩进更少的行中的key
  for (let i = lineIndex - 1; i >= 0; i--) {
    const line = formattedLines[i];
    const lineIndent = getLineIndent(line);
    
    // 只考虑缩进更少的行
    if (lineIndent < currentIndent) {
      const keyMatch = line.match(/"([^"]+)"\s*:\s*[{\[]/);
      if (keyMatch) {
        path.unshift(keyMatch[1]);
        currentIndent = lineIndent;
      }
    }
  }
  
  return path;
};

/**
 * 查找右括号的上下文信息
 * @param {Array} formattedLines - 格式化后的JSON行
 * @param {number} lineIndex - 行索引  
 * @param {string} closingBracket - 右括号
 * @returns {Object|null} 上下文信息
 */
const findClosingBracketContext = (formattedLines, lineIndex, closingBracket) => {
  const matchingOpen = closingBracket === '}' ? '{' : '[';
  let braceCount = 1;
  
  // 向上查找对应的左括号
  for (let i = lineIndex - 1; i >= 0; i--) {
    const line = formattedLines[i];
    if (line.includes(closingBracket)) braceCount++;
    if (line.includes(matchingOpen)) braceCount--;
    
    if (braceCount === 0) {
      // 找到对应的开括号
      const keyMatch = line.match(/"([^"]+)"\s*:\s*[{\[]/);
      if (keyMatch) {
        const key = keyMatch[1];
        const parentPath = findParentPathForFormattedLine(formattedLines, i, key);
        return {
          key: key,
          parentPath: parentPath,
          fullPath: [...parentPath, key]
        };
      }
      break;
    }
  }
  
  return null;
};

/**
 * 比较两个数组是否相等
 * @param {Array} arr1 - 数组1
 * @param {Array} arr2 - 数组2
 * @returns {boolean} 是否相等
 */
const arraysEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, index) => val === arr2[index]);
};

/**
 * 带已使用行集合的匹配函数
 * @param {Array} formattedLines - 格式化后的JSON行数组
 * @param {Object} comment - 注释对象
 * @param {Set} usedLines - 已使用的行集合
 * @returns {number} 最匹配的行索引，-1表示未找到
 */
const findBestMatchLineWithUsedSet = (formattedLines, comment, usedLines) => {
  console.log(`\n匹配注释: "${comment.commentText}"`);
  console.log(`前置内容: "${comment.contentBefore}"`);
  
  if (!comment.hasContentBefore) {
    console.log("跳过：没有前置内容");
    return -1;
  }
  
  const originalContent = comment.contentBefore;
  
  // 特殊处理：检查是否是大括号/方括号注释
  const isBraceComment = originalContent.endsWith('{') || originalContent.endsWith('[') || 
                        originalContent.endsWith('}') || originalContent.endsWith(']');
  
  if (isBraceComment) {
    console.log("检测到大括号/方括号注释，使用上下文匹配");
    return findBraceCommentMatch(formattedLines, comment, usedLines);
  }
  
  // 提取原始内容的关键信息
  let originalKey = '';
  let originalValue = '';
  let hasValue = false;
  
  const propertyMatch = originalContent.match(/"([^"]+)"\s*:\s*(.*)/);
  if (propertyMatch) {
    originalKey = propertyMatch[1];
    originalValue = propertyMatch[2].trim();
    hasValue = originalValue && !originalValue.startsWith('{') && !originalValue.startsWith('[');
  }
  
  console.log(`提取的属性: "${originalKey}", 值: "${originalValue}", 有值: ${hasValue}`);
  
  let bestMatch = -1;
  let bestScore = 0;
  
  for (let i = 0; i < formattedLines.length; i++) {
    if (usedLines.has(i)) continue; // 跳过已使用的行
    
    const line = formattedLines[i];
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // 检查是否是属性行
    const formattedPropertyMatch = trimmedLine.match(/"([^"]+)"\s*:\s*(.*)/);
    if (!formattedPropertyMatch) continue;
    
    const formattedKey = formattedPropertyMatch[1];
    const formattedValue = formattedPropertyMatch[2].trim();
    const formattedHasValue = formattedValue && !formattedValue.startsWith('{') && !formattedValue.startsWith('[');
    
    // 属性名必须匹配
    if (formattedKey !== originalKey) continue;
    
    // 计算匹配分数
    let score = 50; // 基础分：属性名匹配
    
    // 值类型匹配加分
    if (hasValue === formattedHasValue) {
      score += 30;
    }
    
    // 如果都有值，比较值的相似度
    if (hasValue && formattedHasValue) {
      const cleanOriginalValue = originalValue.replace(/[,\s]/g, '').toLowerCase();
      const cleanFormattedValue = formattedValue.replace(/[,\s]/g, '').toLowerCase();
      
      if (cleanOriginalValue === cleanFormattedValue) {
        score += 20; // 值完全匹配
      } else if (cleanOriginalValue.includes(cleanFormattedValue) || cleanFormattedValue.includes(cleanOriginalValue)) {
        score += 10; // 值部分匹配
      }
    }
    
    console.log(`行 ${i}: "${trimmedLine}" - 分数: ${score}`);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = i;
    }
  }
  
  if (bestMatch !== -1) {
    console.log(`最佳匹配: 行 ${bestMatch}, 分数: ${bestScore}`);
    return bestMatch;
  }
  
  console.log(`匹配失败`);
  return -1;
};

/**
 * 专门处理大括号/方括号注释的匹配
 * @param {Array} formattedLines - 格式化后的JSON行数组
 * @param {Object} comment - 注释对象
 * @param {Set} usedLines - 已使用的行集合
 * @returns {number} 最匹配的行索引，-1表示未找到
 */
const findBraceCommentMatch = (formattedLines, comment, usedLines) => {
  const originalContent = comment.contentBefore;
  console.log(`处理大括号注释，原始内容: "${originalContent}"`);
  
  // 提取属性名（如果有的话）
  let targetProperty = '';
  const propertyMatch = originalContent.match(/"([^"]+)"\s*:\s*[\{\[]/);
  if (propertyMatch) {
    targetProperty = propertyMatch[1];
    console.log(`目标属性: "${targetProperty}"`);
  }
  
  // 确定注释的类型：对象开始、数组开始、对象结束、数组结束
  let targetSymbol = '';
  let isOpening = false;
  
  if (originalContent.endsWith('{')) {
    targetSymbol = '{';
    isOpening = true;
  } else if (originalContent.endsWith('[')) {
    targetSymbol = '[';
    isOpening = true;
  } else if (originalContent.endsWith('}')) {
    targetSymbol = '}';
    isOpening = false;
  } else if (originalContent.endsWith(']')) {
    targetSymbol = ']';
    isOpening = false;
  }
  
  console.log(`目标符号: "${targetSymbol}", 是否为开始: ${isOpening}`);
  
  let bestMatch = -1;
  let bestScore = 0;
  
  for (let i = 0; i < formattedLines.length; i++) {
    if (usedLines.has(i)) continue;
    
    const line = formattedLines[i];
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    let score = 0;
    
    if (isOpening && targetProperty) {
      // 对于开始符号且有属性名的情况，查找 "property": { 或 "property": [
      const openingMatch = trimmedLine.match(/"([^"]+)"\s*:\s*[\{\[]/);
      if (openingMatch && openingMatch[1] === targetProperty) {
        score = 100; // 完全匹配
        console.log(`找到开始符号匹配，行 ${i}: "${trimmedLine}"`);
      }
    } else if (!isOpening) {
      // 对于结束符号，需要考虑缩进层级和上下文
      if (trimmedLine.includes(targetSymbol)) {
        score = 60; // 基础匹配
        
        // 通过缩进和上下文进一步判断
        const indent = line.length - line.trimStart().length;
        
        // 检查前面几行是否有相关的开始标记
        const contextScore = calculateBraceContext(formattedLines, i, targetProperty, comment.originalLineIndex);
        score += contextScore;
        
        console.log(`找到结束符号候选，行 ${i}: "${trimmedLine}", 分数: ${score}`);
      }
    } else if (isOpening && !targetProperty) {
      // 独立的开始符号（较少见）
      if (trimmedLine === targetSymbol) {
        score = 80;
        console.log(`找到独立开始符号，行 ${i}: "${trimmedLine}"`);
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = i;
    }
  }
  
  if (bestMatch !== -1) {
    console.log(`大括号注释最佳匹配: 行 ${bestMatch}, 分数: ${bestScore}`);
    return bestMatch;
  }
  
  console.log(`大括号注释匹配失败`);
  return -1;
};

/**
 * 计算大括号注释的上下文分数
 * @param {Array} formattedLines - 格式化后的JSON行
 * @param {number} lineIndex - 当前行索引
 * @param {string} targetProperty - 目标属性名
 * @param {number} originalLineIndex - 原始行号
 * @returns {number} 上下文分数
 */
const calculateBraceContext = (formattedLines, lineIndex, targetProperty, originalLineIndex) => {
  // 简单的上下文检查：看前面是否有对应的属性
  if (!targetProperty) return 0;
  
  // 检查前面几行是否有目标属性
  for (let i = Math.max(0, lineIndex - 10); i < lineIndex; i++) {
    const line = formattedLines[i].trim();
    if (line.includes(`"${targetProperty}"`)) {
      return 20; // 找到相关属性
    }
  }
  
  return 0;
};

/**
 * Converts a Java object's toString() output to a valid JSON string.
 * Handles nested objects, arrays, and various formats.
 * @param {string} input The `toString()` output.
 * @returns {{json: object, warnings: string[]}}
 */
export function javaToStringToObject(input) {
    let i = 0;
    const warnings = [];
    const str = input.trim();

    try {
        // First, try to parse as plain JSON
        return {
            result: JSON.parse(str),
            warnings: [],
        };
    } catch (e) {
        // Ignore and proceed with custom parser if it's not valid JSON
    }


    const skipWhitespace = () => {
        while (i < str.length && /\s/.test(str[i])) {
            i++;
        }
    };

    const parseValue = () => {
        skipWhitespace();
        const char = str[i];

        const isObjectOrArray = (substr) => /^[a-zA-Z0-9_.]*\s*[{[(\[]/.test(substr);

        if (isObjectOrArray(str.substring(i))) {
            if (str.substring(i).match(/^[a-zA-Z0-9_.]*\s*\[/)) return parseArray();
            return parseObject();
        }
        if (char === '[') return parseArray();
        if (char === '{' || char === '(') return parseObject();
        
        return parsePrimitive();
    };

    const parseObject = () => {
        const classNameMatch = str.substring(i).match(/^[a-zA-Z0-9_.]+/) ;
        if (classNameMatch) {
            i += classNameMatch[0].length;
            skipWhitespace();
        }

        const openChar = str[i];
        if (openChar !== '{' && openChar !== '(') throw new Error(`Unexpected token at object start: ${openChar}`);
        const closeChar = openChar === '{' ? '}' : ')';
        i++; 

        const obj = {};
        skipWhitespace();

        while (i < str.length && str[i] !== closeChar) {
            const key = parseKey();
            skipWhitespace();
            if (str[i] !== '=') throw new Error(`Expected '=' after key "${key}"`);
            i++;
            
            const value = parseValue();
            obj[key] = value;
            
            skipWhitespace();
            if (str[i] === ',') {
                i++;
                skipWhitespace();
            }
        }

        if (i >= str.length || str[i] !== closeChar) throw new Error(`Expected '${closeChar}' to close object`);
        i++;
        return obj;
    };

    const parseArray = () => {
        i++;
        const arr = [];
        skipWhitespace();

        while (i < str.length && str[i] !== ']') {
            arr.push(parseValue());
            skipWhitespace();
            if (str[i] === ',') {
                i++;
                skipWhitespace();
            }
        }

        if (i >= str.length || str[i] !== ']') throw new Error("Expected ']' to close array");
        i++;
        return arr;
    };

    const parseKey = () => {
        skipWhitespace();
        const start = i;
        while (i < str.length && str[i] !== '=') {
            i++;
        }
        return str.substring(start, i).trim();
    };

    const parsePrimitive = () => {
        skipWhitespace();
        let end = i;
        let inQuote = false;
        
        while (end < str.length) {
            if (str[end] === '"') inQuote = !inQuote;
            if (!inQuote && (str[end] === ',' || str[end] === '}' || str[end] === ')' || str[end] === ']')) {
                break;
            }
            end++;
        }

        let valueStr = str.substring(i, end).trim();
        i = end;

        if (valueStr.startsWith('"') && valueStr.endsWith('"')) {
            return valueStr.slice(1, -1);
        }
        if (valueStr === 'null') return null;
        if (valueStr === 'true') return true;
        if (valueStr === 'false') return false;
        if (!isNaN(valueStr) && valueStr.trim() !== '') {
            const num = Number(valueStr);
            if (!Number.isSafeInteger(num)) {
                warnings.push(`数值 ${valueStr} 超出JavaScript安全整数范围，已转换为字符串。`);
                return valueStr;
            }
            return num;
        }
        return valueStr;
    };

    const result = parseValue();
    return {
        result,
        warnings,
    };
} 