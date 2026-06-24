import { useState } from "react";
import { Star, User, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useServiceReviews, useServiceRating, useCreateReview } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ServiceReviewsProps {
  serviceId: string;
}

const StarRating = ({
  rating,
  onRatingChange,
  readonly = false,
  size = "md",
}: {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRatingChange?.(star)}
          className={cn(
            "transition-colors",
            !readonly && "hover:scale-110 cursor-pointer"
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted"
            )}
          />
        </button>
      ))}
    </div>
  );
};

const ServiceReviews = ({ serviceId }: ServiceReviewsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: reviews = [], isLoading } = useServiceReviews(serviceId);
  const { data: rating } = useServiceRating(serviceId);
  const createReview = useCreateReview();

  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({
    user_name: "",
    rating: 0,
    comment: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newReview.user_name.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresá tu nombre",
        variant: "destructive",
      });
      return;
    }

    if (newReview.rating === 0) {
      toast({
        title: "Error",
        description: "Por favor seleccioná una calificación",
        variant: "destructive",
      });
      return;
    }

    try {
      await createReview.mutateAsync({
        service_id: serviceId,
        user_name: newReview.user_name.trim(),
        rating: newReview.rating,
        comment: newReview.comment.trim() || undefined,
        user_id: user?.id,
      });

      toast({
        title: "¡Gracias por tu reseña!",
        description: "Tu opinión será revisada antes de publicarse.",
      });

      setNewReview({ user_name: "", rating: 0, comment: "" });
      setShowForm(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo enviar la reseña. Intentá de nuevo.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const isRecommended = rating && rating.average_rating >= 4 && rating.review_count >= 3;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-display">Reseñas</CardTitle>
          {rating && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(rating.average_rating)} readonly size="sm" />
                <span className="font-semibold">{rating.average_rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({rating.review_count} {rating.review_count === 1 ? "reseña" : "reseñas"})
              </span>
              {isRecommended && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  ⭐ Servicio recomendado
                </Badge>
              )}
            </div>
          )}
        </div>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Escribir reseña
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Review Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-muted/50 rounded-xl">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tu nombre</label>
              <Input
                placeholder="Nombre"
                value={newReview.user_name}
                onChange={(e) =>
                  setNewReview({ ...newReview, user_name: e.target.value })
                }
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Calificación</label>
              <StarRating
                rating={newReview.rating}
                onRatingChange={(rating) => setNewReview({ ...newReview, rating })}
                size="lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Comentario (opcional)</label>
              <Textarea
                placeholder="Contanos tu experiencia..."
                value={newReview.comment}
                onChange={(e) =>
                  setNewReview({ ...newReview, comment: e.target.value })
                }
                maxLength={500}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createReview.isPending}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {createReview.isPending ? "Enviando..." : "Enviar reseña"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Todavía no hay reseñas. ¡Sé el primero en opinar!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex gap-4 p-4 rounded-xl bg-muted/30"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{review.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), "d MMM yyyy", {
                        locale: es,
                      })}
                    </span>
                  </div>
                  <StarRating rating={review.rating} readonly size="sm" />
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceReviews;
