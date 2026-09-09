import Dexie, { type EntityTable } from 'dexie';

export type PaymentMethod = 'Dinheiro' | 'PIX' | 'Débito' | 'Crédito';
export type OperatorRole = 'admin' | 'operator';

export interface SaleItem {
  id: string;
  description: string;
  amount: number;
}

export interface SalePayment {
  id: string;
  method: PaymentMethod;
  amount: number;
}

export interface SaleTransaction {
  id: string;
  items: SaleItem[];
  payments: SalePayment[];
  totalAmount: number;
  operatorPin: string;
  timestamp: Date;
  synced: boolean;
}

export interface Operator {
  pin: string;
  name: string;
  role: OperatorRole;
}

const db = new Dexie('MercadinhoDB') as Dexie & {
  transactions: EntityTable<SaleTransaction, 'id'>;
  operators: EntityTable<Operator, 'pin'>;
};

// Version 3 adds the operators table
db.version(3).stores({
  transactions: 'id, timestamp, synced, operatorPin',
  operators: 'pin, role'
});

// Seed default admin operator if none exists
db.on('populate', () => {
  db.operators.add({
    pin: '0000',
    name: 'Gerente',
    role: 'admin'
  });
});

export { db };
