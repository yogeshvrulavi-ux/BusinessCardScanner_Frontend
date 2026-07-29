import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { COUNTRIES, formatCountryOption, findCountryByDialCode } from "@/constants/countries";
import { cn } from "@/lib/utils";

type CountryCodeSelectProps = {
  value: string;
  onChange: (countryCode: string, countryName: string) => void;
  disabled?: boolean;
  error?: string;
};

export function CountryCodeSelect({
  value,
  onChange,
  disabled = false,
  error,
}: CountryCodeSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => (value ? findCountryByDialCode(value) : undefined),
    [value],
  );

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">Country</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                "h-11 w-full justify-between rounded-md border-border/60 bg-background px-3 font-normal shadow-none hover:bg-background",
                !selected && "text-muted-foreground",
                error && "border-destructive/60",
                value && "pr-9",
              )}
            >
              <span className="truncate">
                {selected
                  ? formatCountryOption(selected)
                  : value
                    ? value
                    : "Search country code…"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          {value ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Clear country"
              disabled={disabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange("", "");
              }}
              className={cn(
                "absolute right-8 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground/70",
                disabled ? "cursor-default opacity-30" : "hover:bg-muted hover:text-foreground",
              )}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country or dial code…" />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {COUNTRIES.map((country) => (
                  <CommandItem
                    key={`${country.iso}-${country.dialCode}`}
                    value={`${country.name} ${country.dialCode} ${country.iso}`}
                    onSelect={() => {
                      onChange(country.dialCode, country.name);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected?.iso === country.iso && selected?.dialCode === country.dialCode
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <span className="mr-2">{country.flag}</span>
                    <span className="flex-1 truncate">{country.name}</span>
                    <span className="ml-2 text-muted-foreground">{country.dialCode}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
