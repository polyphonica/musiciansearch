import { prisma } from "@/lib/prisma";

export async function hasBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const block = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });
  return block !== null;
}

/** A block is recorded one-directionally but enforced both ways: neither
 * party can message the other once either has blocked the other. */
export async function isBlockedEitherWay(userIdA: string, userIdB: string): Promise<boolean> {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userIdA, blockedId: userIdB },
        { blockerId: userIdB, blockedId: userIdA },
      ],
    },
  });
  return block !== null;
}

/** All user ids blocking, or blocked by, the given user -- for excluding
 * both directions from that user's own search results. */
export async function blockedUserIds(userId: string): Promise<string[]> {
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  return Array.from(new Set(blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId))));
}
