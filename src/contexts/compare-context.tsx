"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"

export interface CompareSlot {
  ticker: string
  name: string
  market: string
}

interface CompareState {
  slots: CompareSlot[]
}

type CompareAction =
  | { type: "ADD"; payload: CompareSlot }
  | { type: "REMOVE"; ticker: string }
  | { type: "CLEAR" }
  | { type: "INIT"; slots: CompareSlot[] }

const MAX_SLOTS = 4
const SESSION_KEY = "compare-slots"

function reducer(state: CompareState, action: CompareAction): CompareState {
  switch (action.type) {
    case "ADD": {
      if (state.slots.some((s) => s.ticker === action.payload.ticker)) return state
      if (state.slots.length >= MAX_SLOTS) return state
      return { slots: [...state.slots, action.payload] }
    }
    case "REMOVE":
      return { slots: state.slots.filter((s) => s.ticker !== action.ticker) }
    case "CLEAR":
      return { slots: [] }
    case "INIT":
      return { slots: action.slots }
    default:
      return state
  }
}

interface CompareContextValue {
  compareSlots: CompareSlot[]
  addToCompare: (ticker: string, name: string, market: string) => void
  removeFromCompare: (ticker: string) => void
  clearCompare: () => void
  isInCompare: (ticker: string) => boolean
}

const CompareContext = createContext<CompareContextValue | null>(null)

export function CompareProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { slots: [] })

  // sessionStorage에서 복원
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) {
        const slots = JSON.parse(stored) as CompareSlot[]
        if (Array.isArray(slots) && slots.length > 0) {
          dispatch({ type: "INIT", slots })
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // sessionStorage 동기화
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.slots))
    } catch {
      // ignore
    }
  }, [state.slots])

  function addToCompare(ticker: string, name: string, market: string) {
    dispatch({ type: "ADD", payload: { ticker, name, market } })
  }

  function removeFromCompare(ticker: string) {
    dispatch({ type: "REMOVE", ticker })
  }

  function clearCompare() {
    dispatch({ type: "CLEAR" })
  }

  function isInCompare(ticker: string) {
    return state.slots.some((s) => s.ticker === ticker)
  }

  return (
    <CompareContext.Provider value={{ compareSlots: state.slots, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error("useCompare must be used within CompareProvider")
  return ctx
}
