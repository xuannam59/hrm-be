import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ResponseMessageKey = 'responseMessage';
export const ResponseMessage = (message: string) =>
  SetMetadata(ResponseMessageKey, message);
