import jwt from 'jsonwebtoken';
import { envs } from './envs';


const JWT_SEED = envs.JWT_SEED;



export class JwtAdapter {

  // DI?

  static generateToken( payload: object, duration: string = '2h' ): Promise<string | null> {

    return new Promise((resolve) => {
      jwt.sign(payload, JWT_SEED, { expiresIn: duration as any }, (err, token) => {
        
        if ( err ) return resolve(null);

        resolve(token ?? null);
        // a ?? b
        // Si a no es null ni undefined, la expresión devuelve a.
        // Si a es null o undefined, la expresión devuelve b.

      });
    })

  }


  static validateToken<T>(token: string): Promise< T | null> {
    
    return new Promise( (resolve) => {

      jwt.verify( token, JWT_SEED, (err, decoded) => {

        if( err ) return resolve(null);

        resolve( decoded as T);

      });



    })
  }


}
