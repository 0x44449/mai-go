import { getOrCreateGtpClient } from '@/lib/gtp-client-store';
import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from "uuid";

interface GoStartRequest {
  gameId?: string; // Game ID
}

export async function POST(request: NextRequest) {
  const { gameId }: GoStartRequest = await request.json();
  const id = gameId || uuidv4();

  const client = getOrCreateGtpClient(id);
  // await client.waitForReady();

  await client.setBoardSize(19);
  console.log(`gameId: ${id}, set board size to 19`);

  await client.clearBoard();
  console.log(`gameId: ${id}, cleared board`);

  await client.setRules("tromp-taylor");
  console.log(`gameId: ${id}, set rules to tromp-taylor`);

  await client.setKomi(7.5);
  console.log(`gameId: ${id}, set komi to 7.5`);

  await client.configureDifficulty({
    maxVisits: 10,
    maxTime: 0.2,
    playoutDoublingAdvantage: -1,
  });
  console.log(`gameId: ${id}, configured difficulty`);

  return NextResponse.json({ gameId: id });
}