import type { Customer } from '@/types/accounting.types'

/** Five dummy customers across different industries */
export const DUMMY_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Infosys Limited',
    email: 'accounts@infosys.com',
    phone: '+91-80-2852-0261',
    address: 'Electronics City, Bangalore, KA 560100',
  },
  {
    id: 'CUST-002',
    name: 'Tata Consultancy Services',
    email: 'finance@tcs.com',
    phone: '+91-22-6778-9595',
    address: 'TCS House, Raveline Street, Mumbai, MH 400001',
  },
  {
    id: 'CUST-003',
    name: 'Wipro Technologies',
    email: 'ap@wipro.com',
    phone: '+91-80-2844-0011',
    address: 'Doddakannelli, Sarjapur Road, Bangalore, KA 560035',
  },
  {
    id: 'CUST-004',
    name: 'HCL Technologies',
    email: 'billing@hcl.com',
    phone: '+91-120-432-7000',
    address: 'A-10/11, Sector 3, Noida, UP 201301',
  },
  {
    id: 'CUST-005',
    name: 'Reliance Industries',
    email: 'procurement@ril.com',
    phone: '+91-22-3555-5000',
    address: 'Maker Chambers IV, Nariman Point, Mumbai, MH 400021',
  },
  {
    id: 'CUST-006',
    name: 'Tech Mahindra',
    email: 'accounts@techmahindra.com',
    phone: '+91-20-2542-3000',
    address: 'Gateway Building, Apollo Bunder, Mumbai, MH 400001',
  },
]
