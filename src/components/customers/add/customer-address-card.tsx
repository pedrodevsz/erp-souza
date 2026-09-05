"use client"

import { useFieldArray, useFormContext } from 'react-hook-form'
import { Button, Label, Input } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import type { CustomerFormValues } from '@/validations/customers/new-client'
import { CUSTOMER_EMPTY_ADDRESS } from '@/lib/customers/customers'

export function CustomerAddressCard() {
    const { control, register, formState: { errors } } = useFormContext<CustomerFormValues>()
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'addresses',
    })

    return (
        <Card>
            <CardHeader className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="text-sm font-semibold text-sky-600">Endereços</CardTitle>
                    <p className="text-sm text-slate-500">Endereço é opcional. Adicione um ou mais apenas se quiser cadastrar.</p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ ...CUSTOMER_EMPTY_ADDRESS })}
                    className="w-full sm:w-auto"
                >
                    + Adicionar endereço
                </Button>
            </CardHeader>

            <CardContent className="space-y-4">
                {fields.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm text-slate-500">Nenhum endereço cadastrado.</div>
                    </div>
                ) : null}

                {fields.map((field, index) => {
                    const addressErrors = errors.addresses?.[index]

                    return (
                        <div key={field.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div className="text-sm font-medium text-slate-700">Endereço {index + 1}</div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => remove(index)}
                                >
                                    Remover
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <Label>CEP</Label>
                                    <Input {...register(`addresses.${index}.zipCode`)} placeholder="Ex.: 01000-000" />
                                    {addressErrors?.zipCode && <p className="text-sm text-red-600">{String(addressErrors.zipCode.message)}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <Label>Rua</Label>
                                    <Input {...register(`addresses.${index}.street`)} placeholder="Ex.: Rua das Flores" />
                                    {addressErrors?.street && <p className="text-sm text-red-600">{String(addressErrors.street.message)}</p>}
                                </div>

                                <div>
                                    <Label>Número</Label>
                                    <Input {...register(`addresses.${index}.number`)} placeholder="Ex.: 123" />
                                    {addressErrors?.number && <p className="text-sm text-red-600">{String(addressErrors.number.message)}</p>}
                                </div>

                                <div>
                                    <Label>Complemento</Label>
                                    <Input {...register(`addresses.${index}.complement`)} placeholder="Ex.: Apto 101, Bloco B" />
                                    {addressErrors?.complement && <p className="text-sm text-red-600">{String(addressErrors.complement.message)}</p>}
                                </div>

                                <div>
                                    <Label>Bairro</Label>
                                    <Input {...register(`addresses.${index}.district`)} placeholder="Ex.: Centro" />
                                    {addressErrors?.district && <p className="text-sm text-red-600">{String(addressErrors.district.message)}</p>}
                                </div>

                                <div>
                                    <Label>Cidade</Label>
                                    <Input {...register(`addresses.${index}.city`)} placeholder="Ex.: São Paulo" />
                                    {addressErrors?.city && <p className="text-sm text-red-600">{String(addressErrors.city.message)}</p>}
                                </div>

                                <div>
                                    <Label>Estado</Label>
                                    <Input {...register(`addresses.${index}.state`)} placeholder="Ex.: SP" maxLength={2} />
                                    {addressErrors?.state && <p className="text-sm text-red-600">{String(addressErrors.state.message)}</p>}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
