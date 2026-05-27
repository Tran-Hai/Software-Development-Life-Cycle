import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://sdlc:sdlc_secret@localhost:5432/sdlc_platform?schema=public',
}));
