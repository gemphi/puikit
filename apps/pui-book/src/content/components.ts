export interface ComponentDoc {
  name: string;
  category: string;
  description: string;
  propsSummary: string;
}

export const COMPONENT_CATALOG: ComponentDoc[] = [
  { name: 'Button', category: 'Primitives', description: 'Action triggers with variants, sizes, and loading state', propsSummary: 'variant, size, icon, loading, disabled' },
  { name: 'Tag', category: 'Primitives', description: 'Compact interactive chips and status markers', propsSummary: 'intent, size, round, minimal, onRemove' },
  { name: 'Callout', category: 'Feedback', description: 'Prominent contextual alert and status banner', propsSummary: 'intent, title, icon, compact' },
  { name: 'NonIdealState', category: 'Feedback', description: 'Empty, error, or loading state visualizer', propsSummary: 'icon, title, description, action' },
  { name: 'ProgressBar', category: 'Feedback', description: 'Linear progress indicator with indeterminate animation', propsSummary: 'value, intent, striped, animate' },
  { name: 'Tree', category: 'Data Display', description: 'Hierarchical collapsible node tree for dense data', propsSummary: 'nodes, onNodeClick, onNodeExpand' },
  { name: 'Table', category: 'Data Display', description: 'Structured tabular data with interactive rows', propsSummary: 'headers, rows, striped, bordered' },
  { name: 'Card', category: 'Layout', description: 'Surface container with elevation levels 0-4', propsSummary: 'elevation, interactive, compact' },
  { name: 'Switch', category: 'Forms', description: 'Boolean toggle switch with smooth transition', propsSummary: 'checked, label, size, disabled' },
  { name: 'FormGroup', category: 'Forms', description: 'Label, helper text, and validation status container', propsSummary: 'label, helperText, intent, inline' },
  { name: 'Dialog', category: 'Overlays', description: 'Modal dialog focus container with portal mounting', propsSummary: 'isOpen, onClose, title, size' },
  { name: 'Drawer', category: 'Overlays', description: 'Slide-out panel from screen boundaries', propsSummary: 'isOpen, onClose, position, size' },
  { name: 'Price', category: 'Shop', description: 'Formatted currency with discount badges and strikethroughs', propsSummary: 'amount, currency, saleAmount, showDiscount' },
  { name: 'ProductCard', category: 'Shop', description: 'Interactive card with wishlist toggle, add-to-cart, and pricing', propsSummary: 'id, title, price, image, onAddToCart, onToggleWishlist' },
  { name: 'ProductGrid', category: 'Shop', description: 'Responsive grid of product cards with built-in skeleton loading', propsSummary: 'products, loading, skeletonCount' },
  { name: 'CartDrawer', category: 'Shop', description: 'Slide-out drawer containing cart items and checkout summary', propsSummary: 'isOpen, onClose, items, onCheckout' },
  { name: 'OrderCard', category: 'Shop', description: 'Enterprise order summary card with status badges and item breakdown', propsSummary: 'id, date, total, status, items' },
];
