import jwt from 'jsonwebtoken';
import { envs } from './envs';


const JWT_SEED = envs.JWT_SEED;

// Propósito del token: un token de reset no sirve como sesión y viceversa
export const TokenPurpose = {
  SESSION: 'session',
  RESET_PASSWORD: 'reset-password',
} as const;


export class JwtAdapter {

  // DI?

  static generateToken( payload: object, duration: string = '8h' ): Promise<string | null> {

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
