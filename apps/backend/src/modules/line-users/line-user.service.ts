import { upsertLineUser } from './line-user.repository.js';

export async function handleUserFollow(lineUserId: string): Promise<void> {
  await upsertLineUser(lineUserId);
}
