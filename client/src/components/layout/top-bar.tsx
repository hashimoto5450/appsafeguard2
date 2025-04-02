import { useState } from "react";
import { Bell, HelpCircle, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
    // Implementation would normally update the actual theme
  };

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      
      <div className="flex items-center space-x-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-500" />
              <Badge className="absolute top-0 right-0 h-2 w-2 p-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-4 text-center text-sm text-gray-500">
              現在通知はありません
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleTheme}
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5 text-gray-500" />
          ) : (
            <Sun className="h-5 w-5 text-gray-500" />
          )}
        </Button>
        
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5 text-gray-500" />
        </Button>
      </div>
    </header>
  );
}
