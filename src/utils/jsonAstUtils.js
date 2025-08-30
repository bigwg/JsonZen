/**
 * JSON AST工具集成文件
 * 提供统一的API来替换原有的jsonParser功能
 */

import { parseJSONWithComments } from './jsonAstParser.js';
import { formatJSONAST, compressJSONAST, formatJSONASTWithoutComments } from './jsonAstFormatter.js';
import { ASTUtils, ASTValidator } from './jsonAst.js';

/**
 * 检查JSON字符串是否包含注释
 */
export function hasComments(jsonStr) {
  try {
    const ast = parseJSONWithComments(jsonStr);
    let hasComments = false;
    
    ASTUtils.traverse(ast, {
      enter: (node) => {
        const comments = ASTUtils.getAllComments(node);
        if (comments.length > 0) {
          hasComments = true;
        }
      }
    });
    
    return hasComments;
  } catch (error) {
    // 如果解析失败，回退到简单的字符串检查
    return jsonStr.includes('//') || jsonStr.includes('/*');
  }
}

/**
 * 格式化JSON（保持注释和大数字精度）
 */
export function formatJson(jsonStr, options = {}) {
  try {
    const ast = parseJSONWithComments(jsonStr);
    
    // 验证AST
    const validation = ASTValidator.validate(ast);
    if (!validation.valid) {
      throw new Error(`AST validation failed: ${validation.errors.join(', ')}`);
    }
    
    const defaultOptions = {
      indent: 4,
      preserveComments: true,
      ...options
    };
    
    return formatJSONAST(ast, defaultOptions);
  } catch (error) {
    throw new Error(`JSON格式化失败: ${error.message}`);
  }
}

/**
 * 压缩JSON（移除空白和注释）
 */
export function compressJson(jsonStr) {
  try {
    const ast = parseJSONWithComments(jsonStr);
    return compressJSONAST(ast);
  } catch (error) {
    throw new Error(`JSON压缩失败: ${error.message}`);
  }
}

/**
 * 去除注释（保持格式化）
 */
export function removeComments(jsonStr, options = {}) {
  try {
    const ast = parseJSONWithComments(jsonStr);
    
    const defaultOptions = {
      indent: 4,
      preserveComments: false,
      ...options
    };
    
    return formatJSONASTWithoutComments(ast, defaultOptions);
  } catch (error) {
    throw new Error(`去除注释失败: ${error.message}`);
  }
}

/**
 * 验证JSON语法（兼容数字key）
 */
export function validateJson(jsonStr) {
  try {
    // 使用新的解析函数，自动兼容数字key
    const ast = parseJSONWithComments(jsonStr);
    const validation = ASTValidator.validate(ast);
    
    return {
      valid: validation.valid,
      errors: validation.errors,
      ast: validation.valid ? ast : null,
      hasNumericKeys: ast._hasNumericKeys || false
    };
  } catch (error) {
    return {
      valid: false,
      errors: [error.message],
      ast: null,
      hasNumericKeys: false
    };
  }
}

/**
 * 检测大数字
 */
export function detectBigNumbers(jsonStr) {
  try {
    const ast = parseJSONWithComments(jsonStr);
    const bigNumbers = [];
    
    ASTUtils.traverse(ast, {
      enter: (node) => {
        if (node.type === 'Literal' && node.isBigInteger) {
          bigNumbers.push({
            value: node.value,
            numericValue: node.numericValue,
            raw: node.raw
          });
        }
      }
    });
    
    return {
      hasBigNumbers: bigNumbers.length > 0,
      bigNumbers
    };
  } catch (error) {
    return {
      hasBigNumbers: false,
      bigNumbers: [],
      error: error.message
    };
  }
}

/**
 * 转换注释格式（// <-> /星 星/）
 */
export function convertCommentStyle(jsonStr) {
  try {
    const ast = parseJSONWithComments(jsonStr);
    
    // 遍历AST并转换注释类型
    ASTUtils.traverse(ast, {
      enter: (node) => {
        const allComments = ASTUtils.getAllComments(node);
        
        allComments.forEach(comment => {
          if (comment.type === 'LineComment') {
            // // 注释转换为 /* */ 注释
            const text = comment.text.substring(2).trim();
            comment.type = 'BlockComment';
            comment.text = `/* ${text} */`;
            comment.originalText = `/* ${text} */`;
          } else if (comment.type === 'BlockComment') {
            // /* */ 注释转换为 // 注释
            let text = comment.text;
            if (text.startsWith('/*') && text.endsWith('*/')) {
              text = text.substring(2, text.length - 2).trim();
            }
            comment.type = 'LineComment';
            comment.text = `// ${text}`;
            comment.originalText = `// ${text}`;
          }
        });
      }
    });
    
    return formatJSONAST(ast);
  } catch (error) {
    throw new Error(`注释格式转换失败: ${error.message}`);
  }
}

