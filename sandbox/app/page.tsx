"use client";

import React, { useState } from 'react';

// 错误边界组件
interface ErrorBoundaryProps {
  children: React.ReactNode;
  componentName: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ComponentErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('组件渲染错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center mb-2">
            <div className="text-red-500 text-xl mr-2">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800">组件渲染错误</h3>
          </div>
          <p className="text-red-700 mb-2">组件 "{this.props.componentName}" 渲染时发生错误</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-red-600 hover:text-red-800">查看错误详情</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded text-sm text-red-800 overflow-auto">
              {this.state.error?.message}
              {this.state.error?.stack && '\n' + this.state.error.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// 安全的组件渲染器
interface ComponentRendererProps {
  activeTab: string;
  components: string[];
}

function ComponentRenderer({ activeTab, components }: ComponentRendererProps) {
  return (
    <>
      {components.map((componentName) => {
        if (activeTab !== componentName) return null;
        
        return (
          <SafeComponentWrapper key={componentName} componentName={componentName} />
        );
      })}
    </>
  );
}

// 安全的单个组件包装器
interface SafeComponentWrapperProps {
  componentName: string;
}

function SafeComponentWrapper({ componentName }: SafeComponentWrapperProps) {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    setComponent(null);

    try {
      // 从组件映射表中获取组件
      const componentMap = (window as any).componentMap;
      if (componentMap && componentMap[componentName]) {
        setComponent(() => componentMap[componentName]);
      } else {
        throw new Error('组件未在映射表中找到');
      }
    } catch (error) {
      console.error(`组件 ${componentName} 获取失败:`, error);
      setLoadError(`组件获取失败: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [componentName]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <div className="mb-4 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">{componentName}</h2>
          <p className="text-gray-600 text-sm mt-1">组件加载失败</p>
        </div>
        
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center mb-2">
            <div className="text-red-500 text-xl mr-2">❌</div>
            <h3 className="text-lg font-semibold text-red-800">组件加载错误</h3>
          </div>
          <p className="text-red-700">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!Component) {
    return (
      <div>
        <div className="mb-4 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">{componentName}</h2>
          <p className="text-gray-600 text-sm mt-1">组件未找到</p>
        </div>
        
        <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
          <div className="flex items-center mb-2">
            <div className="text-yellow-500 text-xl mr-2">⚠️</div>
            <h3 className="text-lg font-semibold text-yellow-800">组件未找到</h3>
          </div>
          <p className="text-yellow-700">无法找到名为 "{componentName}" 的组件</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 pb-4 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800">{componentName}</h2>
        <p className="text-gray-600 text-sm mt-1">组件预览</p>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
        <ComponentErrorBoundary componentName={componentName}>
          <Component />
        </ComponentErrorBoundary>
      </div>
    </div>
  );
}


    let AccountOverviewPanelComponent: React.ComponentType | null = null;
    try {
      const AccountOverviewPanelModule = require('@/components/AccountOverviewPanel');
      AccountOverviewPanelComponent = AccountOverviewPanelModule.default || AccountOverviewPanelModule;
    } catch (error) {
      console.error('导入组件 AccountOverviewPanel 失败:', error);
      AccountOverviewPanelComponent = null;
    }

    let AccountSidebarNavComponent: React.ComponentType | null = null;
    try {
      const AccountSidebarNavModule = require('@/components/AccountSidebarNav');
      AccountSidebarNavComponent = AccountSidebarNavModule.default || AccountSidebarNavModule;
    } catch (error) {
      console.error('导入组件 AccountSidebarNav 失败:', error);
      AccountSidebarNavComponent = null;
    }

    let AddressFormComponent: React.ComponentType | null = null;
    try {
      const AddressFormModule = require('@/components/AddressForm');
      AddressFormComponent = AddressFormModule.default || AddressFormModule;
    } catch (error) {
      console.error('导入组件 AddressForm 失败:', error);
      AddressFormComponent = null;
    }

    let AddressListComponent: React.ComponentType | null = null;
    try {
      const AddressListModule = require('@/components/AddressList');
      AddressListComponent = AddressListModule.default || AddressListModule;
    } catch (error) {
      console.error('导入组件 AddressList 失败:', error);
      AddressListComponent = null;
    }

    let AftersalesDetailPanelComponent: React.ComponentType | null = null;
    try {
      const AftersalesDetailPanelModule = require('@/components/AftersalesDetailPanel');
      AftersalesDetailPanelComponent = AftersalesDetailPanelModule.default || AftersalesDetailPanelModule;
    } catch (error) {
      console.error('导入组件 AftersalesDetailPanel 失败:', error);
      AftersalesDetailPanelComponent = null;
    }

    let ArticleCardComponent: React.ComponentType | null = null;
    try {
      const ArticleCardModule = require('@/components/ArticleCard');
      ArticleCardComponent = ArticleCardModule.default || ArticleCardModule;
    } catch (error) {
      console.error('导入组件 ArticleCard 失败:', error);
      ArticleCardComponent = null;
    }

    let AuctionBidPanelComponent: React.ComponentType | null = null;
    try {
      const AuctionBidPanelModule = require('@/components/AuctionBidPanel');
      AuctionBidPanelComponent = AuctionBidPanelModule.default || AuctionBidPanelModule;
    } catch (error) {
      console.error('导入组件 AuctionBidPanel 失败:', error);
      AuctionBidPanelComponent = null;
    }

    let AuthWidgetComponent: React.ComponentType | null = null;
    try {
      const AuthWidgetModule = require('@/components/AuthWidget');
      AuthWidgetComponent = AuthWidgetModule.default || AuthWidgetModule;
    } catch (error) {
      console.error('导入组件 AuthWidget 失败:', error);
      AuthWidgetComponent = null;
    }

    let CartLineItemComponent: React.ComponentType | null = null;
    try {
      const CartLineItemModule = require('@/components/CartLineItem');
      CartLineItemComponent = CartLineItemModule.default || CartLineItemModule;
    } catch (error) {
      console.error('导入组件 CartLineItem 失败:', error);
      CartLineItemComponent = null;
    }

    let CheckoutStepNavComponent: React.ComponentType | null = null;
    try {
      const CheckoutStepNavModule = require('@/components/CheckoutStepNav');
      CheckoutStepNavComponent = CheckoutStepNavModule.default || CheckoutStepNavModule;
    } catch (error) {
      console.error('导入组件 CheckoutStepNav 失败:', error);
      CheckoutStepNavComponent = null;
    }

    let ContactFormComponent: React.ComponentType | null = null;
    try {
      const ContactFormModule = require('@/components/ContactForm');
      ContactFormComponent = ContactFormModule.default || ContactFormModule;
    } catch (error) {
      console.error('导入组件 ContactForm 失败:', error);
      ContactFormComponent = null;
    }

    let CouponInputComponent: React.ComponentType | null = null;
    try {
      const CouponInputModule = require('@/components/CouponInput');
      CouponInputComponent = CouponInputModule.default || CouponInputModule;
    } catch (error) {
      console.error('导入组件 CouponInput 失败:', error);
      CouponInputComponent = null;
    }

    let CouponListComponent: React.ComponentType | null = null;
    try {
      const CouponListModule = require('@/components/CouponList');
      CouponListComponent = CouponListModule.default || CouponListModule;
    } catch (error) {
      console.error('导入组件 CouponList 失败:', error);
      CouponListComponent = null;
    }

    let CurrencySwitcherComponent: React.ComponentType | null = null;
    try {
      const CurrencySwitcherModule = require('@/components/CurrencySwitcher');
      CurrencySwitcherComponent = CurrencySwitcherModule.default || CurrencySwitcherModule;
    } catch (error) {
      console.error('导入组件 CurrencySwitcher 失败:', error);
      CurrencySwitcherComponent = null;
    }

    let FAQListComponent: React.ComponentType | null = null;
    try {
      const FAQListModule = require('@/components/FAQList');
      FAQListComponent = FAQListModule.default || FAQListModule;
    } catch (error) {
      console.error('导入组件 FAQList 失败:', error);
      FAQListComponent = null;
    }

    let FacetFilterComponent: React.ComponentType | null = null;
    try {
      const FacetFilterModule = require('@/components/FacetFilter');
      FacetFilterComponent = FacetFilterModule.default || FacetFilterModule;
    } catch (error) {
      console.error('导入组件 FacetFilter 失败:', error);
      FacetFilterComponent = null;
    }

    let FeatureGridComponent: React.ComponentType | null = null;
    try {
      const FeatureGridModule = require('@/components/FeatureGrid');
      FeatureGridComponent = FeatureGridModule.default || FeatureGridModule;
    } catch (error) {
      console.error('导入组件 FeatureGrid 失败:', error);
      FeatureGridComponent = null;
    }

    let FileUploadComponent: React.ComponentType | null = null;
    try {
      const FileUploadModule = require('@/components/FileUpload');
      FileUploadComponent = FileUploadModule.default || FileUploadModule;
    } catch (error) {
      console.error('导入组件 FileUpload 失败:', error);
      FileUploadComponent = null;
    }

    let FilterChipsBarComponent: React.ComponentType | null = null;
    try {
      const FilterChipsBarModule = require('@/components/FilterChipsBar');
      FilterChipsBarComponent = FilterChipsBarModule.default || FilterChipsBarModule;
    } catch (error) {
      console.error('导入组件 FilterChipsBar 失败:', error);
      FilterChipsBarComponent = null;
    }

    let FooterComponent: React.ComponentType | null = null;
    try {
      const FooterModule = require('@/components/Footer');
      FooterComponent = FooterModule.default || FooterModule;
    } catch (error) {
      console.error('导入组件 Footer 失败:', error);
      FooterComponent = null;
    }

    let GroupBuyWidgetComponent: React.ComponentType | null = null;
    try {
      const GroupBuyWidgetModule = require('@/components/GroupBuyWidget');
      GroupBuyWidgetComponent = GroupBuyWidgetModule.default || GroupBuyWidgetModule;
    } catch (error) {
      console.error('导入组件 GroupBuyWidget 失败:', error);
      GroupBuyWidgetComponent = null;
    }

    let HeaderComponent: React.ComponentType | null = null;
    try {
      const HeaderModule = require('@/components/Header');
      HeaderComponent = HeaderModule.default || HeaderModule;
    } catch (error) {
      console.error('导入组件 Header 失败:', error);
      HeaderComponent = null;
    }

    let HeroBannerComponent: React.ComponentType | null = null;
    try {
      const HeroBannerModule = require('@/components/HeroBanner');
      HeroBannerComponent = HeroBannerModule.default || HeroBannerModule;
    } catch (error) {
      console.error('导入组件 HeroBanner 失败:', error);
      HeroBannerComponent = null;
    }

    let InventoryStatusComponent: React.ComponentType | null = null;
    try {
      const InventoryStatusModule = require('@/components/InventoryStatus');
      InventoryStatusComponent = InventoryStatusModule.default || InventoryStatusModule;
    } catch (error) {
      console.error('导入组件 InventoryStatus 失败:', error);
      InventoryStatusComponent = null;
    }

    let LoyaltyWidgetComponent: React.ComponentType | null = null;
    try {
      const LoyaltyWidgetModule = require('@/components/LoyaltyWidget');
      LoyaltyWidgetComponent = LoyaltyWidgetModule.default || LoyaltyWidgetModule;
    } catch (error) {
      console.error('导入组件 LoyaltyWidget 失败:', error);
      LoyaltyWidgetComponent = null;
    }

    let MapViewerComponent: React.ComponentType | null = null;
    try {
      const MapViewerModule = require('@/components/MapViewer');
      MapViewerComponent = MapViewerModule.default || MapViewerModule;
    } catch (error) {
      console.error('导入组件 MapViewer 失败:', error);
      MapViewerComponent = null;
    }

    let MediaGalleryComponent: React.ComponentType | null = null;
    try {
      const MediaGalleryModule = require('@/components/MediaGallery');
      MediaGalleryComponent = MediaGalleryModule.default || MediaGalleryModule;
    } catch (error) {
      console.error('导入组件 MediaGallery 失败:', error);
      MediaGalleryComponent = null;
    }

    let MiniCartComponent: React.ComponentType | null = null;
    try {
      const MiniCartModule = require('@/components/MiniCart');
      MiniCartComponent = MiniCartModule.default || MiniCartModule;
    } catch (error) {
      console.error('导入组件 MiniCart 失败:', error);
      MiniCartComponent = null;
    }

    let ModularContentDisplayComponent: React.ComponentType | null = null;
    try {
      const ModularContentDisplayModule = require('@/components/ModularContentDisplay');
      ModularContentDisplayComponent = ModularContentDisplayModule.default || ModularContentDisplayModule;
    } catch (error) {
      console.error('导入组件 ModularContentDisplay 失败:', error);
      ModularContentDisplayComponent = null;
    }

    let NotificationListComponent: React.ComponentType | null = null;
    try {
      const NotificationListModule = require('@/components/NotificationList');
      NotificationListComponent = NotificationListModule.default || NotificationListModule;
    } catch (error) {
      console.error('导入组件 NotificationList 失败:', error);
      NotificationListComponent = null;
    }

    let OrderDetailPanelComponent: React.ComponentType | null = null;
    try {
      const OrderDetailPanelModule = require('@/components/OrderDetailPanel');
      OrderDetailPanelComponent = OrderDetailPanelModule.default || OrderDetailPanelModule;
    } catch (error) {
      console.error('导入组件 OrderDetailPanel 失败:', error);
      OrderDetailPanelComponent = null;
    }

    let OrderSummaryComponent: React.ComponentType | null = null;
    try {
      const OrderSummaryModule = require('@/components/OrderSummary');
      OrderSummaryComponent = OrderSummaryModule.default || OrderSummaryModule;
    } catch (error) {
      console.error('导入组件 OrderSummary 失败:', error);
      OrderSummaryComponent = null;
    }

    let OrdersListComponent: React.ComponentType | null = null;
    try {
      const OrdersListModule = require('@/components/OrdersList');
      OrdersListComponent = OrdersListModule.default || OrdersListModule;
    } catch (error) {
      console.error('导入组件 OrdersList 失败:', error);
      OrdersListComponent = null;
    }

    let PaymentMethodListComponent: React.ComponentType | null = null;
    try {
      const PaymentMethodListModule = require('@/components/PaymentMethodList');
      PaymentMethodListComponent = PaymentMethodListModule.default || PaymentMethodListModule;
    } catch (error) {
      console.error('导入组件 PaymentMethodList 失败:', error);
      PaymentMethodListComponent = null;
    }

    let PaymentMethodSelectorComponent: React.ComponentType | null = null;
    try {
      const PaymentMethodSelectorModule = require('@/components/PaymentMethodSelector');
      PaymentMethodSelectorComponent = PaymentMethodSelectorModule.default || PaymentMethodSelectorModule;
    } catch (error) {
      console.error('导入组件 PaymentMethodSelector 失败:', error);
      PaymentMethodSelectorComponent = null;
    }

    let PriceBlockComponent: React.ComponentType | null = null;
    try {
      const PriceBlockModule = require('@/components/PriceBlock');
      PriceBlockComponent = PriceBlockModule.default || PriceBlockModule;
    } catch (error) {
      console.error('导入组件 PriceBlock 失败:', error);
      PriceBlockComponent = null;
    }

    let ProductCardComponent: React.ComponentType | null = null;
    try {
      const ProductCardModule = require('@/components/ProductCard');
      ProductCardComponent = ProductCardModule.default || ProductCardModule;
    } catch (error) {
      console.error('导入组件 ProductCard 失败:', error);
      ProductCardComponent = null;
    }

    let ProductGridComponent: React.ComponentType | null = null;
    try {
      const ProductGridModule = require('@/components/ProductGrid');
      ProductGridComponent = ProductGridModule.default || ProductGridModule;
    } catch (error) {
      console.error('导入组件 ProductGrid 失败:', error);
      ProductGridComponent = null;
    }

    let ProfileFormComponent: React.ComponentType | null = null;
    try {
      const ProfileFormModule = require('@/components/ProfileForm');
      ProfileFormComponent = ProfileFormModule.default || ProfileFormModule;
    } catch (error) {
      console.error('导入组件 ProfileForm 失败:', error);
      ProfileFormComponent = null;
    }

    let ProgressTrackerComponent: React.ComponentType | null = null;
    try {
      const ProgressTrackerModule = require('@/components/ProgressTracker');
      ProgressTrackerComponent = ProgressTrackerModule.default || ProgressTrackerModule;
    } catch (error) {
      console.error('导入组件 ProgressTracker 失败:', error);
      ProgressTrackerComponent = null;
    }

    let PurchaseOptionsPanelComponent: React.ComponentType | null = null;
    try {
      const PurchaseOptionsPanelModule = require('@/components/PurchaseOptionsPanel');
      PurchaseOptionsPanelComponent = PurchaseOptionsPanelModule.default || PurchaseOptionsPanelModule;
    } catch (error) {
      console.error('导入组件 PurchaseOptionsPanel 失败:', error);
      PurchaseOptionsPanelComponent = null;
    }

    let QAListComponent: React.ComponentType | null = null;
    try {
      const QAListModule = require('@/components/QAList');
      QAListComponent = QAListModule.default || QAListModule;
    } catch (error) {
      console.error('导入组件 QAList 失败:', error);
      QAListComponent = null;
    }

    let QuestionFormComponent: React.ComponentType | null = null;
    try {
      const QuestionFormModule = require('@/components/QuestionForm');
      QuestionFormComponent = QuestionFormModule.default || QuestionFormModule;
    } catch (error) {
      console.error('导入组件 QuestionForm 失败:', error);
      QuestionFormComponent = null;
    }

    let QuoteRequestFormComponent: React.ComponentType | null = null;
    try {
      const QuoteRequestFormModule = require('@/components/QuoteRequestForm');
      QuoteRequestFormComponent = QuoteRequestFormModule.default || QuoteRequestFormModule;
    } catch (error) {
      console.error('导入组件 QuoteRequestForm 失败:', error);
      QuoteRequestFormComponent = null;
    }

    let RecommendationCarouselComponent: React.ComponentType | null = null;
    try {
      const RecommendationCarouselModule = require('@/components/RecommendationCarousel');
      RecommendationCarouselComponent = RecommendationCarouselModule.default || RecommendationCarouselModule;
    } catch (error) {
      console.error('导入组件 RecommendationCarousel 失败:', error);
      RecommendationCarouselComponent = null;
    }

    let ReturnRequestFormComponent: React.ComponentType | null = null;
    try {
      const ReturnRequestFormModule = require('@/components/ReturnRequestForm');
      ReturnRequestFormComponent = ReturnRequestFormModule.default || ReturnRequestFormModule;
    } catch (error) {
      console.error('导入组件 ReturnRequestForm 失败:', error);
      ReturnRequestFormComponent = null;
    }

    let ReviewFormComponent: React.ComponentType | null = null;
    try {
      const ReviewFormModule = require('@/components/ReviewForm');
      ReviewFormComponent = ReviewFormModule.default || ReviewFormModule;
    } catch (error) {
      console.error('导入组件 ReviewForm 失败:', error);
      ReviewFormComponent = null;
    }

    let ReviewListComponent: React.ComponentType | null = null;
    try {
      const ReviewListModule = require('@/components/ReviewList');
      ReviewListComponent = ReviewListModule.default || ReviewListModule;
    } catch (error) {
      console.error('导入组件 ReviewList 失败:', error);
      ReviewListComponent = null;
    }

    let SearchBarWithSuggestComponent: React.ComponentType | null = null;
    try {
      const SearchBarWithSuggestModule = require('@/components/SearchBarWithSuggest');
      SearchBarWithSuggestComponent = SearchBarWithSuggestModule.default || SearchBarWithSuggestModule;
    } catch (error) {
      console.error('导入组件 SearchBarWithSuggest 失败:', error);
      SearchBarWithSuggestComponent = null;
    }

    let SecuritySettingsPanelComponent: React.ComponentType | null = null;
    try {
      const SecuritySettingsPanelModule = require('@/components/SecuritySettingsPanel');
      SecuritySettingsPanelComponent = SecuritySettingsPanelModule.default || SecuritySettingsPanelModule;
    } catch (error) {
      console.error('导入组件 SecuritySettingsPanel 失败:', error);
      SecuritySettingsPanelComponent = null;
    }

    let ShippingMethodSelectorComponent: React.ComponentType | null = null;
    try {
      const ShippingMethodSelectorModule = require('@/components/ShippingMethodSelector');
      ShippingMethodSelectorComponent = ShippingMethodSelectorModule.default || ShippingMethodSelectorModule;
    } catch (error) {
      console.error('导入组件 ShippingMethodSelector 失败:', error);
      ShippingMethodSelectorComponent = null;
    }

    let SortSelectorComponent: React.ComponentType | null = null;
    try {
      const SortSelectorModule = require('@/components/SortSelector');
      SortSelectorComponent = SortSelectorModule.default || SortSelectorModule;
    } catch (error) {
      console.error('导入组件 SortSelector 失败:', error);
      SortSelectorComponent = null;
    }

    let StateDisplayComponent: React.ComponentType | null = null;
    try {
      const StateDisplayModule = require('@/components/StateDisplay');
      StateDisplayComponent = StateDisplayModule.default || StateDisplayModule;
    } catch (error) {
      console.error('导入组件 StateDisplay 失败:', error);
      StateDisplayComponent = null;
    }

    let StickyCTAComponent: React.ComponentType | null = null;
    try {
      const StickyCTAModule = require('@/components/StickyCTA');
      StickyCTAComponent = StickyCTAModule.default || StickyCTAModule;
    } catch (error) {
      console.error('导入组件 StickyCTA 失败:', error);
      StickyCTAComponent = null;
    }

    let StoreFilterFormComponent: React.ComponentType | null = null;
    try {
      const StoreFilterFormModule = require('@/components/StoreFilterForm');
      StoreFilterFormComponent = StoreFilterFormModule.default || StoreFilterFormModule;
    } catch (error) {
      console.error('导入组件 StoreFilterForm 失败:', error);
      StoreFilterFormComponent = null;
    }

    let StoreHeaderComponent: React.ComponentType | null = null;
    try {
      const StoreHeaderModule = require('@/components/StoreHeader');
      StoreHeaderComponent = StoreHeaderModule.default || StoreHeaderModule;
    } catch (error) {
      console.error('导入组件 StoreHeader 失败:', error);
      StoreHeaderComponent = null;
    }

    let StoreListComponent: React.ComponentType | null = null;
    try {
      const StoreListModule = require('@/components/StoreList');
      StoreListComponent = StoreListModule.default || StoreListModule;
    } catch (error) {
      console.error('导入组件 StoreList 失败:', error);
      StoreListComponent = null;
    }

    let SubscriptionManagementPanelComponent: React.ComponentType | null = null;
    try {
      const SubscriptionManagementPanelModule = require('@/components/SubscriptionManagementPanel');
      SubscriptionManagementPanelComponent = SubscriptionManagementPanelModule.default || SubscriptionManagementPanelModule;
    } catch (error) {
      console.error('导入组件 SubscriptionManagementPanel 失败:', error);
      SubscriptionManagementPanelComponent = null;
    }

    let TierPriceTableComponent: React.ComponentType | null = null;
    try {
      const TierPriceTableModule = require('@/components/TierPriceTable');
      TierPriceTableComponent = TierPriceTableModule.default || TierPriceTableModule;
    } catch (error) {
      console.error('导入组件 TierPriceTable 失败:', error);
      TierPriceTableComponent = null;
    }

    let WishlistGridComponent: React.ComponentType | null = null;
    try {
      const WishlistGridModule = require('@/components/WishlistGrid');
      WishlistGridComponent = WishlistGridModule.default || WishlistGridModule;
    } catch (error) {
      console.error('导入组件 WishlistGrid 失败:', error);
      WishlistGridComponent = null;
    }

    let tempComponent: React.ComponentType | null = null;
    try {
      const tempModule = require('@/components/temp');
      tempComponent = tempModule.default || tempModule;
    } catch (error) {
      console.error('导入组件 temp 失败:', error);
      tempComponent = null;
    }

// 创建组件映射表并挂载到window对象
const componentMap = {
  'AccountOverviewPanel': AccountOverviewPanelComponent,
    'AccountSidebarNav': AccountSidebarNavComponent,
    'AddressForm': AddressFormComponent,
    'AddressList': AddressListComponent,
    'AftersalesDetailPanel': AftersalesDetailPanelComponent,
    'ArticleCard': ArticleCardComponent,
    'AuctionBidPanel': AuctionBidPanelComponent,
    'AuthWidget': AuthWidgetComponent,
    'CartLineItem': CartLineItemComponent,
    'CheckoutStepNav': CheckoutStepNavComponent,
    'ContactForm': ContactFormComponent,
    'CouponInput': CouponInputComponent,
    'CouponList': CouponListComponent,
    'CurrencySwitcher': CurrencySwitcherComponent,
    'FAQList': FAQListComponent,
    'FacetFilter': FacetFilterComponent,
    'FeatureGrid': FeatureGridComponent,
    'FileUpload': FileUploadComponent,
    'FilterChipsBar': FilterChipsBarComponent,
    'Footer': FooterComponent,
    'GroupBuyWidget': GroupBuyWidgetComponent,
    'Header': HeaderComponent,
    'HeroBanner': HeroBannerComponent,
    'InventoryStatus': InventoryStatusComponent,
    'LoyaltyWidget': LoyaltyWidgetComponent,
    'MapViewer': MapViewerComponent,
    'MediaGallery': MediaGalleryComponent,
    'MiniCart': MiniCartComponent,
    'ModularContentDisplay': ModularContentDisplayComponent,
    'NotificationList': NotificationListComponent,
    'OrderDetailPanel': OrderDetailPanelComponent,
    'OrderSummary': OrderSummaryComponent,
    'OrdersList': OrdersListComponent,
    'PaymentMethodList': PaymentMethodListComponent,
    'PaymentMethodSelector': PaymentMethodSelectorComponent,
    'PriceBlock': PriceBlockComponent,
    'ProductCard': ProductCardComponent,
    'ProductGrid': ProductGridComponent,
    'ProfileForm': ProfileFormComponent,
    'ProgressTracker': ProgressTrackerComponent,
    'PurchaseOptionsPanel': PurchaseOptionsPanelComponent,
    'QAList': QAListComponent,
    'QuestionForm': QuestionFormComponent,
    'QuoteRequestForm': QuoteRequestFormComponent,
    'RecommendationCarousel': RecommendationCarouselComponent,
    'ReturnRequestForm': ReturnRequestFormComponent,
    'ReviewForm': ReviewFormComponent,
    'ReviewList': ReviewListComponent,
    'SearchBarWithSuggest': SearchBarWithSuggestComponent,
    'SecuritySettingsPanel': SecuritySettingsPanelComponent,
    'ShippingMethodSelector': ShippingMethodSelectorComponent,
    'SortSelector': SortSelectorComponent,
    'StateDisplay': StateDisplayComponent,
    'StickyCTA': StickyCTAComponent,
    'StoreFilterForm': StoreFilterFormComponent,
    'StoreHeader': StoreHeaderComponent,
    'StoreList': StoreListComponent,
    'SubscriptionManagementPanel': SubscriptionManagementPanelComponent,
    'TierPriceTable': TierPriceTableComponent,
    'WishlistGrid': WishlistGridComponent,
    'temp': tempComponent
};

// 挂载到window对象供组件访问
if (typeof window !== 'undefined') {
  (window as any).componentMap = componentMap;
}

// 页面级错误边界
class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('页面级错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen w-full bg-gray-100 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="text-red-500 text-2xl mr-3">🚨</div>
                <h1 className="text-2xl font-bold text-red-800">页面发生严重错误</h1>
              </div>
              <p className="text-red-700 mb-4">页面渲染时发生了意外错误，请检查组件代码或刷新页面重试。</p>
              <details className="mt-4">
                <summary className="cursor-pointer text-red-600 hover:text-red-800 font-medium">查看错误详情</summary>
                <pre className="mt-2 p-4 bg-red-100 rounded text-sm text-red-800 overflow-auto max-h-64">
                  {this.state.error?.message}
                  {this.state.error?.stack && '\n' + this.state.error.stack}
                </pre>
              </details>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                刷新页面
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

function HomePage() {
  const [activeTab, setActiveTab] = useState<string>("AccountOverviewPanel");
  
  const validComponentsList = ["AccountOverviewPanel", "AccountSidebarNav", "AddressForm", "AddressList", "AftersalesDetailPanel", "ArticleCard", "AuctionBidPanel", "AuthWidget", "CartLineItem", "CheckoutStepNav", "ContactForm", "CouponInput", "CouponList", "CurrencySwitcher", "FAQList", "FacetFilter", "FeatureGrid", "FileUpload", "FilterChipsBar", "Footer", "GroupBuyWidget", "Header", "HeroBanner", "InventoryStatus", "LoyaltyWidget", "MapViewer", "MediaGallery", "MiniCart", "ModularContentDisplay", "NotificationList", "OrderDetailPanel", "OrderSummary", "OrdersList", "PaymentMethodList", "PaymentMethodSelector", "PriceBlock", "ProductCard", "ProductGrid", "ProfileForm", "ProgressTracker", "PurchaseOptionsPanel", "QAList", "QuestionForm", "QuoteRequestForm", "RecommendationCarousel", "ReturnRequestForm", "ReviewForm", "ReviewList", "SearchBarWithSuggest", "SecuritySettingsPanel", "ShippingMethodSelector", "SortSelector", "StateDisplay", "StickyCTA", "StoreFilterForm", "StoreHeader", "StoreList", "SubscriptionManagementPanel", "TierPriceTable", "WishlistGrid", "temp"];
  const invalidComponentsList = [];

  // 确保组件映射表正确初始化
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).componentMap = componentMap;
    }
  }, []);

  return (
    <main className="min-h-screen w-full bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">上传的组件展示</h1>
          <div className="space-y-2">
            <p className="text-gray-600">
              ✅ 语法正确的组件: 61个
              {validComponentsList.length > 0 && ' (' + validComponentsList.join(', ') + ')'}
            </p>
            
          </div>
        </div>
        
        {/* 错误组件展示 */}
        

        
        {/* Tab导航 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Tabs">
              {validComponentsList.map((componentName) => (
                <button
                  key={componentName}
                  onClick={() => setActiveTab(componentName)}
                  className={`
                    ${activeTab === componentName
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }
                    whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm transition-all duration-200
                    rounded-t-lg mb-[-2px] relative
                  `}
                >
                  {componentName}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 有效组件展示区域 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ComponentRenderer activeTab={activeTab} components={validComponentsList} />
        </div>
        
      </div>
    </main>
  );
}

export default function App() {
  return (
    <PageErrorBoundary>
      <HomePage />
    </PageErrorBoundary>
  );
}