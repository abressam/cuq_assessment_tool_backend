import { name, version, description } from '../../../package.json';

const { PORT } = process.env;

export default () => ({
  app: {
    name,
    port: parseInt(PORT ?? '3000', 10) || 3000,
    version,
    description,
    prefix: `/${name}`,
  },
  cors: {
    origin: true,
    credentials: true,
  },
});