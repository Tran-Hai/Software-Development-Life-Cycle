import { NextRequest } from 'next/server';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse } from '@/server/utils';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'attachment';

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop();
    const filename = `${crypto.randomUUID()}.${ext}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', type);

    mkdirSync(uploadDir, { recursive: true });
    writeFileSync(join(uploadDir, filename), buffer);

    return successResponse({ url: `/uploads/${type}/${filename}`, filename: file.name }, 201);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
