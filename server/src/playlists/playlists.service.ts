import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlaylistsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.playlist.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
