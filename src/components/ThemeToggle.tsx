import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const;

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border p-1 bg-muted/40">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant="ghost"
          size="sm"
          onClick={() => setTheme(opt.value)}
          className={cn(
            "gap-1.5",
            theme === opt.value && "bg-background shadow-sm"
          )}
        >
          <opt.icon className="h-4 w-4" />
          {opt.label}
        </Button>
      ))}
    </div>
  );
};

export default ThemeToggle;
