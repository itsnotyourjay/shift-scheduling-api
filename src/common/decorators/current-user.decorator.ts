import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// instead of typing @Request() req and then using req.user everywhere,
// we can just use @CurrentUser() user — much cleaner in controllers
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
