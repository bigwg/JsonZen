/**
 * JSON AST 解析器单元测试
 */

import { describe, it, expect } from 'vitest';
import { JSONASTParser, parseJSONWithComments } from '@/utils/jsonAstParser.js';
import { NodeTypes, CommentTypes } from '@/utils/jsonAst.js';
import { 
  basicComments, 
  bigNumbers, 
  bracketComments,
  pureJSON,
  invalidJSON
} from '../fixtures/jsonSamples.js';
import { assertions } from '../helpers/testUtils.js';

describe('JSONASTParser', () => {
  describe('基础解析功能', () => {
    it('应该解析简单对象', () => {
      const input = '{"name": "test", "age": 25}';
      const parser = new JSONASTParser(input);
      const ast = parser.parse();

      expect(ast.type).toBe(NodeTypes.OBJECT);
      expect(ast.properties).toHaveLength(2);
      expect(ast.properties[0].key.name).toBe('name');
      expect(ast.properties[0].value.value).toBe('test');
      expect(ast.properties[1].key.name).toBe('age');
      expect(ast.properties[1].value.value).toBe(25);
    });

    it('应该解析简单数组', () => {
      const input = '[1, "test", true, null]';
      const parser = new JSONASTParser(input);
      const ast = parser.parse();

      expect(ast.type).toBe(NodeTypes.ARRAY);
      expect(ast.elements).toHaveLength(4);
      expect(ast.elements[0].value).toBe(1);
      expect(ast.elements[1].value).toBe('test');
      expect(ast.elements[2].value).toBe(true);
      expect(ast.elements[3].value).toBe(null);
    });

    it('应该解析嵌套结构', () => {
      const input = '{"user": {"name": "test", "hobbies": ["reading", "coding"]}}';
      const parser = new JSONASTParser(input);
      const ast = parser.parse();

      expect(ast.type).toBe(NodeTypes.OBJECT);
      expect(ast.properties[0].key.name).toBe('user');
      expect(ast.properties[0].value.type).toBe(NodeTypes.OBJECT);
      
      const userObj = ast.properties[0].value;
      expect(userObj.properties).toHaveLength(2);
      expect(userObj.properties[1].value.type).toBe(NodeTypes.ARRAY);
    });
  });

  describe('注释解析', () => {
    it('应该解析行注释', () => {
      const input = '{"name": "test" // 这是注释\n}';
      const parser = new JSONASTParser(input);
      const ast = parser.parse();

      expect(ast.type).toBe(NodeTypes.OBJECT);
      expect(ast.properties[0].trailingComments).toBeDefined();
      expect(ast.properties[0].trailingComments[0].type).toBe(CommentTypes.LINE);
      expect(ast.properties[0].trailingComments[0].text).toContain('这是注释');
    });

    it('应该解析块注释', () => {
      const input = '{"name": "test" /* 这是块注释 */}';
      const parser = new JSONASTParser(input);
      const ast = parser.parse();

      expect(ast.type).toBe(NodeTypes.OBJECT);
      expect(ast.properties[0].trailingComments).toBeDefined();
      expect(ast.properties[0].trailingComments[0].type).toBe(CommentTypes.BLOCK);
      expect(ast.properties[0].trailingComments[0].text).toContain('这是块注释');
    });

    it('应该解析复杂注释场景', () => {
      const parser = new JSONASTParser(bracketComments);
      const ast = parser.parse();

      // 验证对象有注释
      expect(ast.properties[0].value.trailingComments).toBeDefined();
      expect(ast.properties[0].trailingComments).toBeDefined();
      
      // 验证数组有注释
      expect(ast.properties[1].value.trailingComments).toBeDefined();
      expect(ast.properties[1].trailingComments).toBeDefined();
    });
  });

  describe('大数字处理', () => {
    it('应该保持大整数精度', () => {
      const parser = new JSONASTParser(bigNumbers);
      const ast = parser.parse();

      // 找到大数字节点
      const bigNumberProp = ast.properties.find(p => p.key.name === 'bigNumber');
      const hugeBigNumberProp = ast.properties.find(p => p.key.name === 'nested')
                                  .value.properties.find(p => p.key.name === 'hugeBigNumber');

      expect(bigNumberProp.value.isBigInteger).toBe(true);
      expect(bigNumberProp.value.value).toBe('1753586062170048662');
      expect(hugeBigNumberProp.value.isBigInteger).toBe(true);
      expect(hugeBigNumberProp.value.value).toBe('99999999999999999999');
    });

    it('应该正确处理普通数字', () => {
      const input = '{"small": 123, "decimal": 3.14}';
      const parser = new JSONASTParser(input);
      const ast = parser.parse();

      const smallNum = ast.properties.find(p => p.key.name === 'small');
      const decimal = ast.properties.find(p => p.key.name === 'decimal');

      expect(smallNum.value.isBigInteger).toBeUndefined();
      expect(smallNum.value.value).toBe(123);
      expect(decimal.value.value).toBe(3.14);
    });
  });

  describe('字符串转义', () => {
    it('应该正确处理转义字符', () => {
      const input = '{"message": "Hello \\"World\\"", "path": "C:\\\\test"}';
      const parser = new JSONASTParser(input);
      const ast = parser.parse();

      const message = ast.properties.find(p => p.key.name === 'message');
      const path = ast.properties.find(p => p.key.name === 'path');

      expect(message.value.value).toBe('Hello "World"');
      expect(path.value.value).toBe('C:\\test');
    });

    it('应该处理Unicode转义', () => {
      const input = '{"chinese": "\\u4e2d\\u6587"}';
      const parser = new JSONASTParser(input);
      const ast = parser.parse();

      const chinese = ast.properties.find(p => p.key.name === 'chinese');
      expect(chinese.value.value).toBe('中文');
    });
  });

  describe('错误处理', () => {
    it('应该抛出语法错误', () => {
      const parser = new JSONASTParser(invalidJSON);
      
      expect(() => parser.parse()).toThrow(/JSON Parse Error/);
    });

    it('应该检测未终止的字符串', () => {
      const input = '{"name": "unterminated string}';
      const parser = new JSONASTParser(input);
      
      expect(() => parser.parse()).toThrow();
    });

    it('应该检测无效的数字', () => {
      const input = '{"number": 12.}';
      const parser = new JSONASTParser(input);
      
      expect(() => parser.parse()).toThrow();
    });

    it('应该检测意外的字符', () => {
      const input = '{"test": @}';
      const parser = new JSONASTParser(input);
      
      expect(() => parser.parse()).toThrow();
    });
  });

  describe('边界情况', () => {
    it('应该解析空对象', () => {
      const input = '{}';
      const parser = new JSONASTParser(input);
      const ast = parser.parse();

      expect(ast.type).toBe(NodeTypes.OBJECT);
      expect(ast.properties).toHaveLength(0);
    });

    it('应该解析空数组', () => {
      const input = '[]';
      const parser = new JSONASTParser(input);
      const ast = parser.parse();

      expect(ast.type).toBe(NodeTypes.ARRAY);
      expect(ast.elements).toHaveLength(0);
    });

    it('应该处理只有空白字符的JSON', () => {
      const input = '  \n\t  {  \n  "key"  :  "value"  \n  }  \n\t  ';
      const parser = new JSONASTParser(input);
      const ast = parser.parse();

      expect(ast.type).toBe(NodeTypes.OBJECT);
      expect(ast.properties).toHaveLength(1);
      expect(ast.properties[0].key.name).toBe('key');
    });
  });

  describe('位置信息', () => {
    it('应该跟踪行和列信息', () => {
      const input = '{\n  "name": "test"\n}';
      const parser = new JSONASTParser(input);
      
      // 解析前检查初始位置
      expect(parser.line).toBe(1);
      expect(parser.column).toBe(1);
      
      // 解析应该成功
      const ast = parser.parse();
      expect(ast).toBeDefined();
    });
  });
});

describe('parseJSONWithComments 便捷函数', () => {
  it('应该解析包含注释的JSON', () => {
    const ast = parseJSONWithComments(basicComments);
    
    assertions.isValidJSON(JSON.stringify(ast));
    expect(ast.type).toBe(NodeTypes.OBJECT);
  });

  it('应该处理纯JSON', () => {
    const ast = parseJSONWithComments(pureJSON);
    
    expect(ast.type).toBe(NodeTypes.OBJECT);
  });
});