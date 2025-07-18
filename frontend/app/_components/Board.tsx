import { useEffect, useState } from "react";
import Stone from "./Stone";
import { Card } from "@/components/ui/card";

type GoCell = 'empty' | 'black' | 'white';

type BoardType = {
  lines: number;
  starPoints: [number, number][];
}

const GO19: BoardType = {
  lines: 19,
  starPoints: [
    [3, 3], [3, 9], [3, 15],
    [9, 3], [9, 9], [9, 15],
    [15, 3], [15, 9], [15, 15]
  ]
};

export default function Board() {
  const BOARD_LINES = GO19.lines;
  const BOARD_STAR_POINTS = GO19.starPoints;

  const BOARD_SIZE = 34;
  const STONE_SIZE = 33;

  const [boardState, setBoardState] = useState<GoCell[][]>(Array.from({ length: BOARD_LINES }, () => Array(BOARD_LINES).fill('empty')));
  const [turn, setTurn] = useState<'black' | 'white'>('black');

  const [gameId, setGameId] = useState<string>('');
  const [isThinkingAI, setIsThinkingAI] = useState(false);

  const startGame = async () => {
    const response = await fetch('/api/go/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error('Failed to start the game');
    }

    const result = await response.json();
    setGameId(result.gameId);
    console.log('Game started:', result);
  }

  useEffect(() => {
    startGame();
  }, []);

  // 바둑돌 놓기
  const placeStone = (x: number, y: number, turn: 'black' | 'white') => {
    if (boardState[y][x] !== 'empty') return;

    setBoardState(prev => {
      const newState = [...prev];
      newState[y][x] = turn;
      return newState;
    });
  };

  const handleUserMove = async (x: number, y: number) => {
    if (isThinkingAI) return; // AI가 생각 중이면 무시
    if (gameId === '') return; // 게임이 시작되지 않았으면 무시
    if (boardState[y][x] !== 'empty') return;

    placeStone(x, y, 'black');
    setIsThinkingAI(true);

    try {
      const response = await fetch('/api/go/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId, x, y }),
      });

      if (!response.ok) {
        throw new Error('Failed to make AI move');
      }

      const data = await response.json();
      const { ai } = data;

      placeStone(ai.x, ai.y, 'white');
    } catch (error) {
      console.error('Error during AI move:', error);
    } finally {
      setIsThinkingAI(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100 p-4">

      {/* 바둑판 */}
      <div className="max-w-4xl mx-auto flex justify-center">
        <Card className="p-8 border-4 border-amber-900 bg-orange-50/95 bg-amber-100 rounded-3xl shadow-2xl">
          <div className="relative">
            {/* 바둑판 배경 */}
            <div
              className="shadow-inner"
              style={{
                width: `${BOARD_LINES * BOARD_SIZE - (BOARD_SIZE / 2)}px`,
                height: `${BOARD_LINES * BOARD_SIZE - (BOARD_SIZE / 2)}px`
              }}
            >
              {/* 격자 lines */}
              <div className="absolute inset-2">
                {/* 세로선 */}
                {Array.from({ length: BOARD_LINES }).map((_, i) => (
                  <div
                    key={`v-${i}`}
                    className="absolute bg-amber-700 opacity-60"
                    style={{
                      left: `${i * BOARD_SIZE}px`,
                      top: '0px',
                      width: '1px',
                      height: '100%'
                    }}
                  />
                ))}
                {/* 가로선 */}
                {Array.from({ length: BOARD_LINES }).map((_, i) => (
                  <div
                    key={`h-${i}`}
                    className="absolute bg-amber-700 opacity-60"
                    style={{
                      top: `${i * BOARD_SIZE}px`,
                      left: '0px',
                      height: '1px',
                      width: '100%'
                    }}
                  />
                ))}

                {/* 화점 (9개의 점) */}
                {BOARD_STAR_POINTS.map(([row, col]) => (
                  <div
                    key={`star-${row}-${col}`}
                    className="absolute w-2 h-2 bg-amber-800 rounded-full"
                    style={{
                      left: `${col * BOARD_SIZE - 4}px`,
                      top: `${row * BOARD_SIZE - 4}px`
                    }}
                  />
                ))}
              </div>

              {/* 바둑돌 배치 영역 */}
              <div className="absolute inset-2">
                {boardState.map((row, rowIndex) =>
                  row.map((stone, colIndex) => (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      className="absolute flex items-center justify-center hover:bg-amber-500/30 rounded-full transition-colors hover:border-1 hover:border-amber-700/30 duration-200"
                      style={{
                        left: `${colIndex * BOARD_SIZE - (STONE_SIZE / 2)}px`,
                        top: `${rowIndex * BOARD_SIZE - (STONE_SIZE / 2)}px`,
                        width: `${STONE_SIZE}px`,
                        height: `${STONE_SIZE}px`
                      }}
                      onClick={() => handleUserMove(colIndex, rowIndex)}
                    >
                      {stone === 'black' && <Stone color="black" size={STONE_SIZE} />}
                      {stone === 'white' && <Stone color="white" size={STONE_SIZE} />}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}