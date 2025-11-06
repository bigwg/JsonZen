import { useEffect, useRef, useState } from "react";
import { useJsonEditor } from "@/hooks/useJsonEditor";
import { useIndentSettings } from "@/hooks/useIndentSettings";
import { useJsonOperations } from "@/hooks/useJsonOperations";
import JsonTools from "../components/JsonTools";
import FeaturesSidebar from "../components/FeaturesSidebar";
import Editor from "@monaco-editor/react";
import { ChevronUp } from "lucide-react";
import { validateJson } from "../utils/jsonAstUtils";
import { parseJSONWithComments } from "../utils/jsonAstParser";

const Index = () => {
  const {
    jsonContent,
    editorRef,
    handleEditorChange,
    handleEditorDidMount,
    scrollToTop,
    resetEditorPosition,
    setJsonContent,
  } = useJsonEditor();

  // 缩进设置
  const { indentSize, toggleIndentSize } = useIndentSettings();
  
  // 用于获取格式化函数
  const { formatJson } = useJsonOperations(jsonContent, setJsonContent, resetEditorPosition, indentSize);

  // 错误标记状态
  const [errorMarkers, setErrorMarkers] = useState([]);
  
  // 用于跟踪是否是用户主动切换缩进
  const isIndentToggle = useRef(false);
  
  // 创建带自动格式化的缩进切换函数
  const handleToggleIndentSize = () => {
    isIndentToggle.current = true;
    toggleIndentSize();
  };
  
  // 监听缩进变化，自动格式化
  useEffect(() => {
    if (isIndentToggle.current) {
      isIndentToggle.current = false;
      // 使用setTimeout确保状态更新完成
      const timer = setTimeout(() => {
        formatJson();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [indentSize, formatJson]);

  // 检测JSON错误并设置标记
  const checkForErrors = (content) => {
    if (!content || content.trim() === '') {
      setErrorMarkers([]);
      return;
    }

    try {
      // 直接调用解析函数，它会在遇到重复key时抛出异常
      parseJSONWithComments(content);
      // 如果没有错误，清除标记
      setErrorMarkers([]);
    } catch (error) {
      if (error.duplicateKeyInfo) {
        // 处理重复key错误
        const info = error.duplicateKeyInfo;
        
        // 根据key类型计算正确的长度
        const keyLength = info.isNumericKey 
          ? info.duplicateKey.length  // 数字key不需要引号
          : info.duplicateKey.length + 2; // 字符串key需要加引号
        
        const markers = [
          {
            startLineNumber: info.firstOccurrence.line,
            startColumn: info.firstOccurrence.column,
            endLineNumber: info.firstOccurrence.line,
            endColumn: info.firstOccurrence.column + keyLength,
            message: `重复的key "${info.duplicateKey}" (首次出现)`,
            severity: monacoRef.current?.MarkerSeverity?.Error || 8,
          },
          {
            startLineNumber: info.secondOccurrence.line,
            startColumn: info.secondOccurrence.column,
            endLineNumber: info.secondOccurrence.line,
            endColumn: info.secondOccurrence.column + keyLength,
            message: `重复的key "${info.duplicateKey}" (重复位置)`,
            severity: monacoRef.current?.MarkerSeverity?.Error || 8,
          }
        ];
        
        setErrorMarkers(markers);
      } else {
        // 其他JSON解析错误（包括格式错误）
        // 这些错误不需要标记，因为它们是语法错误，Monaco会自动处理
        setErrorMarkers([]);
      }
    }
  };

  // 监听内容变化，检测错误
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForErrors(jsonContent);
    }, 300); // 防抖，300ms后检测

    return () => clearTimeout(timer);
  }, [jsonContent]);

  // 配置Monaco Editor以支持注释
  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: "on",
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: indentSize,
    insertSpaces: true,
    detectIndentation: false,
    comments: {
      lineComment: "//",
    },
    wordWrap: "on", // 添加自动换行，提高长JSON的可读性
    fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
    fontLigatures: true,
    renderLineHighlight: "all",
    cursorBlinking: "smooth",
    smoothScrolling: true,
    padding: { top: 16, bottom: 16 },
  };

  // Monaco编辑器实例引用
  const monacoRef = useRef(null);

  // 自定义JSON语言配置
  const beforeMount = (monaco) => {
    monacoRef.current = monaco;
    // 配置JSON语法检查选项
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      comments: "ignore", // 忽略注释导致的错误
      trailingCommas: "ignore", // 忽略尾随逗号
      allowComments: true, // 允许注释
      schemaValidation: "ignore", // 忽略schema验证
      validate: false, // 完全禁用默认验证
    });

    // 注册自定义的JSON语言，支持数字key
    monaco.languages.register({ id: 'json-extended' });

    // 设置自定义的语法高亮规则
    monaco.languages.setMonarchTokensProvider('json-extended', {
      tokenizer: {
        root: [
          // 数字key（后面跟着冒号）
          [/\d+(?=\s*:)/, 'key.number'],
          
          // 字符串key（标准的"key":格式）
          [/"[^"]*"(?=\s*:)/, 'key.string'],
          
          // 字符串值
          [/"[^"]*"/, 'string.value'],
          
          // 数字值
          [/-?\d+\.?\d*([eE][+-]?\d+)?/, 'number'],
          
          // 布尔值
          [/true|false/, 'keyword.boolean'],
          
          // null值
          [/null/, 'keyword.null'],
          
          // 注释
          [/\/\/.*$/, 'comment.line'],
          [/\/\*[\s\S]*?\*\//, 'comment.block'],
          
          // 分隔符和操作符
          [/[{}[\]]/, 'bracket'],
          [/[:,]/, 'delimiter'],
          
          // 空白字符
          [/\s+/, 'white']
        ]
      }
    });

    // 设置自定义主题，让数字key有合适的颜色
    monaco.editor.defineTheme('json-extended-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'key.number', foreground: '9CDCFE', fontStyle: 'bold' }, // 数字key - 蓝色
        { token: 'key.string', foreground: '9CDCFE', fontStyle: 'bold' }, // 字符串key - 蓝色
        { token: 'string.value', foreground: 'CE9178' }, // 字符串值 - 橙色
        { token: 'number', foreground: 'B5CEA8' }, // 数字值 - 绿色
        { token: 'keyword.boolean', foreground: '569CD6' }, // 布尔值 - 蓝色
        { token: 'keyword.null', foreground: '569CD6' }, // null - 蓝色
        { token: 'comment.line', foreground: '6A9955', fontStyle: 'italic' }, // 行注释 - 绿色
        { token: 'comment.block', foreground: '6A9955', fontStyle: 'italic' }, // 块注释 - 绿色
        { token: 'bracket', foreground: 'FFD700' }, // 括号 - 金色
        { token: 'delimiter', foreground: 'D4D4D4' } // 分隔符 - 灰色
      ],
      colors: {}
    });
  };

  // 自定义的onMount处理函数
  const handleEditorMount = (editor, monaco) => {
    // 调用原有的onMount逻辑
    handleEditorDidMount(editor, monaco);
    
    // 保存Monaco实例
    monacoRef.current = monaco;
  };

  // 应用错误标记到编辑器
  useEffect(() => {
    if (editorRef.current && monacoRef.current && errorMarkers.length > 0) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, 'json-errors', errorMarkers);
      }
    } else if (editorRef.current && monacoRef.current) {
      // 清除错误标记
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, 'json-errors', []);
      }
    }
  }, [errorMarkers]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex flex-col">
      {/* 特性说明侧边栏 */}
      <FeaturesSidebar />

      <header className="py-6 px-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500">
            JSON 超级助手
          </h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            支持注释且功能丰富的JSON工具
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-6 md:p-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <JsonTools
              jsonContent={jsonContent}
              setJsonContent={setJsonContent}
              resetEditorPosition={resetEditorPosition}
              indentSize={indentSize}
              toggleIndentSize={handleToggleIndentSize}
            />
          </div>

          <div className="h-[70vh] overflow-hidden relative">
            <Editor
              height="100%"
              defaultLanguage="json-extended"
              value={jsonContent}
              onChange={handleEditorChange}
              theme="json-extended-dark"
              options={editorOptions}
              beforeMount={beforeMount}
              onMount={handleEditorMount}
            />
            
            {/* 回到顶部按钮 */}
            <button
              onClick={scrollToTop}
              className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl z-10 group"
              title="回到顶部"
            >
              <ChevronUp className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>
        </div>

        <footer className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {/* <p>支持JSON注释 • 功能丰富 • 界面简洁</p> */}
          <p className="mt-2">需求&amp;问题反馈：<a href="https://github.com/bigwg/JsonZen/issues" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub issues</a></p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
