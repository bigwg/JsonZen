import { Button } from "@/components/ui/button";
import {
  Braces,
  Code2,
  Copy,
  FileJson,
  HelpCircle,
  Minimize2,
  Quote,
  RefreshCw,
  Trash2,
  Settings
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useJsonOperations } from "@/hooks/useJsonOperations";
import { TOOL_BUTTON_STYLES } from "@/constants/index";

const JsonTools = ({ jsonContent, setJsonContent, resetEditorPosition, indentSize, toggleIndentSize }) => {
  
  const {
    formatJson,
    compressJson,
    removeComments,
    convertCommentStyle,
    escapeJson,
    unescapeJson,
    copyJson,
    convertToStringToJson,
  } = useJsonOperations(jsonContent, setJsonContent, resetEditorPosition, indentSize);

  // 工具按钮配置
  const tools = [
    {
      name: "格式化",
      icon: <Braces className="h-4 w-4 mr-2" />,
      onClick: formatJson,
      className: "bg-blue-600 hover:bg-blue-700 text-white"
    },
    {
      name: `缩进${indentSize}格`,
      icon: <Settings className="h-4 w-4 mr-2" />,
      onClick: toggleIndentSize,
      className: `${indentSize === 4 ? 'bg-slate-600 hover:bg-slate-700' : 'bg-slate-500 hover:bg-slate-600'} text-white`,
      tooltip: `当前缩进：${indentSize}个空格\n点击切换到${indentSize === 4 ? '2' : '4'}个空格并自动格式化`
    },
    {
      name: "转为Json",
      icon: <FileJson className="h-4 w-4 mr-2" />,
      onClick: convertToStringToJson,
      className: TOOL_BUTTON_STYLES.convertToString,
      tooltip: "使用说明：\n将Java对象的toString输出结果粘贴代码区，然后点击[转为Json]\n\n支持的格式示例：\n• 传统格式：Person{name=张三, age=25}\n• Lombok格式：Person(name=张三, age=25)\n• 嵌套对象：Person(name=张三, address=Address(city=北京, street=朝阳路))\n• 数组：Person(hobbies=[读书, 运动], scores=[98, 95])\n• 顶层数组：[Student(name=张三, age=18), Student(name=李四, age=19)]"
    },
    {
      name: "压缩",
      icon: <Minimize2 className="h-4 w-4 mr-2" />,
      onClick: compressJson,
      className: "bg-indigo-600 hover:bg-indigo-700 text-white"
    },
    {
      name: "复制",
      icon: <Copy className="h-4 w-4 mr-2" />,
      onClick: copyJson,
      className: "bg-green-600 hover:bg-green-700 text-white"
    },
    {
      name: "去除注释",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: removeComments,
      className: "bg-amber-600 hover:bg-amber-700 text-white"
    },
    {
      name: "转换注释",
      icon: <RefreshCw className="h-4 w-4 mr-2" />,
      onClick: convertCommentStyle,
      className: "bg-rose-600 hover:bg-rose-700 text-white"
    },
    {
      name: "添加转义",
      icon: <Quote className="h-4 w-4 mr-2" />,
      onClick: escapeJson,
      className: "bg-emerald-600 hover:bg-emerald-700 text-white"
    },
    {
      name: "移除转义",
      icon: <Code2 className="h-4 w-4 mr-2" />,
      onClick: unescapeJson,
      className: "bg-purple-600 hover:bg-purple-700 text-white"
    }
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
        {tools.map((tool, index) => (
          tool.tooltip ? (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button
                    onClick={tool.onClick}
                    className={`${tool.className} transition-all duration-200 shadow-sm hover:shadow-md flex items-center px-4 py-2 rounded-md text-sm font-medium`}
                  >
                    {tool.icon}
                    {tool.name}
                  </Button>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">?</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <p className="whitespace-pre-line text-sm leading-relaxed">{tool.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              key={index}
              onClick={tool.onClick}
              className={`${tool.className} transition-all duration-200 shadow-sm hover:shadow-md flex items-center px-4 py-2 rounded-md text-sm font-medium`}
            >
              {tool.icon}
              {tool.name}
            </Button>
          )
        ))}
      </div>
    </TooltipProvider>
  );
};

export default JsonTools;
