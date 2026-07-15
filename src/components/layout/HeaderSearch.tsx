import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  contactRowKey,
  filterContactsByQuery,
  type DirectoryContact,
} from "@/lib/contactsDirectory";
import { useContactsDirectory } from "@/hooks/useContactsDirectory";

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 12;

type HeaderSearchProps = {
  className?: string;
  placeholder?: string;
  /** Sync input with URL search `q` on the contacts page */
  urlQuery?: string;
};

function sourceBadge(source: DirectoryContact["source"]): string {
  if (source === "queue") return "Queue";
  return "Database";
}

export function HeaderSearch({
  className,
  placeholder = "Search directory, companies, or queue…",
  urlQuery = "",
}: HeaderSearchProps) {
  const navigate = useNavigate();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { contacts, isLoading } = useContactsDirectory();
  const [query, setQuery] = useState(urlQuery);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [modKeyLabel, setModKeyLabel] = useState("Ctrl");

  useEffect(() => {
    const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
    setModKeyLabel(isApple ? "⌘" : "Ctrl");
  }, []);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const trimmedQuery = query.trim();
  const hasMinQuery = trimmedQuery.length >= MIN_QUERY_LENGTH;

  const suggestions = useMemo(
    () => filterContactsByQuery(contacts, query).slice(0, MAX_RESULTS),
    [contacts, query],
  );

  /** Open panel when query/urlQuery or loaded contacts change and search is active. */
  useEffect(() => {
    if (hasMinQuery) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [hasMinQuery, urlQuery, contacts.length, isLoading]);

  const showPanel = open && hasMinQuery;

  useEffect(() => {
    setActiveIndex(0);
  }, [query, suggestions.length]);

  useEffect(() => {
    const onGlobalShortcut = (event: globalThis.KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") return;
      if (event.altKey || event.shiftKey) return;

      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
      if (query.trim().length >= MIN_QUERY_LENGTH) {
        setOpen(true);
      }
    };

    window.addEventListener("keydown", onGlobalShortcut);
    return () => window.removeEventListener("keydown", onGlobalShortcut);
  }, [query]);

  useEffect(() => {
    if (!showPanel) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showPanel]);

  const selectContact = (contact: DirectoryContact) => {
    const rowKey = contactRowKey(contact);
    const q = contact.name.trim() || contact.company.trim() || contact.email.trim();
    setQuery(q);
    setOpen(false);
    inputRef.current?.blur();
    void navigate({
      to: "/contacts",
      search: { q: q || undefined, highlight: rowKey },
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showPanel || suggestions.length === 0) {
      if (event.key === "Escape") setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const picked = suggestions[activeIndex];
      if (picked) selectContact(picked);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <form
        className="relative w-full"
        onSubmit={(e) => {
          e.preventDefault();
          if (suggestions[activeIndex]) {
            selectContact(suggestions[activeIndex]);
            return;
          }
          const q = query.trim();
          if (q.length >= MIN_QUERY_LENGTH) {
            void navigate({ to: "/contacts", search: { q } });
            setOpen(false);
          }
        }}
      >
        <Search
          className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={inputRef}
          id="header-search"
          name="header-search"
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={showPanel ? listboxId : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (hasMinQuery) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="h-9 w-full rounded-md border-border/60 bg-white pl-9 pr-14 text-sm text-foreground shadow-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-border/80 dark:bg-white dark:focus-visible:bg-white sm:pr-16"
          aria-label="Search contact directory, companies, and sync queue"
          aria-keyshortcuts="Control+K Meta+K"
        />
        <kbd
          className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground sm:inline-flex"
          aria-hidden
        >
          <span>{modKeyLabel}</span>
          <span>K</span>
        </kbd>
      </form>

      {showPanel ? (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-border/70 bg-popover text-popover-foreground shadow-lg"
          role="presentation"
        >
          <div
            id={listboxId}
            role="listbox"
            aria-label="Contact search results"
            className="max-h-56 overflow-y-auto overscroll-contain py-1"
          >
            {isLoading && contacts.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                Loading contacts…
              </div>
            ) : suggestions.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">No contacts match.</p>
            ) : (
              suggestions.map((contact, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={contactRowKey(contact)}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                      isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted/60",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectContact(contact)}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-xs font-semibold text-white",
                        contact.accent,
                      )}
                    >
                      {contact.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{contact.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {contact.company || "No company"}
                        {contact.email ? ` · ${contact.email}` : ""}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {sourceBadge(contact.source)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
