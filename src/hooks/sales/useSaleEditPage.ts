import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import { saleMessages, getFeedbackErrorMessage } from '@/lib/messages/feedback'
import { useSales } from '@/hooks/sales/useSales'
import { useSaleStore } from '@/stores/useSaleStore'
import type { NewSale, Sale } from '@/types/sale'

type State = {
  sale: Sale | null
  loading: boolean
  loadedId: string | null
}

export function useSaleEditPage(id: string) {
  const router = useRouter()
  const toast = useToast()
  const { findSaleById, updateSale } = useSales()
  const [state, setState] = useState<State>({
    sale: null,
    loading: true,
    loadedId: null,
  })

  useEffect(() => {
    let active = true

    async function loadSale() {
      if (!id) {
        if (!active) return
        setState({ sale: null, loading: false, loadedId: null })
        return
      }

      const found = await findSaleById(id)
      if (!active) return

      setState({
        sale: found,
        loading: false,
        loadedId: id,
      })
    }

    loadSale()

    return () => {
      active = false
    }
  }, [findSaleById, id])

  const handleSubmit = async (payload: NewSale) => {
    const updated = await updateSale(id, payload)
    if (!updated) {
      toast.push({
        title: 'Erro',
        description: getFeedbackErrorMessage(useSaleStore.getState().error, saleMessages.notFound),
        type: 'error',
      })
      return
    }

    toast.push({ title: 'Sucesso', description: saleMessages.updated, type: 'success' })
    router.push(`/dashboard/sales/${id}`)
  }

  return {
    sale: state.sale,
    loading: Boolean(id) && state.loadedId !== id ? true : state.loading,
    handleSubmit,
  } as const
}
