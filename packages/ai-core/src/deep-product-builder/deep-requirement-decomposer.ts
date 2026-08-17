/**
 * DeepRequirementDecomposer
 *
 * Decomposes high-level natural language user requirements into atomic, implementation-level
 * obligations spanning UI, API endpoints, Database schema/relations, Business logic rules, and Workflows.
 */

import { type FeatureRequirement } from "../universal-product-builder/universal-requirement-interpreter.js";

export interface DecomposedFeatureObligation {
  obligationId: string;
  featureName: string;
  category: string;
  ui: {
    views: string[];
    components: string[];
    actions: string[];
  };
  api: {
    endpoints: { method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"; path: string; handlerName: string }[];
  };
  database: {
    models: string[];
    fields: string[];
    relations: string[];
  };
  businessLogic: {
    invariants: string[];
    validationRules: string[];
  };
  workflow: {
    steps: string[];
  };
  isCritical: boolean;
}

export class DeepRequirementDecomposer {
  public static decomposeRequirement(feature: FeatureRequirement, domain: string): DecomposedFeatureObligation {
    const fName = feature.name;
    const lower = fName.toLowerCase();
    const dLower = domain.toLowerCase();

    const isAuth = lower.includes("auth") || lower.includes("login") || lower.includes("user");
    const isCartCheckout = lower.includes("cart") || lower.includes("checkout") || lower.includes("payment");
    const isMember = lower.includes("member") || lower.includes("student") || lower.includes("customer");
    const isBooking = lower.includes("book") || lower.includes("appoint") || lower.includes("schedule");

    if (isAuth) {
      return {
        obligationId: `obl_auth_${feature.id}`,
        featureName: fName,
        category: "AUTHENTICATION",
        ui: {
          views: ["/login", "/register", "/profile"],
          components: ["LoginForm", "RegisterForm", "AuthGuard"],
          actions: ["handleLogin", "handleRegister", "handleLogout"],
        },
        api: {
          endpoints: [
            { method: "POST", path: "/api/auth/register", handlerName: "registerUser" },
            { method: "POST", path: "/api/auth/login", handlerName: "loginUser" },
            { method: "GET", path: "/api/auth/me", handlerName: "getCurrentUser" },
          ],
        },
        database: {
          models: ["User", "Session"],
          fields: ["email", "passwordHash", "role", "isActive"],
          relations: ["User.sessions -> Session[]"],
        },
        businessLogic: {
          invariants: ["Email must be unique", "Password must be salted and hashed with bcrypt"],
          validationRules: ["Valid email format", "Password minimum 8 characters"],
        },
        workflow: {
          steps: ["Open login view", "Input valid credentials", "Receive JWT bearer token", "Redirect to authorized dashboard"],
        },
        isCritical: true,
      };
    }

    if (isCartCheckout) {
      return {
        obligationId: `obl_cart_${feature.id}`,
        featureName: fName,
        category: "ECOMMERCE_CHECKOUT",
        ui: {
          views: ["/cart", "/checkout", "/order-confirmation"],
          components: ["CartItemList", "CheckoutForm", "OrderSummaryCard"],
          actions: ["addToCart", "updateQuantity", "submitOrder"],
        },
        api: {
          endpoints: [
            { method: "GET", path: "/api/cart", handlerName: "getCart" },
            { method: "POST", path: "/api/cart/items", handlerName: "addItemToCart" },
            { method: "POST", path: "/api/checkout", handlerName: "processCheckout" },
          ],
        },
        database: {
          models: ["Cart", "CartItem", "Order", "OrderItem", "Payment"],
          fields: ["quantity", "totalAmount", "status", "paymentMethod"],
          relations: ["Cart.items -> CartItem[]", "Order.items -> OrderItem[]"],
        },
        businessLogic: {
          invariants: ["Stock count cannot become negative", "Order total must equal sum of line items + tax"],
          validationRules: ["Quantity must be > 0", "Product must be active and in stock"],
        },
        workflow: {
          steps: ["Add item to cart", "View cart", "Initiate checkout", "Process payment", "Create order record", "Clear cart"],
        },
        isCritical: true,
      };
    }

    if (isBooking) {
      return {
        obligationId: `obl_book_${feature.id}`,
        featureName: fName,
        category: "BOOKING_MANAGEMENT",
        ui: {
          views: ["/bookings", "/schedule", "/appointment-confirmation"],
          components: ["SlotSelector", "BookingCalendar", "AppointmentCard"],
          actions: ["selectDate", "selectSlot", "confirmBooking", "cancelBooking"],
        },
        api: {
          endpoints: [
            { method: "GET", path: "/api/availability", handlerName: "getAvailability" },
            { method: "POST", path: "/api/bookings", handlerName: "createBooking" },
            { method: "DELETE", path: "/api/bookings/:id", handlerName: "cancelBooking" },
          ],
        },
        database: {
          models: ["Booking", "AvailabilitySlot", "Service"],
          fields: ["startTime", "endTime", "status", "userId", "serviceId"],
          relations: ["Booking.user -> User", "Booking.service -> Service"],
        },
        businessLogic: {
          invariants: ["Double booking of identical slot is strictly prohibited", "Past time slots cannot be booked"],
          validationRules: ["Start time must precede end time", "User must be authenticated"],
        },
        workflow: {
          steps: ["Fetch available calendar slots", "Select time slot", "Submit reservation", "Persist booking", "Verify confirmation"],
        },
        isCritical: true,
      };
    }

    // Default Domain Resource Management
    return {
      obligationId: `obl_res_${feature.id}`,
      featureName: fName,
      category: "RESOURCE_MANAGEMENT",
      ui: {
        views: [`/${fName.toLowerCase().replace(/\s+/g, "-")}`],
        components: ["DataTable", "ResourceForm", "DetailModal"],
        actions: ["fetchRecords", "createRecord", "updateRecord", "deleteRecord"],
      },
      api: {
        endpoints: [
          { method: "GET", path: `/api/${fName.toLowerCase().replace(/\s+/g, "-")}`, handlerName: "listRecords" },
          { method: "POST", path: `/api/${fName.toLowerCase().replace(/\s+/g, "-")}`, handlerName: "createRecord" },
        ],
      },
      database: {
        models: [fName.replace(/\s+/g, "")],
        fields: ["id", "title", "createdAt", "updatedAt"],
        relations: [],
      },
      businessLogic: {
        invariants: ["Record identifier must be unique", "Audit timestamp must be recorded"],
        validationRules: ["Required fields must not be empty"],
      },
      workflow: {
        steps: ["Navigate to resource list", "Open create dialog", "Submit valid payload", "Verify data in list"],
      },
      isCritical: feature.isCritical,
    };
  }
}
