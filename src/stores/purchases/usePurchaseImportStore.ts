"use client"

import { createJSONStorage, persist } from 'zustand/middleware'
import { create } from 'zustand'

import type { PurchaseImportDraft, PurchaseImportResponse, PurchaseImportSummary, PurchaseImportWarning } from '@/types/purchases-import'

type State = {
  importedPurchase: PurchaseImportDraft | null
  summary: PurchaseImportSummary | null
  warnings: PurchaseImportWarning[]
  status: PurchaseImportResponse['status'] | null
}

type Actions = {
  setImportResult: (result: PurchaseImportResponse) => void
  clearImportResult: () => void
}

const initialState: State = {
  importedPurchase: null,
  summary: null,
  warnings: [],
  status: null,
}

const storage = typeof window === 'undefined' ? undefined : createJSONStorage(() => sessionStorage)

export const usePurchaseImportStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...initialState,
      setImportResult: (result) =>
        set({
          importedPurchase: result.purchase,
          summary: result.summary,
          warnings: result.warnings,
          status: result.status,
        }),
      clearImportResult: () => set(initialState),
    }),
    {
      name: 'purchase-import-result',
      storage,
      partialize: (state) => ({
        importedPurchase: state.importedPurchase,
        summary: state.summary,
        warnings: state.warnings,
        status: state.status,
      }),
    }
  )
)
