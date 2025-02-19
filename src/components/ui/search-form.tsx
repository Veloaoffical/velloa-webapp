import { useId, useEffect, useRef } from "react";
import { SidebarInput } from "@/components/ui/sidebar";
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";
import { Command, Search } from "lucide-react";

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <form {...props}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <div className="relative">
            <SidebarInput 
              ref={inputRef}
              id={id} 
              className="ps-9 pe-9" 
              aria-label="Search" 
              placeholder="Quick Search..."
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-muted-foreground/60 peer-disabled:opacity-50">
              <Search size={20} aria-hidden="true" />
            </div>
            <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-2 text-muted-foreground">
              <kbd className="inline-flex items-center gap-0 rounded bg-input px-1.5 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                <Command className="h-3 w-3 translate-y-[0.5px]" />
                <span className="translate-y-[0.5px]">K</span>
              </kbd>
            </div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  );
}