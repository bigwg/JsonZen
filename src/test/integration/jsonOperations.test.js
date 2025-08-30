/**
 * JSON 操作功能集成测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  formatJson,
  compressJson,
  removeComments,
  convertCommentStyle,
  hasComments,
  detectBigNumbers,
  validateJson,
  escapeJson,
  unescapeJson
} from '@/utils/jsonAstUtils.js';
import { 
  basicComments,
  complexComments,
  bigNumbers,
  bracketComments,
  mixedComments,
  pureJSON,
  invalidJSON,
  escapedJSON
} from '../fixtures/jsonSamples.js';
import { assertions, createBigNumber, countComments } from '../helpers/testUtils.js';

describe('JSON操作功能集成测试', () => {
  describe('formatJson', () => {
    it('应该格式化包含基础注释的JSON', () => {
      const result = formatJson(basicComments);

      assertions.isValidJSON(result.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''));
      assertions.preservesComments(basicComments, result);
      expect(result).toContain('"name": "test"');
      expect(result).toContain('"age": 25');
    });

    it('应该格式化复杂嵌套注释的JSON', () => {
      const result = formatJson(complexComments);

      assertions.isValidJSON(result.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''));
      assertions.preservesComments(complexComments, result);
      expect(result).toContain('"activityCardViewList"');
      expect(result).toContain('"upcomingActivityCardViewList"');
    });

    it('应该格式化包含各种括号注释的JSON', () => {
      const result = formatJson(bracketComments);

      assertions.isValidJSON(result.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''));
      assertions.preservesComments(bracketComments, result);
      expect(result).toContain('// 对象开始');
      expect(result).toContain('// 数组结束');
    });

    it('应该保持大数字精度', () => {
      const result = formatJson(bigNumbers);
      const bigNum = createBigNumber();

      assertions.containsBigNumber(result, bigNum);
      assertions.isValidJSON(result);
    });

    it('应该格式化纯JSON（无注释）', () => {
      const result = formatJson(pureJSON);

      assertions.isValidJSON(result);
      expect(result).toContain('"name": "test"');
      expect(result).toContain('"hobbies": [');
    });

    it('应该支持自定义格式化选项', () => {
      const result = formatJson(pureJSON, { indent: 4 });

      // 检查是否使用了4空格缩进
      const lines = result.split('\n');
      const indentedLine = lines.find(line => line.startsWith('    '));
      expect(indentedLine).toBeDefined();
    });

    it('应该处理格式化错误', () => {
      expect(() => formatJson(invalidJSON)).toThrow(/JSON格式化失败/);
    });
  });

  describe('compressJson', () => {
    it('应该压缩纯JSON', () => {
      const result = compressJson(pureJSON);

      assertions.isValidJSON(result);
      expect(result).not.toContain('\n');
      expect(result).not.toContain('  ');
      expect(result).toContain('{"name":"test"');
    });

    it('应该在压缩时移除注释', () => {
      const noCommentJson = removeComments(basicComments);
      const result = compressJson(noCommentJson);

      assertions.isValidJSON(result);
      assertions.removesComments(result);
      expect(result).not.toContain('\n');
    });

    it('应该保持大数字精度', () => {
      const result = compressJson(bigNumbers);
      const bigNum = createBigNumber();

      assertions.containsBigNumber(result, bigNum);
      assertions.isValidJSON(result);
    });

    it('应该处理压缩错误', () => {
      expect(() => compressJson(invalidJSON)).toThrow(/JSON压缩失败/);
    });
  });

  describe('removeComments', () => {
    it('应该移除所有类型的注释', () => {
      const result = removeComments(mixedComments);

      assertions.removesComments(result);
      assertions.isValidJSON(result);
      expect(result).toContain('"lineComment": "value"');
      expect(result).toContain('"blockComment": "value"');
    });

    it('应该保持JSON结构不变', () => {
      const result = removeComments(basicComments);
      const originalWithoutComments = JSON.parse(result);

      expect(originalWithoutComments.name).toBe('test');
      expect(originalWithoutComments.age).toBe(25);
      expect(originalWithoutComments.city).toBe('北京');
    });

    it('应该处理复杂嵌套结构', () => {
      const result = removeComments(complexComments);

      assertions.removesComments(result);
      assertions.isValidJSON(result);
      expect(result).toContain('"activityCardViewList"');
    });

    it('应该保持大数字精度', () => {
      const result = removeComments(bigNumbers);
      const bigNum = createBigNumber();

      assertions.containsBigNumber(result, bigNum);
      assertions.isValidJSON(result);
    });
  });

  describe('convertCommentStyle', () => {
    it('应该转换行注释为块注释', () => {
      const lineCommentJson = '{"name": "test" // 行注释\n}';
      const result = convertCommentStyle(lineCommentJson);

      expect(result).toContain('/* 行注释 */');
      expect(result).not.toContain('// 行注释');
    });

    it('应该转换块注释为行注释', () => {
      const blockCommentJson = '{"name": "test" /* 块注释 */}';
      const result = convertCommentStyle(blockCommentJson);

      expect(result).toContain('// 块注释');
      expect(result).not.toContain('/* 块注释 */');
    });

    it('应该处理混合注释类型', () => {
      const result = convertCommentStyle(mixedComments);

      // 验证转换结果仍然有注释，只是类型发生了变化
      const originalCommentCount = countComments(mixedComments);
      const resultCommentCount = countComments(result);
      expect(resultCommentCount).toBe(originalCommentCount);
    });

    it('应该处理转换错误', () => {
      expect(() => convertCommentStyle(invalidJSON)).toThrow(/注释格式转换失败/);
    });
  });

  describe('hasComments', () => {
    it('应该检测到行注释', () => {
      const lineCommentJson = '{"name": "test" // 注释\n}';
      expect(hasComments(lineCommentJson)).toBe(true);
    });

    it('应该检测到块注释', () => {
      const blockCommentJson = '{"name": "test" /* 注释 */}';
      expect(hasComments(blockCommentJson)).toBe(true);
    });

    it('应该检测到复杂注释', () => {
      expect(hasComments(basicComments)).toBe(true);
      expect(hasComments(complexComments)).toBe(true);
      expect(hasComments(mixedComments)).toBe(true);
    });

    it('对于纯JSON应该返回false', () => {
      expect(hasComments(pureJSON)).toBe(false);
    });

    it('应该处理格式错误的JSON', () => {
      // 即使JSON格式错误，仍然应该能检测注释
      const result = hasComments(invalidJSON);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('detectBigNumbers', () => {
    it('应该检测到大数字', () => {
      const result = detectBigNumbers(bigNumbers);

      expect(result.hasBigNumbers).toBe(true);
      expect(result.bigNumbers).toBeDefined();
      expect(result.bigNumbers.length).toBeGreaterThan(0);
      
      const bigNum = result.bigNumbers.find(num => num.value === createBigNumber());
      expect(bigNum).toBeDefined();
    });

    it('对于普通数字应该返回false', () => {
      const normalJson = '{"small": 123, "decimal": 3.14}';
      const result = detectBigNumbers(normalJson);

      expect(result.hasBigNumbers).toBe(false);
      expect(result.bigNumbers).toHaveLength(0);
    });

    it('应该处理错误', () => {
      const result = detectBigNumbers(invalidJSON);

      expect(result.hasBigNumbers).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateJson', () => {
    it('应该验证有效的JSON', () => {
      const result = validateJson(pureJSON);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
    });

    it('应该验证包含注释的JSON', () => {
      const result = validateJson(basicComments);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
    });

    it('应该检测无效的JSON', () => {
      const result = validateJson(invalidJSON);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.ast).toBe(null);
    });
  });

  describe('escapeJson & unescapeJson', () => {
    it('应该添加转义字符', () => {
      const input = '{"message": "Hello "World""}';
      const result = escapeJson(input);

      expect(result).toContain('\\"World\\"');
      expect(result).not.toContain('"World"');
    });

    it('应该移除转义字符', () => {
      const result = unescapeJson(escapedJSON);

      expect(result).toContain('"World"');
      expect(result).not.toContain('\\"World\\"');
    });

    it('转义和反转义应该是可逆的', () => {
      const original = '{"message": "Hello World"}';
      const escaped = escapeJson(original);
      const unescaped = unescapeJson(escaped);

      expect(unescaped).toBe(original);
    });
  });

  describe('端到端工作流程', () => {
    it('应该支持完整的格式化工作流程', () => {
      // 格式化 -> 检测大数字 -> 验证
      const formatted = formatJson(bigNumbers);
      const detection = detectBigNumbers(formatted);
      const validation = validateJson(formatted);

      expect(detection.hasBigNumbers).toBe(true);
      expect(validation.valid).toBe(true);
      assertions.containsBigNumber(formatted, createBigNumber());
    });

    it('应该支持注释处理工作流程', () => {
      // 格式化 -> 转换注释 -> 移除注释 -> 压缩
      const formatted = formatJson(basicComments);
      const converted = convertCommentStyle(formatted);
      const removed = removeComments(converted);
      const compressed = compressJson(removed);

      assertions.isValidJSON(compressed);
      assertions.removesComments(compressed);
      expect(compressed).not.toContain('\n');
    });

    it('应该处理复杂业务场景', () => {
      // 处理复杂的嵌套注释JSON
      const result = formatJson(complexComments);
      
      // 验证核心功能
      assertions.preservesComments(complexComments, result);
      assertions.isValidJSON(result.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''));
      
      // 验证特定的注释场景
      expect(result).toContain('// 活动卡片列表');
      expect(result).toContain('// 数组结束');
      expect(result).toContain('// 报名活动&报名名额已满');
    });
  });
});