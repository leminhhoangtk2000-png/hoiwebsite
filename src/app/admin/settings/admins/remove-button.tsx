
'use client'

import { removeAdmin } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTransition } from 'react'

export function RemoveAdminButton({ adminId }: { adminId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleRemove = async () => {
        if (!confirm('Are you sure you want to revoke admin access for this user?')) return;

        startTransition(async () => {
            const result = await removeAdmin(adminId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Admin access revoked');
            }
        });
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleRemove}
            disabled={isPending}
        >
            <Trash2 className="w-4 h-4" />
        </Button>
    )
}
