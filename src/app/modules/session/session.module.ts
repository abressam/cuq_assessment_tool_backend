import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '@app/modules/user/models/user.model';
import { SessionToken } from '@app/modules/session/models/session-token.model';
import { SessionService } from '@app/modules/session/services/session.service';
import { SessionController } from '@app/modules/session/controllers/session.controller';

@Module({
  imports: [SequelizeModule.forFeature([User, SessionToken])],
  providers: [SessionService],
  controllers: [SessionController],
  exports: [SessionService],
})
export class SessionModule {}