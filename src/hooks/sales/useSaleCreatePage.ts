import { useState } from 'react'
import { useToast } from '@/components/ui/toast-provider'
import { saleMessages, getFeedbackErrorMessage } from '@/lib/messages/feedback'
import { useSales } from '@/hooks/sales/useSales'
import { useSaleStore } from '@/stores/useSaleStore'
import type { NewSale, Sale } from '@/types/sale'

export function useSaleCreatePage() {
  const toast = useToast()
  const { createSale } = useSales()
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)
  const [saleResultModalOpen, setSaleResultModalOpen] = useState(false)
  const [formResetKey, setFormResetKey] = useState(0)

  const handleSubmit = async (payload: NewSale) => {
    const created = await createSale(payload)
    if (!created) {
      toast.push({
        title: 'Erro',
        description: getFeedbackErrorMessage(useSaleStore.getState().error, 'Não foi possível criar a venda.'),
        type: 'error',
      })
      return
    }

    toast.push({ title: 'Sucesso', description: saleMessages.created, type: 'success' })
    setCompletedSale(created)
    setSaleResultModalOpen(true)
  }

  const handleSaleResultModalChange = (open: boolean) => {
    setSaleResultModalOpen(open)

    if (!open) {
      setCompletedSale(null)
      setFormResetKey((current) => current + 1)
    }
  }

  return {
    handleSubmit,
    completedSale,
    saleResultModalOpen,
    formResetKey,
    setSaleResultModalOpen: handleSaleResultModalChange,
  } as const
}
