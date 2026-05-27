import { NextResponse } from 'next/server';

export function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return errorResponse(message, 401);
}

export function notFoundResponse(message = 'Not found') {
  return errorResponse(message, 404);
}

export function conflictResponse(message = 'Already exists') {
  return errorResponse(message, 409);
}

export function parseBody<T>(request: Request): Promise<T> {
  return request.json();
}
