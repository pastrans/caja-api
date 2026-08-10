import { Request, Response, NextFunction } from 'express';
import {
  CreateUser,
  CreateUserDto,
  CustomError,
  DeleteUser,
  GetUser,
  GetUsers,
  PaginationDto,
  UpdateUser,
  UpdateUserDto,
  UserRepository,
} from '../../domain';

export class UsersController {
  constructor(private readonly userRepository: UserRepository) {}

  public getUsers = (req: Request, res: Response, next: NextFunction) => {
    const [error, paginationDto] = PaginationDto.create(req.query);
    if (error) return next(CustomError.badRequest(error));

    // req.baseUrl devuelve la ruta montada en Express (ej: '/api/users')
    new GetUsers(this.userRepository, req.baseUrl)
      .execute(paginationDto!)
      .then((data) => res.json(data))
      .catch(next);
  };

  public getUserById = (req: Request, res: Response, next: NextFunction) => {
    const id = +req.params.id!;
    if (isNaN(id)) return next(CustomError.badRequest('Invalid ID format'));

    new GetUser(this.userRepository)
      .execute(id)
      .then((user) => res.json(user))
      .catch(next);
  };

  public createUser = (req: Request, res: Response, next: NextFunction) => {
    const [error, createUserDto] = CreateUserDto.create(req.body);
    if (error) return next(CustomError.badRequest(error));

    new CreateUser(this.userRepository)
      .execute(createUserDto!)
      .then((user) => res.json(user))
      .catch(next);
  };

  public updateUser = (req: Request, res: Response, next: NextFunction) => {
    const id = +req.params.id!;
    if (isNaN(id)) return next(CustomError.badRequest('Invalid ID format'));

    const [error, updateUserDto] = UpdateUserDto.create({ ...req.body, id });
    if (error) return next(CustomError.badRequest(error));

    new UpdateUser(this.userRepository)
      .execute(updateUserDto!)
      .then((user) => res.json(user))
      .catch(next);
  };

  public deleteUser = (req: Request, res: Response, next: NextFunction) => {
    const id = +req.params.id!;
    if (isNaN(id)) return next(CustomError.badRequest('Invalid ID format'));

    new DeleteUser(this.userRepository)
      .execute(id)
      .then((user) => res.json(user))
      .catch(next);
  };
}