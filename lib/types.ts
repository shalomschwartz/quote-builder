export type VariableType =
  | "text"
  | "number"
  | "date"
  | "currency"
  | "email"
  | "phone"
  | "textarea";

export type VariableSection =
  | "header"
  | "client"
  | "items"
  | "totals"
  | "terms"
  | "footer"
  | "custom";

export interface Variable {
  id: string;
  key: string;
  label: string;
  type: VariableType;
  required: boolean;
  skipped: boolean;
  placeholder: string;
  originalText: string;
  section: VariableSection;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface DocumentStructure {
  hasHeader: boolean;
  hasItemsTable: boolean;
  hasTotals: boolean;
  hasFooter: boolean;
  sections: string[];
}

export interface Template {
  id: string;
  name: string;
  variables: Variable[];
  documentStructure: DocumentStructure;
  createdAt: string;
}

export interface QuoteValues {
  [key: string]: string;
}

export interface ExtractResult {
  variables: Variable[];
  documentStructure: DocumentStructure;
  rawText: string;
}
