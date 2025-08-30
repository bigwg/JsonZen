/**
 * 基于AST的JSON解析器 - 支持注释
 * 将包含注释的JSON字符串解析为AST
 */

import { 
  ASTNodeFactory, 
  NodeTypes, 
  CommentTypes, 
  CommentPositions 
} from './jsonAst.js';

export class JSONASTParser {
  constructor(input) {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
  }

  /**
   * 解析JSON字符串为AST
   */
  parse() {
    try {
      this.skipWhitespaceAndComments();
      const ast = this.parseValue();
      this.skipWhitespaceAndComments();
      
      if (this.pos < this.input.length) {
        throw new Error(`Unexpected character at position ${this.pos}`);
      }
      
      return ast;
    } catch (error) {
      throw new Error(`JSON Parse Error at line ${this.line}, column ${this.column}: ${error.message}`);
    }
  }

  /**
   * 解析任意JSON值
   */
  parseValue() {
    this.skipWhitespaceAndComments();
    
    const char = this.peek();
    let value;
    
    switch (char) {
      case '{':
        value = this.parseObject();
        break;
      case '[':
        value = this.parseArray();
        break;
      case '"':
        value = this.parseString();
        break;
      case 't':
      case 'f':
        value = this.parseBoolean();
        break;
      case 'n':
        value = this.parseNull();
        break;
      default:
        if (char === '-' || (char >= '0' && char <= '9')) {
          value = this.parseNumber();
        } else {
          throw new Error(`Unexpected character: ${char}`);
        }
    }
    
    return value;
  }

  /**
   * 解析对象
   */
  parseObject() {
    const leadingComments = this.collectLeadingComments();
    
    this.expect('{');
    
    // 收集开括号后的同行注释
    const openBraceComments = this.collectTrailingComments();
    
    const innerLeadingComments = this.collectComments();
    const properties = [];
    
    this.skipWhitespaceAndComments();
    
    if (this.peek() !== '}') {
      do {
        // 解析属性
        const property = this.parseProperty();
        properties.push(property);
        
        // 在检查逗号之前先跳过空白字符（但不跳过注释）
        this.skipWhitespace();
        
        if (this.peek() === ',') {
          this.advance(); // 消费逗号
          
          // 收集逗号后的同行注释，并绑定到刚解析的属性上
          const currentLine = this.line;
          this.skipWhitespace(); // 跳过逗号后的空白
          
          if (this.line === currentLine) {
            const trailingComment = this.tryParseComment();
            if (trailingComment) {
              trailingComment.position = CommentPositions.TRAILING;
              if (!property.trailingComments) {
                property.trailingComments = [];
              }
              property.trailingComments.push(trailingComment);
            }
          }
          
          // 继续跳过其他空白和注释
          this.skipWhitespaceAndComments();
        } else {
          break;
        }
      } while (this.peek() !== '}');
    }
    
    const innerTrailingComments = this.collectComments();
    this.expect('}');
    const trailingComments = this.collectTrailingComments();
    
    // 将开括号后的注释合并到尾随注释中
    const allTrailingComments = [...openBraceComments, ...trailingComments];
    
    return ASTNodeFactory.createObject(properties, {
      leading: leadingComments,
      trailing: allTrailingComments,
      innerLeading: innerLeadingComments,
      innerTrailing: innerTrailingComments
    });
  }

