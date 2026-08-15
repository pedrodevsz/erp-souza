import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    Receipt,
    Boxes,
    Truck,
    Settings,
} from "lucide-react";

export const navigationItems = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Clientes",
        href: "/dashboard/customers",
        icon: Users,
    },
    {
        label: "Vendas",
        href: "/dashboard/sales",
        icon: ShoppingCart,
    },
    {
        label: "Compras",
        href: "/dashboard/purchases",
        icon: Receipt,
    },
    {
        label: "Estoque",
        href: "/dashboard/stock",
        icon: Boxes,
    },
    {
        label: "Produtos",
        href: "/dashboard/products",
        icon: Package,
    },
    {
        label: "Entregas",
        href: "/dashboard/deliveries",
        icon: Truck,
    },
    {
        label: "Configurações",
        href: "/settings",
        icon: Settings,
        adminOnly: true,
    },
];

export function getVisibleNavigationItems(role: string) {
    return navigationItems.filter((item) => !item.adminOnly || role === 'ADMIN')
}
