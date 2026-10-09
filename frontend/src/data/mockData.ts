

export const MOCK_CLIENTS = [
  { 
    id: 1, 
    name: "Alice Durant", 
    company: "Alpha Tech", 
    email: "alice@tech.fr", 
    phone: "06 12 34 56 78", 
    status: "Actif" 
  },
  { 
    id: 2, 
    name: "Marc Moulin", 
    company: "Indépendant", 
    email: "m.moulin@gmail.com", 
    phone: "07 88 99 00 11", 
    status: "En attente" 
  },
];

export const MOCK_DEALS = [
  { 
    id: 1, 
    title: "Refonte Site Web", 
    client: "Alpha Tech", 
    amount: "4,500 Ar", 
    stage: "lead", 
    date: "24/03/2026" 
  },
  { 
    id: 2, 
    title: "App Mobile", 
    client: "Vite Transport", 
    amount: "12,000 Ar", 
    stage: "proposal", 
    date: "30/03/2026" 
  },
];

export const MOCK_EVENTS = [
  { 
    id: 1, 
    day: 24, 
    month: 2, 
    title: "RDV Alpha", 
    type: "meeting", 
    client: "Alice", 
    time: "10:00" 
  },
];