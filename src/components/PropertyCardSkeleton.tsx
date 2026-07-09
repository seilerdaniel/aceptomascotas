import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PropertyCardSkeleton = () => {
  return (
    <Card className="overflow-hidden h-full">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCardSkeleton;
