import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminTablePaginationProps {
  page: number;
  pageCount: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

const AdminTablePagination = ({ page, pageCount, totalCount, onPageChange }: AdminTablePaginationProps) => {
  if (totalCount === 0) return null;

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
      <span>
        Página {page} de {pageCount} · {totalCount} en total
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AdminTablePagination;
