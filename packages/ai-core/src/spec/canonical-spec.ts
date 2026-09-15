import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ProjectSpecification, DomainVocabulary } from "../architect/specification.js";

export interface CanonicalProjectSpecification extends ProjectSpecification {
  domainCategory: string;
  lockedStack: {
    frontend: string;
    backend: string;
    database: string;
    orm: string;
    auth: string;
    language: string;
    styling: string;
    packageManager: "pnpm" | "npm" | "yarn";
  };
  forbiddenPatterns: string[];
  domainVocabulary: DomainVocabulary;
}

export class SpecificationNormalizer {
  public static normalize(userPrompt: string, rawSpec: ProjectSpecification): CanonicalProjectSpecification {
    let combinedPrompt = userPrompt;
    if (userPrompt && (userPrompt.includes("/") || userPrompt.includes("\\"))) {
      try {
        const promptFile = join(userPrompt, ".aegis", "prompt.txt");
        if (existsSync(promptFile)) {
          combinedPrompt += " " + readFileSync(promptFile, "utf8");
        }
      } catch {}
    }
    const promptLower = combinedPrompt.toLowerCase();

    // 1. Detect Domain Category dynamically
    let domainCategory = "general-dashboard";
    if (promptLower.includes("real estate") || promptLower.includes("real-estate") || promptLower.includes("realestate") || promptLower.includes("property") || promptLower.includes("realtor") || promptLower.includes("mortgage") || promptLower.includes("tour schedule") || promptLower.includes("tour booking") || promptLower.includes("listing")) {
      domainCategory = "real-estate";
    } else if (promptLower.includes("pet") && (promptLower.includes("groom") || promptLower.includes("spa") || promptLower.includes("package") || promptLower.includes("booking") || promptLower.includes("service"))) {
      domainCategory = "pet-grooming";
    } else if (promptLower.includes("pet") || promptLower.includes("veterinar") || promptLower.includes("vet ") || promptLower.includes("clinic") || promptLower.includes("animal")) {
      domainCategory = "pet-clinic";
    } else if (promptLower.includes("music") || promptLower.includes("instrument") || promptLower.includes("lesson") || promptLower.includes("piano") || promptLower.includes("guitar")) {
      domainCategory = "music-school";
    } else if (promptLower.includes("photography") || promptLower.includes("photo studio") || promptLower.includes("photographer")) {
      domainCategory = "photography-studio";
    } else if (promptLower.includes("community garden") || promptLower.includes("garden") || promptLower.includes("plot allocation") || promptLower.includes("harvest")) {
      domainCategory = "community-garden";
    } else if ((promptLower.includes("bicycle") || promptLower.includes("bike")) && (promptLower.includes("repair") || promptLower.includes("mechanic") || promptLower.includes("fix") || promptLower.includes("tune-up") || promptLower.includes("shop") || promptLower.includes("service"))) {
      domainCategory = "bicycle-repair";
    } else if (promptLower.includes("bicycle") || promptLower.includes("bike") || promptLower.includes("rental") || promptLower.includes("fleet")) {
      domainCategory = "bicycle-rental";
    } else if (promptLower.includes("home repair") || promptLower.includes("handyman") || promptLower.includes("work order") || promptLower.includes("repair service")) {
      domainCategory = "home-repair";
    } else if (promptLower.includes("event") || promptLower.includes("venue") || promptLower.includes("attendee") || promptLower.includes("conference")) {
      domainCategory = "event-planning";
    } else if (promptLower.includes("hotel") || promptLower.includes("room reservation") || promptLower.includes("room booking") || (promptLower.includes("hotel") && promptLower.includes("booking"))) {
      domainCategory = "hotel-booking";
    } else if (promptLower.includes("restaurant") || promptLower.includes("dining") || (promptLower.includes("reservation") && promptLower.includes("table")) || promptLower.includes("menu")) {
      domainCategory = "restaurant-reservation";
    } else if (promptLower.includes("vehicle") || promptLower.includes("car") || promptLower.includes("auto") || promptLower.includes("repair") || promptLower.includes("mechanic")) {
      domainCategory = "vehicle-service";
    } else if (promptLower.includes("library") || ((promptLower.includes("book") || promptLower.includes("books")) && !promptLower.includes("booking") && !promptLower.includes("booked")) || promptLower.includes("borrow") || promptLower.includes("catalog") || promptLower.includes("isbn") || promptLower.includes("author")) {
      domainCategory = "library-management";
    } else if (promptLower.includes("hospital") || promptLower.includes("patient") || promptLower.includes("doctor") || promptLower.includes("appointment") || promptLower.includes("medical")) {
      domainCategory = "hospital-management";
    } else if (promptLower.includes("equipment") || promptLower.includes("machinery") || promptLower.includes("inspection") || (promptLower.includes("maintenance") && !promptLower.includes("bike"))) {
      domainCategory = "equipment-maintenance";
    } else if (promptLower.includes("inventory") || promptLower.includes("warehouse") || promptLower.includes("stock") || promptLower.includes("supplier")) {
      domainCategory = "inventory-system";
    } else if (promptLower.includes("gym") || promptLower.includes("trainer") || promptLower.includes("membership") || promptLower.includes("workout") || promptLower.includes("fitness") || promptLower.includes("exercise")) {
      domainCategory = "gym-management";
    } else if (promptLower.includes("student") || promptLower.includes("academic") || promptLower.includes("department") || promptLower.includes("semester") || promptLower.includes("enrollment") || promptLower.includes("course") || promptLower.includes("university") || promptLower.includes("school")) {
      domainCategory = "student-management";
    } else if (promptLower.includes("code") || promptLower.includes("vulnerability") || promptLower.includes("security") || promptLower.includes("reviewer")) {
      domainCategory = "code-reviewer";
    } else if (promptLower.includes("resume") || promptLower.includes("cv") || promptLower.includes("keyword scanner") || promptLower.includes("match score")) {
      domainCategory = "resume-scanner";
    } else if (promptLower.includes("expense") || promptLower.includes("spending") || promptLower.includes("budget") || promptLower.includes("transaction") || promptLower.includes("finance")) {
      domainCategory = "expense-tracker";
    } else if (promptLower.includes("kanban") || promptLower.includes("task") || promptLower.includes("project management") || promptLower.includes("todo")) {
      domainCategory = "task-manager";
    } else if (promptLower.includes("art") || promptLower.includes("gallery") || promptLower.includes("artwork") || promptLower.includes("exhibition")) {
      domainCategory = "art-gallery";
    } else if (promptLower.includes("ecommerce") || promptLower.includes("shop") || promptLower.includes("store") || promptLower.includes("product")) {
      domainCategory = "ecommerce";
    } else if (promptLower.includes("blog") || promptLower.includes("post") || promptLower.includes("article")) {
      domainCategory = "blog";
    }

    // 2. Lock Stack based on explicit user directives (Prompt > Spec > Defaults)
    let frontend = "React-Vite";
    if (promptLower.includes("next.js") || promptLower.includes("nextjs")) frontend = "Next.js";
    else if (promptLower.includes("vite") || promptLower.includes("react")) frontend = "React-Vite";
    else if (rawSpec.frontend) frontend = rawSpec.frontend;

    let backend = "Express";
    if (promptLower.includes("next.js api") || promptLower.includes("next api")) backend = "Next.js API Routes";
    else if (promptLower.includes("express")) backend = "Express";
    else if (rawSpec.backend) backend = rawSpec.backend;

    let database = "PostgreSQL";
    if (promptLower.includes("postgres") || promptLower.includes("postgresql")) database = "PostgreSQL";
    else if (promptLower.includes("mongo") || promptLower.includes("mongodb")) database = "MongoDB";
    else if (promptLower.includes("sqlite")) database = "SQLite";

    let orm = "Prisma";
    if (promptLower.includes("drizzle")) orm = "Drizzle";
    else if (promptLower.includes("mongoose")) orm = "Mongoose";
    else if (promptLower.includes("prisma")) orm = "Prisma";

    let auth = "JWT";
    if (promptLower.includes("nextauth") || promptLower.includes("next-auth")) auth = "NextAuth.js";
    else if (promptLower.includes("jwt")) auth = "JWT";

    // 3. Define Forbidden Domain Patterns (starter template contamination is strictly forbidden)
    const forbiddenPatterns: string[] = [];
    if (domainCategory !== "art-gallery") {
      forbiddenPatterns.push("Artwork", "Gallery", "ArtStats", "ArtworkCard", "ArtworkDashboard", "Vincent van Gogh", "Oil Painting", "Curated Exhibitions", "Starry Horizon");
    }
    if (domainCategory !== "task-manager") {
      forbiddenPatterns.push("KanbanBoard", "BoardColumn");
    }
    if (domainCategory !== "library-management") {
      forbiddenPatterns.push("BookTable", "BorrowRecord", "borrowed books", "total books", "library overview");
    }

    // 4. Deterministically extract Domain Vocabulary and Data Models from user prompt
    const domainVocabulary = SpecificationNormalizer.extractDomainVocabulary(promptLower, domainCategory);

    let dataModels = rawSpec.dataModels && rawSpec.dataModels.length > 0 ? rawSpec.dataModels : [];
    if (dataModels.length === 0) {
      dataModels = SpecificationNormalizer.deriveDataModels(promptLower, domainCategory, domainVocabulary);
    }

    return {
      ...rawSpec,
      dataModels,
      domainCategory,
      frontend,
      backend,
      database,
      auth,
      domainVocabulary,
      lockedStack: {
        frontend,
        backend,
        database,
        orm,
        auth,
        language: rawSpec.language || "TypeScript",
        styling: rawSpec.styling || "TailwindCSS",
        packageManager: rawSpec.packageManager || "pnpm"
      },
      forbiddenPatterns
    };
  }

