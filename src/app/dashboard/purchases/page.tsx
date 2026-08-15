"use client"

import React from 'react'
import { PageHeader } from '@/components/page-header'
import { PurchaseList } from '@/components/purchases/list/purchase-list'
import { ToastProvider } from '@/components/ui/toast-provider'

export default function PurchasesPage() {
    return (
        <ToastProvider>
            <div>
                <PageHeader title="Compras" description="Gerencie suas compras" />
                <div className="p-6">
                    <PurchaseList />
                </div>
            </div>
        </ToastProvider>
    )
}
