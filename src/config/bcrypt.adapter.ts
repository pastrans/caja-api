import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import { createHash } from 'node:crypto';



export const bcryptAdapter = {

  hash: (password: string) => {
    const salt = genSaltSync();
    return hashSync(password, salt)
  },

  compare: (password:string, hashed: string) => {
    return compareSync(password, hashed);
  },

  // Huella corta del hash actual: cambia cuando cambia la contraseña.
  // Se usa para que el token de reset sea de un solo uso.
  fingerprint: (hashed: string) => {
    return createHash('sha256').update(hashed).digest('hex').slice(0, 16);
  }

}
