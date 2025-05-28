"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Interface for question structure (from parent settings)
interface CustomQuestion {
  id: number;
  question: string;
  answerType: string; // e.g., 'Yes/No', 'Text', 'Number', 'Date'
}

// Interface for answer structure (managed by parent)
interface CustomQuestionAnswer {
  id: number; // Matches the question ID
  question: string; // The question text (for reference)
  answer: string | boolean | number | Date | null; // Store the actual answer
  answerType: string; // Type like 'Text', 'Yes/No', 'Number', 'Date'
}

// Updated Props to receive state and handlers from parent
interface CustomQuestionsPageProps {
  questions: CustomQuestion[];
  answers: CustomQuestionAnswer[];
  onAnswerChange: (id: number, question: string, answerType: string, answer: string | boolean | number | Date | null) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function CustomQuestionsPage({
  questions, 
  answers, 
  onAnswerChange, 
  onNext, 
  onPrevious 
}: CustomQuestionsPageProps) {

  // Helper to get the answer for a specific question ID
  const getAnswer = (questionId: number) => {
    return answers.find(a => a.id === questionId)?.answer ?? null;
  }

  // No internal state or fetching needed anymore
  // const [customQuestions, setCustomQuestions] = useState<CustomQuestionAnswer[]>([])
  // const [isLoading, setIsLoading] = useState(true)
  // const [error, setError] = useState<string | null>(null)

  // useEffect(() => { ... // Removed fetching logic }, [])

  // Handle answer change locally and call parent handler
  // Note: We pass the full question details needed by the parent's handler
  const handleLocalAnswerChange = (
    questionId: number, 
    questionText: string, // Pass text
    answerType: string, // Pass type
    answer: string | boolean | number | Date | null
  ) => {
    onAnswerChange(questionId, questionText, answerType, answer); // Call parent handler
  }

  return (
    <div className="dark">
      <h1 className="mb-6 text-2xl font-bold">Custom Questions</h1>
      <p className="mb-6 text-muted-foreground">
        Please answer the following questions required by the property manager.
      </p>

      <Card className="overflow-hidden border shadow-sm border-border bg-background/5">
        <CardContent className="p-6">
          {/* Remove loading/error states, rely on parent */} 
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No custom questions have been configured.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question) => {
                const currentAnswer = getAnswer(question.id);
                return (
                  <div key={question.id} className="space-y-2">
                    <Label htmlFor={`question-${question.id}`} className="text-sm font-medium">
                      {question.question}
                      <span className="text-destructive ml-1">*</span>
                    </Label>

                    {question.answerType === "Yes/No" ? (
                      <RadioGroup
                        className="flex gap-4"
                        // Use currentAnswer derived from props
                        value={currentAnswer === true ? "yes" : currentAnswer === false ? "no" : undefined}
                        onValueChange={(value: string) => {
                          handleLocalAnswerChange(
                            question.id, 
                            question.question, 
                            question.answerType,
                            value === "yes" ? true : value === "no" ? false : null
                          )
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id={`q${question.id}-yes`} />
                          <Label htmlFor={`q${question.id}-yes`}>Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id={`q${question.id}-no`} />
                          <Label htmlFor={`q${question.id}-no`}>No</Label>
                        </div>
                      </RadioGroup>
                    ) : question.answerType === "Text" ? (
                      <Input
                        id={`question-${question.id}`}
                        placeholder="Enter your answer"
                        className="bg-background/10 border-border"
                        // Use currentAnswer derived from props
                        value={(currentAnswer as string) || ""}
                        onChange={(e) => handleLocalAnswerChange(question.id, question.question, question.answerType, e.target.value)}
                      />
                    ) : question.answerType === "Number" ? (
                      <Input
                        id={`question-${question.id}`}
                        type="number"
                        placeholder="Enter a number"
                        className="bg-background/10 border-border"
                        // Use currentAnswer derived from props
                        value={(currentAnswer as string) || ""}
                        onChange={(e) => handleLocalAnswerChange(question.id, question.question, question.answerType, e.target.value)}
                      />
                    ) : question.answerType === "Date" ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id={`question-${question.id}`}
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal bg-background/10 border-border",
                              // Use currentAnswer derived from props
                              !currentAnswer && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {/* Use currentAnswer derived from props */}
                            {currentAnswer ? (
                              format(new Date(currentAnswer as string), "PPP")
                            ) : (
                              <span>Select date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            // Use currentAnswer derived from props
                            selected={currentAnswer ? new Date(currentAnswer as string) : undefined}
                            onSelect={(date) => handleLocalAnswerChange(question.id, question.question, question.answerType, date ? format(date, "yyyy-MM-dd") : null)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Textarea // Default to Textarea if type unknown
                        id={`question-${question.id}`}
                        className="min-h-[100px] bg-background/10 border-border"
                        placeholder="Enter your answer"
                        // Use currentAnswer derived from props
                        value={(currentAnswer as string) || ""}
                        onChange={(e) => handleLocalAnswerChange(question.id, question.question, question.answerType, e.target.value)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
          <Button onClick={onNext}>Next</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

