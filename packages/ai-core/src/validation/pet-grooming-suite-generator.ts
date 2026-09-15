import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export class PetGroomingSuiteGenerator {
  public static generate(projectRoot: string, createdFiles: string[]) {
    const srcDir = join(projectRoot, "src");
    const pagesDir = join(srcDir, "pages");
    const dashDir = join(srcDir, "features", "dashboard");
    const servicesDir = join(srcDir, "services");
    const typesDir = join(srcDir, "types");
    const serverDir = join(projectRoot, "server");
    const prismaDir = join(projectRoot, "prisma");

    mkdirSync(pagesDir, { recursive: true });
    mkdirSync(dashDir, { recursive: true });
    mkdirSync(servicesDir, { recursive: true });
    mkdirSync(typesDir, { recursive: true });
    mkdirSync(serverDir, { recursive: true });
    mkdirSync(prismaDir, { recursive: true });

    // 1. src/types/index.ts
    const typesPath = join(typesDir, "index.ts");
    const typesContent = `export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  petCount?: number;
  totalSpent?: number;
}

export interface MedicalNote {
  id: string;
  petId: string;
  condition: string;
  allergies?: string;
  vaccinations?: string;
  notes?: string;
  createdAt: string;
}

export interface Pet {
  id: string;
  name: string;
  species: "Dog" | "Cat" | "Other";
  breed: string;
  age: number;
  weightKg: number;
  customerId: string;
  customerName: string;
  customerPhone: string;
  medicalNotes: MedicalNote[];
  groomingHistory?: string[];
  avatar?: string;
}

export interface Groomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  rating: number;
  available: boolean;
  activeAppointments: number;
  avatar: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  durationMins: number;
  price: number;
  category: "Grooming" | "Spa" | "Care" | "Treatment";
  perks: string[];
}

export interface Appointment {
  id: string;
  code: string;
  petId: string;
  petName: string;
  petBreed: string;
  customerName: string;
  customerPhone: string;
  groomerId: string;
  groomerName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: "Scheduled" | "In Progress" | "Completed" | "Cancelled";
  price: number;
  notes?: string;
}
`;
    writeFileSync(typesPath, typesContent, "utf8");
    createdFiles.push("src/types/index.ts");

    // 2. src/services/api.ts
    const apiPath = join(servicesDir, "api.ts");
    const apiContent = `import type { Customer, Pet, MedicalNote, Groomer, ServicePackage, Appointment } from "../types";

const INITIAL_CUSTOMERS: Customer[] = [
  { id: "c1", name: "Eleanor Vance", email: "eleanor.vance@example.com", phone: "+1 (555) 234-5678", address: "742 Evergreen Terrace", petCount: 1, totalSpent: 190 },
  { id: "c2", name: "Liam Hemsworth", email: "liam.h@example.com", phone: "+1 (555) 345-6789", address: "100 Ocean Blvd", petCount: 1, totalSpent: 85 },
  { id: "c3", name: "Sophia Martinez", email: "sophia.m@example.com", phone: "+1 (555) 456-7890", address: "45 Oakridge Lane", petCount: 1, totalSpent: 35 },
  { id: "c4", name: "Jackson Reed", email: "jackson.r@example.com", phone: "+1 (555) 567-8901", address: "1200 Market Street", petCount: 1, totalSpent: 95 },
];

const INITIAL_PETS: Pet[] = [
  {
    id: "p1",
    name: "Barnaby",
    species: "Dog",
    breed: "Golden Retriever",
    age: 4,
    weightKg: 32,
    customerId: "c1",
    customerName: "Eleanor Vance",
    customerPhone: "+1 (555) 234-5678",
    avatar: "🐕",
    medicalNotes: [
      { id: "m1", petId: "p1", condition: "Sensitive Skin", allergies: "Artificial fragrances", vaccinations: "Rabies, DHPP up-to-date (2026-08)", notes: "Use hypoallergenic oatmeal shampoo only.", createdAt: "2026-08-10" }
    ],
    groomingHistory: ["Full Luxe Spa (2026-08-10)", "De-shedding Treatment (2026-07-02)"]
  },
  {
    id: "p2",
    name: "Mochi",
    species: "Cat",
    breed: "Persian Longhair",
    age: 2,
    weightKg: 4.5,
    customerId: "c2",
    customerName: "Liam Hemsworth",
    customerPhone: "+1 (555) 345-6789",
    avatar: "🐱",
    medicalNotes: [
      { id: "m2", petId: "p2", condition: "Eye Tear Staining", allergies: "None", vaccinations: "FVRCP valid through 2027", notes: "Requires gentle facial wipe and comb.", createdAt: "2026-07-22" }
    ],
    groomingHistory: ["Feline Purrfect Spa (2026-07-22)"]
  },
  {
    id: "p3",
    name: "Ziggy",
    species: "Dog",
    breed: "French Bulldog",
    age: 3,
    weightKg: 13,
    customerId: "c3",
    customerName: "Sophia Martinez",
    customerPhone: "+1 (555) 456-7890",
    avatar: "🐶",
    medicalNotes: [
      { id: "m3", petId: "p3", condition: "Brachycephalic Airway", allergies: "Chicken protein", vaccinations: "All core vaccines current", notes: "Keep drying cycle cool and monitor breathing.", createdAt: "2026-09-01" }
    ],
    groomingHistory: ["Nail & Paw Care (2026-09-01)"]
  },
  {
    id: "p4",
    name: "Bella",
    species: "Dog",
    breed: "Standard Poodle",
    age: 5,
    weightKg: 24,
    customerId: "c4",
    customerName: "Jackson Reed",
    customerPhone: "+1 (555) 567-8901",
    avatar: "🐩",
    medicalNotes: [
      { id: "m4", petId: "p4", condition: "Healthy / No known issues", allergies: "None", vaccinations: "Bordetella & Rabies current", notes: "Owner requested Continental show trim.", createdAt: "2026-08-30" }
    ],
    groomingHistory: ["Show Trim & Bath (2026-08-30)"]
  }
];

const INITIAL_GROOMERS: Groomer[] = [
  { id: "g1", name: "Clara Oswald", email: "clara.o@pawlux.com", phone: "+1 (555) 912-3456", specialty: "Double Coat De-shedding & Large Breeds", rating: 4.98, available: true, activeAppointments: 2, avatar: "👩‍🦰" },
  { id: "g2", name: "Marcus Thorne", email: "marcus.t@pawlux.com", phone: "+1 (555) 823-4567", specialty: "Breed Standard Styling & Poodle Trims", rating: 4.92, available: true, activeAppointments: 1, avatar: "👨‍🦱" },
  { id: "g3", name: "Aria Chen", email: "aria.c@pawlux.com", phone: "+1 (555) 734-5678", specialty: "Feline Gentle Spa & Sensitive Skin Care", rating: 4.95, available: true, activeAppointments: 1, avatar: "👩" },
  { id: "g4", name: "Devon Miller", email: "devon.m@pawlux.com", phone: "+1 (555) 645-6789", specialty: "Puppy First Groom & Fear-Free Certified", rating: 4.89, available: false, activeAppointments: 0, avatar: "👨" }
];

const INITIAL_SERVICES: ServicePackage[] = [
  { id: "s1", name: "Full Luxe Spa & Styling", description: "Hydro-massage bath, blow-dry, breed custom haircut, ear hygiene, and blueberry facial.", durationMins: 90, price: 95, category: "Spa", perks: ["Hydrating Shampoo", "Nail Dremel Buffing", "Ear Cleaning", "Bandana & Fragrance"] },
  { id: "s2", name: "Double Coat De-Shedding Care", description: "Deep FURminator bath, undercoat rake blowout, and keratin conditioning mask.", durationMins: 75, price: 80, category: "Treatment", perks: ["Undercoat Blowout", "Keratin Treatment", "Paw Balm", "De-shedding Brushing"] },
  { id: "s3", name: "Puppy Gentle Intro Groom", description: "Warm bath, fluff dry, face/feet/sanitary trim, nail clipping, and positive reward intro.", durationMins: 45, price: 50, category: "Grooming", perks: ["Gentle Tearless Soap", "Nail Clip", "Sanitary Trim", "Puppy Treat Bag"] },
  { id: "s4", name: "Feline Purrfect Spa", description: "Waterless or warm bath for cats, sanitary trim, nail caps, and de-shed comb out.", durationMins: 60, price: 85, category: "Spa", perks: ["Quiet Room Suite", "Gentle Comb-out", "Nail Trimming", "Ear Cleanse"] },
  { id: "s5", name: "Nail & Paw Deep Restoration", description: "Nail grinding, paw pad trim, soothing organic shea butter massage.", durationMins: 30, price: 35, category: "Care", perks: ["Nail Dremel Buffing", "Paw Pad Trim", "Organic Shea Balm"] }
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: "a1", code: "APT-801", petId: "p1", petName: "Barnaby", petBreed: "Golden Retriever", customerName: "Eleanor Vance", customerPhone: "+1 (555) 234-5678", groomerId: "g1", groomerName: "Clara Oswald", serviceId: "s1", serviceName: "Full Luxe Spa & Styling", date: "2026-09-18", time: "10:00 AM", status: "Scheduled", price: 95, notes: "Use oatmeal shampoo." },
  { id: "a2", code: "APT-802", petId: "p2", petName: "Mochi", petBreed: "Persian Longhair", customerName: "Liam Hemsworth", customerPhone: "+1 (555) 345-6789", groomerId: "g3", groomerName: "Aria Chen", serviceId: "s4", serviceName: "Feline Purrfect Spa", date: "2026-09-18", time: "01:30 PM", status: "In Progress", price: 85, notes: "Quiet handling required." },
  { id: "a3", code: "APT-803", petId: "p3", petName: "Ziggy", petBreed: "French Bulldog", customerName: "Sophia Martinez", customerPhone: "+1 (555) 456-7890", groomerId: "g2", groomerName: "Marcus Thorne", serviceId: "s5", serviceName: "Nail & Paw Deep Restoration", date: "2026-09-19", time: "11:00 AM", status: "Scheduled", price: 35, notes: "Keep cool during drying." },
  { id: "a4", code: "APT-804", petId: "p4", petName: "Bella", petBreed: "Standard Poodle", customerName: "Jackson Reed", customerPhone: "+1 (555) 567-8901", groomerId: "g2", groomerName: "Marcus Thorne", serviceId: "s1", serviceName: "Full Luxe Spa & Styling", date: "2026-09-15", time: "03:00 PM", status: "Completed", price: 95, notes: "Show trim completed." }
];

function loadStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export const api = {
  // Pets
  async getPets(): Promise<Pet[]> {
    return loadStorage<Pet[]>("pawlux_pets", INITIAL_PETS);
  },
  async createPet(data: Omit<Pet, "id">): Promise<Pet> {
    const pets = await this.getPets();
    const newPet: Pet = {
      ...data,
      id: "p-" + Date.now(),
      medicalNotes: data.medicalNotes || [],
      groomingHistory: data.groomingHistory || ["Registration complete"]
    };
    const updated = [newPet, ...pets];
    saveStorage("pawlux_pets", updated);
    return newPet;
  },
  async updatePet(id: string, updates: Partial<Pet>): Promise<Pet> {
    const pets = await this.getPets();
    const index = pets.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Pet not found");
    pets[index] = { ...pets[index], ...updates };
    saveStorage("pawlux_pets", pets);
    return pets[index];
  },
  async addMedicalNote(petId: string, note: Omit<MedicalNote, "id" | "petId" | "createdAt">): Promise<MedicalNote> {
    const pets = await this.getPets();
    const pet = pets.find(p => p.id === petId);
    if (!pet) throw new Error("Pet not found");
    const newNote: MedicalNote = {
      ...note,
      id: "m-" + Date.now(),
      petId,
      createdAt: new Date().toISOString().split("T")[0]
    };
    pet.medicalNotes = [newNote, ...(pet.medicalNotes || [])];
    saveStorage("pawlux_pets", pets);
    return newNote;
  },

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return loadStorage<Appointment[]>("pawlux_appointments", INITIAL_APPOINTMENTS);
  },
  async createAppointment(data: Omit<Appointment, "id" | "code">): Promise<Appointment> {
    const appointments = await this.getAppointments();
    const newApt: Appointment = {
      ...data,
      id: "a-" + Date.now(),
      code: "APT-" + Math.floor(100 + Math.random() * 900)
    };
    const updated = [newApt, ...appointments];
    saveStorage("pawlux_appointments", updated);
    return newApt;
  },
  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const appointments = await this.getAppointments();
    const index = appointments.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Appointment not found");
    appointments[index] = { ...appointments[index], ...updates };
    saveStorage("pawlux_appointments", appointments);
    return appointments[index];
  },
  async deleteAppointment(id: string): Promise<boolean> {
    const appointments = await this.getAppointments();
    const filtered = appointments.filter(a => a.id !== id);
    saveStorage("pawlux_appointments", filtered);
    return true;
  },

  // Groomers
  async getGroomers(): Promise<Groomer[]> {
    return loadStorage<Groomer[]>("pawlux_groomers", INITIAL_GROOMERS);
  },
  async createGroomer(data: Omit<Groomer, "id" | "rating" | "activeAppointments">): Promise<Groomer> {
    const groomers = await this.getGroomers();
    const newGroomer: Groomer = {
      ...data,
      id: "g-" + Date.now(),
      rating: 5.0,
      activeAppointments: 0,
      avatar: "👩‍💼"
    };
    const updated = [...groomers, newGroomer];
    saveStorage("pawlux_groomers", updated);
    return newGroomer;
  },
  async updateGroomer(id: string, updates: Partial<Groomer>): Promise<Groomer> {
    const groomers = await this.getGroomers();
    const index = groomers.findIndex(g => g.id === id);
    if (index === -1) throw new Error("Groomer not found");
    groomers[index] = { ...groomers[index], ...updates };
    saveStorage("pawlux_groomers", groomers);
    return groomers[index];
  },

  // Services
  async getServices(): Promise<ServicePackage[]> {
    return loadStorage<ServicePackage[]>("pawlux_services", INITIAL_SERVICES);
  },
  async createService(data: Omit<ServicePackage, "id">): Promise<ServicePackage> {
    const services = await this.getServices();
    const newService: ServicePackage = {
      ...data,
      id: "s-" + Date.now()
    };
    const updated = [...services, newService];
    saveStorage("pawlux_services", updated);
    return newService;
  },
  async deleteService(id: string): Promise<boolean> {
    const services = await this.getServices();
    const filtered = services.filter(s => s.id !== id);
    saveStorage("pawlux_services", filtered);
    return true;
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return loadStorage<Customer[]>("pawlux_customers", INITIAL_CUSTOMERS);
  },
  async createCustomer(data: Omit<Customer, "id" | "petCount" | "totalSpent">): Promise<Customer> {
    const customers = await this.getCustomers();
    const newCustomer: Customer = {
      ...data,
      id: "c-" + Date.now(),
      petCount: 1,
      totalSpent: 0
    };
    const updated = [newCustomer, ...customers];
    saveStorage("pawlux_customers", updated);
    return newCustomer;
  }
};

export const apiClient = {
  get: async (url: string) => ({ data: [] }),
  post: async (url: string, data: any) => ({ data }),
};

export default api;
`;
    writeFileSync(apiPath, apiContent, "utf8");
    createdFiles.push("src/services/api.ts");

    // 3. src/features/dashboard/DashboardPage.tsx
    const dashPath = join(dashDir, "DashboardPage.tsx");
    const dashContent = `import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../../shared/components/Layout";
import api from "../../services/api";
import type { Appointment, Pet, Groomer, ServicePackage } from "../../types";

export function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [groomers, setGroomers] = useState<Groomer[]>([]);
  const [services, setServices] = useState<ServicePackage[]>([]);
  const [isQuickBookOpen, setIsQuickBookOpen] = useState(false);

  // Form state
  const [selectedPetId, setSelectedPetId] = useState("");
  const [selectedGroomerId, setSelectedGroomerId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [bookDate, setBookDate] = useState("2026-09-18");
  const [bookTime, setBookTime] = useState("11:00 AM");
  const [bookNotes, setBookNotes] = useState("");

  const refreshData = async () => {
    const [apts, pList, gList, sList] = await Promise.all([
      api.getAppointments(),
      api.getPets(),
      api.getGroomers(),
      api.getServices()
    ]);
    setAppointments(apts);
    setPets(pList);
    setGroomers(gList);
    setServices(sList);
    if (pList.length > 0 && !selectedPetId) setSelectedPetId(pList[0].id);
    if (gList.length > 0 && !selectedGroomerId) setSelectedGroomerId(gList[0].id);
    if (sList.length > 0 && !selectedServiceId) setSelectedServiceId(sList[0].id);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Compute live KPIs strictly from underlying state
  const todayAppointments = appointments.filter(a => a.date === "2026-09-18" && a.status !== "Cancelled");
  const upcomingAppointments = appointments.filter(a => a.status === "Scheduled" || a.status === "In Progress");
  const activePetsCount = pets.length;
  const availableGroomersCount = groomers.filter(g => g.available).length;
  const totalRevenue = appointments
    .filter(a => a.status !== "Cancelled")
    .reduce((acc, a) => acc + (a.price || 0), 0);
  const pendingBookingsCount = appointments.filter(a => a.status === "Scheduled").length;

  const handleQuickBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const pet = pets.find(p => p.id === selectedPetId);
    const groomer = groomers.find(g => g.id === selectedGroomerId);
    const service = services.find(s => s.id === selectedServiceId);
    if (!pet || !groomer || !service) return;

    await api.createAppointment({
      petId: pet.id,
      petName: pet.name,
      petBreed: pet.breed,
      customerName: pet.customerName,
      customerPhone: pet.customerPhone,
      groomerId: groomer.id,
      groomerName: groomer.name,
      serviceId: service.id,
      serviceName: service.name,
      date: bookDate,
      time: bookTime,
      status: "Scheduled",
      price: service.price,
      notes: bookNotes || "Standard spa booking"
    });

    setIsQuickBookOpen(false);
    setBookNotes("");
    await refreshData();
  };

  const handleStatusChange = async (aptId: string, newStatus: Appointment["status"]) => {
    await api.updateAppointment(aptId, { status: newStatus });
    await refreshData();
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 text-slate-100 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" /> Salon Active
              </span>
              <span className="text-xs text-slate-500">PawLux Pet Grooming Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Pet Grooming Operations Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Real-time salon overview, appointments calendar, pet medical notes, and groomer allocations.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsQuickBookOpen(true)}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              + Quick Book Appointment
            </button>
            <Link
              to="/pets"
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
            >
              🐾 Pet Directory
            </Link>
            <Link
              to="/appointments"
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
            >
              📅 Scheduling Calendar
            </Link>
          </div>
        </div>

        {/* Live KPI Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today's Appointments</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{todayAppointments.length}</span>
              <span className="text-xs text-emerald-400">{todayAppointments.length > 0 ? "Active Scheduled" : "No sessions today"}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{upcomingAppointments.length} total upcoming bookings</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Pets Registered</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-cyan-400">{activePetsCount}</span>
              <span className="text-xs text-cyan-400">In CRM</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">With full medical & allergy notes</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Groomers</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-400">{availableGroomersCount}</span>
              <span className="text-xs text-slate-400">of {groomers.length} on duty</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Ready for appointment intake</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Salon Volume</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-400">\${totalRevenue.toLocaleString()}</span>
              <span className="text-xs text-emerald-400">Revenue</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{pendingBookingsCount} pending confirmations</p>
          </div>
        </div>

        {/* Main Content: Today & Upcoming Appointments + Groomers Roster */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/50 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Upcoming Grooming Sessions</h2>
                <p className="text-xs text-slate-400">Scheduled appointments with assigned groomer & treatment package</p>
              </div>
              <Link to="/appointments" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">View Calendar →</Link>
            </div>

            <div className="divide-y divide-slate-800/80">
              {appointments.slice(0, 5).map(apt => (
                <div key={apt.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl">
                      {apt.petBreed.includes("Cat") || apt.petBreed.includes("Persian") ? "🐱" : "🐕"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{apt.petName}</span>
                        <span className="text-xs text-slate-400">({apt.petBreed})</span>
                        <span className={\`px-2 py-0.5 rounded-full text-[10px] font-semibold border \${
                          apt.status === "Scheduled" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                          apt.status === "In Progress" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          apt.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          "bg-red-500/10 text-red-400 border-red-500/20"
                        }\`}>{apt.status}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        <span className="text-slate-300 font-medium">{apt.serviceName}</span> • Groomer: <span className="text-white font-medium">{apt.groomerName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        📅 {apt.date} at {apt.time} • Client: {apt.customerName} ({apt.customerPhone})
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-sm font-mono font-bold text-emerald-400 mr-2">\${apt.price}</span>
                    {apt.status === "Scheduled" && (
                      <button
                        onClick={() => handleStatusChange(apt.id, "In Progress")}
                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium border border-amber-500/30 transition cursor-pointer"
                      >
                        Start
                      </button>
                    )}
                    {apt.status === "In Progress" && (
                      <button
                        onClick={() => handleStatusChange(apt.id, "Completed")}
                        className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition cursor-pointer"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Groomers on Duty Panel */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-bold text-white">Groomer Staff Roster</h2>
                <Link to="/groomers" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">All Groomers →</Link>
              </div>
              <div className="space-y-3">
                {groomers.map(g => (
                  <div key={g.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{g.avatar}</span>
                      <div>
                        <div className="font-bold text-sm text-white">{g.name}</div>
                        <div className="text-[11px] text-slate-400">{g.specialty}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={\`px-2 py-0.5 rounded-full text-[10px] font-semibold border \${
                        g.available ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-700"
                      }\`}>
                        {g.available ? "Available" : "Off Duty"}
                      </span>
                      <div className="text-[10px] text-amber-400 font-mono mt-1">★ {g.rating}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 text-center mt-4">
              ✨ Fear-Free Certified Pet Grooming & Spa Facility
            </div>
          </div>
        </div>

        {/* Quick Book Modal */}
        {isQuickBookOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base">📅 Book Grooming Appointment</h3>
                <button onClick={() => setIsQuickBookOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleQuickBook} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Select Pet *</label>
                  <select
                    value={selectedPetId}
                    onChange={e => setSelectedPetId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  >
                    {pets.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.breed}) — Owner: {p.customerName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Select Groomer *</label>
                  <select
                    value={selectedGroomerId}
                    onChange={e => setSelectedGroomerId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  >
                    {groomers.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.specialty})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Select Service Package *</label>
                  <select
                    value={selectedServiceId}
                    onChange={e => setSelectedServiceId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} — \${s.price} ({s.durationMins} min)</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Date *</label>
                    <input
                      type="date"
                      value={bookDate}
                      onChange={e => setBookDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Time Slot *</label>
                    <input
                      type="text"
                      value={bookTime}
                      onChange={e => setBookTime(e.target.value)}
                      className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Special Notes / Medical Instructions</label>
                  <textarea
                    rows={2}
                    value={bookNotes}
                    onChange={e => setBookNotes(e.target.value)}
                    placeholder="e.g. Sensitive ears, use hypoallergenic shampoo..."
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button type="button" onClick={() => setIsQuickBookOpen(false)} className="px-3 py-1.5 rounded bg-slate-800 text-slate-300">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded bg-cyan-500 text-slate-950 font-bold">Confirm Booking</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default DashboardPage;
`;
    writeFileSync(dashPath, dashContent, "utf8");
    createdFiles.push("src/features/dashboard/DashboardPage.tsx");

    // 4. src/pages/AppointmentsPage.tsx
    const aptPagePath = join(pagesDir, "AppointmentsPage.tsx");
    const aptPageContent = `import React, { useState, useEffect } from "react";
import Layout from "../shared/components/Layout";
import api from "../services/api";
import type { Appointment, Pet, Groomer, ServicePackage } from "../types";

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [groomers, setGroomers] = useState<Groomer[]>([]);
  const [services, setServices] = useState<ServicePackage[]>([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const [formPetId, setFormPetId] = useState("");
  const [formGroomerId, setFormGroomerId] = useState("");
  const [formServiceId, setFormServiceId] = useState("");
  const [formDate, setFormDate] = useState("2026-09-18");
  const [formTime, setFormTime] = useState("10:00 AM");
  const [formNotes, setFormNotes] = useState("");

  const refreshData = async () => {
    const [aList, pList, gList, sList] = await Promise.all([
      api.getAppointments(),
      api.getPets(),
      api.getGroomers(),
      api.getServices()
    ]);
    setAppointments(aList);
    setPets(pList);
    setGroomers(gList);
    setServices(sList);
    if (pList.length > 0 && !formPetId) setFormPetId(pList[0].id);
    if (gList.length > 0 && !formGroomerId) setFormGroomerId(gList[0].id);
    if (sList.length > 0 && !formServiceId) setFormServiceId(sList[0].id);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filtered = appointments.filter(a => filterStatus === "All" || a.status === filterStatus);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const pet = pets.find(p => p.id === formPetId);
    const groomer = groomers.find(g => g.id === formGroomerId);
    const service = services.find(s => s.id === formServiceId);
    if (!pet || !groomer || !service) return;

    await api.createAppointment({
      petId: pet.id,
      petName: pet.name,
      petBreed: pet.breed,
      customerName: pet.customerName,
      customerPhone: pet.customerPhone,
      groomerId: groomer.id,
      groomerName: groomer.name,
      serviceId: service.id,
      serviceName: service.name,
      date: formDate,
      time: formTime,
      status: "Scheduled",
      price: service.price,
      notes: formNotes || "Scheduled via calendar"
    });

    setIsCreateOpen(false);
    setFormNotes("");
    await refreshData();
  };

  const handleStatusChange = async (aptId: string, status: Appointment["status"]) => {
    await api.updateAppointment(aptId, { status });
    if (selectedApt && selectedApt.id === aptId) {
      setSelectedApt({ ...selectedApt, status });
    }
    await refreshData();
  };

  const handleDelete = async (aptId: string) => {
    await api.deleteAppointment(aptId);
    setSelectedApt(null);
    await refreshData();
  };

  // Calendar dates mock generator for September 2026
  const calendarDays = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27];

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-slate-100 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Appointments & Salon Scheduling Calendar</h1>
            <p className="text-xs text-slate-400 mt-1">Book new grooming slots, assign specialized groomers, and monitor service statuses</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
              <button
                onClick={() => setViewMode("calendar")}
                className={\`px-3 py-1.5 rounded-md font-medium transition cursor-pointer \${
                  viewMode === "calendar" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                }\`}
              >
                📅 Calendar View
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={\`px-3 py-1.5 rounded-md font-medium transition cursor-pointer \${
                  viewMode === "list" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                }\`}
              >
                📋 Table List
              </button>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              + Create Appointment
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Status Filter:</span>
            {["All", "Scheduled", "In Progress", "Completed", "Cancelled"].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={\`px-3 py-1 rounded-lg font-medium transition cursor-pointer \${
                  filterStatus === st ? "bg-slate-800 text-cyan-400 border border-slate-700 font-bold" : "text-slate-400 hover:text-slate-200"
                }\`}
              >
                {st}
              </button>
            ))}
          </div>
          <div className="text-slate-400">
            Showing <span className="text-white font-bold">{filtered.length}</span> appointments
          </div>
        </div>

        {/* Calendar Mode */}
        {viewMode === "calendar" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-sm font-bold text-white mb-3">September 2026 — Salon Booking Grid</div>
              <div className="grid grid-cols-7 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-slate-500 py-1">{d}</div>
                ))}
                {calendarDays.map(day => {
                  const dateStr = \`2026-09-\${day < 10 ? "0" + day : day}\`;
                  const dayApts = appointments.filter(a => a.date === dateStr);
                  const isToday = dateStr === "2026-09-18";
                  return (
                    <div
                      key={day}
                      className={\`min-h-[110px] p-2 rounded-xl border flex flex-col justify-between \${
                        isToday ? "bg-slate-900 border-cyan-500/50 shadow-cyan-500/10 shadow-lg" : "bg-slate-950/60 border-slate-800/80"
                      }\`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className={\`font-bold \${isToday ? "text-cyan-400" : "text-slate-300"}\`}>{day}</span>
                        {isToday && <span className="text-[9px] px-1 bg-cyan-500/20 text-cyan-400 rounded">Today</span>}
                      </div>
                      <div className="space-y-1 mt-1 flex-1">
                        {dayApts.map(a => (
                          <div
                            key={a.id}
                            onClick={() => setSelectedApt(a)}
                            className={\`p-1 rounded text-[10px] truncate cursor-pointer transition border \${
                              a.status === "Scheduled" ? "bg-cyan-950/60 text-cyan-300 border-cyan-800" :
                              a.status === "In Progress" ? "bg-amber-950/60 text-amber-300 border-amber-800" :
                              a.status === "Completed" ? "bg-emerald-950/60 text-emerald-300 border-emerald-800" :
                              "bg-red-950/60 text-red-300 border-red-800"
                            }\`}
                          >
                            {a.time} - {a.petName}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* List / Table Mode */}
        {viewMode === "list" && (
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Pet & Owner</th>
                    <th className="p-3.5">Service Package</th>
                    <th className="p-3.5">Groomer</th>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filtered.map(apt => (
                    <tr key={apt.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono text-cyan-400 font-bold">{apt.code}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{apt.petName}</div>
                        <div className="text-[11px] text-slate-400">{apt.customerName}</div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-200">{apt.serviceName}</td>
                      <td className="p-3.5 text-slate-300">{apt.groomerName}</td>
                      <td className="p-3.5 font-mono text-slate-400">{apt.date} at {apt.time}</td>
                      <td className="p-3.5 font-mono font-bold text-emerald-400">\${apt.price}</td>
                      <td className="p-3.5">
                        <span className={\`px-2 py-0.5 rounded-full text-[10px] font-semibold border \${
                          apt.status === "Scheduled" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                          apt.status === "In Progress" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          apt.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          "bg-red-500/10 text-red-400 border-red-500/20"
                        }\`}>{apt.status}</span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button onClick={() => setSelectedApt(apt)} className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer">Details</button>
                        <button onClick={() => handleDelete(apt.id)} className="text-red-400 hover:text-red-300 font-semibold cursor-pointer">Cancel</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Appointment Details Modal */}
        {selectedApt && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-xs text-cyan-400 font-bold">{selectedApt.code}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Appointment with {selectedApt.petName}</h3>
                </div>
                <button onClick={() => setSelectedApt(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-500">Service:</span><span className="text-white font-semibold">{selectedApt.serviceName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Assigned Groomer:</span><span className="text-white font-semibold">{selectedApt.groomerName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Scheduled Time:</span><span className="text-white font-mono">{selectedApt.date} at {selectedApt.time}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Client Info:</span><span className="text-white">{selectedApt.customerName} ({selectedApt.customerPhone})</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Fee:</span><span className="text-emerald-400 font-bold font-mono">\${selectedApt.price}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Status:</span><span className="text-cyan-400 font-semibold">{selectedApt.status}</span></div>
                </div>
                {selectedApt.notes && (
                  <div>
                    <h4 className="font-semibold text-slate-300 mb-1">Special Handling Notes</h4>
                    <p className="text-slate-400 p-2.5 rounded-lg bg-slate-950 border border-slate-800">{selectedApt.notes}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-slate-300 mb-1.5">Update Status</h4>
                  <div className="flex gap-2">
                    {(["Scheduled", "In Progress", "Completed", "Cancelled"] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(selectedApt.id, st)}
                        className={\`flex-1 py-1.5 rounded text-[11px] font-semibold transition cursor-pointer \${
                          selectedApt.status === st ? "bg-cyan-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }\`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between">
                <button onClick={() => handleDelete(selectedApt.id)} className="px-3 py-1.5 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-semibold">Delete Booking</button>
                <button onClick={() => setSelectedApt(null)} className="px-4 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-medium">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Create Appointment Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base">+ New Grooming Booking</h3>
                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Select Pet *</label>
                  <select
                    value={formPetId}
                    onChange={e => setFormPetId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  >
                    {pets.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.breed}) — Owner: {p.customerName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Select Groomer *</label>
                  <select
                    value={formGroomerId}
                    onChange={e => setFormGroomerId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  >
                    {groomers.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.specialty})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Select Service *</label>
                  <select
                    value={formServiceId}
                    onChange={e => setFormServiceId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} — \${s.price} ({s.durationMins} min)</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Date *</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Time Slot *</label>
                    <input
                      type="text"
                      value={formTime}
                      onChange={e => setFormTime(e.target.value)}
                      className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Special Handling Instructions</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    placeholder="Medical alerts, temperaments, trim instructions..."
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="px-3 py-1.5 rounded bg-slate-800 text-slate-300">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded bg-cyan-500 text-slate-950 font-bold">Schedule Appointment</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AppointmentsPage;
`;
    writeFileSync(aptPagePath, aptPageContent, "utf8");
    createdFiles.push("src/pages/AppointmentsPage.tsx");

    // 5. src/pages/PetsPage.tsx
    const petsPagePath = join(pagesDir, "PetsPage.tsx");
    const petsPageContent = `import React, { useState, useEffect } from "react";
import Layout from "../shared/components/Layout";
import api from "../services/api";
import type { Pet } from "../types";

export function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  // Add Pet Form
  const [petForm, setPetForm] = useState({
    name: "",
    species: "Dog" as "Dog" | "Cat" | "Other",
    breed: "",
    age: 3,
    weightKg: 15,
    customerName: "",
    customerPhone: "",
    condition: "Healthy",
    allergies: "",
    vaccinations: "Core vaccines up to date",
    notes: ""
  });

  // Medical Note Form
  const [noteForm, setNoteForm] = useState({
    condition: "",
    allergies: "",
    vaccinations: "",
    notes: ""
  });

  const refreshPets = async () => {
    const list = await api.getPets();
    setPets(list);
    if (selectedPet) {
      const refreshed = list.find(p => p.id === selectedPet.id);
      if (refreshed) setSelectedPet(refreshed);
    }
  };

  useEffect(() => {
    refreshPets();
  }, []);

  const filteredPets = pets.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.breed.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase());
    const matchSpecies = speciesFilter === "All" || p.species === speciesFilter;
    return matchSearch && matchSpecies;
  });

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petForm.name || !petForm.breed || !petForm.customerName) return;

    await api.createPet({
      name: petForm.name,
      species: petForm.species,
      breed: petForm.breed,
      age: petForm.age,
      weightKg: petForm.weightKg,
      customerId: "c-" + Date.now(),
      customerName: petForm.customerName,
      customerPhone: petForm.customerPhone || "+1 (555) 000-0000",
      avatar: petForm.species === "Cat" ? "🐱" : "🐕",
      medicalNotes: [
        {
          id: "m-" + Date.now(),
          petId: "",
          condition: petForm.condition,
          allergies: petForm.allergies || "None reported",
          vaccinations: petForm.vaccinations,
          notes: petForm.notes || "Initial intake notes",
          createdAt: new Date().toISOString().split("T")[0]
        }
      ],
      groomingHistory: ["Intake registered"]
    });

    setIsAddOpen(false);
    setPetForm({
      name: "",
      species: "Dog",
      breed: "",
      age: 3,
      weightKg: 15,
      customerName: "",
      customerPhone: "",
      condition: "Healthy",
      allergies: "",
      vaccinations: "Core vaccines up to date",
      notes: ""
    });
    await refreshPets();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet || !noteForm.condition) return;

    await api.addMedicalNote(selectedPet.id, {
      condition: noteForm.condition,
      allergies: noteForm.allergies,
      vaccinations: noteForm.vaccinations,
      notes: noteForm.notes
    });

    setIsNoteOpen(false);
    setNoteForm({ condition: "", allergies: "", vaccinations: "", notes: "" });
    await refreshPets();
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-slate-100 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Pet Client Profiles & Medical Records</h1>
            <p className="text-xs text-slate-400 mt-1">Manage pet records, allergies, vaccination verification, and grooming histories</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            + Register New Pet
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Search by pet name, breed, or owner..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Species:</span>
            {["All", "Dog", "Cat"].map(sp => (
              <button
                key={sp}
                onClick={() => setSpeciesFilter(sp)}
                className={\`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer \${
                  speciesFilter === sp ? "bg-slate-800 text-cyan-400 border border-slate-700 font-bold" : "text-slate-400 hover:text-slate-200"
                }\`}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>

        {/* Pets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPets.map(p => (
            <div key={p.id} className="rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between p-5 shadow-lg space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{p.avatar || "🐾"}</span>
                  <div>
                    <h3 className="font-bold text-white text-base">{p.name}</h3>
                    <p className="text-xs text-cyan-400 font-medium">{p.breed} • {p.species}</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {p.age} yrs • {p.weightKg} kg
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">Owner:</span><span className="text-white font-semibold">{p.customerName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Phone:</span><span className="text-slate-300">{p.customerPhone}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Medical Notes:</span><span className="text-amber-400 font-medium">{p.medicalNotes?.length || 0} alert(s)</span></div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex gap-2">
                <button
                  onClick={() => setSelectedPet(p)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold transition cursor-pointer"
                >
                  Medical & History →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pet Details & Medical History Modal */}
        {selectedPet && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedPet.avatar || "🐾"}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedPet.name}</h3>
                    <p className="text-xs text-slate-400">{selectedPet.breed} • Owned by {selectedPet.customerName}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPet(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-2 text-center">
                  <div><span className="text-slate-500 block text-[10px]">Age</span><span className="font-bold text-white">{selectedPet.age} Years</span></div>
                  <div><span className="text-slate-500 block text-[10px]">Weight</span><span className="font-bold text-white">{selectedPet.weightKg} kg</span></div>
                  <div><span className="text-slate-500 block text-[10px]">Species</span><span className="font-bold text-cyan-400">{selectedPet.species}</span></div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-white">🏥 Medical Alerts & Allergies</h4>
                    <button
                      onClick={() => setIsNoteOpen(true)}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                    >
                      + Add Medical Note
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selectedPet.medicalNotes && selectedPet.medicalNotes.length > 0 ? (
                      selectedPet.medicalNotes.map(m => (
                        <div key={m.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <div className="flex justify-between font-semibold text-white">
                            <span>{m.condition}</span>
                            <span className="text-[10px] text-slate-500">{m.createdAt}</span>
                          </div>
                          {m.allergies && <div className="text-amber-400">⚠️ Allergies: {m.allergies}</div>}
                          {m.vaccinations && <div className="text-slate-400">💉 Vaccinations: {m.vaccinations}</div>}
                          {m.notes && <div className="text-slate-400 italic">Notes: {m.notes}</div>}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 italic p-3 rounded-xl bg-slate-950 border border-slate-800">No medical alerts recorded.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-2">✂️ Grooming History</h4>
                  <ul className="space-y-1 list-disc list-inside text-slate-400 p-3 rounded-xl bg-slate-950 border border-slate-800">
                    {(selectedPet.groomingHistory || ["Recent spa styling completed"]).map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button onClick={() => setSelectedPet(null)} className="px-4 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-medium">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Medical Note Modal */}
        {isNoteOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base">Add Medical / Allergy Note</h3>
                <button onClick={() => setIsNoteOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleAddNote} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Health Condition / Skin Sensitivity *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Sensitive dry skin, Arthritis in hips"
                    value={noteForm.condition}
                    onChange={e => setNoteForm({ ...noteForm, condition: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Known Allergies</label>
                  <input
                    type="text"
                    placeholder="e.g. Lavender, Perfumed shampoos"
                    value={noteForm.allergies}
                    onChange={e => setNoteForm({ ...noteForm, allergies: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Vaccination Status</label>
                  <input
                    type="text"
                    placeholder="e.g. Rabies, DHPP up to date (2027)"
                    value={noteForm.vaccinations}
                    onChange={e => setNoteForm({ ...noteForm, vaccinations: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Special Grooming Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="Instructions for groomer during drying & scissoring..."
                    value={noteForm.notes}
                    onChange={e => setNoteForm({ ...noteForm, notes: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button type="button" onClick={() => setIsNoteOpen(false)} className="px-3 py-1.5 rounded bg-slate-800 text-slate-300">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded bg-cyan-500 text-slate-950 font-bold">Save Medical Note</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Pet Modal */}
        {isAddOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base">🐾 Register New Pet Client</h3>
                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleAddPet} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Pet Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Barnaby"
                      value={petForm.name}
                      onChange={e => setPetForm({ ...petForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Species</label>
                    <select
                      value={petForm.species}
                      onChange={e => setPetForm({ ...petForm, species: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                    >
                      <option value="Dog">Dog</option>
                      <option value="Cat">Cat</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Breed *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Golden Retriever"
                    value={petForm.breed}
                    onChange={e => setPetForm({ ...petForm, breed: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Age (Years)</label>
                    <input
                      type="number"
                      value={petForm.age}
                      onChange={e => setPetForm({ ...petForm, age: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={petForm.weightKg}
                      onChange={e => setPetForm({ ...petForm, weightKg: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Owner Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Eleanor Vance"
                      value={petForm.customerName}
                      onChange={e => setPetForm({ ...petForm, customerName: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Owner Phone</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 234-5678"
                      value={petForm.customerPhone}
                      onChange={e => setPetForm({ ...petForm, customerPhone: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Allergies / Special Medical Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Sensitive skin, use oatmeal shampoo"
                    value={petForm.allergies}
                    onChange={e => setPetForm({ ...petForm, allergies: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button type="button" onClick={() => setIsAddOpen(false)} className="px-3 py-1.5 rounded bg-slate-800 text-slate-300">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded bg-cyan-500 text-slate-950 font-bold">Register Pet</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default PetsPage;
`;
    writeFileSync(petsPagePath, petsPageContent, "utf8");
    createdFiles.push("src/pages/PetsPage.tsx");

    // 6. src/pages/GroomersPage.tsx
    const groomerPagePath = join(pagesDir, "GroomersPage.tsx");
    const groomerPageContent = `import React, { useState, useEffect } from "react";
import Layout from "../shared/components/Layout";
import api from "../services/api";
import type { Groomer } from "../types";

export function GroomersPage() {
  const [groomers, setGroomers] = useState<Groomer[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "Breed Standard Styling & Poodle Trims",
    available: true
  });

  const refreshGroomers = async () => {
    const list = await api.getGroomers();
    setGroomers(list);
  };

  useEffect(() => {
    refreshGroomers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    await api.createGroomer({
      name: form.name,
      email: form.email,
      phone: form.phone || "+1 (555) 000-0000",
      specialty: form.specialty,
      available: form.available,
      avatar: "👩‍💼"
    });

    setIsAddOpen(false);
    setForm({ name: "", email: "", phone: "", specialty: "Breed Standard Styling & Poodle Trims", available: true });
    await refreshGroomers();
  };

  const toggleAvailability = async (g: Groomer) => {
    await api.updateGroomer(g.id, { available: !g.available });
    await refreshGroomers();
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-slate-100 font-sans">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Groomer Staff & Stylist Roster</h1>
            <p className="text-xs text-slate-400 mt-1">Manage stylist profiles, specialty certifications, ratings, and active salon shifts</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            + Add Groomer
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groomers.map(g => (
            <div key={g.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between shadow-lg space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{g.avatar}</span>
                    <div>
                      <h3 className="font-bold text-white text-base">{g.name}</h3>
                      <p className="text-xs text-amber-400 font-semibold">★ {g.rating} Rating</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAvailability(g)}
                    className={\`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer \${
                      g.available ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-700"
                    }\`}
                  >
                    {g.available ? "✓ Available" : "Off Duty"}
                  </button>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-500">Specialty:</span><span className="text-cyan-400 font-medium text-right">{g.specialty}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Email:</span><span className="text-slate-300 font-mono">{g.email}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Phone:</span><span className="text-slate-300">{g.phone}</span></div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">Active Bookings:</span>
                <span className="font-bold text-white">{g.activeAppointments} sessions</span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Groomer Modal */}
        {isAddOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base">+ Add New Stylist / Groomer</h3>
                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleAdd} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Clara Oswald"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    placeholder="clara@pawlux.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 912-3456"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Specialty</label>
                  <input
                    type="text"
                    placeholder="e.g. Double Coat De-shedding & Large Breeds"
                    value={form.specialty}
                    onChange={e => setForm({ ...form, specialty: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button type="button" onClick={() => setIsAddOpen(false)} className="px-3 py-1.5 rounded bg-slate-800 text-slate-300">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded bg-cyan-500 text-slate-950 font-bold">Save Groomer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default GroomersPage;
`;
    writeFileSync(groomerPagePath, groomerPageContent, "utf8");
    createdFiles.push("src/pages/GroomersPage.tsx");

    // 7. src/pages/ServicesPage.tsx
    const servicePagePath = join(pagesDir, "ServicesPage.tsx");
    const servicePageContent = `import React, { useState, useEffect } from "react";
import Layout from "../shared/components/Layout";
import api from "../services/api";
import type { ServicePackage } from "../types";

export function ServicesPage() {
  const [services, setServices] = useState<ServicePackage[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    durationMins: 60,
    price: 75,
    category: "Spa" as "Grooming" | "Spa" | "Care" | "Treatment",
    perk1: "Hydro-Massage Bath",
    perk2: "Nail Buffing & Ear Cleaning"
  });

  const refreshServices = async () => {
    const list = await api.getServices();
    setServices(list);
  };

  useEffect(() => {
    refreshServices();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;

    await api.createService({
      name: form.name,
      description: form.description || "Premium pet grooming service package",
      durationMins: Number(form.durationMins),
      price: Number(form.price),
      category: form.category,
      perks: [form.perk1, form.perk2].filter(Boolean)
    });

    setIsAddOpen(false);
    setForm({ name: "", description: "", durationMins: 60, price: 75, category: "Spa", perk1: "Hydro-Massage Bath", perk2: "Nail Buffing & Ear Cleaning" });
    await refreshServices();
  };

  const handleDelete = async (id: string) => {
    await api.deleteService(id);
    await refreshServices();
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-slate-100 font-sans">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Grooming & Spa Service Packages</h1>
            <p className="text-xs text-slate-400 mt-1">Configure service catalog, bath & trim packages, durations, and pricing</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            + Add Service Package
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(s => (
            <div key={s.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between shadow-lg space-y-4">
              <div>
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{s.category}</span>
                  <div className="text-right">
                    <span className="font-mono text-xl font-bold text-emerald-400">\${s.price}</span>
                    <span className="text-[10px] text-slate-500 block">{s.durationMins} Mins</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mt-2">{s.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{s.description}</p>

                <div className="mt-4 pt-3 border-t border-slate-800 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Included in Package:</span>
                  {s.perks.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="text-emerald-400 text-xs">✓</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">ID: {s.id}</span>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-xs text-red-400 hover:text-red-300 font-medium transition cursor-pointer"
                >
                  Delete Package
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Service Modal */}
        {isAddOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base">+ Add New Service Package</h3>
                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleAdd} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Package Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. De-Shedding Deluxe Spa"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Price ($) *</label>
                    <input
                      required
                      type="number"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Duration (Minutes)</label>
                    <input
                      type="number"
                      value={form.durationMins}
                      onChange={e => setForm({ ...form, durationMins: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Description of treatment and steps..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Included Perks</label>
                  <input
                    type="text"
                    value={form.perk1}
                    onChange={e => setForm({ ...form, perk1: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white mb-2"
                  />
                  <input
                    type="text"
                    value={form.perk2}
                    onChange={e => setForm({ ...form, perk2: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button type="button" onClick={() => setIsAddOpen(false)} className="px-3 py-1.5 rounded bg-slate-800 text-slate-300">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded bg-cyan-500 text-slate-950 font-bold">Publish Package</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ServicesPage;
`;
    writeFileSync(servicePagePath, servicePageContent, "utf8");
    createdFiles.push("src/pages/ServicesPage.tsx");

    // 8. src/pages/CustomersPage.tsx
    const customerPagePath = join(pagesDir, "CustomersPage.tsx");
    const customerPageContent = `import React, { useState, useEffect } from "react";
import Layout from "../shared/components/Layout";
import api from "../services/api";
import type { Customer, Pet } from "../types";

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  const refreshData = async () => {
    const [cList, pList] = await Promise.all([
      api.getCustomers(),
      api.getPets()
    ]);
    setCustomers(cList);
    setPets(pList);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    await api.createCustomer({
      name: form.name,
      email: form.email,
      phone: form.phone || "+1 (555) 000-0000",
      address: form.address || "Local Client"
    });

    setIsAddOpen(false);
    setForm({ name: "", email: "", phone: "", address: "" });
    await refreshData();
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-slate-100 font-sans">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Pet Owner / Customer CRM</h1>
            <p className="text-xs text-slate-400 mt-1">Directory of registered pet parents, linked pets, and contact details</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            + Add Customer
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map(c => {
            const customerPets = pets.filter(p => p.customerName === c.name || p.customerId === c.id);
            return (
              <div key={c.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between shadow-lg space-y-4">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-base">{c.name}</h3>
                      <p className="text-xs text-slate-400">{c.email}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                      \${c.totalSpent || 0} Spent
                    </span>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-slate-500">Phone:</span><span className="text-slate-300">{c.phone}</span></div>
                    {c.address && <div className="flex justify-between"><span className="text-slate-500">Address:</span><span className="text-slate-300 truncate max-w-[180px]">{c.address}</span></div>}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Registered Pets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {customerPets.length > 0 ? (
                        customerPets.map(p => (
                          <span key={p.id} className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-white flex items-center gap-1 border border-slate-700">
                            <span>{p.avatar || "🐾"}</span>
                            <span>{p.name}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 italic">No pets linked</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <span className="text-[10px] text-slate-500">Customer ID: {c.id}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Customer Modal */}
        {isAddOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base">+ Add New Customer</h3>
                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleAdd} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Eleanor Vance"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    placeholder="eleanor@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 234-5678"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="742 Evergreen Terrace"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button type="button" onClick={() => setIsAddOpen(false)} className="px-3 py-1.5 rounded bg-slate-800 text-slate-300">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded bg-cyan-500 text-slate-950 font-bold">Save Customer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default CustomersPage;
`;
    writeFileSync(customerPagePath, customerPageContent, "utf8");
    createdFiles.push("src/pages/CustomersPage.tsx");

    // 9. src/routes.tsx
    const routesPath = join(srcDir, "routes.tsx");
    const routesContent = `import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./features/dashboard/DashboardPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import PetsPage from "./pages/PetsPage";
import GroomersPage from "./pages/GroomersPage";
import ServicesPage from "./pages/ServicesPage";
import CustomersPage from "./pages/CustomersPage";

export function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-sans">Loading PawLux Spa...</div>}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/calendar" element={<AppointmentsPage />} />
        <Route path="/pets" element={<PetsPage />} />
        <Route path="/groomers" element={<GroomersPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/packages" element={<ServicesPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export const routes = AppRoutes;
export default AppRoutes;
`;
    writeFileSync(routesPath, routesContent, "utf8");
    createdFiles.push("src/routes.tsx");

    // 10. prisma/schema.prisma
    const prismaPath = join(prismaDir, "schema.prisma");
    let prismaContent = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      String   @default("client")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Customer {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  phone     String
  address   String?
  pets      Pet[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Pet {
  id             String          @id @default(uuid())
  name           String
  species        String          @default("Dog")
  breed          String
  age            Int             @default(3)
  weightKg       Float           @default(12.0)
  customerId     String?
  customer       Customer?       @relation(fields: [customerId], references: [id], onDelete: Cascade)
  medicalRecords MedicalRecord[]
  medicalNotes   MedicalNote[]
  appointments   Appointment[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model MedicalRecord {
  id           String   @id @default(uuid())
  petId        String
  pet          Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  condition    String
  allergies    String?
  vaccinations String?
  notes        String?
  createdAt    DateTime @default(now())
}

model MedicalNote {
  id           String   @id @default(uuid())
  petId        String
  pet          Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  condition    String
  allergies    String?
  vaccinations String?
  notes        String?
  createdAt    DateTime @default(now())
}

model Groomer {
  id           String        @id @default(uuid())
  name         String
  email        String        @unique
  phone        String
  specialty    String
  rating       Float         @default(4.9)
  available    Boolean       @default(true)
  appointments Appointment[]
  createdAt    DateTime      @default(now())
}

model GroomerAvailability {
  id        String   @id @default(uuid())
  groomerId String
  dayOfWeek String   @default("Monday")
  startTime String   @default("09:00 AM")
  endTime   String   @default("05:00 PM")
  isBooked  Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Service {
  id           String        @id @default(uuid())
  name         String
  description  String
  durationMins Int           @default(60)
  price        Float
  category     String        @default("Grooming")
  appointments Appointment[]
  createdAt    DateTime      @default(now())
}

model ServicePackage {
  id          String   @id @default(uuid())
  name        String
  description String
  price       Float    @default(80.0)
  tier        String   @default("Standard")
  createdAt   DateTime @default(now())
}

model Appointment {
  id        String    @id @default(uuid())
  petId     String
  pet       Pet       @relation(fields: [petId], references: [id])
  groomerId String
  groomer   Groomer   @relation(fields: [groomerId], references: [id])
  serviceId String
  service   Service   @relation(fields: [serviceId], references: [id])
  date      String
  time      String
  status    String    @default("Scheduled")
  notes     String?
  price     Float     @default(0.0)
  payments  Payment[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Payment {
  id            String      @id @default(uuid())
  appointmentId String
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  amount        Float
  status        String      @default("Pending")
  method        String      @default("Card")
  createdAt     DateTime    @default(now())
}

model Staff {
  id        String   @id @default(uuid())
  name      String
  role      String   @default("Groomer Assistant")
  email     String   @unique
  phone     String
  createdAt DateTime @default(now())
}
`;

    // Dynamic entity syncer: Ensure every model declared in domain contract exists in schema.prisma
    try {
      const domainContractPath = join(projectRoot, ".aegis", "domain-contract.json");
      if (existsSync(domainContractPath)) {
        const domain = JSON.parse(readFileSync(domainContractPath, "utf8"));
        if (domain?.entities && Array.isArray(domain.entities)) {
          for (const ent of domain.entities) {
            const name = ent.name || ent;
            if (name && !new RegExp(`model\\s+${name}\\s*\\{`, "m").test(prismaContent)) {
              prismaContent += `\nmodel ${name} {\n  id        String   @id @default(uuid())\n  name      String   @default("${name}")\n  status    String   @default("Active")\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n`;
            }
          }
        }
      }
    } catch {}

    writeFileSync(prismaPath, prismaContent, "utf8");
    createdFiles.push("prisma/schema.prisma");

    // 11. server/index.ts
    const serverPath = join(serverDir, "index.ts");
    const serverContent = `import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

let customers = [
  { id: "c1", name: "Eleanor Vance", email: "eleanor.vance@example.com", phone: "+1 (555) 234-5678", address: "742 Evergreen Terrace" },
  { id: "c2", name: "Liam Hemsworth", email: "liam.h@example.com", phone: "+1 (555) 345-6789", address: "100 Ocean Blvd" },
  { id: "c3", name: "Sophia Martinez", email: "sophia.m@example.com", phone: "+1 (555) 456-7890", address: "45 Oakridge Lane" },
  { id: "c4", name: "Jackson Reed", email: "jackson.r@example.com", phone: "+1 (555) 567-8901", address: "1200 Market Street" }
];

let pets = [
  { id: "p1", name: "Barnaby", species: "Dog", breed: "Golden Retriever", age: 4, weightKg: 32, customerId: "c1", customerName: "Eleanor Vance", customerPhone: "+1 (555) 234-5678" },
  { id: "p2", name: "Mochi", species: "Cat", breed: "Persian Longhair", age: 2, weightKg: 4.5, customerId: "c2", customerName: "Liam Hemsworth", customerPhone: "+1 (555) 345-6789" },
  { id: "p3", name: "Ziggy", species: "Dog", breed: "French Bulldog", age: 3, weightKg: 13, customerId: "c3", customerName: "Sophia Martinez", customerPhone: "+1 (555) 456-7890" },
  { id: "p4", name: "Bella", species: "Dog", breed: "Standard Poodle", age: 5, weightKg: 24, customerId: "c4", customerName: "Jackson Reed", customerPhone: "+1 (555) 567-8901" }
];

let medicalNotes = [
  { id: "m1", petId: "p1", condition: "Sensitive Skin", allergies: "Artificial fragrances", vaccinations: "Rabies, DHPP up-to-date", notes: "Use oatmeal shampoo." },
  { id: "m2", petId: "p2", condition: "Eye Tear Staining", allergies: "None", vaccinations: "FVRCP current", notes: "Gentle facial wipe." },
  { id: "m3", petId: "p3", condition: "Brachycephalic Airway", allergies: "Chicken protein", vaccinations: "All core vaccines", notes: "Cool dry only." },
  { id: "m4", petId: "p4", condition: "Healthy", allergies: "None", vaccinations: "Bordetella current", notes: "Show trim." }
];

let groomers = [
  { id: "g1", name: "Clara Oswald", email: "clara.o@pawlux.com", phone: "+1 (555) 912-3456", specialty: "Double Coat De-shedding", rating: 4.98, available: true },
  { id: "g2", name: "Marcus Thorne", email: "marcus.t@pawlux.com", phone: "+1 (555) 823-4567", specialty: "Breed Standard Styling", rating: 4.92, available: true },
  { id: "g3", name: "Aria Chen", email: "aria.c@pawlux.com", phone: "+1 (555) 734-5678", specialty: "Feline Gentle Spa", rating: 4.95, available: true },
  { id: "g4", name: "Devon Miller", email: "devon.m@pawlux.com", phone: "+1 (555) 645-6789", specialty: "Puppy First Groom", rating: 4.89, available: false }
];

let services = [
  { id: "s1", name: "Full Luxe Spa & Styling", description: "Hydro-massage bath, breed haircut, ear hygiene.", durationMins: 90, price: 95, category: "Spa" },
  { id: "s2", name: "Double Coat De-Shedding Care", description: "Deep bath, undercoat rake blowout.", durationMins: 75, price: 80, category: "Treatment" },
  { id: "s3", name: "Puppy Gentle Intro Groom", description: "Warm bath, fluff dry, face/feet/sanitary trim.", durationMins: 45, price: 50, category: "Grooming" },
  { id: "s4", name: "Feline Purrfect Spa", description: "Bath for cats, sanitary trim, nail caps.", durationMins: 60, price: 85, category: "Spa" },
  { id: "s5", name: "Nail & Paw Deep Restoration", description: "Nail grinding, paw pad organic balm.", durationMins: 30, price: 35, category: "Care" }
];

let appointments = [
  { id: "a1", code: "APT-801", petId: "p1", petName: "Barnaby", petBreed: "Golden Retriever", customerName: "Eleanor Vance", customerPhone: "+1 (555) 234-5678", groomerId: "g1", groomerName: "Clara Oswald", serviceId: "s1", serviceName: "Full Luxe Spa & Styling", date: "2026-09-18", time: "10:00 AM", status: "Scheduled", price: 95 },
  { id: "a2", code: "APT-802", petId: "p2", petName: "Mochi", petBreed: "Persian Longhair", customerName: "Liam Hemsworth", customerPhone: "+1 (555) 345-6789", groomerId: "g3", groomerName: "Aria Chen", serviceId: "s4", serviceName: "Feline Purrfect Spa", date: "2026-09-18", time: "01:30 PM", status: "In Progress", price: 85 },
  { id: "a3", code: "APT-803", petId: "p3", petName: "Ziggy", petBreed: "French Bulldog", customerName: "Sophia Martinez", customerPhone: "+1 (555) 456-7890", groomerId: "g2", groomerName: "Marcus Thorne", serviceId: "s5", serviceName: "Nail & Paw Deep Restoration", date: "2026-09-19", time: "11:00 AM", status: "Scheduled", price: 35 },
  { id: "a4", code: "APT-804", petId: "p4", petName: "Bella", petBreed: "Standard Poodle", customerName: "Jackson Reed", customerPhone: "+1 (555) 567-8901", groomerId: "g2", groomerName: "Marcus Thorne", serviceId: "s1", serviceName: "Full Luxe Spa & Styling", date: "2026-09-15", time: "03:00 PM", status: "Completed", price: 95 }
];

// Health
app.get("/health", (req, res) => res.json({ status: "healthy", domain: "pet-grooming", timestamp: new Date().toISOString() }));
app.get("/api/health", (req, res) => res.json({ status: "healthy", domain: "pet-grooming" }));

// Customers
app.get("/api/customers", (req, res) => res.json(customers));
app.post("/api/customers", (req, res) => {
  const newC = { id: "c-" + Date.now(), ...req.body };
  customers.unshift(newC);
  res.status(201).json(newC);
});

// Pets
app.get("/api/pets", (req, res) => res.json(pets));
app.post("/api/pets", (req, res) => {
  const newP = { id: "p-" + Date.now(), ...req.body };
  pets.unshift(newP);
  res.status(201).json(newP);
});
app.get("/api/pets/:id", (req, res) => {
  const p = pets.find(item => item.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Pet not found" });
  res.json(p);
});

// Medical Notes
app.get("/api/medical-notes", (req, res) => res.json(medicalNotes));
app.post("/api/medical-notes", (req, res) => {
  const newM = { id: "m-" + Date.now(), ...req.body, createdAt: new Date().toISOString().split("T")[0] };
  medicalNotes.unshift(newM);
  res.status(201).json(newM);
});

// Groomers
app.get("/api/groomers", (req, res) => res.json(groomers));
app.post("/api/groomers", (req, res) => {
  const newG = { id: "g-" + Date.now(), rating: 5.0, ...req.body };
  groomers.push(newG);
  res.status(201).json(newG);
});

// Services
app.get("/api/services", (req, res) => res.json(services));
app.get("/api/packages", (req, res) => res.json(services));
app.post("/api/services", (req, res) => {
  const newS = { id: "s-" + Date.now(), ...req.body };
  services.push(newS);
  res.status(201).json(newS);
});
app.delete("/api/services/:id", (req, res) => {
  services = services.filter(s => s.id !== req.params.id);
  res.json({ success: true });
});

// Appointments
app.get("/api/appointments", (req, res) => res.json(appointments));
app.post("/api/appointments", (req, res) => {
  const newA = { id: "a-" + Date.now(), code: "APT-" + Math.floor(100 + Math.random() * 900), ...req.body };
  appointments.unshift(newA);
  res.status(201).json(newA);
});
app.put("/api/appointments/:id", (req, res) => {
  const index = appointments.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Appointment not found" });
  appointments[index] = { ...appointments[index], ...req.body };
  res.json(appointments[index]);
});
app.delete("/api/appointments/:id", (req, res) => {
  appointments = appointments.filter(a => a.id !== req.params.id);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(\`[Server] Pet Grooming API listening on port \${PORT}\`);
  });
}

export default app;
`;
    writeFileSync(serverPath, serverContent, "utf8");
    createdFiles.push("server/index.ts");
  }
}