  public static deriveDataModels(
    promptLower: string,
    domainCategory: string,
    domainVocabulary: DomainVocabulary
  ): string[] {
    switch (domainCategory) {
      case "real-estate":
        return ["User", "Property", "Tour", "Lead", "Interaction", "Agent", "Inquiry"];
      case "photography-studio":
        return ["User", "Client", "Photographer", "Session", "Package", "Invoice", "Equipment"];
      case "community-garden":
        return ["User", "Garden", "Plot", "Member", "Plant", "Harvest", "Event"];
      case "home-repair":
        return ["User", "Customer", "Technician", "ServiceRequest", "WorkOrder", "Invoice", "Part"];
      case "pet-grooming":
        return ["User", "Customer", "Pet", "Groomer", "Appointment", "Service"];
      case "music-school":
        return ["User", "Student", "Teacher", "Instrument", "Lesson", "Enrollment"];
      case "pet-clinic":
        return ["User", "Owner", "Pet", "Appointment", "Treatment"];
      case "bicycle-rental":
        return ["User", "Bicycle", "Rental", "Customer", "MaintenanceRecord"];
      case "bicycle-repair":
        return ["User", "Customer", "Bicycle", "RepairJob", "Mechanic", "RepairService"];
      case "event-planning":
        return ["User", "Event", "Venue", "Attendee", "Vendor", "Budget"];
      case "restaurant-reservation":
        return ["User", "Reservation", "Table", "Guest", "MenuItem", "Order"];
      case "hotel-booking":
        return ["User", "Room", "Booking", "Guest", "Payment"];
      case "vehicle-service":
        return ["User", "Vehicle", "ServiceOrder", "Customer", "Part"];
      case "equipment-maintenance":
        return ["User", "Equipment", "Technician", "Inspection", "MaintenanceLog", "SparePart", "FailureReport"];
      case "task-manager":
        return ["User", "Task", "BoardColumn", "Project"];
      case "expense-tracker":
        return ["User", "Expense", "Category", "Budget"];
      case "workout-fitness":
      case "gym-management":
        return ["User", "Member", "Plan", "Trainer", "Attendance"];
      case "library-management":
        return ["User", "Book", "Author", "BorrowRecord", "Category"];
      case "inventory-system":
        return ["User", "Product", "Category", "Supplier", "StockMovement"];
      case "hospital-management":
        return ["User", "Patient", "Doctor", "Appointment", "MedicalRecord"];
      case "ecommerce":
        return ["User", "Product", "Order", "Category"];
      case "blog":
        return ["User", "Post", "Category", "Comment"];
      case "art-gallery":
        return ["User", "Artwork", "Collection", "Artist"];
      case "student-management":
        return ["User", "Student", "Department", "Enrollment", "Semester"];
      case "code-reviewer":
        return ["User", "Repository", "Scan", "Vulnerability"];
      case "resume-scanner":
        return ["User", "Resume", "JobDescription", "AnalysisResult"];
      default: {
        const models = ["User"];
        
        // Dynamically extract domain nouns from prompt
        if (promptLower.includes("customer") || promptLower.includes("client")) models.push("Customer");
        if (promptLower.includes("garden") || promptLower.includes("plot")) models.push("Plot");
        if (promptLower.includes("repair") || promptLower.includes("technician")) models.push("WorkOrder");
        if (promptLower.includes("pet") || promptLower.includes("animal")) models.push("Pet");
        if (promptLower.includes("groomer") || promptLower.includes("groom")) models.push("Groomer");
        if (promptLower.includes("appointment") || promptLower.includes("booking")) models.push("Appointment");
        if (promptLower.includes("service")) models.push("Service");
        if (promptLower.includes("student")) models.push("Student");
        if (promptLower.includes("teacher") || promptLower.includes("instructor")) models.push("Teacher");
        if (promptLower.includes("lesson") || promptLower.includes("course")) models.push("Lesson");
        if (promptLower.includes("venue")) models.push("Venue");
        if (promptLower.includes("vendor")) models.push("Vendor");
        if (promptLower.includes("attendee")) models.push("Attendee");
        if (promptLower.includes("event")) models.push("Event");
        if (promptLower.includes("table")) models.push("Table");
        if (promptLower.includes("reservation")) models.push("Reservation");
        if (promptLower.includes("bike") || promptLower.includes("bicycle")) models.push("Bicycle");
        if (promptLower.includes("rental")) models.push("Rental");
        if (promptLower.includes("order")) models.push("Order");
        if (promptLower.includes("categor")) models.push("Category");
        if (promptLower.includes("product") || promptLower.includes("item")) models.push("Product");
        if (promptLower.includes("price") || promptLower.includes("payment") || promptLower.includes("invoice")) models.push("Payment");
        if (promptLower.includes("report")) models.push("Report");
        if (promptLower.includes("log") || promptLower.includes("record")) models.push("Record");

        if (domainVocabulary.entityName && domainVocabulary.entityName !== "Item") {
          models.push(domainVocabulary.entityName);
        }
        if (models.length === 1) models.push("Item", "Activity");
        return Array.from(new Set(models));
      }
    }
  }

