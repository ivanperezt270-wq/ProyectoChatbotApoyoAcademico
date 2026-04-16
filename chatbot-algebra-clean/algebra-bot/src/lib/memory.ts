import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function getMemories(userId: string) {
  const memories = await prisma.memory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10
  })

  return memories.map(m => m.content).join("\n")
}

export async function saveMemory(userId: string, content: string) {
  await prisma.memory.create({
    data: {
      userId,
      content
    }
  })
}