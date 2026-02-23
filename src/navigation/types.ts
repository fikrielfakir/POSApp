export type RootStackParamList = {
  Setup: undefined;
  PINLock: undefined;
  Main: undefined;
};

export type DrawerParamList = {
  Dashboard: undefined;
  POS: undefined;
  Products: undefined;
  Sales: undefined;
  Contacts: undefined;
  Purchases: undefined;
  StockTransfers: undefined;
  Shipments: undefined;
  SellReturns: undefined;
  Expenses: undefined;
  Reports: undefined;
  FieldForce: undefined;
  Followups: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  POSTab: undefined;
  ProductsTab: undefined;
  SalesTab: undefined;
  ContactsTab: undefined;
  MoreTab: undefined;
};

export type ProductStackParamList = {
  ProductList: undefined;
  ProductDetail: { productId: string };
  ProductForm: { productId?: string };
  StockAdjust: { productId: string };
  CategoryList: undefined;
  BrandList: undefined;
};

export type SaleStackParamList = {
  SaleList: undefined;
  Invoice: { saleId: string };
  Checkout: undefined;
};

export type ContactStackParamList = {
  ContactList: undefined;
  ContactDetail: { contactId: string };
  ContactForm: { contactId?: string };
};

export type PurchaseStackParamList = {
  PurchaseList: undefined;
  PurchaseForm: { purchaseId?: string };
  PurchaseReceive: { purchaseId: string };
};

export type ReportStackParamList = {
  ReportHome: undefined;
  ProfitLoss: undefined;
  SalesReport: undefined;
  StockReport: undefined;
  ExpenseReport: undefined;
};

export type FieldForceStackParamList = {
  FieldDashboard: undefined;
  VisitHistory: undefined;
  Attendance: undefined;
  MapView: undefined;
};

export type FollowupStackParamList = {
  FollowupList: undefined;
  FollowupForm: { followupId?: string };
};
