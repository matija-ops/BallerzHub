import { useState } from "react";
import type { FormEvent } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CourtSearchProps {
  onSearch: (query: string) => Promise<void>;
  isSearching: boolean;
}

export function CourtSearch({ onSearch, isSearching }: CourtSearchProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    await onSearch(trimmedQuery);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-12 w-full min-w-0 items-center rounded-xl bg-white/30 px-3 shadow-lg sm:w-[480px]"
    >
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Ort oder Stadt weltweit suchen ..."
        disabled={isSearching}
        className="court-search-input !bg-transparent h-full flex-1 border-0 px-2 text-base shadow-none focus-visible:ring-0"
      />

      <Button
        type="submit"
        size="icon"
        disabled={isSearching}
        aria-label="Ort suchen"
        className="h-8 w-8 shrink-0 rounded-xl"
      >
        <Search className="h-5 w-5" />
      </Button>
    </form>
  );
}
