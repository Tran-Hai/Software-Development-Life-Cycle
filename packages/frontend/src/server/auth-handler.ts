import { verifyAccessToken, JwtPayload } from './auth';

export function getAuthUser(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}