/**
 * 添加转义字符
 */
export function escapeJson(jsonStr) {
  // 对于转义操作，我们直接使用字符串操作，因为它不涉及JSON结构解析
  try {
    return jsonStr.replace(/(?<!\\)"/g, '\\"');
  } catch (error) {
    throw new Error(`添加转义失败: ${error.message}`);
  }
}

/**
 * 移除转义字符
 */
export function unescapeJson(jsonStr) {
  try {
    return jsonStr.replace(/\\"/g, '"');
  } catch (error) {
    throw new Error(`移除转义失败: ${error.message}`);
  }
}

/**
 * 获取JSON统计信息
 */
export function getJsonStats(jsonStr) {
  try {
    const ast = parseJSONWithComments(jsonStr);
    
    const stats = {
      objects: 0,
      arrays: 0,
      properties: 0,
      literals: 0,
      comments: 0,
      bigNumbers: 0,
      maxDepth: 0
    };
    
    let currentDepth = 0;
    
    ASTUtils.traverse(ast, {
      enter: (node) => {
        switch (node.type) {
          case 'ObjectExpression':
            stats.objects++;
            currentDepth++;
            stats.maxDepth = Math.max(stats.maxDepth, currentDepth);
            break;
          case 'ArrayExpression':
            stats.arrays++;
            currentDepth++;
            stats.maxDepth = Math.max(stats.maxDepth, currentDepth);
            break;
          case 'Property':
            stats.properties++;
            break;
          case 'Literal':
            stats.literals++;
            if (node.isBigInteger) {
              stats.bigNumbers++;
            }
            break;
        }
        
        const comments = ASTUtils.getAllComments(node);
        stats.comments += comments.length;
      },
      exit: (node) => {
        if (node.type === 'ObjectExpression' || node.type === 'ArrayExpression') {
          currentDepth--;
        }
      }
    });
    
    return stats;
  } catch (error) {
    throw new Error(`获取JSON统计信息失败: ${error.message}`);
  }
}

/**
 * 兼容性：保持原有的API接口
 */

// 兼容原有的parseJsonWithComments函数
export function parseJsonWithComments(jsonStr) {
  try {
    const ast = parseJSONWithComments(jsonStr);
    
    // 返回兼容的格式
    return {
      parsed: ast, // 现在返回AST而不是普通对象
      jsonOnly: removeComments(jsonStr), // 去除注释的JSON字符串
      formatted: jsonStr // 保持原始格式
    };
  } catch (error) {
    throw new Error(`JSON解析错误：${error.message}`);
  }
}

// 兼容原有的extractCommentsAndStructure函数
export function extractCommentsAndStructure(jsonStr) {
  try {
    const ast = parseJSONWithComments(jsonStr);
    const comments = [];
    const cleanLines = removeComments(jsonStr).split('\n');
    
    // 提取所有注释
    ASTUtils.traverse(ast, {
      enter: (node) => {
        const nodeComments = ASTUtils.getAllComments(node);
        nodeComments.forEach((comment, index) => {
          comments.push({
            originalLineIndex: -1, // AST系统中不需要行号
            commentText: comment.originalText,
            contentBefore: '', // AST系统中不需要
            hasContentBefore: false,
            semanticPath: '', // AST系统中通过节点关系确定
            commentType: comment.type === 'LineComment' ? 'line' : 'block',
            astNode: node, // 新增：直接引用AST节点
            position: comment.position
          });
        });
      }
    });
    
    return { comments, cleanLines };
  } catch (error) {
    throw new Error(`提取注释结构失败: ${error.message}`);
  }
}

// 兼容原有的mergeJsonWithComments函数
export function mergeJsonWithComments(formattedJson, originalData) {
  // 在AST系统中，注释已经绑定到节点，不需要重新合并
  // 这个函数主要用于向后兼容
  try {
    const ast = parseJSONWithComments(originalData.comments ? originalData.comments[0]?.astNode?.root || formattedJson : formattedJson);
    return formatJSONAST(ast);
  } catch (error) {
    // 回退到原始JSON
    return formattedJson;
  }
}