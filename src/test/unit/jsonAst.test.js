/**
 * JSON AST 核心功能单元测试
 */

import { describe, it, expect } from 'vitest';
import { 
  ASTNodeFactory, 
  NodeTypes, 
  CommentTypes, 
  CommentPositions,
  ASTUtils,
  ASTValidator
} from '@/utils/jsonAst.js';

describe('ASTNodeFactory', () => {
  describe('createObject', () => {
    it('应该创建空对象节点', () => {
      const node = ASTNodeFactory.createObject();
      
      expect(node.type).toBe(NodeTypes.OBJECT);
      expect(node.properties).toEqual([]);
      expect(node.leadingComments).toEqual([]);
      expect(node.trailingComments).toEqual([]);
    });

    it('应该创建带注释的对象节点', () => {
      const comments = {
        leading: [ASTNodeFactory.createComment('// 前导注释')],
        trailing: [ASTNodeFactory.createComment('// 尾随注释')]
      };
      
      const node = ASTNodeFactory.createObject([], comments);
      
      expect(node.leadingComments).toHaveLength(1);
      expect(node.trailingComments).toHaveLength(1);
      expect(node.leadingComments[0].text).toBe('// 前导注释');
    });
  });

  describe('createArray', () => {
    it('应该创建空数组节点', () => {
      const node = ASTNodeFactory.createArray();
      
      expect(node.type).toBe(NodeTypes.ARRAY);
      expect(node.elements).toEqual([]);
    });

    it('应该创建带元素的数组节点', () => {
      const elements = [
        ASTNodeFactory.createLiteral(1),
        ASTNodeFactory.createLiteral('test')
      ];
      
      const node = ASTNodeFactory.createArray(elements);
      
      expect(node.elements).toHaveLength(2);
      expect(node.elements[0].value).toBe(1);
      expect(node.elements[1].value).toBe('test');
    });
  });

  describe('createProperty', () => {
    it('应该创建属性节点', () => {
      const value = ASTNodeFactory.createLiteral('test');
      const property = ASTNodeFactory.createProperty('name', value);
      
      expect(property.type).toBe(NodeTypes.PROPERTY);
      expect(property.key.name).toBe('name');
      expect(property.value.value).toBe('test');
    });
  });

  describe('createLiteral', () => {
    it('应该创建字符串字面量', () => {
      const node = ASTNodeFactory.createLiteral('hello');
      
      expect(node.type).toBe(NodeTypes.LITERAL);
      expect(node.value).toBe('hello');
      expect(node.raw).toBe('"hello"');
    });

    it('应该创建数字字面量', () => {
      const node = ASTNodeFactory.createLiteral(42);
      
      expect(node.type).toBe(NodeTypes.LITERAL);
      expect(node.value).toBe(42);
      expect(node.raw).toBe('42');
    });

    it('应该创建布尔字面量', () => {
      const node = ASTNodeFactory.createLiteral(true);
      
      expect(node.type).toBe(NodeTypes.LITERAL);
      expect(node.value).toBe(true);
      expect(node.raw).toBe('true');
    });

    it('应该创建null字面量', () => {
      const node = ASTNodeFactory.createLiteral(null);
      
      expect(node.type).toBe(NodeTypes.LITERAL);
      expect(node.value).toBe(null);
      expect(node.raw).toBe('null');
    });
  });

  describe('createComment', () => {
    it('应该创建行注释', () => {
      const comment = ASTNodeFactory.createComment('// 这是注释', CommentTypes.LINE);
      
      expect(comment.type).toBe(CommentTypes.LINE);
      expect(comment.text).toBe('这是注释');
      expect(comment.originalText).toBe('// 这是注释');
    });

    it('应该创建块注释', () => {
      const comment = ASTNodeFactory.createComment('/* 这是块注释 */', CommentTypes.BLOCK);
      
      expect(comment.type).toBe(CommentTypes.BLOCK);
      expect(comment.text).toBe('这是块注释');
      expect(comment.originalText).toBe('/* 这是块注释 */');
    });
  });
});