  /**
   * 解析数组
   */
  parseArray() {
    const leadingComments = this.collectLeadingComments();
    
    this.expect('[');
    
    // 收集开括号后的同行注释
    const openBracketComments = this.collectTrailingComments();
    
    const innerLeadingComments = this.collectComments();
    const elements = [];
    
    this.skipWhitespaceAndComments();
    
    if (this.peek() !== ']') {
      do {
        // 解析元素
        const element = this.parseValue();
        elements.push(element);
        
        // 在检查逗号之前先跳过空白字符（但不跳过注释）
        this.skipWhitespace();
        
        if (this.peek() === ',') {
          this.advance(); // 消费逗号
          
          // 收集逗号后的同行注释，并绑定到刚解析的元素上
          const currentLine = this.line;
          this.skipWhitespace(); // 跳过逗号后的空白
          
          if (this.line === currentLine) {
            const trailingComment = this.tryParseComment();
            if (trailingComment) {
              trailingComment.position = CommentPositions.TRAILING;
              if (!element.trailingComments) {
                element.trailingComments = [];
              }
              element.trailingComments.push(trailingComment);
            }
          }
          
          // 继续跳过其他空白和注释
          this.skipWhitespaceAndComments();
        } else {
          // 没有逗号了，检查是否有最后一个元素的尾随注释
          const elementTrailingComments = this.collectTrailingComments();
          if (elementTrailingComments.length > 0) {
            if (!element.trailingComments) {
              element.trailingComments = [];
            }
            element.trailingComments.push(...elementTrailingComments);
          }
          break;
        }
      } while (this.peek() !== ']');
    }
    
    const innerTrailingComments = this.collectComments();
    this.expect(']');
    const trailingComments = this.collectTrailingComments();
    
    // 将开括号后的注释合并到尾随注释中
    const allTrailingComments = [...openBracketComments, ...trailingComments];
    
    return ASTNodeFactory.createArray(elements, {
      leading: leadingComments,
      trailing: allTrailingComments,
      innerLeading: innerLeadingComments,
      innerTrailing: innerTrailingComments
    });
  }

  /**
   * 解析属性（键值对）
   */
  parseProperty() {
    // 解析键
    const key = this.parseString();
    
    this.skipWhitespace();
    this.expect(':');
    this.skipWhitespace();
    
    // 解析值
    const value = this.parseValue();
    
    // 收集属性后的尾随注释（如果有的话）
    const trailingComments = this.collectTrailingComments();
    
    const property = ASTNodeFactory.createProperty(key.value, value);
    
    // 只有当确实有尾随注释时才添加
    if (trailingComments.length > 0) {
      property.trailingComments = trailingComments;
    }
    
    return property;
  }

  /**
   * 解析字符串
   */
  parseString() {
    this.expect('"');
    
    let value = '';
    
    while (this.peek() !== '"') {
      const char = this.peek();
      
      if (char === '\\') {
        this.advance();
        const escaped = this.peek();
        switch (escaped) {
          case '"':
          case '\\':
          case '/':
            value += escaped;
            break;
          case 'b':
            value += '\b';
            break;
          case 'f':
            value += '\f';
            break;
          case 'n':
            value += '\n';
            break;
          case 'r':
            value += '\r';
            break;
          case 't':
            value += '\t';
            break;
          case 'u':
            // Unicode escape
            this.advance();
            let unicode = '';
            for (let i = 0; i < 4; i++) {
              unicode += this.peek();
              this.advance();
            }
            value += String.fromCharCode(parseInt(unicode, 16));
            continue;
          default:
            throw new Error(`Invalid escape character: \\${escaped}`);
        }
        this.advance();
      } else if (char === '\n' || char === '\r') {
        throw new Error('Unterminated string');
      } else {
        value += char;
        this.advance();
      }
    }
    
    this.expect('"');
    
    return ASTNodeFactory.createLiteral(value);
  }

