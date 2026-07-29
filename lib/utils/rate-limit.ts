const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(identifier: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userRecord = requestCounts.get(identifier);

  if (!userRecord || now > userRecord.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (userRecord.count >= maxRequests) {
    return false;
  }

  userRecord.count += 1;
  return true;
}