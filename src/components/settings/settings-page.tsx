"use client"

import { useState } from 'react'

import { PageHeader } from '@/components/page-header'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { EmployeeManagementDialog } from './employee-management-section'

export function SettingsPage() {
  const [employeesDialogOpen, setEmployeesDialogOpen] = useState(false)

  return (
    <div className="space-y-8">
      <PageHeader title="Configurações" description="Gerencie dados auxiliares do sistema." />

      <section className="rounded-[28px]">
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Funcionários</CardTitle>
            <CardDescription className="text-sm text-slate-500">Gerencie a equipe, os cargos e o status dos funcionários.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => setEmployeesDialogOpen(true)}>
              Gerenciar funcionários
            </Button>
          </CardContent>
        </Card>
      </section>

      <EmployeeManagementDialog open={employeesDialogOpen} onOpenChange={setEmployeesDialogOpen} />
    </div>
  )
}