  /**
   * 解析数字（保持大数字精度）
   */
  parseNumber() {
    let numStr = '';
    
    // 处理负号
    if (this.peek() === '-') {
      numStr += this.peek();
      this.advance();
    }
    
    // 处理整数部分
    if (this.peek() === '0') {
      numStr += this.peek();
      this.advance();
    } else if (this.peek() >= '1' && this.peek() <= '9') {
      while (this.peek() >= '0' && this.peek() <= '9') {
        numStr += this.peek();
        this.advance();
      }
    } else {
      throw new Error('Invalid number');
    }
    
    // 处理小数部分
    if (this.peek() === '.') {
      numStr += this.peek();
      this.advance();
      
      if (!(this.peek() >= '0' && this.peek() <= '9')) {
        throw new Error('Invalid number');
      }
      
      while (this.peek() >= '0' && this.peek() <= '9') {
        numStr += this.peek();
        this.advance();
      }
    }
    
    // 处理指数部分
    if (this.peek() === 'e' || this.peek() === 'E') {
      numStr += this.peek();
      this.advance();
      
      if (this.peek() === '+' || this.peek() === '-') {
        numStr += this.peek();
        this.advance();
      }
      
      if (!(this.peek() >= '0' && this.peek() <= '9')) {
        throw new Error('Invalid number');
      }
      
      while (this.peek() >= '0' && this.peek() <= '9') {
        numStr += this.peek();
        this.advance();
      }
    }
    
    // 检查是否为大整数，如果是则保持为字符串
    const num = Number(numStr);
    if (numStr.indexOf('.') === -1 && numStr.indexOf('e') === -1 && numStr.indexOf('E') === -1) {
      // 整数情况
      if (!Number.isSafeInteger(num)) {
        // 大整数，保持字符串形式但标记为数字类型
        return {
          type: NodeTypes.LITERAL,
          value: numStr, // 保存原始字符串
          numericValue: num, // 保存数值（可能有精度丢失）
          isBigInteger: true,
          raw: numStr
        };
      }
    }
    
    return ASTNodeFactory.createLiteral(num);
  }

  /**
   * 解析布尔值
   */
  parseBoolean() {
    if (this.input.substr(this.pos, 4) === 'true') {
      this.pos += 4;
      this.column += 4;
      return ASTNodeFactory.createLiteral(true);
    } else if (this.input.substr(this.pos, 5) === 'false') {
      this.pos += 5;
      this.column += 5;
      return ASTNodeFactory.createLiteral(false);
    } else {
      throw new Error('Invalid boolean value');
    }
  }

  /**
   * 解析null
   */
  parseNull() {
    if (this.input.substr(this.pos, 4) === 'null') {
      this.pos += 4;
      this.column += 4;
      return ASTNodeFactory.createLiteral(null);
    } else {
      throw new Error('Invalid null value');
    }
  }

  /**
   * 收集前导注释
   */
  collectLeadingComments() {
    const comments = [];
    const savedPos = this.pos;
    
    this.skipWhitespace();
    
    while (this.pos < this.input.length) {
      const comment = this.tryParseComment();
      if (comment) {
        comment.position = CommentPositions.LEADING;
        comments.push(comment);
        this.skipWhitespace();
      } else {
        break;
      }
    }
    
    return comments;
  }

  /**
   * 收集尾随注释（同行）
   */
  collectTrailingComments() {
    const comments = [];
    
    // 保存当前位置，用于判断是否在同一行
    const currentLine = this.line;
    
    // 跳过同行的空白字符，但不跳过换行符
    while (this.pos < this.input.length && (this.peek() === ' ' || this.peek() === '\t')) {
      this.advance();
    }
    
    // 只有在同一行才收集尾随注释
    if (this.line === currentLine) {
      const comment = this.tryParseComment();
      if (comment) {
        comment.position = CommentPositions.TRAILING;
        comments.push(comment);
      }
    }
    
    return comments;
  }

  /**
   * 收集注释（不区分位置）
   */
  collectComments() {
    const comments = [];
    
    this.skipWhitespace();
    
    while (this.pos < this.input.length) {
      const comment = this.tryParseComment();
      if (comment) {
        comments.push(comment);
        this.skipWhitespace();
      } else {
        break;
      }
    }
    
    return comments;
  }

  /**
   * 尝试解析注释
   */
  tryParseComment() {
    if (this.pos >= this.input.length) return null;
    
    if (this.peek() === '/' && this.input[this.pos + 1] === '/') {
      return this.parseLineComment();
    } else if (this.peek() === '/' && this.input[this.pos + 1] === '*') {
      return this.parseBlockComment();
    }
    
    return null;
  }

