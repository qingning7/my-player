import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';

@Injectable()
export class PlaylistsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.playlist.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: CreatePlaylistDto) {
    return this.prisma.playlist.create({ data });
  }

  update(id: string, data: UpdatePlaylistDto) {
    return this.prisma.playlist.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.playlist.delete({
      where: { id },
    });
  }
}
