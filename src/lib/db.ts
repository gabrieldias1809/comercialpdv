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

export type CashEventType = 'OPEN' | 'BLEED' | 'CLOSE';

export interface CashEvent {
  id: string;
  storeId: string;
  operatorPin: string;
  type: CashEventType;
  amount: number;
  note?: string;
  timestamp: Date;
  synced: boolean;
}

const db = new Dexie('MercadinhoDB') as Dexie & {
  transactions: EntityTable<SaleTransaction, 'id'>;
  operators: EntityTable<Operator, 'pin'>;
  cashEvents: EntityTable<CashEvent, 'id'>;
};

// Version 5 adds cashEvents
db.version(5).stores({
  transactions: 'id, storeId, timestamp, synced, operatorPin',
  operators: 'pin, storeId, role',
  cashEvents: 'id, storeId, type, timestamp, synced, operatorPin'
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
