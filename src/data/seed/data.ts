export const seedData = {

  users: [
    { name: 'Carlos', email: 'pastran2526@gmail.com', role : 'ADMIN', password: '123456' },
    { name: 'idalia', email: 'pastran@gmail.com', role : 'CASHIER', password:  '123456' },   
  ],

  employee: [
    { name: 'Maria' },
    { name: 'Marisol' },
    { name: 'flor' },
  ],

  OpenCashRegister: [
    {
      "cash": 25,
      "userSequenceArray": 1,           // this is a the postion in user array
      "denominations": [{
          "value": 5,
          "quantity": 1
        }, 
        {"value": 10,
          "quantity": 2
        }],
      "note": "this is a opening note"
    },
    {
      "cash": 21.10,
      "userSequenceArray": 2,           // this is a the postion in user array
      "denominations": [{
          "value": 1,
          "quantity": 1
        }, 
        {"value": 10,
          "quantity": 2
        }, 
        {"value": 0.10,
          "quantity": 1
        }],
      "note": "this is a opening note"
    },
    {
      "cash": 58.75,
      "userSequenceArray": 1,           // this is a the postion in user array
      "note": "this is a opening note"
    }
  ],

  transactions: [
    {
      "amountToCharge": 8.5,
      "cashProvided": 10,
      "changeReturned": 1.5,
      "cashRegisterRecordSequenceArray": 1,        // this is a the postion in cashRegister array
      "employeeSequenceArray": 1,                  // this is a the postion in empleado array
      "denominations": [
        {
          "value": 5,
          "quantity": 2
        }
      ],
      "note": "this is a note 2",
      "employee": 2
    },
    {
      "amountToCharge": 12,
      "cashProvided": 15,
      "changeReturned": 3,
      "cashRegisterRecordSequenceArray": 1,        // this is a the postion in cashRegister array
      "employeeSequenceArray": 1,                  // this is a the postion in empleado array 
      "note": "this is a note 2",
      "employee": 2
    },
    {
      "amountToCharge": 9,
      "cashProvided": 10,
      "changeReturned": 1,
      "cashRegisterRecordSequenceArray": 2,        // this is a the postion in cashRegister array
      "employeeSequenceArray": 1,                  // this is a the postion in empleado array 
      "employee": 2
    },
    {
      "amountToCharge": 8,
      "cashProvided": 10,
      "changeReturned": 2,
      "cashRegisterRecordSequenceArray": 2,        // this is a the postion in cashRegister array
      "employeeSequenceArray": 2,                  // this is a the postion in empleado array 
      "note": "this is a note 2",
      "employee": 2
    },
    {
      "amountToCharge": 2.85,
      "cashProvided": 2.85,
      "changeReturned": 0,
      "cashRegisterRecordSequenceArray": 2,        // this is a the postion in cashRegister array
      "employeeSequenceArray": 1,                  // this is a the postion in empleado array 
      "denominations": [
        {
          "value": 0.25,
          "quantity": 11
        },
        {
          "value": 0.10,
          "quantity": 1
        }
      ],
      "employee": 2
    },
    {
      "amountToCharge": 45,
      "cashProvided": 50,
      "changeReturned": 5,
      "cashRegisterRecordSequenceArray": 3,        // this is a the postion in cashRegister array
      "employeeSequenceArray": 2,                  // this is a the postion in empleado array 
      "note": "this is a note 2",
      "employee": 2
    },
    {
      "amountToCharge": 15.75,
      "cashProvided": 20,
      "changeReturned": 4.25,
      "cashRegisterRecordSequenceArray": 3,        // this is a the postion in cashRegister array
      "employeeSequenceArray": 1,                  // this is a the postion in empleado array 
      "denominations": [
        {
          "value": 20,
          "quantity": 1
        }
      ],
      "employee": 2
    }
  ],
  cash_in_out: [
    {
      "type": "OUT",
      "amount": 10.5,
      "reason": "coins",
      "cashRegisterRecordSequenceArray": 1         // this is a the postion in cashRegister array
    },
    {
      "type": "IN",
      "amount": 100,
      "reason": "coins",
      "cashRegisterRecordSequenceArray": 1         // this is a the postion in cashRegister array
    },
    {
      "type": "IN",
      "amount": 20,
      "reason": "dollar coins",
      "cashRegisterRecordSequenceArray": 2         // this is a the postion in cashRegister array
    }
  ],
  CloseCashRegister: [
    {
    "cashProvided": 115.5,
      "difference": 20,
      "cashRegisterRecordSequenceArray": 1,        // this is a the postion in cashRegister array
      "userSequenceArray": 2,                                 // this is a the postion in user array
      "denominations": [],
      "note": "this is a opening note",
      "totalTransactions" : 20.5,
      "totalCashInOut" : 90,
      "totalExpected" : 135.5,
    },
    {
    "cashProvided": 60.95,
      "difference": 0,
      "cashRegisterRecordSequenceArray": 2,        // this is a the postion in cashRegister array
      "userSequenceArray": 2,                                 // this is a the postion in user array
      "denominations": [
        {
          "value": 10,
          "quantity": 2
        }, 
        {"value": 20,
          "quantity": 2
        }, 
        {"value": 0.25,
          "quantity": 3
        },
        {"value": 0.1,
          "quantity": 2
        }
      ],
      "note": "this is a opening note",
      "totalTransactions" : 19.85,
      "totalCashInOut" : 20,
      "totalExpected" : 60.95,
    }
  ]

}