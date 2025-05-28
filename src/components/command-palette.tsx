'use client';

import { Command } from 'cmdk';
import { createContext, useContext, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Home, Plus, Search } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface CommandPaletteContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | null>(null);

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down, true);
    return () => document.removeEventListener('keydown', down, true);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  );
}

function CommandPalette() {
  const { open, setOpen } = useCommandPalette();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-[20%] -translate-x-1/2 z-50">
          <Dialog.Title className="sr-only">Command Menu</Dialog.Title>
          <Command
            className={cn(
              'w-[90vw] max-w-[640px] rounded-xl',
              'bg-background border shadow-lg'
            )}
            shouldFilter={true}
          >
            <div className="border-b">
              <div className="flex items-center px-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Command.Input 
                  className="flex-1 border-none bg-transparent px-2 py-5 text-foreground outline-none placeholder:text-muted-foreground" 
                  placeholder="What do you need?"
                  autoFocus
                />
              </div>
            </div>

            <Command.List className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>

              <div className="px-2 py-3">
                <p className="text-xs font-medium text-muted-foreground">Home</p>
                <Command.Group className="mt-2">
                  <Command.Item className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer aria-selected:bg-accent">
                    <Home className="h-4 w-4" />
                    <span>Go to Home</span>
                  </Command.Item>
                </Command.Group>
              </div>

              <div className="px-2 py-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Properties</p>
                <Command.Group>
                  <Command.Item className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer aria-selected:bg-accent">
                    <Search className="h-4 w-4" />
                    <span>Search Projects...</span>
                  </Command.Item>
                  <Command.Item className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer aria-selected:bg-accent">
                    <Plus className="h-4 w-4" />
                    <span>Create New Project...</span>
                  </Command.Item>
                </Command.Group>
              </div>

              <div className="px-2 py-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Leases</p>
                <Command.Group>
                  <Command.Item className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer aria-selected:bg-accent">
                    <Search className="h-4 w-4" />
                    <span>Search Teams...</span>
                    <div className="ml-auto flex items-center gap-2">
                    </div>
                  </Command.Item>
                  <Command.Item className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer aria-selected:bg-accent">
                    <Plus className="h-4 w-4" />
                    <span>Create New Lease...</span>
                  </Command.Item>
                </Command.Group>
              </div>

              <div className="px-2 py-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Tasks & Maintenance</p>
                <Command.Group>
                <Command.Item className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer aria-selected:bg-accent">
                    <Search className="h-4 w-4" />
                    <span>Search Tasks...</span>
                  </Command.Item>
                <Command.Item className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer aria-selected:bg-accent">
                    <Plus className="h-4 w-4" />
                    <span>Add Task...</span>
                  </Command.Item>
               
                </Command.Group>
              </div>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}