import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';

export interface SearchResult {
  id: string;
  type: 'issue' | 'document' | 'bug';
  title: string;
  description?: string;
  projectId: string;
  projectKey?: string;
  status?: string;
  priority?: string;
  createdAt: string;
  url: string;
  rank: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private prisma: PrismaService) {}

  async search(
    projectId: string,
    query: string,
    filters?: {
      type?: string;
      status?: string;
      limit?: number;
    },
  ): Promise<SearchResult[]> {
    const limit = filters?.limit || 50;
    const results: SearchResult[] = [];

    const sanitizedQuery = query.replace(/['"\\]/g, '').trim();
    if (!sanitizedQuery) return [];

    try {
      // Search Issues
      if (!filters?.type || filters.type === 'issue') {
        const issues = await this.prisma.$queryRaw`
          SELECT
            i.id,
            i.title,
            i.description,
            i.status,
            i.priority,
            i."issueNumber" as "issueNumber",
            i."projectId" as "projectId",
            i."createdAt" as "createdAt",
            p.key as "projectKey",
            ts_rank(
              to_tsvector('english', COALESCE(i.title, '') || ' ' || COALESCE(i.description, '')),
              plainto_tsquery('english', ${sanitizedQuery})
            ) as rank
          FROM issues i
          JOIN projects p ON i."projectId" = p.id
          WHERE i."projectId" = ${projectId}::uuid
            AND to_tsvector('english', COALESCE(i.title, '') || ' ' || COALESCE(i.description, ''))
                @@ plainto_tsquery('english', ${sanitizedQuery})
            ${filters?.status ? Prisma.sql`AND i.status = ${filters.status}` : Prisma.sql``}
          ORDER BY rank DESC, i."createdAt" DESC
          LIMIT ${limit}
        `;

        results.push(
          ...(issues as Array<{
            id: string;
            title: string;
            description: string | null;
            status: string;
            priority: string | null;
            issueNumber: number;
            projectId: string;
            createdAt: string;
            projectKey: string;
            rank: number;
          }>).map((issue) => ({
            id: issue.id,
            type: 'issue' as const,
            title: `${issue.issueNumber} - ${issue.title}`,
            description: issue.description ?? undefined,
            projectId: issue.projectId,
            projectKey: issue.projectKey,
            status: issue.status,
            priority: issue.priority ?? undefined,
            createdAt: issue.createdAt,
            rank: issue.rank,
            url: `/projects/${issue.projectId}/issues/${issue.id}`,
          })),
        );
      }

      // Search Documents
      if (!filters?.type || filters.type === 'document') {
        const documents = await this.prisma.$queryRaw`
          SELECT
            d.id,
            d.title,
            d.content as description,
            d.status,
            d."projectId" as "projectId",
            d."createdAt" as "createdAt",
            p.key as "projectKey",
            ts_rank(
              to_tsvector('english', COALESCE(d.title, '') || ' ' || COALESCE(d.content, '')),
              plainto_tsquery('english', ${sanitizedQuery})
            ) as rank
          FROM documents d
          JOIN projects p ON d."projectId" = p.id
          WHERE d."projectId" = ${projectId}::uuid
            AND to_tsvector('english', COALESCE(d.title, '') || ' ' || COALESCE(d.content, ''))
                @@ plainto_tsquery('english', ${sanitizedQuery})
          ORDER BY rank DESC, d."createdAt" DESC
          LIMIT ${limit}
        `;

        results.push(
          ...(documents as Array<{
            id: string;
            title: string;
            description: string | null;
            status: string | null;
            projectId: string;
            createdAt: string;
            projectKey: string;
            rank: number;
          }>).map((doc) => ({
            id: doc.id,
            type: 'document' as const,
            title: doc.title,
            description: doc.description ?? undefined,
            projectId: doc.projectId,
            projectKey: doc.projectKey,
            status: doc.status ?? undefined,
            createdAt: doc.createdAt,
            rank: doc.rank,
            url: `/projects/${doc.projectId}/wiki`,
          })),
        );
      }

      // Search Bugs
      if (!filters?.type || filters.type === 'bug') {
        const bugs = await this.prisma.$queryRaw`
          SELECT
            b.id,
            b.title,
            b.description,
            b.status,
            b.severity as priority,
            b."projectId" as "projectId",
            b."createdAt" as "createdAt",
            p.key as "projectKey",
            ts_rank(
              to_tsvector('english', COALESCE(b.title, '') || ' ' || COALESCE(b.description, '') || ' ' || COALESCE(b.steps_to_reproduce, '')),
              plainto_tsquery('english', ${sanitizedQuery})
            ) as rank
          FROM bugs b
          JOIN projects p ON b."projectId" = p.id
          WHERE b."projectId" = ${projectId}::uuid
            AND to_tsvector('english', COALESCE(b.title, '') || ' ' || COALESCE(b.description, '') || ' ' || COALESCE(b.steps_to_reproduce, ''))
                @@ plainto_tsquery('english', ${sanitizedQuery})
            ${filters?.status ? Prisma.sql`AND b.status = ${filters.status}` : Prisma.sql``}
          ORDER BY rank DESC, b."createdAt" DESC
          LIMIT ${limit}
        `;

        results.push(
          ...(bugs as Array<{
            id: string;
            title: string;
            description: string | null;
            status: string;
            priority: string;
            projectId: string;
            createdAt: string;
            projectKey: string;
            rank: number;
          }>).map((bug) => ({
            id: bug.id,
            type: 'bug' as const,
            title: bug.title,
            description: bug.description ?? undefined,
            projectId: bug.projectId,
            projectKey: bug.projectKey,
            status: bug.status,
            priority: bug.priority,
            createdAt: bug.createdAt,
            rank: bug.rank,
            url: `/projects/${bug.projectId}/bugs`,
          })),
        );
      }

      // Sort all results by ts_rank (relevance)
      return results.sort((a, b) => b.rank - a.rank).slice(0, limit);
    } catch (error) {
      this.logger.error(`Search failed for project ${projectId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async searchAllProjects(userId: string, query: string, limit = 20): Promise<SearchResult[]> {
    const sanitizedQuery = query.replace(/['"\\]/g, '').trim();
    if (!sanitizedQuery) return [];

    try {
      const memberships = await this.prisma.member.findMany({
        where: { userId },
        select: { projectId: true },
      });

      const projectIds = memberships.map((m) => m.projectId);
      if (projectIds.length === 0) return [];

      const results: SearchResult[] = [];

      // Search issues across all accessible projects
      const issues = await this.prisma.$queryRaw`
        SELECT
          i.id,
          i.title,
          i.description,
          i.status,
          i.priority,
          i."issueNumber" as "issueNumber",
          i."projectId" as "projectId",
          i."createdAt" as "createdAt",
          p.key as "projectKey",
          ts_rank(
            to_tsvector('english', COALESCE(i.title, '') || ' ' || COALESCE(i.description, '')),
            plainto_tsquery('english', ${sanitizedQuery})
          ) as rank
        FROM issues i
        JOIN projects p ON i."projectId" = p.id
        WHERE i."projectId" = ANY(${projectIds}::uuid[])
          AND to_tsvector('english', COALESCE(i.title, '') || ' ' || COALESCE(i.description, ''))
              @@ plainto_tsquery('english', ${sanitizedQuery})
        ORDER BY rank DESC, i."createdAt" DESC
        LIMIT ${limit}
      `;

      results.push(
        ...(issues as Array<{
          id: string;
          title: string;
          description: string | null;
          status: string;
          priority: string | null;
          issueNumber: number;
          projectId: string;
          createdAt: string;
          projectKey: string;
          rank: number;
        }>).map((issue) => ({
          id: issue.id,
          type: 'issue' as const,
          title: `${issue.issueNumber} - ${issue.title}`,
          description: issue.description ?? undefined,
          projectId: issue.projectId,
          projectKey: issue.projectKey,
          status: issue.status,
          priority: issue.priority ?? undefined,
          createdAt: issue.createdAt,
          rank: issue.rank,
          url: `/projects/${issue.projectId}/issues/${issue.id}`,
        })),
      );

      // Search documents across all accessible projects
      const documents = await this.prisma.$queryRaw`
        SELECT
          d.id,
          d.title,
          d.content as description,
          d.status,
          d."projectId" as "projectId",
          d."createdAt" as "createdAt",
          p.key as "projectKey",
          ts_rank(
            to_tsvector('english', COALESCE(d.title, '') || ' ' || COALESCE(d.content, '')),
            plainto_tsquery('english', ${sanitizedQuery})
          ) as rank
        FROM documents d
        JOIN projects p ON d."projectId" = p.id
        WHERE d."projectId" = ANY(${projectIds}::uuid[])
          AND to_tsvector('english', COALESCE(d.title, '') || ' ' || COALESCE(d.content, ''))
              @@ plainto_tsquery('english', ${sanitizedQuery})
        ORDER BY rank DESC, d."createdAt" DESC
        LIMIT ${limit}
      `;

      results.push(
        ...(documents as Array<{
          id: string;
          title: string;
          description: string | null;
          status: string | null;
          projectId: string;
          createdAt: string;
          projectKey: string;
          rank: number;
        }>).map((doc) => ({
          id: doc.id,
          type: 'document' as const,
          title: doc.title,
          description: doc.description ?? undefined,
          projectId: doc.projectId,
          projectKey: doc.projectKey,
          status: doc.status ?? undefined,
          createdAt: doc.createdAt,
          rank: doc.rank,
          url: `/projects/${doc.projectId}/wiki`,
        })),
      );

      // Search bugs across all accessible projects
      const bugs = await this.prisma.$queryRaw`
        SELECT
          b.id,
          b.title,
          b.description,
          b.status,
          b.severity as priority,
          b."projectId" as "projectId",
          b."createdAt" as "createdAt",
          p.key as "projectKey",
          ts_rank(
            to_tsvector('english', COALESCE(b.title, '') || ' ' || COALESCE(b.description, '') || ' ' || COALESCE(b.steps_to_reproduce, '')),
            plainto_tsquery('english', ${sanitizedQuery})
          ) as rank
        FROM bugs b
        JOIN projects p ON b."projectId" = p.id
        WHERE b."projectId" = ANY(${projectIds}::uuid[])
          AND to_tsvector('english', COALESCE(b.title, '') || ' ' || COALESCE(b.description, '') || ' ' || COALESCE(b.steps_to_reproduce, ''))
              @@ plainto_tsquery('english', ${sanitizedQuery})
        ORDER BY rank DESC, b."createdAt" DESC
        LIMIT ${limit}
      `;

      results.push(
        ...(bugs as Array<{
          id: string;
          title: string;
          description: string | null;
          status: string;
          priority: string;
          projectId: string;
          createdAt: string;
          projectKey: string;
          rank: number;
        }>).map((bug) => ({
          id: bug.id,
          type: 'bug' as const,
          title: bug.title,
          description: bug.description ?? undefined,
          projectId: bug.projectId,
          projectKey: bug.projectKey,
          status: bug.status,
          priority: bug.priority,
          createdAt: bug.createdAt,
          rank: bug.rank,
          url: `/projects/${bug.projectId}/bugs`,
        })),
      );

      // Sort all results by ts_rank (relevance)
      return results.sort((a, b) => b.rank - a.rank).slice(0, limit);
    } catch (error) {
      this.logger.error(`Global search failed for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
