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
  storeId: string;
  items: SaleItem[];
  payments: SalePayment[];
  totalAmount: number;
  operatorPin: string;
  timestamp: Date;
  synced: boolean;
}

export interface Operator {
  pin: string;
  storeId: string;
  name: string;
  role: OperatorRole;
}

const db = new Dexie('MercadinhoDB') as Dexie & {
  transactions: EntityTable<SaleTransaction, 'id'>;
  operators: EntityTable<Operator, 'pin'>;
};

// Version 4 adds storeId
db.version(4).stores({
  transactions: 'id, storeId, timestamp, synced, operatorPin',
  operators: 'pin, storeId, role'
});

// Seed default admin operator if none exists
db.on('populate', () => {
  db.operators.add({
    pin: '0000',
    storeId: 'demo-store',
    name: 'Gerente',
    role: 'admin'
  });
});

export { db };
