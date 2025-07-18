function coordsToGtp(x: number, y: number): string {
  // A..T (I 생략)
  const col = String.fromCharCode(
    "A".charCodeAt(0) + (x >= 8 ? x + 1 : x)
  );
  const row = (y + 1).toString();
  return `${col}${row}`;
}

function gtpToCoords(vertex: string): { x: number; y: number } {
  let colChar = vertex[0];
  let x = colChar.charCodeAt(0) - "A".charCodeAt(0);
  if (colChar >= "I") x -= 1;
  const y = parseInt(vertex.slice(1), 10) - 1;
  return { x, y };
}

export const gtpUtil = {
  coordsToGtp,
  gtpToCoords
};