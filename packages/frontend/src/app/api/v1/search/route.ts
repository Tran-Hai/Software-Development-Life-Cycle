import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse } from '@/server/utils';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || !q.trim()) return successResponse({ issues: [], documents: [], bugs: [], testCases: [] });

    const query = q.trim();
    const limit = 5;

    const [issues, documents, bugs, testCases] = await Promise.all([
      prisma.issue.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { issueNumber: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          issueNumber: true,
          status: true,
          projectId: true,
          createdAt: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, content: true, projectId: true, createdAt: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bug.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, description: true, status: true, severity: true, projectId: true, createdAt: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.testCase.findMany({
        where: { title: { contains: query, mode: 'insensitive' } },
        select: { id: true, title: true, priority: true, status: true, projectId: true, createdAt: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return successResponse({
      issues: issues.map((i) => ({ ...i, url: `/projects/${i.projectId}/issues/${i.id}` })),
      documents: documents.map((d) => ({ ...d, url: `/projects/${d.projectId}/wiki` })),
      bugs: bugs.map((b) => ({ ...b, url: `/projects/${b.projectId}/bugs` })),
      testCases: testCases.map((t) => ({ ...t, url: `/projects/${t.projectId}/test-cases` })),
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
