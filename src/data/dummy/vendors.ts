import type { Vendor } from '@/types/accounting.types'

/** Six dummy vendors supplying goods and services */
export const DUMMY_VENDORS: Vendor[] = [
  {
    id: 'VEND-001',
    name: 'Amazon Web Services India',
    email: 'billing@aws.in',
    phone: '+91-1800-1082-266',
    address: 'Brigade Gateway, Malleshwaram, Bangalore, KA 560055',
  },
  {
    id: 'VEND-002',
    name: 'Microsoft India',
    email: 'invoices@microsoft.com',
    phone: '+91-22-6776-6776',
    address: 'Signature Building, Gurgaon, HR 122002',
  },
  {
    id: 'VEND-003',
    name: 'National Real Estate Pvt Ltd',
    email: 'leasing@nationalrealestate.in',
    phone: '+91-80-4163-2200',
    address: 'Koramangala, Bangalore, KA 560034',
  },
  {
    id: 'VEND-004',
    name: 'Bluedart Express',
    email: 'billing@bluedart.com',
    phone: '+91-22-6160-7070',
    address: 'Blue Dart Centre, Marol, Andheri East, Mumbai, MH 400059',
  },
  {
    id: 'VEND-005',
    name: 'Stationery World Pvt Ltd',
    email: 'orders@stationeryworld.in',
    phone: '+91-80-2553-4400',
    address: 'Chickpet, Bangalore, KA 560053',
  },
  {
    id: 'VEND-006',
    name: 'BESCOM (Electricity Board)',
    email: 'commercial@bescom.org',
    phone: '+91-80-2222-3777',
    address: 'K.R. Circle, Bangalore, KA 560001',
  },
]
