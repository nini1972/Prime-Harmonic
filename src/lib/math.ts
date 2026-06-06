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

