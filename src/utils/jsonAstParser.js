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
      // 防止无限循环：检查是否到达字符串末尾
      if (this.pos >= this.input.length) {
        throw new Error('Unterminated string: reached end of input');
      }

      const char = this.peek();
      
      if (char === '\\') {
        this.advance();
        const escaped = this.peek();

        // 防止转义字符后到达末尾
        if (this.pos >= this.input.length) {
          throw new Error('Unterminated string: escape character at end of input');
        }

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
              if (this.pos >= this.input.length) {
                throw new Error('Unterminated unicode escape sequence');
              }
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
    while (this.pos < this.input.length) {
      // 检查是否找到了结束符 */
      if (this.peek() === '*' && this.pos + 1 < this.input.length && this.input[this.pos + 1] === '/') {
        this.advance(); // *
        this.advance(); // /
        break;
      }

      // 防止无限循环：如果到达末尾还没找到 */，抛出错误
      if (this.pos >= this.input.length) {
        throw new Error('Unterminated block comment: reached end of input without finding */');
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
    let maxIterations = this.input.length + 10; // 防止无限循环的迭代次数限制
    let iterations = 0;

    while (this.pos < this.input.length) {
      iterations++;
      if (iterations > maxIterations) {
        throw new Error('Infinite loop detected in skipWhitespaceAndComments');
      }

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
  // 更精确的数字key检测：排除字符串内部的数字
  // 使用更复杂的逻辑来避免在字符串值中匹配
  
  // 首先，我们需要找到所有真正的数字key（不在字符串内部）
  const lines = input.split('\n');
  let hasNumericKeys = false;
  const originalKeys = new Map();
  let processedLines = [];
    
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    
    // 检查这一行是否包含数字key
    // 数字key的特征：数字后面跟着冒号，且不在字符串内部
    // 我们需要跳过字符串内部的内容
      
    let processedLine = '';
    let inString = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      // 处理字符串边界
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inString = !inString;
        processedLine += char;
        i++;
        continue;
      }
    
      // 如果在字符串内部，直接复制
      if (inString) {
        processedLine += char;
        i++;
        continue;
      }
    
      // 不在字符串内部，检查是否是数字key
      if (char >= '0' && char <= '9') {
        // 收集完整的数字
        let numStr = '';
        let numStart = i;
        while (i < line.length && line[i] >= '0' && line[i] <= '9') {
          numStr += line[i];
          i++;
        }

        // 跳过空白
        let spaceAfterNum = '';
        while (i < line.length && (line[i] === ' ' || line[i] === '\t')) {
          spaceAfterNum += line[i];
          i++;
        }

        // 检查是否后面跟着冒号
        if (i < line.length && line[i] === ':') {
          // 这是一个数字key
          hasNumericKeys = true;
          originalKeys.set(numStr, {
            original: numStr,
            position: numStart
          });

          // 转换为字符串key
          processedLine += `"${numStr}"${spaceAfterNum}`;
          i++; // 跳过冒号，让后续逻辑处理
          continue;
        } else {
          // 不是数字key，恢复原样
          processedLine += numStr + spaceAfterNum;
          continue;
        }
      }
    
      processedLine += char;
      i++;
    }

    processedLines.push(processedLine);
  }

  const processedInput = processedLines.join('\n');

  if (hasNumericKeys) {
    return {
      processedInput,
      hasNumericKeys: true,
      originalInput: input,
      originalKeys // 保存原始数字key信息
    };
  }
  
  return {
    processedInput: input,
    hasNumericKeys: false,
    originalInput: input,
    originalKeys: new Map()
  };
}

/**
 * 便捷的解析函数（支持数字key自动兼容）
 */
