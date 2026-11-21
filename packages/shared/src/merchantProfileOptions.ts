/** Business values shared by both merchant profile maintenance surfaces. */
export const merchantProfileOptions = {
    businessType: ['ECOMMERCE', 'DIGITAL_CONTENT', 'PROFESSIONAL_SERVICES', 'RETAIL', 'TRAVEL', 'OTHER'],
    industry: ['GENERAL_RETAIL', 'DIGITAL_GOODS', 'SOFTWARE_SERVICES', 'TRAVEL_HOSPITALITY', 'PROFESSIONAL_SERVICES', 'OTHER'],
    legalEntityType: ['LTD', 'LLC', 'CORPORATION', 'PARTNERSHIP', 'SOLE_PROPRIETORSHIP', 'OTHER'],
    companySize: ['1_10', '11_50', '51_200', '201_500', '501_PLUS'],
    businessModel: ['B2C', 'B2B', 'B2B2C'],
    customerType: ['CONSUMER', 'BUSINESS', 'BOTH'],
    salesChannel: ['WEBSITE', 'APP', 'MARKETPLACE', 'OFFLINE', 'OTHER'],
    idType: ['PASSPORT', 'NATIONAL_ID', 'DRIVER_LICENSE'],
} as const;
