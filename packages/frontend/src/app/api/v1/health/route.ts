import { NextRequest } from 'next/server';
import { successResponse } from '@/server/utils';

export async function GET(request: NextRequest) {
  return successResponse({ status: 'ok', timestamp: new Date().toISOString() });
}