describe('ASTUtils', () => {
  describe('traverse', () => {
    it('应该遍历简单对象', () => {
      const ast = ASTNodeFactory.createObject([
        ASTNodeFactory.createProperty('name', ASTNodeFactory.createLiteral('test'))
      ]);

      const visitedNodes = [];
      ASTUtils.traverse(ast, {
        enter: (node) => {
          visitedNodes.push(node.type);
        }
      });

      expect(visitedNodes).toContain(NodeTypes.OBJECT);
      expect(visitedNodes).toContain(NodeTypes.PROPERTY);
      expect(visitedNodes).toContain(NodeTypes.LITERAL);
      expect(visitedNodes).toContain(NodeTypes.IDENTIFIER);
    });

    it('应该遍历嵌套结构', () => {
      const ast = ASTNodeFactory.createObject([
        ASTNodeFactory.createProperty('user', ASTNodeFactory.createObject([
          ASTNodeFactory.createProperty('name', ASTNodeFactory.createLiteral('test'))
        ]))
      ]);

      let objectCount = 0;
      ASTUtils.traverse(ast, {
        enter: (node) => {
          if (node.type === NodeTypes.OBJECT) {
            objectCount++;
          }
        }
      });

      expect(objectCount).toBe(2); // 根对象 + 嵌套对象
    });
  });

  describe('getAllComments', () => {
    it('应该获取节点的所有注释', () => {
      const comments = {
        leading: [ASTNodeFactory.createComment('// 前导')],
        trailing: [ASTNodeFactory.createComment('// 尾随')]
      };
      
      const node = ASTNodeFactory.createObject([], comments);
      const allComments = ASTUtils.getAllComments(node);
      
      expect(allComments).toHaveLength(2);
      expect(allComments[0].text).toBe('前导');
      expect(allComments[1].text).toBe('尾随');
    });
  });

  describe('addComment', () => {
    it('应该添加注释到节点', () => {
      const node = ASTNodeFactory.createLiteral('test');
      const comment = ASTNodeFactory.createComment('// 新注释');
      
      ASTUtils.addComment(node, comment, CommentPositions.TRAILING);
      
      expect(node.trailingComments).toHaveLength(1);
      expect(node.trailingComments[0].text).toBe('新注释');
    });
  });

  describe('isEmpty', () => {
    it('应该检测空对象', () => {
      const emptyObj = ASTNodeFactory.createObject([]);
      const nonEmptyObj = ASTNodeFactory.createObject([
        ASTNodeFactory.createProperty('key', ASTNodeFactory.createLiteral('value'))
      ]);
      
      expect(ASTUtils.isEmpty(emptyObj)).toBe(true);
      expect(ASTUtils.isEmpty(nonEmptyObj)).toBe(false);
    });

    it('应该检测空数组', () => {
      const emptyArr = ASTNodeFactory.createArray([]);
      const nonEmptyArr = ASTNodeFactory.createArray([ASTNodeFactory.createLiteral(1)]);
      
      expect(ASTUtils.isEmpty(emptyArr)).toBe(true);
      expect(ASTUtils.isEmpty(nonEmptyArr)).toBe(false);
    });
  });

  describe('getPropertyKey', () => {
    it('应该获取属性键名', () => {
      const property = ASTNodeFactory.createProperty('testKey', ASTNodeFactory.createLiteral('value'));
      
      const key = ASTUtils.getPropertyKey(property);
      
      expect(key).toBe('testKey');
    });

    it('对非属性节点应该返回null', () => {
      const literal = ASTNodeFactory.createLiteral('test');
      
      const key = ASTUtils.getPropertyKey(literal);
      
      expect(key).toBe(null);
    });
  });

  describe('clone', () => {
    it('应该深拷贝AST节点', () => {
      const original = ASTNodeFactory.createObject([
        ASTNodeFactory.createProperty('name', ASTNodeFactory.createLiteral('test'))
      ]);
      
      const cloned = ASTUtils.clone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.properties[0]).not.toBe(original.properties[0]);
    });
  });
});

describe('ASTValidator', () => {
  describe('validate', () => {
    it('应该验证有效的AST', () => {
      const validAST = ASTNodeFactory.createObject([
        ASTNodeFactory.createProperty('name', ASTNodeFactory.createLiteral('test'))
      ]);
      
      const result = ASTValidator.validate(validAST);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测无效的节点类型', () => {
      const invalidAST = {
        type: 'InvalidType',
        properties: []
      };
      
      const result = ASTValidator.validate(invalidAST);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid node type: InvalidType');
    });

    it('应该检测缺少必要属性的Property节点', () => {
      const invalidProperty = {
        type: NodeTypes.PROPERTY,
        key: ASTNodeFactory.createIdentifier('name')
        // 缺少 value 属性
      };
      
      const ast = ASTNodeFactory.createObject([invalidProperty]);
      const result = ASTValidator.validate(ast);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Property node must have key and value');
    });
  });
});