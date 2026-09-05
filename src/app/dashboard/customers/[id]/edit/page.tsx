import { CustomerEditPage } from '@/components/customers/add/customer-edit-page'

type Props = {
    params: Promise<{
        id: string
    }>
}

export default async function CustomerEditRoutePage({ params }: Props) {
    const { id } = await params
    return <CustomerEditPage id={id} />
}
