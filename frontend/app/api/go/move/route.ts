import { gtpUtil } from '@/lib/gpt-util';
import { getOrCreateGtpClient } from '@/lib/gtp-client-store';
import { NextRequest, NextResponse } from 'next/server';


interface GoMoveRequest {
  gameId: string; // Game ID
  x: number; // X coordinate (0-18)
  y: number; // Y coordinate (0-18)
}

export async function POST(request: NextRequest) {
  const { gameId, x, y }: GoMoveRequest = await request.json();
  const client = getOrCreateGtpClient(gameId);

  const mv = gtpUtil.coordsToGtp(x, y);
  await client.play("B", mv);

  const aiMv = await client.genmove("W");
  const { x: ax, y: ay } = gtpUtil.gtpToCoords(aiMv);
  const json = {
    gameId,
    player: { x, y },
    ai: { x: ax, y: ay },
  }
  return NextResponse.json(json);
}