  /**
   * 解析行注释
   */
  parseLineComment() {
    let text = '';
    
    // 跳过 //
    this.advance();
    this.advance();
    
    // 读取到行尾
    while (this.pos < this.input.length && this.peek() !== '\n' && this.peek() !== '\r') {
      text += this.peek();
      this.advance();
    }
    
    return ASTNodeFactory.createComment('//' + text, CommentTypes.LINE);
  }

  /**
   * 解析块注释
   */
  parseBlockComment() {
    let text = '';
    
    // 跳过 /*
    this.advance();
    this.advance();
    
    // 读取到 */
    while (this.pos < this.input.length - 1) {
      if (this.peek() === '*' && this.input[this.pos + 1] === '/') {
        this.advance(); // *
        this.advance(); // /
        break;
      }
      text += this.peek();
      this.advance();
    }
    
    return ASTNodeFactory.createComment('/*' + text + '*/', CommentTypes.BLOCK);
  }

  /**
   * 跳过空白字符和注释
   */
  skipWhitespaceAndComments() {
    while (this.pos < this.input.length) {
      const oldPos = this.pos;
      
      this.skipWhitespace();
      
      // 跳过注释
      if (this.tryParseComment()) {
        // 注释被消费了，继续循环
        continue;
      }
      
      // 如果位置没有变化，说明没有更多空白和注释了
      if (this.pos === oldPos) {
        break;
      }
    }
  }

  /**
   * 跳过空白字符
   */
  skipWhitespace() {
    while (this.pos < this.input.length) {
      const char = this.peek();
      if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        this.advance();
      } else {
        break;
      }
    }
  }

  /**
   * 查看当前字符
   */
  peek() {
    return this.pos < this.input.length ? this.input[this.pos] : null;
  }

  /**
   * 前进一个字符
   */
  advance() {
    if (this.pos < this.input.length) {
      if (this.input[this.pos] === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.pos++;
    }
  }

  /**
   * 期望特定字符
   */
  expect(char) {
    if (this.peek() !== char) {
      throw new Error(`Expected '${char}', but got '${this.peek()}'`);
    }
    this.advance();
  }

  /**
   * 检查是否在当前位置之前有换行符（从上一个有意义的字符开始）
   */
  hasNewLineBefore() {
    // 向前查找到上一个非空白字符，看路径中是否有换行符
    let tempPos = this.pos - 1;
    while (tempPos >= 0 && (this.input[tempPos] === ' ' || this.input[tempPos] === '\t')) {
      tempPos--;
    }
    
    // 检查从上一个字符到当前位置是否有换行符
    for (let i = tempPos + 1; i < this.pos; i++) {
      if (this.input[i] === '\n' || this.input[i] === '\r') {
        return true;
      }
    }
    
    return false;
  }
}

/**
 * 检测并预处理数字key
 */
function preprocessNumericKeys(input) {
  // 检测是否包含数字key
  const hasNumericKeys = /(\s*)(\d+)(\s*):/g.test(input);
  
  if (hasNumericKeys) {
    // 将数字key转换为字符串key用于解析
    return {
      processedInput: input.replace(/(\s*)(\d+)(\s*):/g, '$1"$2"$3:'),
      hasNumericKeys: true,
      originalInput: input
    };
  }
  
  return {
    processedInput: input,
    hasNumericKeys: false,
    originalInput: input
  };
}

/**
 * 便捷的解析函数（支持数字key自动兼容）
 */
export function parseJSONWithComments(input) {
  try {
    // 首先尝试标准解析
    const parser = new JSONASTParser(input);
    return parser.parse();
  } catch (error) {
    // 如果失败，尝试预处理数字key后再解析
    try {
      const { processedInput, hasNumericKeys } = preprocessNumericKeys(input);
      
      if (hasNumericKeys) {
        const parser = new JSONASTParser(processedInput);
        const ast = parser.parse();
        
        // 标记这个AST包含数字key，用于格式化时恢复
        ast._hasNumericKeys = true;
        ast._originalInput = input;
        
        return ast;
      }
    } catch (preprocessError) {
      // 如果预处理也失败，抛出原始错误
    }
    
    // 抛出原始解析错误
    throw error;
  }
}