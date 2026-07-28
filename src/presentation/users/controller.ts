import { Request, Response } from 'express';
import {
  CreateUser,
  CreateUserDto,
  DeleteUser,
  GetUser,
  GetUsers,
  UpdateUser,
  UpdateUserDto,
  UserRepository,
} from '../../domain';

export class UsersController {
  constructor(private readonly userRepository: UserRepository) {}

  public getUsers = (req: Request, res: Response) => {
    new GetUsers(this.userRepository)
      .execute()
      .then((users) => res.json(users))
      .catch((error) => res.status(400).json({ error }));
  };

  public getUserById = (req: Request, res: Response) => {
    const id = +req.params.id!;

    new GetUser(this.userRepository)
      .execute(id)
      .then((user) => res.json(user))
      .catch((error) => res.status(400).json({ error }));
  };

  public createUser = (req: Request, res: Response) => {
    const [error, createUserDto] = CreateUserDto.create(req.body);
    if (error) return res.status(400).json({ error });

    new CreateUser(this.userRepository)
      .execute(createUserDto!)
      .then((user) => res.json(user))
      .catch((error) => res.status(400).json({ error }));
  };

  public updateUser = (req: Request, res: Response) => {
    const id = +req.params.id!;
    const [error, updateUserDto] = UpdateUserDto.create({ ...req.body, id });
    if (error) return res.status(400).json({ error });

    new UpdateUser(this.userRepository)
      .execute(updateUserDto!)
      .then((user) => res.json(user))
      .catch((error) => res.status(400).json({ error }));
  };

  public deleteUser = (req: Request, res: Response) => {
    const id = +req.params.id!;

    new DeleteUser(this.userRepository)
      .execute(id)
      .then((user) => res.json(user))
      .catch((error) => res.status(400).json({ error }));
  };
}