export function parseJSONWithComments(input) {
  // 先检查是否包含数字key，如果有则直接使用预处理逻辑
  // 使用更精确的检测方法
  const { processedInput, hasNumericKeys, originalKeys } = preprocessNumericKeys(input);
  
  if (hasNumericKeys) {
    // 直接使用数字key预处理逻辑
    try {
      const parser = new JSONASTParser(processedInput);
      const ast = parser.parse();
      
      // 检查重复key（包括数字key和字符串key的冲突）
      checkDuplicateKeysWithNumeric(ast, originalKeys, [], input);
      
      // 标记这个AST包含数字key，用于格式化时恢复
      ast._hasNumericKeys = true;
      ast._originalInput = input;
      ast._originalKeys = originalKeys;
      
      return ast;
    } catch (preprocessError) {
      // 抛出预处理错误（可能包含重复key信息）
      throw preprocessError;
    }
  } else {
    // 标准JSON解析
    try {
      const parser = new JSONASTParser(input);
      const ast = parser.parse();
      
      // 检查是否有重复key
      checkDuplicateKeys(ast, [], input);
      
      return ast;
    } catch (error) {
      throw error;
    }
  }
}

/**
 * 检查AST中的重复key
 */
function checkDuplicateKeys(node, path = [], originalInput = '') {
  if (!node) return;
  
  if (node.type === 'ObjectExpression' && node.properties) {
    const keyMap = new Map(); // 使用Map存储key的位置信息
    
    for (let i = 0; i < node.properties.length; i++) {
      const property = node.properties[i];
      
      if (property.key) {
        let keyValue;
        
        // 处理不同类型的key
        if (property.key.type === 'Literal') {
          keyValue = String(property.key.value);
        } else if (property.key.type === 'Identifier') {
          keyValue = property.key.name;
        } else {
          continue; // 跳过不支持的key类型
        }
        
        if (keyMap.has(keyValue)) {
          // 发现重复key，使用文本搜索找到准确位置
          const firstPos = findKeyPositionInText(originalInput, keyValue, 1);
          const secondPos = findKeyPositionInText(originalInput, keyValue, 2);
          
          // 检查是否是数字key（通过检查原始输入中是否没有引号包围）
          const isOriginalNumeric = isNumericKeyInText(originalInput, keyValue);
          
          const errorInfo = {
            message: `Duplicate key: "${keyValue}"`,
            duplicateKey: keyValue,
            firstOccurrence: {
              index: 0,
              line: firstPos.line,
              column: firstPos.column
            },
            secondOccurrence: {
              index: i,
              line: secondPos.line,
              column: secondPos.column
            },
            path: path.length > 0 ? path.join('.') : 'root',
            isNumericKey: isOriginalNumeric
          };
          
          const error = new Error(errorInfo.message);
          error.duplicateKeyInfo = errorInfo;
          throw error;
        }
        
        keyMap.set(keyValue, {
          index: i,
          line: 0, // 暂时不需要存储，因为我们用文本搜索
          column: 0
        });
      }
    }
    
    // 递归检查嵌套对象
    for (const property of node.properties) {
      if (property.value) {
        let keyForPath;
        if (property.key.type === 'Literal') {
          keyForPath = property.key.value;
        } else if (property.key.type === 'Identifier') {
          keyForPath = property.key.name;
        }
        checkDuplicateKeys(property.value, [...path, keyForPath], originalInput);
      }
    }
  } else if (node.type === 'ArrayExpression' && node.elements) {
    // 递归检查数组元素
    for (let i = 0; i < node.elements.length; i++) {
      checkDuplicateKeys(node.elements[i], [...path, i], originalInput);
    }
  }
}

/**
 * 计算字符位置对应的行号
 */
function calculateLineNumber(text, position) {
  if (!text || position < 0) return 1;
  
  let line = 1;
  for (let i = 0; i < Math.min(position, text.length); i++) {
    if (text[i] === '\n') {
      line++;
    }
  }
  return line;
}

/**
 * 计算字符位置对应的列号
 */
function calculateColumnNumber(text, position) {
  if (!text || position < 0) return 1;
  
  let column = 1;
  for (let i = 0; i < Math.min(position, text.length); i++) {
    if (text[i] === '\n') {
      column = 1;
    } else {
      column++;
    }
  }
  return column;
}

/**
 * 检查key在原始文本中是否是数字格式（不带引号）
 */
function isNumericKeyInText(text, keyValue) {
  const lines = text.split('\n');
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    
    // 检查是否存在数字key格式
    const numericKeyRegex = new RegExp(`(?:^|[^"])\\s*(${keyValue})\\s*:`, 'g');
    if (numericKeyRegex.test(line)) {
      return true;
    }
  }
  
  return false;
}

