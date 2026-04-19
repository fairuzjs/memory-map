import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

interface Props {
    params: Promise<{ username: string }>
}

export default async function UsernameRedirectPage({ params }: Props) {
    const { username } = await params

    const user = await prisma.user.findUnique({
        where: { username: username.toLowerCase() },
        select: { id: true },
    })

    if (!user) {
        notFound()
    }

    redirect(`/profile/${user.id}`)
}
