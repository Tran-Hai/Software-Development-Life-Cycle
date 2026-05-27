import { Module } from '@nestjs/common';
import {
  TestSuitesController,
  TestCasesController,
  TestRunsController,
  TestProjectRunsController,
  TestResultsController,
} from './test-management.controller';
import { TestManagementService } from './test-management.service';

@Module({
  controllers: [
    TestSuitesController,
    TestCasesController,
    TestRunsController,
    TestProjectRunsController,
    TestResultsController,
  ],
  providers: [TestManagementService],
  exports: [TestManagementService],
})
export class TestManagementModule {}
