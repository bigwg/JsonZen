/**
 * 测试工具函数
 */

/**
 * 标准化换行符，确保跨平台一致性
 */
export function normalizeLineEndings(str) {
  return str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * 移除多余的空白字符用于比较
 */
export function normalizeWhitespace(str) {
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * 检查字符串是否包含特定注释
 */
export function containsComment(str, comment) {
  return normalizeWhitespace(str).includes(normalizeWhitespace(comment));
}

/**
 * 提取JSON中的所有数字
 */
export function extractNumbers(jsonStr) {
  const numbers = [];
  const regex = /:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
  let match;
  
  while ((match = regex.exec(jsonStr)) !== null) {
    numbers.push(match[1]);
  }
  
  return numbers;
}

/**
 * 检查是否为有效的JSON
 */
export function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * 创建测试用的大数字
 */
export function createBigNumber() {
  return '1753586062170048662';
}

/**
 * 创建测试用的超大数字
 */
export function createHugeBigNumber() {
  return '99999999999999999999';
}

/**
 * 比较两个JSON字符串的结构是否相同（忽略格式差异）
 */
export function jsonStructureEqual(json1, json2) {
  try {
    const obj1 = JSON.parse(json1);
    const obj2 = JSON.parse(json2);
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  } catch {
    return false;
  }
}

/**
 * 计算字符串中的注释数量
 */
export function countComments(str) {
  const lineComments = (str.match(/\/\/.*$/gm) || []).length;
  const blockComments = (str.match(/\/\*[\s\S]*?\*\//g) || []).length;
  return lineComments + blockComments;
}

/**
 * 创建标准测试断言
 */
export const assertions = {
  /**
   * 断言包含大数字
   */
  containsBigNumber(result, expectedNumber) {
    expect(result).toContain(expectedNumber);
    expect(result).not.toContain(Number(expectedNumber).toString());
  },

  /**
   * 断言保留了注释
   */
  preservesComments(original, result) {
    const originalCommentCount = countComments(original);
    const resultCommentCount = countComments(result);
    expect(resultCommentCount).toBeGreaterThan(0);
    expect(resultCommentCount).toBe(originalCommentCount);
  },

  /**
   * 断言移除了注释
   */
  removesComments(result) {
    const commentCount = countComments(result);
    expect(commentCount).toBe(0);
  },

  /**
   * 断言是有效的JSON
   */
  isValidJSON(result) {
    expect(isValidJSON(result)).toBe(true);
  }
};