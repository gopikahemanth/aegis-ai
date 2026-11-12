import { describe, it, expect } from "vitest";
import { DesignSystemGenerator } from "../design-system-generator.js";

describe("Phase B — Frontend UI & Design System Interactive Components", () => {
  const generator = new DesignSystemGenerator();
  const mockSpec: any = {
    name: "Aura Veterinary Care",
    description: "Modern veterinary booking and pet health platform",
    userPrompt: "Build a modern booking platform for a veterinary clinic with appointments and services",
    dataModels: ["Pet", "Owner", "Appointment", "Service"],
  };

  const files = generator.generate(mockSpec);
  const getFile = (pathSuffix: string) => files.find(f => f.path.endsWith(pathSuffix));

  it("1. Generates all 6 rich accessible component files in src/design-system/components/", () => {
    const expectedComponents = [
      "Modal.tsx",
      "Tabs.tsx",
      "Alert.tsx",
      "Toast.tsx",
      "Navbar.tsx",
      "DatePicker.tsx",
      "FileUpload.tsx",
    ];

    for (const comp of expectedComponents) {
      const file = getFile(comp);
      expect(file, `Component ${comp} should be generated`).toBeDefined();
      expect(file?.content.length).toBeGreaterThan(100);
    }
  });

  it("2. Exports all new interactive components in src/design-system/index.ts", () => {
    const indexFile = getFile("src/design-system/index.ts");
    expect(indexFile).toBeDefined();
    const content = indexFile!.content;

    expect(content).toContain("export * from './components/Modal';");
    expect(content).toContain("export * from './components/Tabs';");
    expect(content).toContain("export * from './components/Alert';");
    expect(content).toContain("export * from './components/Toast';");
    expect(content).toContain("export * from './components/Navbar';");
    expect(content).toContain("export * from './components/DatePicker';");
    expect(content).toContain("export * from './components/FileUpload';");
  });

  it("3. Modal.tsx implements accessible ARIA, Escape key handling, and focus trapping", () => {
    const modalFile = getFile("Modal.tsx");
    expect(modalFile).toBeDefined();
    const c = modalFile!.content;

    // ARIA roles & accessibility
    expect(c).toContain('role="dialog"');
    expect(c).toContain('aria-modal="true"');
    expect(c).toContain('aria-labelledby');
    expect(c).toContain('aria-describedby');

    // Escape handling
    expect(c).toContain("e.key === 'Escape'");

    // Focus trapping
    expect(c).toContain("e.key === 'Tab'");
    expect(c).toContain("document.body.style.overflow = 'hidden'");

    // Dialog export
    expect(c).toContain("export const Dialog");
    expect(c).toContain("export const Modal");
  });

  it("4. Tabs.tsx implements ARIA tablist/tab/tabpanel, keyboard navigation, and responsive container", () => {
    const tabsFile = getFile("Tabs.tsx");
    expect(tabsFile).toBeDefined();
    const c = tabsFile!.content;

    // ARIA roles & accessibility
    expect(c).toContain('role="tablist"');
    expect(c).toContain('role="tab"');
    expect(c).toContain('role="tabpanel"');
    expect(c).toContain('aria-selected');
    expect(c).toContain('aria-controls');

    // Keyboard navigation (Arrow keys, Home, End)
    expect(c).toContain("e.key === 'ArrowRight'");
    expect(c).toContain("e.key === 'ArrowLeft'");
    expect(c).toContain("e.key === 'Home'");
    expect(c).toContain("e.key === 'End'");

    // Responsive container
    expect(c).toContain("overflow-x-auto");
    expect(c).toContain("export const TabPanel");
  });

  it("5. Alert.tsx and Toast.tsx implement accessible announcements and auto-dismiss lifecycle", () => {
    const alertFile = getFile("Alert.tsx");
    expect(alertFile).toBeDefined();
    const ac = alertFile!.content;
    expect(ac).toContain('role="alert"');
    expect(ac).toContain("variant = 'info'");
    expect(ac).toContain("dismissible");

    const toastFile = getFile("Toast.tsx");
    expect(toastFile).toBeDefined();
    const tc = toastFile!.content;
    expect(tc).toContain('aria-live="polite"');
    expect(tc).toContain("export const ToastProvider");
    expect(tc).toContain("export const useToast");
    expect(tc).toContain("durationMs");
  });

  it("6. Navbar.tsx implements responsive mobile drawer, hamburger toggle, and Escape key dismissal", () => {
    const navFile = getFile("Navbar.tsx");
    expect(navFile).toBeDefined();
    const c = navFile!.content;

    // Responsive hamburger & accessibility
    expect(c).toContain('aria-label="Toggle navigation menu"');
    expect(c).toContain('aria-expanded={mobileMenuOpen}');
    expect(c).toContain("mobileMenuOpen");
    expect(c).toContain("e.key === 'Escape'");

    // Desktop and mobile links
    expect(c).toContain("hidden md:flex");
    expect(c).toContain("md:hidden");
  });

  it("7. DatePicker.tsx implements calendar controls, min/max bounds, and disabled date checks", () => {
    const dateFile = getFile("DatePicker.tsx");
    expect(dateFile).toBeDefined();
    const c = dateFile!.content;

    expect(c).toContain("minDate");
    expect(c).toContain("maxDate");
    expect(c).toContain("disabledDates");
    expect(c).toContain("handlePrevMonth");
    expect(c).toContain("handleNextMonth");
    expect(c).toContain("handleSelectDay");
    expect(c).toContain("Today");
    expect(c).toContain("Clear");
  });

  it("8. FileUpload.tsx implements drag-and-drop, format filtering, and size limit checks", () => {
    const uploadFile = getFile("FileUpload.tsx");
    expect(uploadFile).toBeDefined();
    const c = uploadFile!.content;

    expect(c).toContain("onDragOver");
    expect(c).toContain("onDrop");
    expect(c).toContain("maxSizeMB");
    expect(c).toContain("accept");
    expect(c).toContain("URL.createObjectURL");
    expect(c).toContain("handleRemove");
  });

  it("9. buildCoderContext includes all interactive component exports and instructions", () => {
    const context = generator.buildCoderContext(mockSpec);
    expect(context).toContain("Modal");
    expect(context).toContain("Dialog");
    expect(context).toContain("Tabs");
    expect(context).toContain("TabPanel");
    expect(context).toContain("Alert");
    expect(context).toContain("ToastProvider");
    expect(context).toContain("useToast");
    expect(context).toContain("Navbar");
    expect(context).toContain("DatePicker");
    expect(context).toContain("FileUpload");
    expect(context).toContain("INTERACTIVE COMPONENT GUIDELINES");
  });
});
