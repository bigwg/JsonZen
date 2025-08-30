/**
 * 工具按钮配置文件
 * 定义所有工具按钮的图标、样式等配置
 */

import {
  Braces,
  Code2,
  Copy,
  Minimize2,
  Quote,
  RefreshCw,
  Trash2
} from "lucide-react";

// 工具按钮配置
export const createToolsConfig = (actions) => [
  {
    name: "格式化",
    icon: <Braces className="h-4 w-4 mr-2" />,
    onClick: actions.formatJson,
    className: "bg-blue-600 hover:bg-blue-700 text-white"
  },
  {
    name: "压缩",
    icon: <Minimize2 className="h-4 w-4 mr-2" />,
    onClick: actions.compressJson,
    className: "bg-indigo-600 hover:bg-indigo-700 text-white"
  },
  {
    name: "复制",
    icon: <Copy className="h-4 w-4 mr-2" />,
    onClick: actions.copyJson,
    className: "bg-green-600 hover:bg-green-700 text-white"
  },
  {
    name: "去除注释",
    icon: <Trash2 className="h-4 w-4 mr-2" />,
    onClick: actions.removeComments,
    className: "bg-amber-600 hover:bg-amber-700 text-white"
  },
  {
    name: "转换注释",
    icon: <RefreshCw className="h-4 w-4 mr-2" />,
    onClick: actions.convertCommentStyle,
    className: "bg-rose-600 hover:bg-rose-700 text-white"
  },
  {
    name: "添加转义",
    icon: <Quote className="h-4 w-4 mr-2" />,
    onClick: actions.escapeJson,
    className: "bg-emerald-600 hover:bg-emerald-700 text-white"
  },
  {
    name: "移除转义",
    icon: <Code2 className="h-4 w-4 mr-2" />,
    onClick: actions.unescapeJson,
    className: "bg-purple-600 hover:bg-purple-700 text-white"
  }
]; 