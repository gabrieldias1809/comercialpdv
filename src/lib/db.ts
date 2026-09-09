import Dexie, { type EntityTable } from 'dexie';

export type PaymentMethod = 'Dinheiro' | 'PIX' | 'Débito' | 'Crédito';

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

const db = new Dexie('MercadinhoDB') as Dexie & {
  transactions: EntityTable<
    SaleTransaction,
    'id'
  >;
};

// Schema declaration: only indexed fields need to be specified.
// We keep transactions as the store name to avoid breaking the previous IndexedDB
// if we wanted seamless migration, but since this is MVP we can just bump version and reset,
// or just use version 2 to add the new indexes.
db.version(2).stores({
  transactions: 'id, timestamp, synced, operatorPin' // Removed paymentMethod from top-level index since it's an array now
});

export { db };
