import { UserServiceInterface } from '@app/modules/user/services/user.service.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DeleteUserResDto } from '@app/modules/user/dtos/responses/delete-user-res.dto';
import { GetUserResDto } from '@app/modules/user/dtos/responses/get-user-res.dto';
import { PutUserReqDto } from '@app/modules/user/dtos/requests/put-user-req.dto';
import { User } from '@app/modules/user/models/user.model';
import {
  encodePassword,
  generatePasswordSalt,
} from '@app/modules/session/utils/session.util';

@Injectable()
export class UserService implements UserServiceInterface {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async getUser(userId: number): Promise<GetUserResDto> {
    const user = await this.userModel.findByPk(userId, {
      attributes: {
        exclude: ['id', 'password'],
      },
    });

    this.validateUser(user);

    return {
      user: {
        name: user.name,
        email: user.email,
      },
    };
  }

  async putUser(userId: number, body: PutUserReqDto): Promise<GetUserResDto> {
    const userOld = await this.userModel.findByPk(userId);

    this.validateUser(userOld);

    let passwordSalt = userOld.passwordSalt;
    let password = userOld.password;
    if (body.password) {
      passwordSalt = generatePasswordSalt();
      password = encodePassword(passwordSalt, body.password);
    }

    await this.userModel.update(
      {
        name: body.name ?? userOld.name,
        password,
        passwordSalt,
      },
      {
        where: {
          id: userId,
        },
      },
    );

    return {
      user: {
        name: body.name ?? userOld.name,
        email: userOld.email,
      },
    };
  }

  async deleteUser(userId: number): Promise<DeleteUserResDto> {
    const user = await this.userModel.findByPk(userId);

    this.validateUser(user);

    await user.destroy();

    return {
      statusCode: 200,
      message: 'User successfully deleted',
    };
  }

  private validateUser(user: User | null): asserts user is User {
    if (!user) {
      throw new HttpException('No user found', HttpStatus.NOT_FOUND);
    }
  }
}