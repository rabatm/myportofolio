import type { APIRoute } from 'astro';
import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const prerender = false;

const DATA_FILE = join(process.cwd(), 'src/data/contact.json');

export const GET: APIRoute = async () => {
  const data = await readFile(DATA_FILE, 'utf-8');
  return new Response(data, {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { name, email, message } = body;
  const entries = JSON.parse(await readFile(DATA_FILE, 'utf-8'));
  entries.push({ name, email, message, date: new Date().toISOString() });
  await writeFile(DATA_FILE, JSON.stringify(entries, null, 2));
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
