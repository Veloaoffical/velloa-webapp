import { useId } from "react";
import { SidebarInput } from "@/components/ui/sidebar";
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";
import { Command, Search } from "lucide-react";

interface SearchFormProps extends React.ComponentProps<"form"> {
  onSearchClick: () => void;
}

export function SearchForm({ onSearchClick, ...props }: SearchFormProps) {
  const id = useId();

  return (
    <form {...props} onClick={(e) => {
      e.preventDefault();
      onSearchClick();
    }}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <div className="relative cursor-pointer">
            <SidebarInput 
              readOnly
              id={id} 
              className="ps-9 pe-9 cursor-pointer" 
              aria-label="Search" 
              placeholder="Quick Search..."
              onClick={(e) => {
                e.preventDefault();
                onSearchClick();
              }}
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-muted-foreground/60">
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