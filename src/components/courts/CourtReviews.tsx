import { Pencil, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { Tables } from "@/types/supabase.types";

type CourtReview = Tables<"court_reviews">;

interface CourtReviewsProps {
  reviews: CourtReview[];
  currentUserId: string | null;
  isSubmitting: boolean;
  reviewError: string | null;
  onCreateReview: (rating: number, comment: string) => void;
  onUpdateReview: (reviewId: string, rating: number, comment: string) => void;
  onDeleteReview: (reviewId: string) => void;
}

function CourtReviews({
  reviews,
  currentUserId,
  isSubmitting,
  reviewError,
  onCreateReview,
  onUpdateReview,
  onDeleteReview,
}: CourtReviewsProps) {
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bewertungen</CardTitle>

        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />

            <span>
              {averageRating.toFixed(1)} / 5 ({reviews.length})
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {currentUserId && (
          <form
            onSubmit={(event) => {
              event.preventDefault();

              const formData = new FormData(event.currentTarget);

              const ratingValue = Number(formData.get("rating"));
              const commentValue = String(formData.get("comment") ?? "").trim();

              if (ratingValue < 1 || ratingValue > 5 || !commentValue) {
                return;
              }

              onCreateReview(ratingValue, commentValue);
              event.currentTarget.reset();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="review-rating">Bewertung</Label>

              <select
                id="review-rating"
                name="rating"
                defaultValue="5"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <option value="5">5 – Sehr gut</option>
                <option value="4">4 – Gut</option>
                <option value="3">3 – Okay</option>
                <option value="2">2 – Schlecht</option>
                <option value="1">1 – Sehr schlecht</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-comment">Kommentar</Label>

              <Textarea
                id="review-comment"
                name="comment"
                placeholder="Wie findest du den Court?"
                required
              />
            </div>

            {reviewError && (
              <p className="text-sm text-destructive" role="alert">
                {reviewError}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Wird gespeichert …" : "Bewertung abgeben"}
            </Button>
          </form>
        )}

        {!currentUserId && (
          <p className="text-sm text-muted-foreground">
            Du musst eingeloggt sein, um den Court zu bewerten.
          </p>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Bewertungen vorhanden.
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const isOwnReview = review.user_id === currentUserId;

              return (
                <article
                  key={review.id}
                  className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />

                      <span className="font-medium">{review.rating}/5</span>
                    </div>

                    {review.created_at && (
                      <time
                        dateTime={review.created_at}
                        className="text-xs text-muted-foreground"
                      >
                        {new Date(review.created_at).toLocaleDateString(
                          "de-DE"
                        )}
                      </time>
                    )}
                  </div>

                  <p className="text-sm">{review.comment}</p>

                  {isOwnReview && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => {
                          const newComment = window.prompt(
                            "Kommentar bearbeiten:",
                            review.comment
                          );

                          if (newComment === null) {
                            return;
                          }

                          const trimmedComment = newComment.trim();

                          if (!trimmedComment) {
                            return;
                          }

                          onUpdateReview(
                            review.id,
                            review.rating,
                            trimmedComment
                          );
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Bearbeiten
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => {
                          const confirmed = window.confirm(
                            "Möchtest du diese Bewertung wirklich löschen?"
                          );

                          if (confirmed) {
                            onDeleteReview(review.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Löschen
                      </Button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CourtReviews;
