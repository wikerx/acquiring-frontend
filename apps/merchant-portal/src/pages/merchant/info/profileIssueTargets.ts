const corporateIssues = {
    MERCHANT_NAME: 'merchantName',
    MERCHANT_TYPE: 'merchantType',
    COUNTRY_CODE: 'countryCode',
    OPERATING_COUNTRY: 'operatingCountry',
    MERCHANT_DESCRIPTION: 'merchantDescription',
    REGISTRATION_NUMBER: 'registrationNumber',
    LEGAL_ENTITY_TYPE: 'legalEntityType',
    INCORPORATION_DATE: 'incorporationDate',
    INCORPORATION_COUNTRY: 'incorporationCountry',
    REGISTERED_CITY: 'registeredCity',
    REGISTERED_ADDRESS: 'registeredAddress',
} as const;

const businessIssues = {
    BUSINESS_MODEL: 'businessModel',
    SALES_CHANNELS: 'salesChannels',
    PRODUCTS_SERVICES: 'productsServices',
    TARGET_MARKETS: 'targetMarkets',
    CUSTOMER_TYPE: 'customerType',
    TRANSACTION_CURRENCIES: 'transactionCurrencies',
    EXPECTED_MONTHLY_VOLUME: 'expectedMonthlyVolume',
    EXPECTED_VOLUME_CURRENCY: 'expectedVolumeCurrency',
    AVERAGE_TICKET: 'averageTicket',
    WEBSITE_LIVE_FLAG: 'websiteLiveFlag',
    WEBSITE_URL: 'websiteUrl',
    PRIVACY_POLICY_URL: 'privacyPolicyUrl',
    REFUND_POLICY_URL: 'refundPolicyUrl',
    TERMS_URL: 'termsUrl',
    OTHER_SALES_URL_WHEN_WEBSITE_OFFLINE: 'otherSalesUrl',
} as const;

const peopleIssues = ['RELATED_PERSONS', 'LEGAL_REPRESENTATIVE', 'UBO', 'RELATED_PERSON_ID_NUMBER'];
const documentIssues = ['BUSINESS_REGISTRATION_DOCUMENT', 'RELATED_PERSON_ID_DOCUMENT'];

export function profileIssueTarget(issue: string) {
    const corporateField = (corporateIssues as Readonly<Record<string, string>>)[issue];
    if (Object.hasOwn(corporateIssues, issue)) return { tab: 'corporate', field: corporateField };
    const businessField = (businessIssues as Readonly<Record<string, string>>)[issue];
    if (Object.hasOwn(businessIssues, issue)) return { tab: 'business', field: businessField };
    if (peopleIssues.includes(issue)) return { tab: 'people' };
    if (documentIssues.includes(issue)) return { tab: 'documents' };
    return undefined;
}
