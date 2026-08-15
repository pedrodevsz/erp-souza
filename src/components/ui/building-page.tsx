import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import Button from "./button";
import { Card, CardContent, CardHeader } from "./card";

export function BuildingPage() {
    return (
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="flex flex-col items-center gap-4 text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500" />

                    <h2 className="text-lg font-semibold">
                        Página em desenvolvimento
                    </h2>

                    <p className="text-sm text-muted-foreground">
                        Em breve você poderá acessar todas as informações desta página.
                    </p>
                </CardHeader>

                <CardContent className="flex justify-center">
                    <Button asChild>
                        <Link href="/dashboard">
                            Voltar ao dashboard
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}