import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND, UNDO_COMMAND, REDO_COMMAND, ElementFormatType } from 'lexical';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, Sparkles } from 'lucide-react';

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  return (
    <div className="flex items-center gap-1 p-2 border-b">
      <div className="flex items-center gap-1 pr-2 border-r">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          type="button"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          type="button"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 pl-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          type="button"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
          type="button"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
          type="button"
        >
          <Underline className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 pl-2 ml-2 border-l">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left' as ElementFormatType)}
          type="button"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center' as ElementFormatType)}
          type="button"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right' as ElementFormatType)}
          type="button"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 pl-2 ml-2 border-l">
        <Button
          variant="ghost"
          className="h-8 px-3 flex items-center gap-2 group"
          type="button"
        >
          <Sparkles className="h-4 w-4 text-pink-500" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 font-medium">
            Ask AI
          </span>
        </Button>
      </div>
    </div>
  );
} 