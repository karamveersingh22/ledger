import fs from 'fs/promises';
import path from 'path';
import { User } from '@/models/user_schema';
import { connectdb } from '@/dbconfig/db';

/**
 * Seed initial users from users.json into MongoDB if collection empty.
 * Idempotent: safe to call multiple times.
 */
export async function seedUsers() {
  await connectdb();
  try {
    const existing = await User.countDocuments();
    if (existing > 0) return;
    const usersPath = path.join(process.cwd(), 'users.json');
    const raw = await fs.readFile(usersPath, 'utf-8');
    const users: Array<{ username: string; password: string; role: string }> = JSON.parse(raw);
    if (!Array.isArray(users) || users.length === 0) return;
    const unique: { username: string; password: string; role: string }[] = [];
    const seen = new Set<string>();
    for (const u of users) {
      if (u.username && !seen.has(u.username)) { seen.add(u.username); unique.push(u); }
    }
    if (unique.length) await User.insertMany(unique);
  } catch (err) {
    console.error('seedUsers failed (non-fatal):', err);
  }
}
