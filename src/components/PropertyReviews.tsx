import { useState } from "react";
import { Star, User, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  usePropertyReviews,
  usePropertyRating,
  useCreatePropertyReview,
  type PropertyReview,
} from "@/hooks/usePropertyReviews";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PropertyReviewsProps {
  propertyId: string;
}

// Structured pet-dimension axes collected with a property review (R3/S16).
const DIMENSION_LABELS: { key: string; label: string }[] = [
  { key: "pet_friendliness", label: "Amigable con mascotas" },
  { key: "space", label: "Espacio" },
  { key: "owner_responsiveness", label: "Respuesta del dueño" },
];

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

// Public URL for a review photo stored in the review-images bucket
// (folder-per-user RLS, R3/S17).
const reviewPhotoUrl = (path: string): string =>
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${path}`;

const PropertyReviews = ({ propertyId }: PropertyReviewsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: reviews = [], isLoading } = usePropertyReviews(propertyId);
  const { data: rating } = usePropertyRating(propertyId);
  const createReview = useCreatePropertyReview();

  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({
    user_name: "",
    rating: 0,
    comment: "",
    pet_friendliness: 0,
    space: 0,
    owner_responsiveness: 0,
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
        property_id: propertyId,
        user_name: newReview.user_name.trim(),
        rating: newReview.rating,
        comment: newReview.comment.trim() || undefined,
        pet_dimensions: {
          pet_friendliness: newReview.pet_friendliness || null,
          space: newReview.space || null,
          owner_responsiveness: newReview.owner_responsiveness || null,
        },
        user_id: user?.id,
      });

      toast({
        title: "¡Gracias por tu reseña!",
        description: "Tu opinión será revisada antes de publicarse.",
      });

      setNewReview({
        user_name: "",
        rating: 0,
        comment: "",
        pet_friendliness: 0,
        space: 0,
        owner_responsiveness: 0,
      });
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

  // Defense in depth for S18: the query already filters is_approved = true
  // server-side (and RLS enforces it), but the public component never
  // renders an unapproved review (nor its photos) even if the data ever
  // contains one.
  const approvedReviews = reviews.filter((review) => review.is_approved);

  const isRecommended = rating && rating.average_rating >= 4 && rating.review_count >= 3;

  const renderDimensions = (review: PropertyReview) => {
    if (!review.pet_dimensions || typeof review.pet_dimensions !== "object") {
      return null;
    }
    const dimensions = review.pet_dimensions as Record<string, unknown>;
    const present = DIMENSION_LABELS.filter(
      ({ key }) => typeof dimensions[key] === "number"
    );
    if (present.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {present.map(({ key, label }) => (
          <Badge key={key} variant="soft" className="gap-1">
            {label}: {String(dimensions[key])}/5
          </Badge>
        ))}
      </div>
    );
  };

  const renderPhotos = (review: PropertyReview) => {
    if (!review.pet_dimensions || typeof review.pet_dimensions !== "object") {
      return null;
    }
    const photos = (review.pet_dimensions as Record<string, unknown>).photos;
    if (!Array.isArray(photos) || photos.length === 0) return null;

    return (
      <div className="grid grid-cols-3 gap-2 mt-3">
        {photos.slice(0, 5).map((photo) => (
          <img
            key={String(photo)}
            loading="lazy"
            decoding="async"
            src={reviewPhotoUrl(String(photo))}
            alt="Foto de la reseña"
            className="h-20 w-full object-cover rounded-lg"
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-display">Reseñas</CardTitle>
          {rating && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(rating.average_rating ?? 0)} readonly size="sm" />
                <span className="font-semibold">{rating.average_rating ?? "—"}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({rating.review_count ?? 0} {(rating.review_count ?? 0) === 1 ? "reseña" : "reseñas"})
              </span>
              {isRecommended && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  ⭐ Propiedad recomendada
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

            <div className="space-y-3">
              <label className="text-sm font-medium">¿Cómo es para las mascotas?</label>
              {DIMENSION_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <StarRating
                    rating={newReview[key as "pet_friendliness"]}
                    onRatingChange={(value) =>
                      setNewReview({ ...newReview, [key]: value })
                    }
                    size="sm"
                  />
                </div>
              ))}
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
        ) : approvedReviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Todavía no hay reseñas. ¡Sé el primero en opinar!
          </p>
        ) : (
          <div className="space-y-4">
            {approvedReviews.map((review) => (
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
                  {renderDimensions(review)}
                  {renderPhotos(review)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyReviews;
