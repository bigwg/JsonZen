import { FileJsonIcon } from "lucide-react";
import Index from "./pages/Index.jsx";

export const navItems = [
  {
    title: "JSON工具",
    to: "/",
    icon: <FileJsonIcon className="h-4 w-4" />,
    page: <Index />,
  },
];
