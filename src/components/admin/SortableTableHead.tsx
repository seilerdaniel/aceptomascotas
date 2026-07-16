import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface SortableTableHeadProps {
  column: string;
  label: string;
  activeSortBy: string;
  ascending: boolean;
  onSort: (column: string) => void;
  className?: string;
}

const SortableTableHead = ({
  column,
  label,
  activeSortBy,
  ascending,
  onSort,
  className,
}: SortableTableHeadProps) => {
  const isActive = activeSortBy === column;
  const Icon = isActive ? (ascending ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex items-center gap-1 font-medium hover:text-foreground transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </button>
    </TableHead>
  );
};

export default SortableTableHead;
