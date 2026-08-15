
import { CustomersList } from "../../../components/customers/list/customer-list";
import { ToastProvider } from '@/components/ui/toast-provider'

export default function customersListPage() {
    return (
        <ToastProvider>
            <CustomersList />
        </ToastProvider>
    )
}
