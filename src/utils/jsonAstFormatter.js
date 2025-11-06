/**
 * 基于AST的JSON格式化器
 * 将AST转换为格式化的JSON字符串，完美保持注释位置
 */

import { NodeTypes, CommentTypes, CommentPositions, ASTUtils } from './jsonAst.js';

export class JSONASTFormatter {
  constructor(options = {}) {
    this.options = {
      indent: 4,
      insertFinalNewline: false,
      preserveComments: true,
      compactArrays: false,
      compactObjects: false,
      ...options
    };
  }

  /**
   * 格式化AST为JSON字符串
   */
  format(ast) {
    this.output = '';
    this.indentLevel = 0;
    this.hasNumericKeys = ast._hasNumericKeys || false;
    this.originalKeys = ast._originalKeys || new Map();
    
    this.formatNode(ast);
    
    if (this.options.insertFinalNewline && !this.output.endsWith('\n')) {
      this.output += '\n';
    }
    
    // 如果原始输入包含数字key，恢复数字key格式
    if (this.hasNumericKeys) {
      return this.restoreNumericKeys(this.output);
    }
    
    return this.output;
  }

  /**
   * 恢复数字key格式（只转换原本就是数字key的）
   */
  restoreNumericKeys(formattedJson) {
    if (!this.originalKeys || this.originalKeys.size === 0) {
      // 如果没有原始数字key信息，使用原来的逻辑
      return formattedJson.replace(/"(\d+)"(\s*):/g, '$1$2:');
    }
    
    // 只恢复原本就是数字key的部分
    let result = formattedJson;
    for (const [numericKey, info] of this.originalKeys) {
      // 构建更精确的正则表达式来匹配这个特定的key
      const keyPattern = new RegExp(`"(${numericKey})"(\\s*):`, 'g');
      result = result.replace(keyPattern, `$1$2:`);
    }
    
    return result;
  }

  /**
   * 压缩AST为紧凑JSON字符串
   */
  compress(ast) {
    const originalOptions = { ...this.options };
    this.options = {
      ...this.options,
      indent: 0,
      preserveComments: false,
      compactArrays: true,
      compactObjects: true
    };
    
    this.output = '';
    this.indentLevel = 0;
    this.hasNumericKeys = ast._hasNumericKeys || false;
    this.originalKeys = ast._originalKeys || new Map();
    
    this.formatNode(ast);
    
    // 恢复原始选项
    this.options = originalOptions;
    
    // 如果原始输入包含数字key，恢复数字key格式
    if (this.hasNumericKeys) {
      return this.restoreNumericKeys(this.output);
    }
    
    return this.output;
  }

  /**
   * 格式化节点
   */
  formatNode(node) {
    if (!node) return;

    // 添加前导注释
    this.formatComments(node.leadingComments, 'leading');

    // 格式化节点内容
    this.formatNodeContent(node);

    // 对于对象和数组，它们的开括号后注释在内部处理，这里只处理闭括号后的注释
    if (node.type === NodeTypes.OBJECT || node.type === NodeTypes.ARRAY) {
      // 对于对象和数组，需要区分开括号后的注释和闭括号后的注释
      if (node.trailingComments && node.trailingComments.length > 0) {
        // 第一个行注释已经在开括号后显示，其余的在闭括号后显示
        const openBraceComment = node.trailingComments[0];
        if (openBraceComment.type === CommentTypes.LINE) {
          // 其余注释在闭括号后显示
          const closeBraceComments = node.trailingComments.slice(1);
          this.formatComments(closeBraceComments, 'trailing');
        } else {
          // 如果第一个不是行注释，全部在闭括号后显示
          this.formatComments(node.trailingComments, 'trailing');
        }
      }
    } else {
      // 其他节点正常处理尾随注释
      this.formatComments(node.trailingComments, 'trailing');
    }
  }

