import { prisma } from '../../data/postgres';
import { seedData } from './data';
import {
  CreateCashInOutDto,
  CloseCashRegisterDto,
  CreateEmployeeDto,
  CreateTransactionDto,
  CreateUserDto,
  OpenCashRegisterDto,
} from '../../domain';
import {
  CashRegisterRecordDatasourceImpl,
  EmployeeDatasourceImpl,
  UserDatasourceImpl,
} from '../../infrastructure';


(async()=> {
  try {
    await main();
  } catch (error) {
    console.error('Error durante el proceso de seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit()
  }
})();


async function main() {

  // 0. Borrar todos los datos (en orden para evitar conflictos de FK)
  console.log('Borrando registros existentes...');
  // await prisma.transactionRecord.deleteMany();
  // await prisma.cashInOutRecord.deleteMany();
  // await prisma.closing.deleteMany();
  // await prisma.opening.deleteMany();
  // await prisma.cashRegisterRecord.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.employee.deleteMany();


  // 1. Crear usuarios
  // const userDatasource = new UserDatasourceImpl();
  // const userCreationPromises = seedData.users.map(async(user) => {
  //   const [error, createUserDto] = CreateUserDto.create({
  //     ...user,
  //     password: await user.password, // Resolvemos la promesa del hash
  //   });
  //   if (error) throw new Error(`Error en DTO de usuario: ${error}`);
  //   return userDatasource.create(createUserDto!);
  // });

  // const users = await Promise.all(userCreationPromises);
  // console.log('Usuarios creados!');

  // 2. Crear employee
  const employeeDatasource = new EmployeeDatasourceImpl();
  const employeeCreationPromises = seedData.employee.map((employee) => {
    const [error, createEmployeeDto] = CreateEmployeeDto.create(employee);
    if (error) throw new Error(`Error en DTO de empleado: ${error}`);
    return employeeDatasource.create(createEmployeeDto!);
  });

  const employees = await Promise.all(employeeCreationPromises);
  console.log('Empleados creados!');

  // 3. Crear aperturas de caja (OpenCashRegister)
  // const cashRegisterDatasource = new CashRegisterRecordDatasourceImpl();
  // const openingPromises = seedData.OpenCashRegister.map(openData => {
  //   const user = users[openData.userSequenceArray - 1];
  //   if (!user) throw new Error(`Usuario no encontrado en la posición ${openData.userSequenceArray}`);

  //   const [error, openCashRegisterDto] = OpenCashRegisterDto.create({
  //     ...openData,
  //     userId: user.id,
  //   });
  //   if (error) throw new Error(`Error en DTO de apertura de caja: ${error}`);
  //   return cashRegisterDatasource.open(openCashRegisterDto!);
  // });

  // const openedCashRegisters = await Promise.all(openingPromises);
  // console.log('Cajas abiertas!');

  // // 4. Crear transacciones para las cajas abiertas
  // const transactionPromises = seedData.transactions.map(transactionData => {
  //   const cashRegister = openedCashRegisters[transactionData.cashRegisterRecordSequenceArray - 1];
  //   const employee = employees[transactionData.employeeSequenceArray - 1];
  //   if (!cashRegister) throw new Error(`Caja no encontrada en la posición ${transactionData.cashRegisterRecordSequenceArray}`);
  //   if (!employee) throw new Error(`Empleado no encontrado en la posición ${transactionData.employeeSequenceArray}`);

  //   const [error, createTransactionDto] = CreateTransactionDto.create({
  //     ...transactionData,
  //     cashRegisterRecordId: cashRegister.id,
  //     employeeId: employee.id,
  //   });
  //   if (error) throw new Error(`Error en DTO de transacción: ${error}`);
  //   return cashRegisterDatasource.createTransaction(createTransactionDto!);
  // });
  // await Promise.all(transactionPromises);
  // console.log('Transacciones creadas!');

  // // 5. Crear entradas/salidas de efectivo
  // const cashInOutPromises = seedData.cash_in_out.map(cashInOutData => {
  //   const cashRegister = openedCashRegisters[cashInOutData.cashRegisterRecordSequenceArray - 1];
  //   if (!cashRegister) throw new Error(`Caja no encontrada en la posición ${cashInOutData.cashRegisterRecordSequenceArray}`);

  //   const [error, createCashInOutDto] = CreateCashInOutDto.create({
  //     ...cashInOutData,
  //     cashRegisterRecordId: cashRegister.id,
  //   });
  //   if (error) throw new Error(`Error en DTO de cash-in-out: ${error}`);
  //   return cashRegisterDatasource.createCashInOut(createCashInOutDto!);
  // });
  // await Promise.all(cashInOutPromises);
  // console.log('Movimientos de caja creados!');

  // // 6. Crear cierres de caja (CloseCashRegister)
  // const closingPromises = seedData.CloseCashRegister.map(closeData => {
  //   const cashRegister = openedCashRegisters[closeData.cashRegisterRecordSequenceArray - 1];
  //   const user = users[closeData.userSequenceArray - 1];
  //   if (!cashRegister) throw new Error(`Caja no encontrada en la posición ${closeData.cashRegisterRecordSequenceArray}`);
  //   if (!user) throw new Error(`Usuario no encontrado en la posición ${closeData.userSequenceArray}`);

  //   const [error, closeCashRegisterDto] = CloseCashRegisterDto.create({
  //     ...closeData,
  //     cashRegisterRecordId: cashRegister.id,
  //     userId: user.id,
  //   });
  //   if (error) throw new Error(`Error en DTO de cierre de caja: ${error}`);
  //   return cashRegisterDatasource.close(closeCashRegisterDto!);
  // });
  // await Promise.all(closingPromises);
  // console.log('Cajas cerradas!');

  console.log('SEEDED');
}
