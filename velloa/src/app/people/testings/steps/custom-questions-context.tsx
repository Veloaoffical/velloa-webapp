"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface CustomQuestionAnswer {
  id: number
  question: string
  answer: string | boolean | null
  answerType: string
}

interface CustomQuestionsContextType {
  customQuestions: CustomQuestionAnswer[]
  setCustomQuestions: (questions: CustomQuestionAnswer[]) => void
  updateAnswer: (questionId: number, answer: string | boolean | null) => void
}

const CustomQuestionsContext = createContext<CustomQuestionsContextType | undefined>(undefined)

export function CustomQuestionsProvider({ children }: { children: ReactNode }) {
  const [customQuestions, setCustomQuestions] = useState<CustomQuestionAnswer[]>([])

  const updateAnswer = (questionId: number, answer: string | boolean | null) => {
    setCustomQuestions((prevQuestions) => prevQuestions.map((q) => (q.id === questionId ? { ...q, answer } : q)))
  }

  return (
    <CustomQuestionsContext.Provider value={{ customQuestions, setCustomQuestions, updateAnswer }}>
      {children}
    </CustomQuestionsContext.Provider>
  )
}

export function useCustomQuestions() {
  const context = useContext(CustomQuestionsContext)
  if (context === undefined) {
    throw new Error("useCustomQuestions must be used within a CustomQuestionsProvider")
  }
  return context
}

