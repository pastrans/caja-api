import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

import express, { Router } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { CustomError } from '../domain';
import { ErrorMiddleware } from './middlewares';

interface Options {
  port: number;
  routes: Router;
  public_path?: string;
  acceptedOrigins?: string[]; // 👈 Lista de orígenes permitidos
  trustProxy?: number; // Proxies delante de la API (para obtener la IP real del cliente)
}

export class Server {
  private app = express();
  private readonly port: number;
  private readonly publicPath: string;
  private readonly routes: Router;
  private readonly acceptedOrigins: string[];
  private readonly trustProxy: number;

  constructor(options: Options) {
    const { port, routes, public_path = 'public', acceptedOrigins = [], trustProxy = 0 } = options;
    this.port = port;
    this.publicPath = public_path;
    this.routes = routes;
    this.acceptedOrigins = acceptedOrigins;
    this.trustProxy = trustProxy;
  }

  async start() {
    //* 0. Seguridad: IP real detrás del proxy y cabeceras seguras
    this.app.set('trust proxy', this.trustProxy);
    this.app.use(helmet());

    //* 1. CORS Configuration
    this.app.use(
      cors({
        origin: (origin, callback) => {
          // Permite peticiones sin origin (como apps móviles, Postman o curl)
          if (!origin) return callback(null, true);

          if (this.acceptedOrigins.includes(origin)) {
            return callback(null, true);
          }

          return callback(CustomError.forbidden(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

    //* 2. Middlewares
    this.app.use(express.json()); // raw
    this.app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded
    this.app.use(compression());

    //* 3. Public Folder
    this.app.use(express.static(this.publicPath));

    //* 4. Routes
    this.app.use(this.routes);

    //* 5. SPA Fallback
    this.app.get('*', (req, res) => {
      const indexPath = path.join(__dirname, '../../', this.publicPath, 'index.html');
      res.sendFile(indexPath);
    });

    //* 6. Error handler (a nivel de app para capturar también errores de CORS y del body parser)
    this.app.use(ErrorMiddleware.handleError);

    this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }
}