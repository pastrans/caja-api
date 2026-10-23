import { prisma } from '../../data/postgres';
import { seedData } from './data';
import { bcryptAdapter } from '../../config';
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
  await prisma.transactionRecord.deleteMany();
  await prisma.cashInOutRecord.deleteMany();
  await prisma.closing.deleteMany();
  await prisma.opening.deleteMany();
  await prisma.cashRegisterRecord.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();


  // 1. Crear usuarios
  const userDatasource = new UserDatasourceImpl();
  const userCreationPromises = seedData.users.map(async(user) => {
    const [error, createUserDto] = CreateUserDto.create({
      ...user,
      password: await bcryptAdapter.hash( user.password ), // Resolvemos la promesa del hash
    });
    if (error) throw new Error(`Error en DTO de usuario: ${error}`);
    return userDatasource.create(createUserDto!);
  });

  const users = await Promise.all(userCreationPromises);
  console.log('Usuarios creados!');

  // 2. Crear employee
  const employeeDatasource = new EmployeeDatasourceImpl();
  const employeeCreationPromises = seedData.employee.map((employee) => {
    const [error, createEmployeeDto] = CreateEmployeeDto.create(employee);
    if (error) throw new Error(`Error en DTO de empleado: ${error}`);
    return employeeDatasource.create(createEmployeeDto!);
  });

  const employees = await Promise.all(employeeCreationPromises);
  console.log('Empleados creados!');

  // 3. Cajas: solo puede haber una abierta a la vez, así que cada caja se abre,
  //    recibe sus transacciones y movimientos, y se cierra antes de abrir la siguiente
  const cashRegisterDatasource = new CashRegisterRecordDatasourceImpl();

  for (const [index, openData] of seedData.OpenCashRegister.entries()) {
    const position = index + 1;

    // 3.1 Apertura
    const user = users[openData.userSequenceArray - 1];
    if (!user) throw new Error(`Usuario no encontrado en la posición ${openData.userSequenceArray}`);

    const [openError, openCashRegisterDto] = OpenCashRegisterDto.create({
      ...openData,
      userId: user.id,
    });
    if (openError) throw new Error(`Error en DTO de apertura de caja: ${openError}`);
    const cashRegister = await cashRegisterDatasource.open(openCashRegisterDto!);

    // 3.2 Transacciones
    for (const transactionData of seedData.transactions.filter(t => t.cashRegisterRecordSequenceArray === position)) {
      const employee = employees[transactionData.employeeSequenceArray - 1];
      if (!employee) throw new Error(`Empleado no encontrado en la posición ${transactionData.employeeSequenceArray}`);
      const [error, createTransactionDto] = CreateTransactionDto.create({
        ...transactionData,
        cashRegisterRecordId: cashRegister.id,
        employeeId: employee.id,
      });
      if (error) throw new Error(`Error en DTO de transacción: ${error}`);
      await cashRegisterDatasource.createTransaction(createTransactionDto!);
    }

    // 3.3 Entradas/salidas de efectivo
    for (const cashInOutData of seedData.cash_in_out.filter(c => c.cashRegisterRecordSequenceArray === position)) {
      const [error, createCashInOutDto] = CreateCashInOutDto.create({
        ...cashInOutData,
        cashRegisterRecordId: cashRegister.id,
      });
      if (error) throw new Error(`Error en DTO de cash-in-out: ${error}`);
      await cashRegisterDatasource.createCashInOut(createCashInOutDto!);
    }

    // 3.4 Cierre (si la caja tiene uno definido; la última puede quedar abierta)
    const closeData = seedData.CloseCashRegister.find(c => c.cashRegisterRecordSequenceArray === position);
    if (closeData) {
      const closeUser = users[closeData.userSequenceArray - 1];
      if (!closeUser) throw new Error(`Usuario no encontrado en la posición ${closeData.userSequenceArray}`);

      const [closeError, closeCashRegisterDto] = CloseCashRegisterDto.create({
        ...closeData,
        cashRegisterRecordId: cashRegister.id,
        userId: closeUser.id,
      });
      if (closeError) throw new Error(`Error en DTO de cierre de caja: ${closeError}`);
      // Los totales del seed se guardan tal cual: no se validan contra el balance calculado
      await cashRegisterDatasource.close(closeCashRegisterDto!, () => {});
    }

    console.log(`Caja ${position} ${closeData ? 'abierta y cerrada' : 'abierta'}!`);
  }

  console.log('SEEDED');
}
