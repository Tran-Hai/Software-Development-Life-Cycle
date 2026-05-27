import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { TransformInterceptor } from '../interceptors/transform.interceptor';

export function ApiResponse() {
  return applyDecorators(UseInterceptors(TransformInterceptor));
}
