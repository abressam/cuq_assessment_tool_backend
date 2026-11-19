import { ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

const dbConfig = (config: ConfigService): SequelizeModuleOptions => ({
  dialect: 'postgres',
  host: config.getOrThrow<string>('DB_HOST'),
  port: parseInt(config.get<string>('DB_PORT') ?? '', 10) || 5432,
  username: config.getOrThrow<string>('DB_USER'),
  password: config.getOrThrow<string>('DB_PASSWORD'),
  database: config.getOrThrow<string>('DB_NAME'),
  autoLoadModels: true,
  synchronize: true,
  logging: false,
});

export default dbConfig;