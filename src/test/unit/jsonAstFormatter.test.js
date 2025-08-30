/**
 * JSON AST 格式化器单元测试
 */

import { describe, it, expect } from 'vitest';
import { JSONASTFormatter, formatJSONAST, compressJSONAST } from '@/utils/jsonAstFormatter.js';
import { parseJSONWithComments } from '@/utils/jsonAstParser.js';
import { ASTNodeFactory, NodeTypes } from '@/utils/jsonAst.js';
import { 
  basicComments, 
  bigNumbers, 
  pureJSON,
  compressedJSON
} from '../fixtures/jsonSamples.js';
import { assertions, normalizeLineEndings, createBigNumber } from '../helpers/testUtils.js';

describe('JSONASTFormatter', () => {
  describe('基础格式化功能', () => {
    it('应该格式化简单对象', () => {
      const ast = ASTNodeFactory.createObject([
        ASTNodeFactory.createProperty('name', ASTNodeFactory.createLiteral('test')),
        ASTNodeFactory.createProperty('age', ASTNodeFactory.createLiteral(25))
      ]);

      const formatter = new JSONASTFormatter({ indent: 2 });
      const result = formatter.format(ast);

      expect(result).toContain('"name": "test"');
      expect(result).toContain('"age": 25');
      assertions.isValidJSON(result);
    });

    it('应该格式化简单数组', () => {
      const ast = ASTNodeFactory.createArray([
        ASTNodeFactory.createLiteral(1),
        ASTNodeFactory.createLiteral('test'),
        ASTNodeFactory.createLiteral(true)
      ]);

      const formatter = new JSONASTFormatter({ indent: 2 });
      const result = formatter.format(ast);

      expect(result).toContain('1');
      expect(result).toContain('"test"');
      expect(result).toContain('true');
      assertions.isValidJSON(result);
    });

    it('应该处理嵌套结构', () => {
      const ast = ASTNodeFactory.createObject([
        ASTNodeFactory.createProperty('user', ASTNodeFactory.createObject([
          ASTNodeFactory.createProperty('name', ASTNodeFactory.createLiteral('test'))
        ]))
      ]);

      const formatter = new JSONASTFormatter({ indent: 2 });
      const result = formatter.format(ast);

      expect(result).toContain('"user"');
      expect(result).toContain('"name": "test"');
      assertions.isValidJSON(result);
    });
  });

  describe('注释处理', () => {
    it('应该保留注释', () => {
      const ast = parseJSONWithComments(basicComments);
      const formatter = new JSONASTFormatter({ preserveComments: true });
      const result = formatter.format(ast);

      expect(result).toContain('// 这是姓名');
      expect(result).toContain('/* 这是年龄 */');
      assertions.preservesComments(basicComments, result);
    });

    it('应该移除注释', () => {
      const ast = parseJSONWithComments(basicComments);
      const formatter = new JSONASTFormatter({ preserveComments: false });
      const result = formatter.format(ast);

      assertions.removesComments(result);
      assertions.isValidJSON(result);
    });

    it('应该正确放置尾随注释', () => {
      const property = ASTNodeFactory.createProperty(
        'name', 
        ASTNodeFactory.createLiteral('test')
      );
      property.trailingComments = [ASTNodeFactory.createComment('// 注释', 'LineComment')];

      const ast = ASTNodeFactory.createObject([property]);
      const formatter = new JSONASTFormatter({ preserveComments: true });
      const result = formatter.format(ast);

      // 注释应该在同一行
      const lines = result.split('\n');
      const nameLineIndex = lines.findIndex(line => line.includes('"name"'));
      expect(lines[nameLineIndex]).toContain('// 注释');
    });
  });

  describe('大数字处理', () => {
    it('应该保持大数字精度', () => {
      const bigNum = createBigNumber();
      const literal = {
        type: NodeTypes.LITERAL,
        value: bigNum,
        isBigInteger: true
      };
      
      const ast = ASTNodeFactory.createObject([
        ASTNodeFactory.createProperty('bigNumber', literal)
      ]);

      const formatter = new JSONASTFormatter();
      const result = formatter.format(ast);

      assertions.containsBigNumber(result, bigNum);
    });

    it('应该正确处理普通数字', () => {
      const ast = ASTNodeFactory.createObject([
        ASTNodeFactory.createProperty('small', ASTNodeFactory.createLiteral(123)),
        ASTNodeFactory.createProperty('decimal', ASTNodeFactory.createLiteral(3.14))
      ]);

      const formatter = new JSONASTFormatter();
      const result = formatter.format(ast);

      expect(result).toContain('"small": 123');
      expect(result).toContain('"decimal": 3.14');
      assertions.isValidJSON(result);
    });
  });

  describe('压缩功能', () => {
    it('应该压缩JSON', () => {
      const ast = parseJSONWithComments(pureJSON);
      const formatter = new JSONASTFormatter();
      const result = formatter.compress(ast);

      expect(result).not.toContain('\n');
      expect(result).not.toContain('  ');
      assertions.isValidJSON(result);
    });

    it('压缩时应该移除注释', () => {
      const ast = parseJSONWithComments(basicComments);
      const formatter = new JSONASTFormatter();
      const result = formatter.compress(ast);

      assertions.removesComments(result);
      assertions.isValidJSON(result);
    });
  });

  describe('格式化选项', () => {
    it('应该支持自定义缩进', () => {
      const ast = ASTNodeFactory.createObject([
        ASTNodeFactory.createProperty('name', ASTNodeFactory.createLiteral('test'))
      ]);

      const formatter4 = new JSONASTFormatter({ indent: 4 });
      const formatter2 = new JSONASTFormatter({ indent: 2 });

      const result4 = formatter4.format(ast);
      const result2 = formatter2.format(ast);

      // 4空格缩进的行应该比2空格缩进的行更长
      const lines4 = result4.split('\n').filter(line => line.trim());
      const lines2 = result2.split('\n').filter(line => line.trim());
      
      expect(lines4[1].length).toBeGreaterThan(lines2[1].length);
    });

    it('应该支持紧凑数组', () => {
      const ast = ASTNodeFactory.createArray([
        ASTNodeFactory.createLiteral(1),
        ASTNodeFactory.createLiteral(2),
        ASTNodeFactory.createLiteral(3)
      ]);

      const formatter = new JSONASTFormatter({ compactArrays: true });
      const result = formatter.format(ast);

      // 紧凑数组应该在一行
      expect(result.split('\n')).toHaveLength(1);
      assertions.isValidJSON(result);
    });

    it('应该支持紧凑对象', () => {
      const ast = ASTNodeFactory.createObject([
        ASTNodeFactory.createProperty('a', ASTNodeFactory.createLiteral(1)),
        ASTNodeFactory.createProperty('b', ASTNodeFactory.createLiteral(2))
      ]);

      const formatter = new JSONASTFormatter({ compactObjects: true });
      const result = formatter.format(ast);

      // 紧凑对象应该在一行
      expect(result.split('\n')).toHaveLength(1);
      assertions.isValidJSON(result);
    });
  });

  describe('字符串转义', () => {
    it('应该正确转义特殊字符', () => {
      const ast = ASTNodeFactory.createObject([
        ASTNodeFactory.createProperty('message', ASTNodeFactory.createLiteral('Hello "World"')),
        ASTNodeFactory.createProperty('path', ASTNodeFactory.createLiteral('C:\\test\n'))
      ]);

      const formatter = new JSONASTFormatter();
      const result = formatter.format(ast);

      expect(result).toContain('\\"World\\"');
      expect(result).toContain('C:\\\\test\\n');
      assertions.isValidJSON(result);
    });
  });

  describe('边界情况', () => {
    it('应该处理空对象', () => {
      const ast = ASTNodeFactory.createObject([]);
      const formatter = new JSONASTFormatter();
      const result = formatter.format(ast);

      expect(result.trim()).toBe('{}');
      assertions.isValidJSON(result);
    });

    it('应该处理空数组', () => {
      const ast = ASTNodeFactory.createArray([]);
      const formatter = new JSONASTFormatter();
      const result = formatter.format(ast);

      expect(result.trim()).toBe('[]');
      assertions.isValidJSON(result);
    });

    it('应该处理null值', () => {
      const ast = ASTNodeFactory.createObject([
        ASTNodeFactory.createProperty('value', ASTNodeFactory.createLiteral(null))
      ]);

      const formatter = new JSONASTFormatter();
      const result = formatter.format(ast);

      expect(result).toContain('"value": null');
      assertions.isValidJSON(result);
    });

    it('应该处理布尔值', () => {
      const ast = ASTNodeFactory.createObject([
        ASTNodeFactory.createProperty('isTrue', ASTNodeFactory.createLiteral(true)),
        ASTNodeFactory.createProperty('isFalse', ASTNodeFactory.createLiteral(false))
      ]);

      const formatter = new JSONASTFormatter();
      const result = formatter.format(ast);

      expect(result).toContain('"isTrue": true');
      expect(result).toContain('"isFalse": false');
      assertions.isValidJSON(result);
    });
  });
});

describe('便捷函数', () => {
  describe('formatJSONAST', () => {
    it('应该格式化AST', () => {
      const ast = parseJSONWithComments(pureJSON);
      const result = formatJSONAST(ast);

      assertions.isValidJSON(result);
      expect(result).toContain('"name"');
      expect(result).toContain('"age"');
    });

    it('应该支持选项参数', () => {
      const ast = parseJSONWithComments(pureJSON);
      const result = formatJSONAST(ast, { indent: 4 });

      // 应该使用4空格缩进
      const lines = result.split('\n');
      const indentedLine = lines.find(line => line.startsWith('    '));
      expect(indentedLine).toBeDefined();
    });
  });

  describe('compressJSONAST', () => {
    it('应该压缩AST', () => {
      const ast = parseJSONWithComments(pureJSON);
      const result = compressJSONAST(ast);

      expect(result).not.toContain('\n');
      expect(result).not.toContain('  ');
      assertions.isValidJSON(result);
    });
  });
});