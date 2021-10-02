
export function deltaInterp(current: number, target: number, speed: number, delta: number): number {
  return Math.abs(current - target) < 0.000001 ? target : current + (target - current) * (1 - Math.exp(-speed * delta));
}
