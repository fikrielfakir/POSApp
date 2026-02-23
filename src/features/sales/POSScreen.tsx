import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../shared/theme/theme';
import { useCartStore, CartItem } from './cartStore';
import { createSale } from './saleRepository';
import { getAllProducts, Product } from '../products/productRepository';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

const C = Colors.light;

export default function POSScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    getSubtotal,
    getTaxAmount,
    getDiscountAmount,
    getTotal,
    getItemCount,
    clearCart,
  } = useCartStore();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name?.toLowerCase().includes(query) ||
            p.barcode?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, products]);

  const loadProducts = async () => {
    try {
      const list = getAllProducts();
      setProducts(list);
      setFilteredProducts(list);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id!,
      name: product.name,
      barcode: product.barcode,
      quantity: 1,
      unitPrice: product.price || 0,
      discountPercent: 0,
      taxPercent: 0,
    });
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart first');
      return;
    }

    Alert.alert(
      'Confirm Sale',
      `Total: ${getTotal().toFixed(2)}\nProceed with checkout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cash',
          onPress: () => processSale('cash'),
        },
        {
          text: 'Card',
          onPress: () => processSale('card'),
        },
      ]
    );
  };

  const processSale = (paymentMethod: 'cash' | 'card' | 'bank' | 'split') => {
    try {
      const saleData = {
        subtotal: getSubtotal(),
        tax_amount: getTaxAmount(),
        discount_amount: getDiscountAmount(),
        total: getTotal(),
        paid_amount: getTotal(),
        payment_method: paymentMethod,
        items: items.map((item) => ({
          product_id: item.productId,
          product_name: item.name,
          barcode: item.barcode,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount_percent: item.discountPercent,
          tax_percent: item.taxPercent,
          line_total: item.lineTotal,
        })),
      };

      createSale(saleData);
      clearCart();
      Alert.alert('Success', 'Sale completed successfully!');
    } catch (error) {
      console.error('Sale failed:', error);
      Alert.alert('Error', 'Failed to process sale');
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cartItemPrice}>
          {item.unitPrice.toFixed(2)} x {item.quantity}
        </Text>
      </View>
      <View style={styles.cartItemActions}>
        <TouchableOpacity
          style={styles.qtyButton}
          onPress={() => updateQuantity(item.productId, item.quantity - 1)}
        >
          <Ionicons name="remove" size={16} color={C.primary} />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.qtyButton}
          onPress={() => updateQuantity(item.productId, item.quantity + 1)}
        >
          <Ionicons name="add" size={16} color={C.primary} />
        </TouchableOpacity>
        <Text style={styles.cartItemTotal}>{item.lineTotal.toFixed(2)}</Text>
      </View>
    </View>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleAddToCart(item)}
    >
      <View style={styles.productIcon}>
        <Ionicons name="cube-outline" size={24} color={C.primary} />
      </View>
      <Text style={styles.productName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.productPrice}>{item.price?.toFixed(2) || '0.00'}</Text>
      {item.stock !== undefined && (
        <Text style={[styles.productStock, item.stock < 5 && { color: C.danger }]}>
          Stock: {item.stock}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (isTablet) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={C.background} />
        <View style={styles.tabletLayout}>
          <View style={styles.productSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={C.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={C.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id!}
              numColumns={3}
              contentContainerStyle={styles.productList}
            />
          </View>
          <View style={styles.cartSection}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>Current Sale</Text>
              {items.length > 0 && (
                <TouchableOpacity onPress={clearCart}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={items}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.cartList}
              ListEmptyComponent={
                <Text style={styles.emptyCart}>No items in cart</Text>
              }
            />
            <View style={styles.cartSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{getSubtotal().toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>{getTaxAmount().toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.summaryValueDiscount}>
                  -{getDiscountAmount().toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{getTotal().toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.checkoutButton, items.length === 0 && styles.checkoutButtonDisabled]}
                onPress={handleCheckout}
                disabled={items.length === 0}
              >
                <Text style={styles.checkoutButtonText}>
                  CHECKOUT ({getItemCount()} items)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id!}
        numColumns={2}
        contentContainerStyle={styles.productList}
      />
      {items.length > 0 && (
        <TouchableOpacity style={styles.floatingCart} onPress={() => {}}>
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{getItemCount()}</Text>
          </View>
          <Text style={styles.floatingCartText}>
            {getTotal().toFixed(2)}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.md,
    color: C.textPrimary,
  },
  productList: {
    padding: Spacing.sm,
  },
  productCard: {
    flex: 1,
    backgroundColor: C.surface,
    margin: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    maxWidth: (width - 48) / 2,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  productName: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: C.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  productPrice: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: C.primary,
  },
  productStock: {
    fontSize: Typography.xs,
    color: C.textMuted,
    marginTop: Spacing.xs,
  },
  tabletLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  productSection: {
    flex: 1.2,
  },
  cartSection: {
    flex: 0.8,
    backgroundColor: C.surface,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  cartTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: C.textPrimary,
  },
  clearText: {
    color: C.danger,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  cartList: {
    flex: 1,
    padding: Spacing.sm,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: C.textPrimary,
  },
  cartItemPrice: {
    fontSize: Typography.xs,
    color: C.textMuted,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    marginHorizontal: Spacing.sm,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  cartItemTotal: {
    marginLeft: Spacing.md,
    fontSize: Typography.sm,
    fontWeight: '700',
    color: C.textPrimary,
    minWidth: 50,
    textAlign: 'right',
  },
  cartSummary: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.sm,
    color: C.textSecondary,
  },
  summaryValue: {
    fontSize: Typography.sm,
    color: C.textPrimary,
  },
  summaryValueDiscount: {
    fontSize: Typography.sm,
    color: C.danger,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  totalLabel: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: C.textPrimary,
  },
  totalValue: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: C.primary,
  },
  checkoutButton: {
    backgroundColor: C.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  checkoutButtonDisabled: {
    backgroundColor: C.border,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: Typography.md,
    fontWeight: '700',
  },
  emptyCart: {
    textAlign: 'center',
    color: C.textMuted,
    marginTop: Spacing.xl,
  },
  floatingCart: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    elevation: 4,
  },
  cartBadge: {
    backgroundColor: '#fff',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: C.primary,
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  floatingCartText: {
    color: '#fff',
    fontSize: Typography.lg,
    fontWeight: '700',
  },
});
