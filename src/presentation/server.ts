import express, { Router } from 'express';
import compression from 'compression';
import cors from 'cors';
import path from 'path';

interface Options {
  port: number;
  routes: Router;
  public_path?: string;
  acceptedOrigins?: string[]; // 👈 Lista de orígenes permitidos
}

export class Server {
  private app = express();
  private readonly port: number;
  private readonly publicPath: string;
  private readonly routes: Router;
  private readonly acceptedOrigins: string[];

  constructor(options: Options) {
    const { port, routes, public_path = 'public', acceptedOrigins = [] } = options;
    this.port = port;
    this.publicPath = public_path;
    this.routes = routes;
    this.acceptedOrigins = acceptedOrigins;
  }

  async start() {
    //* 1. CORS Configuration
    this.app.use(
      cors({
        origin: (origin, callback) => {
          // Permite peticiones sin origin (como apps móviles, Postman o curl)
          if (!origin) return callback(null, true);

          if (this.acceptedOrigins.includes(origin)) {
            return callback(null, true);
          }

          return callback(new Error(`Origin ${origin} not allowed by CORS`));
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
      const indexPath = path.join(__dirname + `../../../${this.publicPath}/index.html`);
      res.sendFile(indexPath);
    });

    this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }
}