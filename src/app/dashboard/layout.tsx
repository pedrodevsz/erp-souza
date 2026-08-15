import { ToastProvider } from "@/components/ui/toast-provider";
import { AppShell } from "@/features/layout/app-shell";
import { requireCurrentUser } from '@/server/auth/guards'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const currentUser = await requireCurrentUser()

    return (
        <AppShell currentUser={currentUser}>
            <ToastProvider>{children}</ToastProvider>
        </AppShell>
    );
}
