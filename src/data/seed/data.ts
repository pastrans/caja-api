export const seedData = {

  users: [
    { name: 'Carlos', email: 'pastran2526@gmail.com', role : 'ADMIN', password: '123456' },
    { name: 'idalia', email: 'pastran@gmail.com', role : 'CASHIER', password:  '123456' },
    // { name: 'Carlos', email: 'pastran25261@gmail.com', role : 'ADMIN', password: '123456' },
    // { name: 'Carlos', email: 'pastran25262@gmail.com', role : 'ADMIN', password: '123456' },
    // { name: 'Carlos', email: 'pastran25263@gmail.com', role : 'ADMIN', password: '123456' },
    // { name: 'Carlos', email: 'pastran25264@gmail.com', role : 'ADMIN', password: '123456' },
    // { name: 'Carlos', email: 'pastran25265@gmail.com', role : 'ADMIN', password: '123456' },
    // { name: 'Carlos', email: 'pastran25266@gmail.com', role : 'ADMIN', password: '123456' },
    // { name: 'Carlos', email: 'pastran25267@gmail.com', role : 'ADMIN', password: '123456' },
    // { name: 'Carlos', email: 'pastran25268@gmail.com', role : 'ADMIN', password: '123456' },
    // { name: 'Carlos', email: 'pastran25269@gmail.com', role : 'ADMIN', password: '123456' },
   
  ],

  employee: [
    { name: 'Maria' },
    { name: 'Marisol' },
    { name: 'flor' },
    { name: 'Julia' }
  ],

  products: [
    { name: 'Than', available: true, price: 75.0369, descripcion: 'daughter me move thumb claws lose supper strip animal teach additional definition why pitch help thus boy like every mud month are account dozen' },
    { name: 'Wagon', available: true, price: 1.9631,  descripcion: 'actual difficult nature yellow smile captain nervous to cause wolf strong neck fifteen wrote consider visit likely happened rear red review wash flag parent' },
    { name: 'Tone', available: true, price: 11.0312, descripcion: 'met certain specific detail deeply red forth tiny whatever what image parts deer difficulty pair mixture trouble forgotten fort dry listen strength got seldom' },
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
      "userSequenceArray": 1,           // this is a the postion in user array
      "denominations": [{
          "value": 1,
          "quantity": 1
        }, 
        {"value": 10,
          "quantity": 2
        }, 
        {"value": 0.10,
          "quantity": 2
        }],
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
      "amountToCharge": 8.5,
      "cashProvided": 10,
      "changeReturned": 1.5,
      "cashRegisterRecordSequenceArray": 2,        // this is a the postion in cashRegister array
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
      "amountToCharge": 23.25,
      "cashProvided": 50,
      "changeReturned": 26.75,
      "cashRegisterRecordSequenceArray": 2,        // this is a the postion in cashRegister array
      "employeeSequenceArray": 1,                  // this is a the postion in empleado array 
      "denominations": [
        {
          "value": 50,
          "quantity": 1
        }
      ],
      "note": "this is a note 2",
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
      "amount": 20,
      "reason": "dollar coins",
      "cashRegisterRecordSequenceArray": 2         // this is a the postion in cashRegister array
    }
  ],
  CloseCashRegister: [{
    "cashProvided": 23,
      "cash": 23,
      "difference": 0,
      "cashRegisterRecordSequenceArray": 1,        // this is a the postion in cashRegister array
      "userSequenceArray": 2,                                 // this is a the postion in user array
      "denominations": [],
      "note": "this is a opening note"
    },
    {
    "cashProvided": 72.85,
      "cash": 72.85,
      "difference": 0,
      "cashRegisterRecordSequenceArray": 2,        // this is a the postion in cashRegister array
      "userSequenceArray": 2,                                 // this is a the postion in user array
      "denominations": [
        {
          "value": 50,
          "quantity": 1
        },
        {
          "value": 20,
          "quantity": 1
        },
        {
          "value": 25,
          "quantity": 3
        },
        {
          "value": 10,
          "quantity": 1
        },
      ],
      "note": "this is a opening note"
    }]

}