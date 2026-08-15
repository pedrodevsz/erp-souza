import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/toast-provider'
import { useSales } from '@/hooks/sales/useSales'
import { useSaleStore } from '@/stores/useSaleStore'
import { getFeedbackErrorMessage } from '@/lib/messages/feedback'
import { SalesService } from '@/services/salesService'
import type { SalePaymentPayload } from '@/components/sales/view/register-payment-form'
import type { Sale, SaleHistoryEntry } from '@/types/sale'

type State = {
  sale: Sale | null
  history: SaleHistoryEntry[]
  loading: boolean
  loadedId: string | null
}

export function useSaleViewPage(id: string) {
  const toast = useToast()
  const { findSaleById, addSalePayment } = useSales()
  const [state, setState] = useState<State>({
    sale: null,
    history: [],
    loading: true,
    loadedId: null,
  })

  useEffect(() => {
    let active = true

    async function loadSale() {
      if (!id) {
        if (!active) return
        setState({ sale: null, history: [], loading: false, loadedId: null })
        return
      }

      const [found, entries] = await Promise.all([findSaleById(id), SalesService.getHistory(id)])
      if (!active) return

      setState({
        sale: found,
        history: entries,
        loading: false,
        loadedId: id,
      })
    }

    loadSale()

    return () => {
      active = false
    }
  }, [findSaleById, id])

  const reload = async () => {
    const [found, entries] = await Promise.all([findSaleById(id), SalesService.getHistory(id)])
    setState((current) => ({
      sale: found,
      history: entries,
      loading: false,
      loadedId: current.loadedId,
    }))
  }

  const handleAddPayment = async (saleId: string, payload: SalePaymentPayload) => {
    const targetSaleId = saleId || id
    const updated = await addSalePayment(targetSaleId, payload)
    if (!updated) {
      toast.push({
        title: 'Erro',
        description: getFeedbackErrorMessage(useSaleStore.getState().error, 'Não foi possível registrar o pagamento.'),
        type: 'error',
      })
      return false
    }

    toast.push({ title: 'Sucesso', description: 'Pagamento registrado com sucesso.', type: 'success' })
    await reload()
    return true
  }

  return {
    sale: state.sale,
    history: state.history,
    loading: Boolean(id) && state.loadedId !== id ? true : state.loading,
    handleAddPayment,
  } as const
}
