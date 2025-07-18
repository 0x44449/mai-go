interface StoneProps {
  color: 'black' | 'white';
  size: number;
}

export default function Stone(props: StoneProps) {
  const { color, size } = props;

  return (
    <div className={`relative`} style={{ width: `${size}px`, height: `${size}px` }}>
      <div className={`w-full h-full rounded-full border-2 border-amber-900 ${color === 'black' ? 'bg-amber-900' : 'bg-orange-50'} shadow-md flex items-center justify-center`}>
        {/* 눈 */}
        <div className="flex space-x-0.5">
          <div className={`w-0.5 h-1 rounded-full ${color === 'black' ? 'bg-white' : 'bg-amber-900'}`}></div>
          <div className={`w-0.5 h-1 rounded-full ${color === 'black' ? 'bg-white' : 'bg-amber-900'}`}></div>
        </div>
        {/* 입 */}
        <div className={`absolute bottom-1 w-1 h-0.5 rounded-full bg-orange-400`}></div>
      </div>
      {/* 볼 */}
      <div className="absolute top-1 left-0.5 w-0.5 h-0.5 bg-pink-300 rounded-full opacity-60"></div>
      <div className="absolute top-1 right-0.5 w-0.5 h-0.5 bg-pink-300 rounded-full opacity-60"></div>
    </div>
  )
}