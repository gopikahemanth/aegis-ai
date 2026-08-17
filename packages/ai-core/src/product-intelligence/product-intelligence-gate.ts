/**
 * ProductIntelligenceGate
 *
 * Tier 37 Apex Integration Gate — Verifies that UniversalProductBuilder, RealProductValidation,
 * UIIntelligence, Repair, Acceptance, and Delivery have produced consistent, uncorrupted evidence.
 */

import { type MasterAcceptanceDecision } from "./product-acceptance-coordinator.js";
import { type DeliveryManifest } from "./product-delivery-coordinator.js";
import { FinalProductCertificateEngine, type FinalProductCertificate } from "./final-product-certificate.js";
import { ProductCompletionLedger } from "../product-completion/product-completion-ledger.js";

export class ProductIntelligenceGate {
  public static verifyAndCertify(
    acceptance: MasterAcceptanceDecision,
    manifest: DeliveryManifest,
    targetDirectory: string = process.cwd()
  ): FinalProductCertificate {
    if (!acceptance.isAccepted) {
      throw new Error(`ProductIntelligenceGate: Cannot certify product. Acceptance failed: ${acceptance.summary}`);
    }

    const certificate = FinalProductCertificateEngine.issueCertificate(manifest, targetDirectory);

    // Record into append-only cryptographic completion ledger
    ProductCompletionLedger.recordEntry({
      actor: "product_intelligence_gate",
      project: manifest.product,
      eventType: "FINAL_PRODUCT_ASSEMBLY_CERTIFIED",
      requirementId: "ALL",
      evidenceReferences: [manifest.manifestId, certificate.certificateId, certificate.cryptographicSignature],
    });

    return certificate;
  }
}
