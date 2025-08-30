/**
 * JSON AST 系统 - 支持注释的JSON解析和格式化
 * 基于抽象语法树的方法，彻底解决注释定位问题
 */

// AST节点类型定义
export const NodeTypes = {
  OBJECT: 'ObjectExpression',
  ARRAY: 'ArrayExpression', 
  PROPERTY: 'Property',
  LITERAL: 'Literal',
  IDENTIFIER: 'Identifier'
};

// 注释类型定义
export const CommentTypes = {
  LINE: 'LineComment',      // // 注释
  BLOCK: 'BlockComment'     // /* */ 注释
};

// 注释位置定义
export const CommentPositions = {
  LEADING: 'leading',       // 节点前的注释
  TRAILING: 'trailing',     // 节点后的注释（同行）
  INNER_LEADING: 'innerLeading',   // 对象/数组内部开始的注释
  INNER_TRAILING: 'innerTrailing'  // 对象/数组内部结束的注释
};

/**
 * 创建AST节点的工厂函数
 */
export class ASTNodeFactory {
  static createObject(properties = [], comments = {}) {
    return {
      type: NodeTypes.OBJECT,
      properties,
      leadingComments: comments.leading || [],
      trailingComments: comments.trailing || [],
      innerLeadingComments: comments.innerLeading || [],
      innerTrailingComments: comments.innerTrailing || []
    };
  }

  static createArray(elements = [], comments = {}) {
    return {
      type: NodeTypes.ARRAY,
      elements,
      leadingComments: comments.leading || [],
      trailingComments: comments.trailing || [],
      innerLeadingComments: comments.innerLeading || [],
      innerTrailingComments: comments.innerTrailing || []
    };
  }

  static createProperty(key, value, comments = {}) {
    return {
      type: NodeTypes.PROPERTY,
      key: typeof key === 'string' ? this.createIdentifier(key) : key,
      value,
      leadingComments: comments.leading || [],
      trailingComments: comments.trailing || []
    };
  }

  static createLiteral(value, comments = {}) {
    return {
      type: NodeTypes.LITERAL,
      value,
      raw: typeof value === 'string' ? `"${value}"` : String(value),
      leadingComments: comments.leading || [],
      trailingComments: comments.trailing || []
    };
  }

  static createIdentifier(name, comments = {}) {
    return {
      type: NodeTypes.IDENTIFIER,
      name,
      leadingComments: comments.leading || [],
      trailingComments: comments.trailing || []
    };
  }

  static createComment(text, type = CommentTypes.LINE, position = CommentPositions.TRAILING) {
    return {
      type,
      text: text.trim(),
      position,
      originalText: text // 保留原始文本，包含//或/* */
    };
  }
}

/**
 * AST工具函数
 */
export class ASTUtils {
  /**
   * 遍历AST节点
   */
  static traverse(node, visitor) {
    if (!node || typeof node !== 'object') return;

    // 访问当前节点
    if (visitor.enter) {
      visitor.enter(node);
    }

    // 递归访问子节点
    switch (node.type) {
      case NodeTypes.OBJECT:
        if (node.properties) {
          node.properties.forEach(prop => this.traverse(prop, visitor));
        }
        break;
      
      case NodeTypes.ARRAY:
        if (node.elements) {
          node.elements.forEach(element => this.traverse(element, visitor));
        }
        break;
      
      case NodeTypes.PROPERTY:
        this.traverse(node.key, visitor);
        this.traverse(node.value, visitor);
        break;
    }

    // 访问完毕回调
    if (visitor.exit) {
      visitor.exit(node);
    }
  }

  /**
   * 获取节点的所有注释
   */
  static getAllComments(node) {
    const comments = [];
    
    if (node.leadingComments) comments.push(...node.leadingComments);
    if (node.trailingComments) comments.push(...node.trailingComments);
    if (node.innerLeadingComments) comments.push(...node.innerLeadingComments);
    if (node.innerTrailingComments) comments.push(...node.innerTrailingComments);
    
    return comments;
  }

  /**
   * 为节点添加注释
   */
  static addComment(node, comment, position = CommentPositions.TRAILING) {
    const commentKey = `${position}Comments`;
    if (!node[commentKey]) {
      node[commentKey] = [];
    }
    node[commentKey].push(comment);
  }

  /**
   * 克隆AST节点
   */
  static clone(node) {
    return JSON.parse(JSON.stringify(node));
  }

  /**
   * 检查节点是否为空
   */
  static isEmpty(node) {
    if (!node) return true;
    
    switch (node.type) {
      case NodeTypes.OBJECT:
        return !node.properties || node.properties.length === 0;
      case NodeTypes.ARRAY:
        return !node.elements || node.elements.length === 0;
      default:
        return false;
    }
  }

  /**
   * 获取节点的键名（仅对Property节点有效）
   */
  static getPropertyKey(node) {
    if (node.type !== NodeTypes.PROPERTY) return null;
    return node.key.type === NodeTypes.IDENTIFIER ? node.key.name : node.key.value;
  }

  /**
   * 检查节点是否包含大数字
   */
  static containsBigNumber(node) {
    let hasBigNumber = false;
    
    this.traverse(node, {
      enter: (currentNode) => {
        if (currentNode.type === NodeTypes.LITERAL && 
            typeof currentNode.value === 'number' &&
            !Number.isSafeInteger(currentNode.value)) {
          hasBigNumber = true;
        }
      }
    });
    
    return hasBigNumber;
  }
}

/**
 * AST验证器
 */
export class ASTValidator {
  static validate(node) {
    const errors = [];
    
    ASTUtils.traverse(node, {
      enter: (currentNode) => {
        // 验证节点类型
        if (!Object.values(NodeTypes).includes(currentNode.type)) {
          errors.push(`Invalid node type: ${currentNode.type}`);
        }
        
        // 验证属性节点
        if (currentNode.type === NodeTypes.PROPERTY) {
          if (!currentNode.key || !currentNode.value) {
            errors.push('Property node must have key and value');
          }
        }
        
        // 验证注释
        const allComments = ASTUtils.getAllComments(currentNode);
        allComments.forEach(comment => {
          if (!Object.values(CommentTypes).includes(comment.type)) {
            errors.push(`Invalid comment type: ${comment.type}`);
          }
        });
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}