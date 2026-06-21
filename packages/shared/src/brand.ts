export type VexraSystemKey =
    | 'admin'
    | 'merchant'
    | 'checkout'
    | 'gateway'
    | 'risk'
    | 'settlement'
    | 'ops';

export interface VexraSystemBrand {
    name: string;
    subtitleEn: string;
    subtitleZh: string;
    accentColor: string;
    title: string;
    descriptionEn: string;
    descriptionZh: string;
    logos: {
        horizontal: string;
        icon: string;
        favicon: string;
    };
}

export interface VexraBrandConfig {
    brandName: string;
    brandFullNameEn: string;
    brandFullNameZh: string;
    primaryNavy: string;
    primaryBlue: string;
    cyan: string;
    purple: string;
    coolGray: string;
    lightGray: string;
    systems: Record<VexraSystemKey, VexraSystemBrand>;
}

const commonIcon = new URL('./assets/brand/vexra/common/logo-icon.svg', import.meta.url).href;
const commonFavicon = new URL('./assets/brand/vexra/common/favicon.svg', import.meta.url).href;

export const VEXRA_BRAND: VexraBrandConfig = {
    brandName: 'Vexra',
    brandFullNameEn: 'Vexra Intelligent Payment Exchange Network',
    brandFullNameZh: 'Vexra 智能支付交换网络',
    primaryNavy: '#0B1026',
    primaryBlue: '#1E3AFF',
    cyan: '#00C2FF',
    purple: '#7B5CFF',
    coolGray: '#64748B',
    lightGray: '#F2F4F7',
    systems: {
        admin: {
            name: 'Vexra Admin',
            subtitleEn: 'Management Console',
            subtitleZh: '管理系统',
            accentColor: '#2563EB',
            title: 'Vexra Admin - Management Console',
            descriptionEn:
                'Vexra Admin is the management console of the Vexra ecosystem, providing secure, efficient and scalable operational capabilities for enterprise payment teams.',
            descriptionZh:
                'Vexra Admin 是 Vexra 品牌体系下的管理控制台，为企业支付团队提供安全、高效、可扩展的运营管理能力。',
            logos: {
                horizontal: new URL('./assets/brand/vexra/admin/logo-horizontal.svg', import.meta.url)
                    .href,
                icon: commonIcon,
                favicon: commonFavicon,
            },
        },
        merchant: {
            name: 'Vexra Merchant',
            subtitleEn: 'Merchant Portal',
            subtitleZh: '商户系统',
            accentColor: '#10B981',
            title: 'Vexra Merchant - Merchant Portal',
            descriptionEn:
                'Vexra Merchant is the merchant portal of the Vexra ecosystem, providing transaction management, settlement visibility and operational tools for global merchants.',
            descriptionZh:
                'Vexra Merchant 是 Vexra 品牌体系下的商户门户，为全球商户提供交易管理、结算可视化与经营支持能力。',
            logos: {
                horizontal: new URL(
                    './assets/brand/vexra/merchant/logo-horizontal.svg',
                    import.meta.url,
                ).href,
                icon: commonIcon,
                favicon: commonFavicon,
            },
        },
        checkout: {
            name: 'Vexra Checkout',
            subtitleEn: 'Hosted Checkout',
            subtitleZh: '收银台系统',
            accentColor: '#7C3AED',
            title: 'Vexra Checkout - Hosted Checkout',
            descriptionEn:
                'Vexra Checkout is the hosted checkout experience of the Vexra ecosystem, delivering secure, smooth and conversion-oriented payment experiences.',
            descriptionZh:
                'Vexra Checkout 是 Vexra 品牌体系下的托管收银台，提供安全、顺畅、以转化为导向的支付体验。',
            logos: {
                horizontal: new URL(
                    './assets/brand/vexra/checkout/logo-horizontal.svg',
                    import.meta.url,
                ).href,
                icon: commonIcon,
                favicon: commonFavicon,
            },
        },
        gateway: {
            name: 'Vexra Gateway',
            subtitleEn: 'Payment Gateway',
            subtitleZh: '支付网关',
            accentColor: '#2563EB',
            title: 'Vexra Gateway - Payment Gateway',
            descriptionEn: 'Vexra Gateway extends the Vexra network with gateway capabilities.',
            descriptionZh: 'Vexra Gateway 是 Vexra 品牌体系下的支付网关。',
            logos: {
                horizontal: new URL('./assets/brand/vexra/admin/logo-horizontal.svg', import.meta.url)
                    .href,
                icon: commonIcon,
                favicon: commonFavicon,
            },
        },
        risk: {
            name: 'Vexra Risk',
            subtitleEn: 'Risk Control',
            subtitleZh: '风控系统',
            accentColor: '#7C3AED',
            title: 'Vexra Risk - Risk Control',
            descriptionEn: 'Vexra Risk extends the Vexra network with risk control capabilities.',
            descriptionZh: 'Vexra Risk 是 Vexra 品牌体系下的风控系统。',
            logos: {
                horizontal: new URL('./assets/brand/vexra/admin/logo-horizontal.svg', import.meta.url)
                    .href,
                icon: commonIcon,
                favicon: commonFavicon,
            },
        },
        settlement: {
            name: 'Vexra Settlement',
            subtitleEn: 'Settlement Center',
            subtitleZh: '清结算系统',
            accentColor: '#10B981',
            title: 'Vexra Settlement - Settlement Center',
            descriptionEn:
                'Vexra Settlement extends the Vexra network with settlement capabilities.',
            descriptionZh: 'Vexra Settlement 是 Vexra 品牌体系下的清结算系统。',
            logos: {
                horizontal: new URL('./assets/brand/vexra/merchant/logo-horizontal.svg', import.meta.url)
                    .href,
                icon: commonIcon,
                favicon: commonFavicon,
            },
        },
        ops: {
            name: 'Vexra Ops',
            subtitleEn: 'Operations Console',
            subtitleZh: '运营后台',
            accentColor: '#F59E0B',
            title: 'Vexra Ops - Operations Console',
            descriptionEn:
                'Vexra Ops extends the Vexra network with operations capabilities.',
            descriptionZh: 'Vexra Ops 是 Vexra 品牌体系下的运营后台。',
            logos: {
                horizontal: new URL('./assets/brand/vexra/admin/logo-horizontal.svg', import.meta.url)
                    .href,
                icon: commonIcon,
                favicon: commonFavicon,
            },
        },
    },
};

export function getSystemBrand(system: VexraSystemKey): VexraSystemBrand {
    return VEXRA_BRAND.systems[system];
}
