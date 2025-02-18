import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND, UNDO_COMMAND, REDO_COMMAND, ElementFormatType } from 'lexical';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Undo, Redo } from 'lucide-react';

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  return (
    <div className="flex items-center gap-1 p-2 border-b">
      <div className="flex items-center gap-1 pr-2 border-r">
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

      <div className="flex items-center gap-1 pl-2 border-l">
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

      <div className="flex items-center gap-1 pl-2 border-l">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          type="button"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          type="button"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 