/**
 * 通过key值在原始文本中查找位置
 */
function findKeyPositionInText(text, keyValue, occurrence = 1) {
  const lines = text.split('\n');
  let currentOccurrence = 0;
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    
    // 尝试匹配数字key模式: 数字 + 可选空格 + 冒号
    const numericKeyRegex = new RegExp(`(?:^|[^"])\\s*(${keyValue})\\s*:`, 'g');
    // 尝试匹配字符串key模式: "数字" + 可选空格 + 冒号  
    const stringKeyRegex = new RegExp(`"(${keyValue})"\\s*:`, 'g');
    
    let match = numericKeyRegex.exec(line);
    let isNumeric = true;
    if (!match) {
      match = stringKeyRegex.exec(line);
      isNumeric = false;
    }
    
    if (match) {
      currentOccurrence++;
      if (currentOccurrence === occurrence) {
        // 计算正确的列位置
        let keyStartIndex;
        if (isNumeric) {
          // 对于数字key，找到数字的开始位置
          keyStartIndex = line.indexOf(keyValue, match.index);
        } else {
          // 对于字符串key，找到引号的开始位置
          keyStartIndex = line.indexOf(`"${keyValue}"`, match.index);
        }
        
        return {
          line: lineIndex + 1, // 行号从1开始
          column: keyStartIndex + 1 // 列号从1开始
        };
      }
    }
  }
  
  // 如果没找到，返回默认位置
  return { line: 1, column: 1 };
}

/**
 * 检查包含数字key的重复key情况
 */
function checkDuplicateKeysWithNumeric(node, originalKeys, path = [], originalInput = '') {
  if (!node) return;
  
  if (node.type === 'ObjectExpression' && node.properties) {
    const keyMap = new Map(); // 使用Map存储key的位置信息
    
    for (let i = 0; i < node.properties.length; i++) {
      const property = node.properties[i];
      
      if (property.key) {
        let keyValue;
        
        // 处理不同类型的key
        if (property.key.type === 'Literal') {
          keyValue = String(property.key.value);
        } else if (property.key.type === 'Identifier') {
          keyValue = property.key.name;
        } else {
          continue; // 跳过不支持的key类型
        }
        
        // 检查是否与已存在的key冲突
        if (keyMap.has(keyValue)) {
          // 检查是否是原本的数字key
          const isOriginalNumeric = originalKeys.has(keyValue);
          const displayKey = isOriginalNumeric ? keyValue : `"${keyValue}"`;
          
          // 发现重复key，使用文本搜索找到准确位置
          const firstPos = findKeyPositionInText(originalInput, keyValue, 1);
          const secondPos = findKeyPositionInText(originalInput, keyValue, 2);
          
          const errorInfo = {
            message: `Duplicate key: ${displayKey}`,
            duplicateKey: keyValue,
            firstOccurrence: {
              index: 0,
              line: firstPos.line,
              column: firstPos.column
            },
            secondOccurrence: {
              index: i,
              line: secondPos.line,
              column: secondPos.column
            },
            path: path.length > 0 ? path.join('.') : 'root',
            isNumericKey: isOriginalNumeric
          };
          
          const error = new Error(errorInfo.message);
          error.duplicateKeyInfo = errorInfo;
          throw error;
        }
        
        keyMap.set(keyValue, {
          index: i,
          line: 0, // 暂时不需要存储，因为我们用文本搜索
          column: 0
        });
      }
    }
    
    // 递归检查嵌套对象
    for (const property of node.properties) {
      if (property.value) {
        let keyForPath;
        if (property.key.type === 'Literal') {
          keyForPath = property.key.value;
        } else if (property.key.type === 'Identifier') {
          keyForPath = property.key.name;
        }
        checkDuplicateKeysWithNumeric(property.value, originalKeys, [...path, keyForPath], originalInput);
      }
    }
  } else if (node.type === 'ArrayExpression' && node.elements) {
    // 递归检查数组元素
    for (let i = 0; i < node.elements.length; i++) {
      checkDuplicateKeysWithNumeric(node.elements[i], originalKeys, [...path, i], originalInput);
    }
  }
}