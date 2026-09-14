/** 历史中文问题文案到稳定编码的兼容映射，滚动发布期间仍可正确切换语言。 */
const LEGACY_READINESS_ISSUE_CODES: Record<string, string> = {
  实际经营国家: 'OPERATING_COUNTRY',
  商户描述: 'MERCHANT_DESCRIPTION',
  公司注册号: 'REGISTRATION_NUMBER',
  企业注册类型: 'LEGAL_ENTITY_TYPE',
  成立日期: 'INCORPORATION_DATE',
  注册证书签发国家: 'INCORPORATION_COUNTRY',
  注册地址城市: 'REGISTERED_CITY',
  注册地址: 'REGISTERED_ADDRESS',
  联系人姓名: 'CONTACT_NAME',
  联系邮箱: 'CONTACT_EMAIL',
  联系电话: 'CONTACT_PHONE',
  电话国家区号: 'PHONE_COUNTRY_CODE',
  业务模式: 'BUSINESS_MODEL',
  销售渠道: 'SALES_CHANNELS',
  主营产品或服务: 'PRODUCTS_SERVICES',
  目标市场: 'TARGET_MARKETS',
  客户类型: 'CUSTOMER_TYPE',
  交易币种: 'TRANSACTION_CURRENCIES',
  预计月交易金额: 'EXPECTED_MONTHLY_VOLUME',
  预计月交易金额币种: 'EXPECTED_VOLUME_CURRENCY',
  平均单笔金额: 'AVERAGE_TICKET',
  是否循环扣款: 'RECURRING_PAYMENT_FLAG',
  是否预售: 'PRESALE_FLAG',
  是否涉及数字商品: 'DIGITAL_GOODS_FLAG',
  是否涉及受限行业: 'RESTRICTED_BUSINESS_FLAG',
  网站是否上线: 'WEBSITE_LIVE_FLAG',
  官方网站: 'WEBSITE_URL',
  '隐私政策 URL': 'PRIVACY_POLICY_URL',
  '退款政策 URL': 'REFUND_POLICY_URL',
  '服务条款 URL': 'TERMS_URL',
  未上线网站时的其他销售页面: 'OTHER_SALES_URL_WHEN_WEBSITE_OFFLINE',
  '法定代表人/董事/UBO 信息': 'RELATED_PERSONS',
  法定代表人: 'LEGAL_REPRESENTATIVE',
  '最终受益人 UBO': 'UBO',
  相关人员证件号: 'RELATED_PERSON_ID_NUMBER',
  '公司注册证书/营业执照': 'BUSINESS_REGISTRATION_DOCUMENT',
  '董事、法人或 UBO 身份证明': 'RELATED_PERSON_ID_DOCUMENT',
  商户审核尚未通过: 'MERCHANT_REVIEW_NOT_PASSED',
  'MCC 尚未确认': 'MCC_NOT_CONFIRMED',
  结算币种尚未确认: 'SETTLEMENT_CURRENCY_NOT_CONFIRMED',
  风险等级尚未配置: 'RISK_LEVEL_NOT_CONFIGURED',
  尚无已生效商户费率版本: 'FEE_PLAN_NOT_ACTIVE',
  '尚无当前生效的渠道 MID 绑定': 'CHANNEL_MID_NOT_ACTIVE',
};

/**
 * 按当前语言转换就绪问题；未知编码保留原值，避免新增后端问题时页面显示空白。
 */
export function readinessIssueText(
  issue: string,
  translate: (key: string) => string,
): string {
  const issueCode = LEGACY_READINESS_ISSUE_CODES[issue] || issue;
  const key = `merchant.info.readinessIssue.${issueCode}`;
  const translated = translate(key);
  return translated === key ? issue : translated;
}
