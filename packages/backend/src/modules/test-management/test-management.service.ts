import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateTestSuiteDto,
  UpdateTestSuiteDto,
  CreateTestCaseDto,
  UpdateTestCaseDto,
  CreateTestRunDto,
  UpdateTestRunStatusDto,
  CreateTestResultDto,
} from './dto/test-management.dto';

@Injectable()
export class TestManagementService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ===== TEST SUITES =====

  async findAllSuites(projectId: string) {
    return this.prisma.testSuite.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            testCases: true,
            testRuns: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSuite(id: string) {
    const suite = await this.prisma.testSuite.findUnique({
      where: { id },
      include: {
        testCases: {
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            testCases: true,
            testRuns: true,
          },
        },
      },
    });

    if (!suite) {
      throw new NotFoundException('Test suite not found');
    }

    return suite;
  }

  async createSuite(projectId: string, dto: CreateTestSuiteDto) {
    return this.prisma.testSuite.create({
      data: {
        projectId,
        name: dto.name,
        description: dto.description,
        status: dto.status || 'active',
      },
      include: {
        _count: {
          select: {
            testCases: true,
            testRuns: true,
          },
        },
      },
    });
  }

  async updateSuite(id: string, dto: UpdateTestSuiteDto) {
    const suite = await this.prisma.testSuite.findUnique({ where: { id } });
    if (!suite) {
      throw new NotFoundException('Test suite not found');
    }

    return this.prisma.testSuite.update({
      where: { id },
      data: dto,
      include: {
        _count: {
          select: {
            testCases: true,
            testRuns: true,
          },
        },
      },
    });
  }

  async deleteSuite(id: string) {
    const suite = await this.prisma.testSuite.findUnique({ where: { id } });
    if (!suite) {
      throw new NotFoundException('Test suite not found');
    }

    return this.prisma.testSuite.delete({ where: { id } });
  }

  // ===== TEST CASES =====

  async findAllCases(projectId: string, suiteId?: string) {
    return this.prisma.testCase.findMany({
      where: {
        projectId,
        ...(suiteId && { testSuiteId: suiteId }),
      },
      include: {
        testSuite: {
          select: {
            id: true,
            name: true,
          },
        },
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCase(id: string) {
    const testCase = await this.prisma.testCase.findUnique({
      where: { id },
      include: {
        testSuite: true,
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        results: {
          include: {
            testRun: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
            executor: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { executedAt: 'desc' },
        },
      },
    });

    if (!testCase) {
      throw new NotFoundException('Test case not found');
    }

    return testCase;
  }

  async createCase(projectId: string, testSuiteId: string, authorId: string, dto: CreateTestCaseDto) {
    return this.prisma.testCase.create({
      data: {
        projectId,
        testSuiteId,
        authorId,
        title: dto.title,
        description: dto.description,
        preconditions: dto.preconditions,
        steps: dto.steps,
        expectedResult: dto.expectedResult,
        priority: dto.priority || 'medium',
        status: dto.status || 'draft',
      },
      include: {
        testSuite: true,
      },
    });
  }

  async updateCase(id: string, dto: UpdateTestCaseDto) {
    const testCase = await this.prisma.testCase.findUnique({ where: { id } });
    if (!testCase) {
      throw new NotFoundException('Test case not found');
    }

    return this.prisma.testCase.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCase(id: string) {
    const testCase = await this.prisma.testCase.findUnique({ where: { id } });
    if (!testCase) {
      throw new NotFoundException('Test case not found');
    }

    return this.prisma.testCase.delete({ where: { id } });
  }

  // ===== TEST RUNS =====

  async findAllRuns(projectId: string, suiteId?: string) {
    return this.prisma.testRun.findMany({
      where: {
        testSuite: { projectId },
        ...(suiteId && { testSuiteId: suiteId }),
      },
      include: {
        testSuite: {
          select: {
            id: true,
            name: true,
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
          },
        },
        executor: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRun(id: string) {
    const testRun = await this.prisma.testRun.findUnique({
      where: { id },
      include: {
        testSuite: {
          include: {
            testCases: {
              include: {
                results: {
                  where: { testRunId: id },
                  include: {
                    executor: {
                      select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        executor: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        results: {
          include: {
            testCase: true,
            executor: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!testRun) {
      throw new NotFoundException('Test run not found');
    }

    return testRun;
  }

  async createRun(projectId: string, testSuiteId: string, executorId: string, dto: CreateTestRunDto) {
    const testSuite = await this.prisma.testSuite.findUnique({
      where: { id: testSuiteId },
    });

    if (!testSuite) {
      throw new NotFoundException('Test suite not found');
    }

    const testRun = await this.prisma.testRun.create({
      data: {
        testSuiteId,
        sprintId: dto.sprintId || null,
        executorId,
        name: dto.name,
        status: 'planned',
      },
      include: {
        executor: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const actor = await this.prisma.user.findUnique({ where: { id: executorId }, select: { fullName: true } });
    await this.notifications.notifyProject(projectId || testSuite.projectId, {
      type: 'test_run',
      title: `${actor?.fullName || 'Someone'} created test run "${testRun.name}"`,
      entityType: 'test_run',
      entityId: testRun.id,
    });

    return testRun;
  }

  async updateRunStatus(id: string, dto: UpdateTestRunStatusDto, userId?: string) {
    const testRun = await this.prisma.testRun.findUnique({ where: { id } });
    if (!testRun) {
      throw new NotFoundException('Test run not found');
    }

    const data: any = { status: dto.status };
    if (dto.status === 'in_progress' && !testRun.startedAt) {
      data.startedAt = new Date();
    }
    if (['passed', 'failed', 'blocked'].includes(dto.status) && !testRun.completedAt) {
      data.completedAt = new Date();
    }

    const updated = await this.prisma.testRun.update({
      where: { id },
      data,
    });

    if (userId && dto.status !== testRun.status) {
      const actor = await this.prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
      const suite = await this.prisma.testSuite.findUnique({ where: { id: testRun.testSuiteId }, select: { projectId: true } });
      await this.notifications.notifyProject(suite?.projectId || '', {
        type: 'test_run',
        title: `${actor?.fullName || 'Someone'} updated test run "${testRun.name}" to ${dto.status}`,
        entityType: 'test_run',
        entityId: id,
      });
    }

    return updated;
  }

  async deleteRun(id: string) {
    const testRun = await this.prisma.testRun.findUnique({ where: { id } });
    if (!testRun) {
      throw new NotFoundException('Test run not found');
    }

    return this.prisma.testRun.delete({ where: { id } });
  }

  // ===== TEST RESULTS =====

  async createResult(testRunId: string, executedBy: string, dto: CreateTestResultDto) {
    const testRun = await this.prisma.testRun.findUnique({
      where: { id: testRunId },
    });

    if (!testRun) {
      throw new NotFoundException('Test run not found');
    }

    const result = await this.prisma.testResult.create({
      data: {
        testRunId,
        testCaseId: dto.testCaseId,
        executedBy,
        status: dto.status,
        actualResult: dto.actualResult,
        notes: dto.notes,
      },
      include: {
        testCase: true,
        executor: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (testRun.status === 'planned') {
      await this.prisma.testRun.update({
        where: { id: testRunId },
        data: { status: 'in_progress', startedAt: new Date() },
      });
    }

    await this.updateRunStatusFromResults(testRunId);

    return result;
  }

  async updateResult(id: string, dto: CreateTestResultDto) {
    const result = await this.prisma.testResult.findUnique({ where: { id } });
    if (!result) {
      throw new NotFoundException('Test result not found');
    }

    return this.prisma.testResult.update({
      where: { id },
      data: {
        status: dto.status,
        actualResult: dto.actualResult,
        notes: dto.notes,
      },
    });
  }

  private async updateRunStatusFromResults(testRunId: string) {
    const results = await this.prisma.testResult.findMany({
      where: { testRunId },
    });

    if (results.length === 0) return;

    const allPass = results.every((r) => r.status === 'pass');
    const hasFail = results.some((r) => r.status === 'fail');
    const hasBlocked = results.some((r) => r.status === 'blocked');

    let newStatus = 'in_progress';
    if (allPass) {
      newStatus = 'passed';
    } else if (hasFail) {
      newStatus = 'failed';
    } else if (hasBlocked) {
      newStatus = 'blocked';
    }

    await this.prisma.testRun.update({
      where: { id: testRunId },
      data: {
        status: newStatus,
        completedAt: newStatus !== 'in_progress' ? new Date() : undefined,
      },
    });
  }
}