  private static extractDomainVocabulary(
    promptLower: string,
    domainCategory: string
  ): DomainVocabulary {
    switch (domainCategory) {
      case "real-estate": {
        return {
          entityName: "Property",
          entityPlural: "Properties",
          primaryMetrics: ["Active Listings", "Scheduled Tours", "Active Leads", "Monthly Volume", "Average Price"],
          actionVerbs: ["Add Property", "Schedule Tour", "Contact Agent", "Calculate Payment", "Assign Lead"],
          domainPrefix: "estate"
        };
      }

      case "photography-studio": {
        return {
          entityName: "Session",
          entityPlural: "Sessions",
          primaryMetrics: ["Today's Sessions", "Monthly Revenue", "Active Photographers", "Booked Slots"],
          actionVerbs: ["Book Session", "Add Package", "Assign Photographer", "Generate Invoice"],
          domainPrefix: "studio"
        };
      }

      case "community-garden": {
        return {
          entityName: "Plot",
          entityPlural: "Plots",
          primaryMetrics: ["Total Plots", "Active Gardeners", "Harvest Yield", "Scheduled Workdays"],
          actionVerbs: ["Allocate Plot", "Register Member", "Record Harvest", "Schedule Workday"],
          domainPrefix: "garden"
        };
      }

      case "home-repair": {
        return {
          entityName: "WorkOrder",
          entityPlural: "WorkOrders",
          primaryMetrics: ["Open Work Orders", "Active Technicians", "Completed Jobs", "Revenue This Month"],
          actionVerbs: ["Create Work Order", "Assign Technician", "Update Job Status", "Generate Invoice"],
          domainPrefix: "repair"
        };
      }

      case "pet-grooming": {
        return {
          entityName: "Appointment",
          entityPlural: "Appointments",
          primaryMetrics: ["Total Appointments", "Active Pets", "Today's Appointments", "Active Grooming Sessions", "Registered Owners", "Total Revenue"],
          actionVerbs: ["Book Appointment", "Register Pet", "Assign Groomer", "Manage Packages", "Update Status"],
          domainPrefix: "pet"
        };
      }

      case "music-school": {
        return {
          entityName: "Lesson",
          entityPlural: "Lessons",
          primaryMetrics: ["Total Students", "Active Lessons", "Instruments", "Faculty"],
          actionVerbs: ["Schedule Lesson", "Enroll Student", "Assign Teacher", "Record Attendance"],
          domainPrefix: "music"
        };
      }

      case "pet-clinic": {
        return {
          entityName: "Pet",
          entityPlural: "Pets",
          primaryMetrics: ["Total Pets", "Today's Appointments", "Active Treatments", "Registered Owners"],
          actionVerbs: ["Register Pet", "Schedule Appointment", "Record Treatment", "Add Owner"],
          domainPrefix: "pet"
        };
      }

      case "bicycle-rental": {
        return {
          entityName: "Bicycle",
          entityPlural: "Bicycles",
          primaryMetrics: ["Total Bicycles", "Active Rentals", "Available Fleet", "Revenue Today"],
          actionVerbs: ["Rent Bicycle", "Return Bicycle", "Add Bike", "Schedule Service"],
          domainPrefix: "bicycle"
        };
      }

      case "bicycle-repair": {
        return {
          entityName: "RepairJob",
          entityPlural: "RepairJobs",
          primaryMetrics: ["Total Bicycles", "Active Repair Jobs", "Completed Repairs", "Pending Repairs", "Total Repair Revenue", "Upcoming Pickups"],
          actionVerbs: ["Create Repair Job", "Register Bicycle", "Add Customer", "Assign Mechanic", "Update Status"],
          domainPrefix: "repair"
        };
      }

      case "event-planning": {
        return {
          entityName: "Event",
          entityPlural: "Events",
          primaryMetrics: ["Upcoming Events", "Total Attendees", "Booked Venues", "Budget Allocated"],
          actionVerbs: ["Create Event", "Register Attendee", "Book Venue", "Add Vendor"],
          domainPrefix: "event"
        };
      }

      case "restaurant-reservation": {
        return {
          entityName: "Reservation",
          entityPlural: "Reservations",
          primaryMetrics: ["Today's Reservations", "Seated Guests", "Available Tables", "Waitlist Count"],
          actionVerbs: ["New Reservation", "Seat Party", "Update Status", "Cancel Booking"],
          domainPrefix: "reservation"
        };
      }

      case "hotel-booking": {
        return {
          entityName: "Booking",
          entityPlural: "Bookings",
          primaryMetrics: ["Total Rooms", "Occupied Rooms", "Check-ins Today", "Total Revenue"],
          actionVerbs: ["Book Room", "Check In", "Check Out", "Manage Rooms"],
          domainPrefix: "booking"
        };
      }

      case "vehicle-service": {
        return {
          entityName: "Vehicle",
          entityPlural: "Vehicles",
          primaryMetrics: ["Vehicles in Service", "Pending Orders", "Completed Today", "Parts in Stock"],
          actionVerbs: ["Create Service Order", "Update Status", "Add Parts", "Generate Invoice"],
          domainPrefix: "vehicle"
        };
      }

      case "equipment-maintenance": {
        return {
          entityName: "Equipment",
          entityPlural: "Equipment",
          primaryMetrics: ["Equipment Health", "Overdue Inspections", "Maintenance Spending", "Upcoming Work"],
          actionVerbs: ["Register Equipment", "Schedule Inspection", "Record Maintenance", "Order Spare Parts"],
          domainPrefix: "equipment"
        };
      }

      case "resume-scanner": {
        return {
          entityName: "ResumeScan",
          entityPlural: "ResumeScans",
          primaryMetrics: ["Match Score", "Matched Keywords", "Missing Skills Count"],
          actionVerbs: ["Upload Resume", "Upload Job Description", "Analyze Match", "Export Report"],
          domainPrefix: "scan"
        };
      }

      case "student-management": {
        return {
          entityName: "Student",
          entityPlural: "Students",
          primaryMetrics: ["Total Students", "Active Students", "Departments", "Semesters"],
          actionVerbs: ["Add Student", "Edit Profile", "Filter by Department", "Delete Record"],
          domainPrefix: "student"
        };
      }

      case "library-management": {
        return {
          entityName: "Book",
          entityPlural: "Books",
          primaryMetrics: ["Total Books", "Borrowed Books", "Available Books", "Active Members"],
          actionVerbs: ["Add Book", "Issue Book", "Return Book", "Filter by Genre"],
          domainPrefix: "book"
        };
      }

      case "gym-management":
      case "workout-fitness": {
        return {
          entityName: "Member",
          entityPlural: "Members",
          primaryMetrics: ["Total Members", "Active Memberships", "Daily Check-ins", "Trainers"],
          actionVerbs: ["Register Member", "Assign Plan", "Log Attendance", "Renew Membership"],
          domainPrefix: "member"
        };
      }

      case "inventory-system": {
        return {
          entityName: "Product",
          entityPlural: "Products",
          primaryMetrics: ["Total Items", "Low Stock Alerts", "Total Valuation", "Suppliers"],
          actionVerbs: ["Add Product", "Stock In", "Stock Out", "Adjust Inventory"],
          domainPrefix: "inventory"
        };
      }

      case "hospital-management": {
        return {
          entityName: "Patient",
          entityPlural: "Patients",
          primaryMetrics: ["Total Patients", "Appointments Today", "Available Doctors", "Admitted"],
          actionVerbs: ["Register Patient", "Book Appointment", "Update Vitals", "Discharge"],
          domainPrefix: "patient"
        };
      }

      case "expense-tracker": {
        const primaryMetrics: string[] = [];
        if (promptLower.includes("income") || promptLower.includes("revenue")) primaryMetrics.push("Total Income");
        primaryMetrics.push("Total Expenses");
        if (promptLower.includes("budget")) primaryMetrics.push("Monthly Budget");
        primaryMetrics.push("Remaining Balance");
        if (promptLower.includes("categor")) primaryMetrics.push("Top Category");

        const actionVerbs: string[] = ["Add Expense"];
        if (promptLower.includes("income")) actionVerbs.push("Add Income");
        if (promptLower.includes("edit") || promptLower.includes("update")) actionVerbs.push("Edit");
        if (promptLower.includes("delete") || promptLower.includes("remov")) actionVerbs.push("Delete");
        if (promptLower.includes("export") || promptLower.includes("csv") || promptLower.includes("pdf")) actionVerbs.push("Export CSV", "Export PDF");
        if (promptLower.includes("filter")) actionVerbs.push("Filter by Date", "Filter by Category");

        return {
          entityName: promptLower.includes("transaction") ? "Transaction" : "Expense",
          entityPlural: promptLower.includes("transaction") ? "Transactions" : "Expenses",
          primaryMetrics,
          actionVerbs,
          domainPrefix: "expense"
        };
      }

      case "task-manager": {
        const primaryMetrics: string[] = ["Total Tasks", "Completed", "In Progress", "Overdue"];
        return {
          entityName: promptLower.includes("ticket") ? "Ticket" : "Task",
          entityPlural: promptLower.includes("ticket") ? "Tickets" : "Tasks",
          primaryMetrics,
          actionVerbs: ["Add Task", "Edit", "Delete", "Mark Complete", "Move to Column"],
          domainPrefix: "task"
        };
      }

      case "ecommerce": {
        return {
          entityName: "Product",
          entityPlural: "Products",
          primaryMetrics: ["Total Revenue", "Orders", "Avg. Order Value", "Stock Items"],
          actionVerbs: ["Add to Cart", "Buy Now", "Checkout", "Track Order"],
          domainPrefix: "product"
        };
      }

      case "blog": {
        return {
          entityName: "Post",
          entityPlural: "Posts",
          primaryMetrics: ["Total Posts", "Published", "Drafts", "Total Views"],
          actionVerbs: ["Write Post", "Edit", "Publish", "Delete"],
          domainPrefix: "post"
        };
      }

      case "art-gallery": {
        return {
          entityName: "Artwork",
          entityPlural: "Artworks",
          primaryMetrics: ["Total Artworks", "Collections", "Featured", "Recent Additions"],
          actionVerbs: ["Add Artwork", "Edit", "Remove", "Feature"],
          domainPrefix: "artwork"
        };
      }

      default: {
        // Dynamic fallback: extract primary entity from prompt
        const words = promptLower.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 3);
        const stopWords = new Set(["build", "with", "system", "management", "application", "where", "staff", "manage", "view", "include", "small", "responsive", "storage", "database", "modern", "platform", "should", "allow", "track"]);
        const candidateWords = words.filter(w => !stopWords.has(w));
        const prime = candidateWords[0] ? candidateWords[0].charAt(0).toUpperCase() + candidateWords[0].slice(1) : "Item";
        
        return {
          entityName: prime,
          entityPlural: prime.endsWith("s") ? prime : prime + "s",
          primaryMetrics: ["Total " + prime + "s", "Active " + prime + "s", "Pending", "Completed"],
          actionVerbs: ["Add " + prime, "Edit", "Delete", "Export"],
          domainPrefix: prime.toLowerCase()
        };
      }
    }
  }
}

