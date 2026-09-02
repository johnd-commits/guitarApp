export function LevelMeter({ rms }: { rms: number }) {
  const fill = Math.min(1, rms / 0.15)

  return (
    <div
      className="h-4 overflow-hidden rounded-full bg-surface ring-1 ring-line"
      role="meter"
      aria-label="Input level"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(fill * 100)}
    >
      <div
        className="h-full rounded-full bg-amber transition-[width] duration-75"
        style={{ width: `${fill * 100}%` }}
      />
    </div>
  )
}
