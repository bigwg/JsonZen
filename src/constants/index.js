// 应用常量配置
export const APP_CONFIG = {
  DEFAULT_CONTENT: "//请输入JSON，支持//或/**/形式的单行注释",
  CACHE_KEY: "json-tools-content",
  DEBOUNCE_DELAY: 1000, // 缓存保存防抖延迟
  EDITOR_RESET_DELAY: 50, // 编辑器位置重置延迟
};

// 编辑器配置
export const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: "on",
  scrollBeyondLastLine: false,
  automaticLayout: true,
  comments: {
    lineComment: "//",
  },
  wordWrap: "on",
  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
  fontLigatures: true,
  renderLineHighlight: "all",
  cursorBlinking: "smooth",
  smoothScrolling: true,
  padding: { top: 16, bottom: 16 },
};

// Monaco编辑器语言配置
export const MONACO_JSON_CONFIG = {
  comments: "ignore",
  trailingCommas: "ignore",
  allowComments: true,
};

// 工具按钮样式配置
export const TOOL_BUTTON_STYLES = {
  format: "bg-blue-600 hover:bg-blue-700 text-white",
  compress: "bg-indigo-600 hover:bg-indigo-700 text-white",
  copy: "bg-green-600 hover:bg-green-700 text-white",
  removeComments: "bg-amber-600 hover:bg-amber-700 text-white",
  convertToString: "bg-teal-600 hover:bg-teal-700 text-white",
  convertComments: "bg-rose-600 hover:bg-rose-700 text-white",
  escape: "bg-emerald-600 hover:bg-emerald-700 text-white",
  unescape: "bg-purple-600 hover:bg-purple-700 text-white",
};

// 错误消息
export const ERROR_MESSAGES = {
  EMPTY_INPUT: "请输入JSON，支持//或/**/形式的单行注释",
  PARSE_ERROR: "JSON解析错误：",
  NO_COMMENTS: "JSON不包含注释，无法转换注释格式",
  HAS_COMMENTS_COMPRESS: "JSON包含注释，无法压缩，请去除注释后重试",
  COPY_FAILED: "复制失败：",
  ESCAPE_FAILED: "转义失败：",
  UNESCAPE_FAILED: "转义移除失败：",
  FORMAT_FAILED: "格式化失败：",
  COMPRESS_FAILED: "JSON压缩失败：",
  COMMENT_CONVERT_FAILED: "注释格式转换失败：",
};

// 成功消息
export const SUCCESS_MESSAGES = {
  FORMAT_SUCCESS: "格式化成功",
  COMPRESS_SUCCESS: "JSON已压缩",
  COPY_SUCCESS: "JSON内容已复制到剪贴板",
  REMOVE_COMMENTS_SUCCESS: "注释已移除",
  CONVERT_COMMENTS_SUCCESS: "注释格式已转换",
  ESCAPE_SUCCESS: "转义添加成功",
  UNESCAPE_SUCCESS: "转义移除成功",
}; 