import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { Tables } from "@/types/supabase.types";

type Court = Tables<"courts">;

interface CourtListSheetProps {
  courts: Court[];
  selectedCourt: Court | null;
  onSelectCourt: (court: Court) => void;
}

type SheetState = "collapsed" | "partially-expanded" | "expanded";

const COLLAPSED_HEIGHT = 96;
const PARTIALLY_EXPANDED_RATIO = 0.4;
const EXPANDED_RATIO = 0.7;

function getSheetHeight(state: SheetState) {
  const viewportHeight = window.innerHeight;

  switch (state) {
    case "collapsed":
      return COLLAPSED_HEIGHT;

    case "partially-expanded":
      return viewportHeight * PARTIALLY_EXPANDED_RATIO;

    case "expanded":
      return viewportHeight * EXPANDED_RATIO;
  }
}

export function CourtListSheet({
  courts,
  selectedCourt,
  onSelectCourt,
}: CourtListSheetProps) {
  const [sheetState, setSheetState] = useState<SheetState>("collapsed");

  const [dragHeight, setDragHeight] = useState<number | null>(null);

  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number | null>(null);

  const currentHeight = dragHeight ?? getSheetHeight(sheetState);

  const isDragging = dragHeight !== null;

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartY.current = event.clientY;
    dragStartHeight.current = getSheetHeight(sheetState);

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null || dragStartHeight.current === null) {
      return;
    }

    const deltaY = event.clientY - dragStartY.current;

    const nextHeight = dragStartHeight.current - deltaY;

    const minHeight = COLLAPSED_HEIGHT;
    const maxHeight = window.innerHeight * EXPANDED_RATIO;

    const clampedHeight = Math.min(Math.max(nextHeight, minHeight), maxHeight);

    setDragHeight(clampedHeight);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null || dragStartHeight.current === null) {
      return;
    }

    const finalHeight = currentHeight;

    const states: SheetState[] = [
      "collapsed",
      "partially-expanded",
      "expanded",
    ];

    const closestState = states.reduce((closest, state) => {
      const closestDistance = Math.abs(finalHeight - getSheetHeight(closest));

      const currentDistance = Math.abs(finalHeight - getSheetHeight(state));

      return currentDistance < closestDistance ? state : closest;
    });

    setSheetState(closestState);
    setDragHeight(null);

    dragStartY.current = null;
    dragStartHeight.current = null;

    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    setDragHeight(null);

    dragStartY.current = null;
    dragStartHeight.current = null;

    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleToggle = () => {
    if (sheetState === "collapsed") {
      setSheetState("partially-expanded");
      return;
    }

    if (sheetState === "partially-expanded") {
      setSheetState("expanded");
      return;
    }

    setSheetState("partially-expanded");
  };

  const isExpanded = sheetState === "expanded";
  const isPartiallyExpanded = sheetState === "partially-expanded";

  return (
    <section
      className="absolute right-0 bottom-0 left-0 z-[1000] mx-4 rounded-t-2xl bg-background p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]"
      style={{
        height: `${currentHeight}px`,
        transition: isDragging ? "none" : "height 300ms ease",
      }}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="cursor-grab touch-none select-none active:cursor-grabbing"
      >
        <button
          type="button"
          onClick={handleToggle}
          className="flex w-full flex-col items-center px-4 py-3"
          aria-label={
            isExpanded ? "Court-Liste verkleinern" : "Court-Liste erweitern"
          }
        >
          <span className="mb-2 h-1.5 w-12 rounded-full bg-muted-foreground/30" />

          <div className="flex w-full items-center justify-between">
            <span className="font-semibold">{courts.length} Courts</span>

            <span className="text-sm text-muted-foreground">
              {isExpanded
                ? "Verkleinern"
                : isPartiallyExpanded
                  ? "Erweitern"
                  : "Erweitern"}
            </span>
          </div>
        </button>
      </div>

      {(isExpanded || isPartiallyExpanded) && (
        <div className="h-[calc(100%-76px)] overflow-y-auto px-4 pb-6">
          <div className="space-y-3">
            {courts.map((court) => {
              const isSelected = selectedCourt?.id === court.id;

              return (
                <button
                  key={court.id}
                  type="button"
                  onClick={() => onSelectCourt(court)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{court.name}</h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {court.type} · {court.hoops_count} Körbe
                      </p>
                    </div>

                    <span className="shrink-0 text-xs text-muted-foreground">
                      {court.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
