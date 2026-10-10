# MetroVerify: Legal Metrology Digital Verification & Audit Ledger Platform

## 1. Executive Summary & SIH Context
In the modern economy, everyday commerce is governed by measurement accuracy. The **Legal Metrology Act, 2009** and the **Legal Metrology (General) Rules, 2011 (Amended 2024–2026)** require that every commercial weight, measure, weighing machine, and measuring instrument be verified, stamped, and certified before commercial deployment and periodically thereafter.

Built for the **Smart India Hackathon (SIH)**, **MetroVerify** addresses the systemic vulnerabilities inherent in manual, paper-based verification regimes across India's state Metrology Departments (Weights & Measures organizations):
* Counterfeit verification stamping and forged paper certificates.
* Human error in complex **Maximum Permissible Error (MPE)** calculations across Classes I, II, III, and IIII.
* Inefficient logistics and unverifiable repeatability ($\sigma$) in high-capacity weighbridge test-weight substitution.
* Zero continuous visibility into load-cell degradation, drift, or fraudulent tampering between annual physical inspection visits.

---

## 2. Core Real-World Problems

### A. Piecewise MPE Calculation Complexity
Statutory Non-Automatic Weighing Instruments (NAWI) are categorized into four distinct accuracy classes:
1. **Class I (Special Accuracy):** Micro-balances, analytical laboratory equipment ($e \le 1\,\text{mg}$).
2. **Class II (High Accuracy):** Precision scales, bullion and precious stones scales ($1\,\text{mg} \le e \le 50\,\text{mg}$).
3. **Class III (Medium Accuracy):** Retail trade, grocery scales, industrial platforms, vehicle weighbridges ($e \ge 0.1\,\text{g}$).
4. **Class IIII (Ordinary Accuracy):** Coarse materials, scrap balances, earthwork measurements ($e \ge 5\,\text{g}$).

For each class, the Maximum Permissible Error (MPE) is calculated based on verification scale intervals ($e$) across non-linear load tiers (e.g., $0 \le m \le 500e \implies \pm 0.5e$, $500e < m \le 2000e \implies \pm 1.0e$, $m > 2000e \implies \pm 1.5e$). During in-service inspection, statutory allowances double to $2 \times \text{MPE}$. In the field, inspectors calculating these limits on manual forms often miscalculate boundary step points, resulting in either unlawful rejection of valid instruments or unlawful certification of defective devices.

### B. High-Capacity Weighbridge Verification Bottlenecks
Standard legal verification requires testing up to maximum capacity ($Max$, often 40t to 100t). Transporting 60 tonnes of Class $M_1$ calibrated cast-iron weights is logistically impossible in rural and industrial areas. While the Legal Metrology Rules permit test load substitution with arbitrary materials (such as gravel or scrap) if repeatability ($\sigma$) is established at $1/2 Max$ or $1/5 Max$, inspectors lacked an automated, tamper-proof tool to compute repeatability standard deviation and enforce substitution ceilings.

### C. Physical Stamp Tampering & Certificate Forgery
Paper verification certificates lack verifiable linkage to physical devices. Fraudulent traders routinely alter certificate serial numbers, duplicate paper documents, or attach counterfeit lead seals to uninspected instruments. Consumers and business partners purchasing goods across weighbridges have no instant, zero-trust mechanism to verify certification authenticity.

### D. The Real-Time Telemetry Gap
Weighbridges operate under harsh environmental conditions: thermal expansion, foundation settling, and mechanical shock degrade load-cell linearity over time. Furthermore, dishonest operators can insert signal attenuators or tamper with analog junction boxes to short-weigh commercial cargo. Traditional once-a-year physical inspections fail to detect dynamic zero-point drift or corner load imbalances between inspection cycles.

---

## 3. MetroVerify v3 Solution Architecture

MetroVerify v3 introduces a robust, enterprise-grade architecture:
1. **Statutory MPE Rule Engine:** Complete algorithmic implementation of Legal Metrology (General) Rules, 2011 with 2026 amendments.
2. **AI Vision & Document OCR Engine:** Neural vision extraction of scale nameplates, manufacturer serials, and model approval marks from mobile photo uploads.
3. **IoT Real-Time Telemetry Stream:** WebSocket-driven load-cell monitoring streaming live 4-corner weighbridge loads, evaluating zero-point stability, load-cell jitter, and corner imbalance ratios.
4. **Cryptographic Tamper-Evident Ledger:** SHA-256 hash-chained immutable audit logs for all inspection actions.
5. **Zero-Trust Public Verification:** Instant mobile-friendly QR verification giving citizens and enforcement agencies immediate certificate validity status.
6. **Bluma-Level Dark Mode Experience:** A modern, high-precision dark mode interface engineered for field inspectors and regulatory executives.
