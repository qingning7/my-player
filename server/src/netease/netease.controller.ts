import { Controller, Get, Query } from '@nestjs/common';
import { NeteaseService } from './netease.service';

type QueryValue = string | string[] | undefined;

@Controller('netease')
export class NeteaseController {
  constructor(private readonly neteaseService: NeteaseService) {}

  @Get('search')
  search(@Query() query: Record<string, QueryValue>) {
    return this.neteaseService.get('/search', query);
  }

  @Get('song/detail')
  songDetail(@Query() query: Record<string, QueryValue>) {
    return this.neteaseService.get('/song/detail', query);
  }

  @Get('song/url')
  songUrl(@Query() query: Record<string, QueryValue>) {
    return this.neteaseService.get('/song/url', query);
  }

  @Get('lyric')
  lyric(@Query() query: Record<string, QueryValue>) {
    return this.neteaseService.get('/lyric', query);
  }
}