  /**
   * 格式化节点内容（不包括注释）
   */
  formatNodeContent(node) {
    if (!node) return;

    switch (node.type) {
      case NodeTypes.OBJECT:
        this.formatObject(node);
        break;
      case NodeTypes.ARRAY:
        this.formatArray(node);
        break;
      case NodeTypes.PROPERTY:
        this.formatProperty(node);
        break;
      case NodeTypes.LITERAL:
        this.formatLiteral(node);
        break;
      case NodeTypes.IDENTIFIER:
        this.formatIdentifier(node);
        break;
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * 格式化对象
   */
  formatObject(node) {
    this.write('{');

    // 开括号后的同行注释（通常是第一个尾随注释）
    let hasOpenBraceComment = false;
    if (node.trailingComments && node.trailingComments.length > 0) {
      const firstComment = node.trailingComments[0];
      if (firstComment.type === CommentTypes.LINE) {
        this.formatComments([firstComment], 'trailing');
        hasOpenBraceComment = true;
      }
    }

    // 内部前导注释
    this.formatComments(node.innerLeadingComments, 'innerLeading');

    if (node.properties && node.properties.length > 0) {
      if (!this.options.compactObjects) {
        this.newline();
        this.indent();
      }

      for (let i = 0; i < node.properties.length; i++) {
        const property = node.properties[i];
        
        if (!this.options.compactObjects) {
          if (i > 0) {
            this.newline();
          }
          this.writeIndent();
        } else if (i > 0) {
          this.write(',');
        }

        // 格式化属性内容（不包括尾随注释）
        this.formatNodeContent(property);

        // 如果不是最后一个属性，先添加逗号，再添加注释
        if (i < node.properties.length - 1) {
          if (this.options.compactObjects) {
            // 紧凑模式下逗号已经在循环开始时处理了
          } else {
            this.write(',');
          }
        }

        // 然后添加属性的尾随注释
        this.formatComments(property.trailingComments, 'trailing');
      }

      if (!this.options.compactObjects) {
        this.newline();
        this.dedent();
        this.writeIndent();
      }
    } else if (hasOpenBraceComment) {
      // 如果是空对象但有开括号后的注释，需要换行显示闭括号
      this.newline();
      this.writeIndent();
    }

    // 内部尾随注释
    this.formatComments(node.innerTrailingComments, 'innerTrailing');

    this.write('}');
  }

  /**
   * 格式化数组
   */
  formatArray(node) {
    this.write('[');

    // 开括号后的同行注释（通常是第一个尾随注释）
    let hasOpenBraceComment = false;
    if (node.trailingComments && node.trailingComments.length > 0) {
      const firstComment = node.trailingComments[0];
      if (firstComment.type === CommentTypes.LINE) {
        this.formatComments([firstComment], 'trailing');
        hasOpenBraceComment = true;
      }
    }

    // 内部前导注释
    this.formatComments(node.innerLeadingComments, 'innerLeading');

    if (node.elements && node.elements.length > 0) {
      // 如果有注释且要保留注释，强制非紧凑模式
      const hasComments = this.options.preserveComments && (hasOpenBraceComment || 
                         node.elements.some(el => el.trailingComments && el.trailingComments.length > 0));
      const isCompact = !hasComments && (this.options.compactArrays || this.shouldCompactArray(node));

      if (!isCompact) {
        this.newline();
        this.indent();
      }

      for (let i = 0; i < node.elements.length; i++) {
        const element = node.elements[i];
        
        if (!isCompact) {
          this.writeIndent();
        } else if (i > 0) {
          this.write(',');
        }

        // 格式化元素内容（不包括注释）
        this.formatNodeContent(element);

        // 如果不是最后一个元素，先添加逗号
        if (i < node.elements.length - 1) {
          if (isCompact) {
            // 紧凑模式已经在循环开始时处理了逗号
          } else {
            this.write(',');
          }
        }

        // 然后添加元素的尾随注释
        this.formatComments(element.trailingComments, 'trailing');

        // 非紧凑模式在处理完注释后换行
        if (!isCompact && i < node.elements.length - 1) {
          this.newline();
        }
      }

      if (!isCompact) {
        this.newline();
        this.dedent();
        this.writeIndent();
      }
    } else if (hasOpenBraceComment) {
      // 如果是空数组但有开括号后的注释，需要换行显示闭括号
      this.newline();
      this.writeIndent();
    }

    // 内部尾随注释
    this.formatComments(node.innerTrailingComments, 'innerTrailing');

    this.write(']');
  }

  /**
   * 格式化属性
   */
  formatProperty(node) {
    // 格式化键（不包括注释，由上层处理）
    this.formatNodeContent(node.key);
    
    if (this.options.compactObjects) {
      this.write(':');
    } else {
      this.write(': ');
    }
    
    // 格式化值（包括注释）
    this.formatNode(node.value);
  }

  /**
   * 格式化字面量
   */
  formatLiteral(node) {
    if (node.isBigInteger) {
      // 大整数，使用原始字符串值
      this.write(node.value);
    } else if (typeof node.value === 'string') {
      this.write(this.escapeString(node.value));
    } else if (node.value === null) {
      this.write('null');
    } else if (typeof node.value === 'boolean') {
      this.write(node.value ? 'true' : 'false');
    } else if (typeof node.value === 'number') {
      this.write(String(node.value));
    } else {
      this.write(String(node.value));
    }
  }

  /**
   * 格式化标识符（通常是对象键）
   */
  formatIdentifier(node) {
    this.write(this.escapeString(node.name));
  }

  /**
   * 格式化注释
   */
  formatComments(comments, position) {
    if (!this.options.preserveComments || !comments || comments.length === 0) {
      return;
    }

    for (const comment of comments) {
      switch (position) {
        case 'leading':
          // 前导注释在新行
          if (this.output && !this.output.endsWith('\n')) {
            this.newline();
          }
          this.writeIndent();
          this.write(comment.originalText);
          this.newline();
          break;

        case 'trailing':
          // 尾随注释在同一行，前面加一个空格
          if (!this.output.endsWith(' ')) {
            this.write(' ');
          }
          this.write(comment.originalText);
          break;

        case 'innerLeading':
          // 对象/数组内部开始的注释
          this.newline();
          this.writeIndent();
          this.write(comment.originalText);
          break;

        case 'innerTrailing':
          // 对象/数组内部结束的注释
          this.newline();
          this.writeIndent();
          this.write(comment.originalText);
          break;
      }
    }
  }

  /**
   * 判断数组是否应该紧凑显示
   */
  shouldCompactArray(node) {
    // 如果数组只包含简单值且元素很少，则紧凑显示
    return node.elements.every(element => 
      element.type === NodeTypes.LITERAL && 
      typeof element.value !== 'object' &&
      element.value !== null
    ) && node.elements.length <= 2;
  }

  /**
   * 转义字符串
   */
  escapeString(str) {
    return '"' + str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t') + '"';
  }

  /**
   * 写入输出
   */
  write(text) {
    this.output += text;
  }

  /**
   * 写入缩进
   */
  writeIndent() {
    if (this.options.indent > 0) {
      this.write(' '.repeat(this.indentLevel * this.options.indent));
    }
  }

  /**
   * 换行
   */
  newline() {
    if (this.options.indent > 0) {
      this.write('\n');
    }
  }

  /**
   * 增加缩进
   */
  indent() {
    this.indentLevel++;
  }

  /**
   * 减少缩进
   */
  dedent() {
    this.indentLevel = Math.max(0, this.indentLevel - 1);
  }
}

/**
 * 便捷的格式化函数
 */
export function formatJSONAST(ast, options = {}) {
  const formatter = new JSONASTFormatter(options);
  return formatter.format(ast);
}

/**
 * 便捷的压缩函数
 */
export function compressJSONAST(ast) {
  const formatter = new JSONASTFormatter();
  return formatter.compress(ast);
}

/**
 * 去除注释的格式化
 */
export function formatJSONASTWithoutComments(ast, options = {}) {
  const formatter = new JSONASTFormatter({
    ...options,
    preserveComments: false
  });
  return formatter.format(ast);
}