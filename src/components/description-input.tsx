import { useId, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import type { InputHTMLAttributes } from "react"

export interface DescriptionInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

function DescriptionInput({ value, onChange, className, ...props }: DescriptionInputProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Track previous value for focus management
  const prevValueRef = useRef(value)
  
  // Maintain focus after state updates
  useEffect(() => {
    // Only try to refocus if value has changed and input was already focused
    if (prevValueRef.current !== value && 
        inputRef.current && 
        document.activeElement === inputRef.current) {
      // Get current cursor position
      const cursorPosition = inputRef.current.selectionStart
      
      // Preserve selection after React re-renders the component
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          // Try to restore cursor to the end of the input
          const newPosition = cursorPosition !== null ? cursorPosition : value.length
          inputRef.current.setSelectionRange(newPosition, newPosition)
        }
      })
    }
    
    // Update previous value reference
    prevValueRef.current = value
  }, [value])
  
  return (
    <div className="*:not-first:mt-2">
      <Input
        id={id}
        ref={inputRef}
        placeholder="Description"
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value === null || e.target.value === undefined ? '' : e.target.value)}
        className={className}
        {...props}
      />
    </div>
  )
}

export default DescriptionInput;
