import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';

@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  findAll() {
    return this.playlistsService.findAll();
  }

  @Post()
  create(@Body() body: CreatePlaylistDto) {
    return this.playlistsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdatePlaylistDto) {
    return this.playlistsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.playlistsService.remove(id);
  }
}
