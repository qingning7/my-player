import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PlaylistsModule } from './playlists/playlists.module';

@Module({
  imports: [PrismaModule, PlaylistsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
