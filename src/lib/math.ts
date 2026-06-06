export function isPrime(n: number): boolean {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i = i + 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

export function getPrimes(limit: number): number[] {
  const primes: number[] = [];
  for (let i = 2; i <= limit; i++) {
    if (isPrime(i)) primes.push(i);
  }
  return primes;
}

export function getUlamCoordinates(n: number): [number, number, number] {
  // Classic 2D spiral expanded to 3D
  // Using polar coordinates for a more "harmonic" 3D spiral
  const angle = Math.sqrt(n) * Math.PI * 2;
  const radius = Math.sqrt(n);
  const height = n * 0.01;
  return [
    Math.cos(angle) * radius,
    height,
    Math.sin(angle) * radius
  ];
}

export function isMersenne(p: number): boolean {
  if (!isPrime(p)) return false;
  // p = 2^n - 1
  let n = 2;
  let val = 0;
  while (val < p) {
    val = Math.pow(2, n) - 1;
    if (val === p) return true;
    n++;
  }
  return false;
}

export function isTwinPrime(p: number): boolean {
  return isPrime(p) && (isPrime(p - 2) || isPrime(p + 2));
}

export function getPrimeType(p: number): string[] {
  const types: string[] = [];
  if (isMersenne(p)) types.push("Mersenne");
  if (isTwinPrime(p)) types.push("Twin");
  if (p === 2) types.push("Even Prime");
  return types;
}

export interface PrimeGapInfo {
  gap: number;
  probability: number; // empirical frequency percentage
}

export function getPrimeGapInfo(p: number | null, limit: number): PrimeGapInfo {
  const primes = getPrimes(limit);
  if (primes.length < 2) {
    return { gap: 0, probability: 0 };
  }

  // Calculate all empirical gaps in the current horizon
  const gaps: number[] = [];
  const gapCounts: { [key: number]: number } = {};
  for (let i = 0; i < primes.length - 1; i++) {
    const g = primes[i + 1] - primes[i];
    gaps.push(g);
    gapCounts[g] = (gapCounts[g] || 0) + 1;
  }

  if (!p) {
    // If no active prime is selected, return the average gap statistics
    const avgGap = gaps.reduce((sum, val) => sum + val, 0) / gaps.length;
    // Probability of the average/most common gap
    const mostCommonGap = Object.keys(gapCounts).reduce((a, b) => 
      gapCounts[Number(a)] > gapCounts[Number(b)] ? a : b
    );
    const prob = (gapCounts[Number(mostCommonGap)] / gaps.length) * 100;
    return { gap: Math.round(avgGap * 10) / 10, probability: prob };
  }

  // Find the exact gap for the selected active prime
  // First, find the next prime after p
  let nextP = p + 1;
  while (!isPrime(nextP)) {
    nextP++;
  }
  const activeGap = nextP - p;

  // Empirical probability of this gap occurring in our horizon
  const count = gapCounts[activeGap] || 0;
  const probability = gaps.length > 0 ? (count / gaps.length) * 100 : 0;

  return { gap: activeGap, probability };
}

