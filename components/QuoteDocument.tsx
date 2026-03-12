import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Template, QuoteValues, LineItem } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827",
    padding: 40,
    backgroundColor: "#ffffff",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
  },
  companyBlock: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 9,
    color: "#6b7280",
    lineHeight: 1.5,
  },
  quoteInfoBlock: {
    alignItems: "flex-end",
  },
  quoteTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    marginBottom: 8,
    letterSpacing: 2,
  },
  quoteMetaRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 2,
  },
  quoteMetaLabel: {
    fontSize: 9,
    color: "#6b7280",
    width: 70,
    textAlign: "right",
  },
  quoteMetaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  // Client section
  clientSection: {
    marginBottom: 24,
    flexDirection: "row",
    gap: 24,
  },
  clientBlock: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  clientDetail: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.5,
  },
  // Items table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e3a8a",
    padding: 8,
    borderRadius: 4,
    marginBottom: 1,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableRowEven: {
    backgroundColor: "#f9fafb",
  },
  colDescription: { flex: 4 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 2, textAlign: "right" },
  colTotal: { flex: 2, textAlign: "right" },
  tableCell: {
    fontSize: 9,
    color: "#374151",
  },
  // Totals
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  totalsBlock: {
    width: 220,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  totalsLabel: {
    fontSize: 9,
    color: "#6b7280",
  },
  totalsValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "#1e3a8a",
    borderRadius: 4,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  totalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  // Terms
  termsSection: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  termsText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.6,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
  },
});

interface QuoteDocumentProps {
  template: Template;
  values: QuoteValues;
  lineItems: LineItem[];
  vatRate: number;
}

function getVal(values: QuoteValues, key: string): string {
  return values[key] || "";
}

function findValBySection(
  template: Template,
  values: QuoteValues,
  section: string,
  hint: string
): string {
  const v = template.variables.find(
    (variable) =>
      variable.section === section &&
      !variable.skipped &&
      variable.key.toLowerCase().includes(hint.toLowerCase())
  );
  return v ? getVal(values, v.key) : "";
}

function getVariablesBySection(template: Template, section: string) {
  return template.variables.filter(
    (v) => v.section === section && !v.skipped
  );
}

export function QuoteDocument({
  template,
  values,
  lineItems,
  vatRate,
}: QuoteDocumentProps) {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const vatAmount = (subtotal * vatRate) / 100;
  const total = subtotal + vatAmount;

  const headerVars = getVariablesBySection(template, "header");
  const clientVars = getVariablesBySection(template, "client");
  const termsVars = getVariablesBySection(template, "terms");
  const footerVars = getVariablesBySection(template, "footer");

  // Try to find specific common fields
  const companyName =
    findValBySection(template, values, "header", "company") ||
    findValBySection(template, values, "header", "name") ||
    "Company Name";

  const quoteNumber =
    findValBySection(template, values, "header", "number") ||
    findValBySection(template, values, "header", "quote_no") ||
    findValBySection(template, values, "header", "reference") ||
    "-";

  const quoteDate =
    findValBySection(template, values, "header", "date") || "-";

  const validUntil =
    findValBySection(template, values, "header", "valid") ||
    findValBySection(template, values, "header", "expiry") ||
    "-";

  const clientName =
    findValBySection(template, values, "client", "name") ||
    findValBySection(template, values, "client", "company") ||
    findValBySection(template, values, "client", "to") ||
    "-";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{companyName}</Text>
            {headerVars
              .filter(
                (v) =>
                  !v.key.toLowerCase().includes("company") &&
                  !v.key.toLowerCase().includes("name") &&
                  !v.key.toLowerCase().includes("number") &&
                  !v.key.toLowerCase().includes("date") &&
                  !v.key.toLowerCase().includes("valid")
              )
              .map((v) => (
                <Text key={v.id} style={styles.companyDetails}>
                  {getVal(values, v.key)}
                </Text>
              ))}
          </View>

          <View style={styles.quoteInfoBlock}>
            <Text style={styles.quoteTitle}>QUOTATION</Text>
            <View style={styles.quoteMetaRow}>
              <Text style={styles.quoteMetaLabel}>Quote #:</Text>
              <Text style={styles.quoteMetaValue}>{quoteNumber}</Text>
            </View>
            <View style={styles.quoteMetaRow}>
              <Text style={styles.quoteMetaLabel}>Date:</Text>
              <Text style={styles.quoteMetaValue}>{quoteDate}</Text>
            </View>
            {validUntil !== "-" && (
              <View style={styles.quoteMetaRow}>
                <Text style={styles.quoteMetaLabel}>Valid until:</Text>
                <Text style={styles.quoteMetaValue}>{validUntil}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Client section */}
        {clientVars.length > 0 && (
          <View style={styles.clientSection}>
            <View style={styles.clientBlock}>
              <Text style={styles.sectionTitle}>Bill To</Text>
              <Text style={styles.clientName}>{clientName}</Text>
              {clientVars
                .filter(
                  (v) =>
                    !v.key.toLowerCase().includes("name") &&
                    !v.key.toLowerCase().includes("company") &&
                    !v.key.toLowerCase().includes("to_")
                )
                .map((v) => (
                  <Text key={v.id} style={styles.clientDetail}>
                    {v.label}: {getVal(values, v.key)}
                  </Text>
                ))}
            </View>
          </View>
        )}

        {/* Line items table */}
        {template.documentStructure.hasItemsTable && (
          <View style={styles.table}>
            <Text style={styles.sectionTitle}>Items</Text>
            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colDescription]}>
                Description
              </Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>
                Unit Price
              </Text>
              <Text style={[styles.tableHeaderText, styles.colTotal]}>
                Total
              </Text>
            </View>

            {/* Rows */}
            {lineItems.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.tableRow,
                  index % 2 === 1 ? styles.tableRowEven : {},
                ]}
              >
                <Text style={[styles.tableCell, styles.colDescription]}>
                  {item.description}
                </Text>
                <Text style={[styles.tableCell, styles.colQty]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableCell, styles.colPrice]}>
                  {item.unitPrice.toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, styles.colTotal]}>
                  {(item.quantity * item.unitPrice).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBlock}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{subtotal.toFixed(2)}</Text>
            </View>
            {vatRate > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>VAT ({vatRate}%)</Text>
                <Text style={styles.totalsValue}>{vatAmount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Terms */}
        {termsVars.length > 0 && (
          <View style={styles.termsSection}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            {termsVars.map((v) => (
              <Text key={v.id} style={styles.termsText}>
                {v.label}: {getVal(values, v.key)}
              </Text>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {footerVars.length > 0
              ? getVal(values, footerVars[0].key)
              : "Thank you for your business"}
          </Text>
          <Text style={styles.footerText}>
            Generated with QuoteBuilder
          </Text>
        </View>
      </Page>
    </Document>
  );
}
