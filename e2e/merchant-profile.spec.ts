import { expect, test, type Page, type Route } from '@playwright/test';
import type { MerchantProfileDocument, MerchantProfileSnapshot } from '../apps/merchant-portal/src/api/merchantInfoApi';

const currentProfile: MerchantProfileSnapshot = {
    merchantName: 'Synthetic Merchant',
    merchantType: 'COMPANY',
    countryCode: 'USA',
    incorporationCountry: 'USA',
    operatingSameAsRegistered: false,
    registrationNumber: 'FIXTURE-2026',
    businessType: 'ECOMMERCE',
    industryCategory: 'SOFTWARE_SERVICES',
    legalEntityType: 'LTD',
    companySize: '11_50',
    customerType: 'BOTH',
    productsServices: 'Original Products',
    salesChannels: ['WEBSITE'],
    targetMarkets: ['USA', 'old-market'],
    transactionCurrencies: ['USD', 'old-currency'],
    expectedVolumeCurrency: 'USD',
    expectedMonthlyVolume: 100,
    websiteLanguages: [],
    relatedPersons: [{
        id: '3', fullName: 'Synthetic Person', personRoles: ['DIRECTOR'],
        nationality: 'USA', residenceCountry: 'old-country', idType: 'PASSPORT', idNumberMasked: '***1234',
    }],
};

const countryOptions = [
    { alpha3Code: 'CAN', alpha2Code: 'CA', chineseName: '加拿大', englishName: 'Canada', flagEmoji: '🇨🇦' },
    { alpha3Code: 'USA', alpha2Code: 'US', chineseName: '美国', shortEnglishName: 'United States',
        englishName: 'United States of America', flagEmoji: '🇺🇸' },
];

const currencyOptions = [
    { alphabeticCode: 'CAD', chineseName: '加拿大元', englishName: 'Canadian Dollar' },
    { alphabeticCode: 'USD', chineseName: '美元', englishName: 'US Dollar' },
];

const fixtureDocument: MerchantProfileDocument = {
    id: '1', requestNo: 'SYNTH-1', documentType: 'BUSINESS_LICENSE', originalFilename: 'fixture.pdf',
    contentType: 'application/pdf', fileSize: 15, documentStatus: 'PENDING_REVIEW',
};

interface MockOptions {
    readOnly?: boolean;
    english?: boolean;
    failCountry?: boolean;
    alreadySameAddress?: boolean;
    failedUpload?: boolean;
    extraIssues?: string[];
    legacyCompanySize?: boolean;
}

async function mockProfile(page: Page, options: MockOptions = {}) {
    const state = {
        proposed: { ...structuredClone(currentProfile), operatingSameAsRegistered: Boolean(options.alreadySameAddress) },
        documents: [] as MerchantProfileDocument[],
        failCountry: Boolean(options.failCountry),
        failUpload: Boolean(options.failedUpload),
        failWorkspace: false,
        draftCount: 0,
        workspaceReads: 0,
        committedContact: 'Original Contact',
        status: 'DRAFT',
        extraIssues: options.extraIssues || [],
    };
    if (options.legacyCompanySize) state.proposed.companySize = 'Historical segment';
    await page.addInitScript((locale) => localStorage.setItem('acquiring_merchant_locale', locale),
        options.english ? 'en-US' : 'zh-CN');

    function respond(route: Route, data: unknown) {
        return route.fulfill({ json: { code: 'T200', message: 'SUCCESS', data } });
    }

    function fail(route: Route) {
        return route.fulfill({ status: 503, json: { code: 'T503', message: 'Fixture unavailable' } });
    }

    function changeRequest() {
        return {
            requestNo: 'SYNTH-1', status: state.status,
            changedFields: ['merchantDescription'], proposedProfile: state.proposed,
        };
    }

    await page.route((url) => url.pathname.startsWith('/merchant/'), async (route) => {
        const request = route.request();
        switch (new URL(request.url()).pathname) {
            case '/merchant/auth/me':
                return respond(route, {
                    account: {
                        accountId: 1, userId: 1, merchantUserId: 1, merchantId: 'REQ002',
                        appCode: 'MERCHANT', loginAccount: 'fixture', realName: 'Synthetic',
                    },
                    roles: ['MERCHANT_FIXTURE'],
                    permissions: options.readOnly ? ['merchant:info:view'] : ['merchant:info:view', 'merchant:info:edit'],
                    menus: [{
                        id: 2, parentId: 0, menuCode: 'merchant_profile_maintenance_v1',
                        menuName: '商户信息管理', menuType: 'MENU', routePath: '/merchant-info/profile',
                        componentPath: 'merchant/info', permissionCode: 'merchant:info:view',
                        visible: 1, keepAlive: 1, externalLink: 0, sortNo: 2, children: [],
                    }],
                });
            case '/merchant/info':
                if (request.method() === 'PUT') state.committedContact = request.postDataJSON().contactName;
                return respond(route, {
                    merchantId: 'REQ002', merchantName: 'Synthetic Merchant', merchantShortName: 'Synthetic',
                    merchantStatus: 1, merchantCategoryCode: '5311', countryCode: 'USA',
                    settlementCurrency: 'USD', contactName: state.committedContact, contactEmail: 'fixture@example.test',
                    timezone: 'Asia/Shanghai', defaultLocale: options.english ? 'en-US' : 'zh-CN',
                });
            case '/merchant/info/country-options':
                return state.failCountry ? fail(route) : respond(route, countryOptions);
            case '/merchant/system/dicts/currency-presentations':
                return respond(route, currencyOptions);
            case '/merchant/info/workspace': {
                state.workspaceReads++;
                if (state.failWorkspace) return fail(route);
                const completenessIssues = [...(state.proposed.operatingCountry ? [] : ['OPERATING_COUNTRY']), ...state.extraIssues];
                return respond(route, {
                    currentProfile, activeRequest: changeRequest(), documents: state.documents,
                    requestHistory: [{
                        requestNo: 'SYNTH-0', status: 'APPROVED', changedFields: ['industryCategory'],
                        gmtModified: '2026-11-20T11:22:33',
                    }],
                    completenessIssues, completenessPercent: 100 - 5 * completenessIssues.length,
                });
            }
            case '/merchant/info/change-requests/draft':
                state.draftCount++;
                state.proposed = request.postDataJSON();
                return respond(route, changeRequest());
            case '/merchant/info/change-requests/SYNTH-1/submit':
                state.status = 'PENDING_REVIEW';
                return respond(route, changeRequest());
            case '/merchant/info/change-requests/SYNTH-1/documents':
                if (state.failUpload) return fail(route);
                state.documents = [fixtureDocument];
                return respond(route, fixtureDocument);
            case '/merchant/info/change-requests/SYNTH-1/documents/1':
                state.documents = [];
                return respond(route, null);
            default:
                return respond(route, []);
        }
    });
    await page.goto('/merchant-info/profile');
    await expect(page.getByRole('heading', { name: 'Synthetic', exact: true })).toBeVisible();
    return state;
}

async function openTab(page: Page, name: string) {
    await page.getByRole('tab', { name, exact: true }).click();
}

async function choose(page: Page, inputName: string, keyword: string, option: RegExp) {
    const input = page.getByRole('combobox', { name: inputName, exact: true });
    await input.press('ArrowDown');
    await input.fill(keyword);
    const list = page.locator(`[id="${await input.getAttribute('aria-controls')}"]`);
    const choice = list.getByRole('option', { name: option });
    await expect(choice).toBeVisible();
    await choice.click();
}

async function selectFixtureFile(page: Page) {
    await page.locator('input[type=file]').setInputFiles({
        name: 'fixture.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 fixture'),
    });
}

const saveDraft = (page: Page) => page.getByRole('button', { name: '保存草稿', exact: true });

test('uses searchable directories and shared classification choices without altering historical values', async ({ page }) => {
    const state = await mockProfile(page, { legacyCompanySize: true });
    await expect(page.locator('.profile-facts')).toContainText('🇺🇸 USA — 美国');
    await expect(page.locator('.profile-facts')).toContainText('5311');
    await openTab(page, '企业与 KYB');
    await expect(page.getByText('🇺🇸 USA — 美国', { exact: true }).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('Historical segment（历史值）', { exact: true }).filter({ visible: true })).toBeVisible();
    const registrationCountry = page.getByRole('combobox', { name: '注册国家', exact: true });
    await page.locator('.el-select__wrapper').filter({ has: registrationCountry }).click();
    await registrationCountry.fill('Canada');
    await expect(page.getByRole('option', { name: /CAN — 加拿大/ }).filter({ visible: true })).toBeVisible();
    await registrationCountry.press('ArrowDown');
    await registrationCountry.press('Enter');
    await expect(page.locator('#profile-field-incorporationCountry')).toContainText('CAN — 加拿大');
    await openTab(page, '业务与网站');
    await expect(page.getByText('软件服务', { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(page.getByText('个人与企业客户', { exact: true }).filter({ visible: true })).toBeVisible();
    await choose(page, '行业分类', '综合', /综合零售/);
    await choose(page, '目标市场', '加拿大', /CAN — 加拿大/);
    await choose(page, '交易币种', 'Canadian Dollar', /CAD — 加拿大元/);
    await choose(page, '预计交易额币种', 'CAD', /CAD — 加拿大元/);
    const markets = page.getByRole('combobox', { name: '目标市场', exact: true });
    await markets.press('ArrowDown');
    await markets.fill('nonexistent code');
    await expect(page.getByRole('option', { name: 'nonexistent code', exact: true })).toHaveCount(0);
    await markets.press('Escape');
    await saveDraft(page).click();
    await expect.poll(() => state.draftCount).toBe(1);
    expect(state.proposed.incorporationCountry).toBe('CAN');
    expect(state.proposed.targetMarkets).toEqual(['USA', 'old-market', 'CAN']);
    expect(state.proposed.transactionCurrencies).toEqual(['USD', 'old-currency', 'CAD']);
    expect(state.proposed.expectedVolumeCurrency).toBe('CAD');
    expect(state.proposed.expectedMonthlyVolume).toBe(100);
    expect(state.proposed.industryCategory).toBe('GENERAL_RETAIL');
    expect(state.proposed.companySize).toBe('Historical segment');
    expect(state.proposed).not.toHaveProperty('merchantCategoryCode');
    await expect(saveDraft(page)).toBeDisabled();
    await page.reload();
    await openTab(page, '业务与网站');
    await expect(page.getByText('综合零售', { exact: true }).filter({ visible: true })).toBeVisible();
});

test('keeps raw values on directory failure and allows retry without changing permissions', async ({ page }) => {
    const state = await mockProfile(page, { failCountry: true, readOnly: true });
    const retry = page.getByRole('button', { name: '国家地区选项加载失败，重试' });
    await expect(retry).toBeVisible();
    await expect(page.locator('.profile-facts')).toContainText('USA');
    await expect(page.getByLabel('联系人', { exact: true })).toBeDisabled();
    await expect(saveDraft(page)).toHaveCount(0);
    state.failCountry = false;
    await retry.click();
    await expect(page.locator('.profile-facts')).toContainText('🇺🇸 USA — 美国');
    await openTab(page, '相关人员');
    await expect(page.getByText('护照', { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(page.getByRole('combobox', { name: '国籍', exact: true })).toBeDisabled();
    await expect(page.getByPlaceholder('***1234')).toBeVisible();
    await expect(page.getByRole('button', { name: '添加人员' })).toHaveCount(0);
    expect(state.draftCount).toBe(0);
});

test('locates an existing same-address issue and fills the country before submission', async ({ page }) => {
    const state = await mockProfile(page, { alreadySameAddress: true });
    await page.getByRole('button', { name: '查看缺项' }).click();
    await page.getByRole('button', { name: '经营国家', exact: true }).click();
    await expect(page.getByRole('tab', { name: '企业与 KYB' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#profile-operating-summary')).toBeVisible();
    await expect(page.locator('#profile-operating-summary')).toBeFocused();
    await page.getByRole('button', { name: '同步为国家/地区' }).click();
    await saveDraft(page).click();
    await expect.poll(() => state.proposed.operatingCountry).toBe('USA');
    await expect(page.getByRole('button', { name: '查看缺项' })).toHaveCount(0);
    await page.getByRole('button', { name: '提交审核', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: '提交审核', exact: true }).click();
    await expect.poll(() => state.status).toBe('PENDING_REVIEW');
    await expect(page.getByRole('combobox', { name: '*国家/地区', exact: true })).toBeDisabled();
    await expect(page.locator('.profile-facts')).toContainText('5311');
});

test('syncs on explicit same-address changes and leaves the manual country visible again on close', async ({ page }) => {
    const state = await mockProfile(page);
    await openTab(page, '企业与 KYB');
    const sameAddress = page.locator('.switch-row').filter({ hasText: '经营地址与注册地址一致' }).locator('.el-switch');
    await sameAddress.click();
    await expect(page.locator('#profile-operating-summary')).toContainText('USA');
    await choose(page, '*国家/地区', '加拿大', /CAN — 加拿大/);
    await expect(page.locator('#profile-operating-summary')).toContainText('CAN');
    await saveDraft(page).click();
    await expect.poll(() => state.proposed.operatingCountry).toBe('CAN');
    await expect(saveDraft(page)).toBeDisabled();
    await sameAddress.click();
    await expect(page.getByRole('combobox', { name: '经营国家', exact: true })).toBeVisible();
    await expect(page.locator('#profile-field-operatingCountry')).toContainText('CAN');
});

test('retains unsaved edits after attachment upload, failure, deletion and cancelled refresh', async ({ page }) => {
    const state = await mockProfile(page, { failedUpload: true });
    const contact = page.getByLabel('联系人', { exact: true });
    const products = page.getByLabel('产品或服务', { exact: true });
    await contact.fill('Unsaved Contact');
    await openTab(page, '业务与网站');
    await products.fill('Unsaved Products');
    await openTab(page, '合规资料');
    await expect(page.getByText('暂无合规资料')).toBeVisible();
    const failedUpload = page.waitForResponse((response) => response.url().endsWith('/documents') && response.status() === 503);
    await selectFixtureFile(page);
    await failedUpload;
    await expect(page.locator('.document-upload-bar .el-upload')).toHaveAttribute('aria-disabled', 'false');
    state.failUpload = false;
    await selectFixtureFile(page);
    await expect(page.getByText('fixture.pdf', { exact: true })).toBeVisible();
    const deleteButton = page.getByRole('button', { name: '删除', exact: true });
    await deleteButton.click();
    await page.getByRole('dialog').getByRole('button', { name: /^(确定|确认)$/ }).click();
    await expect(page.getByText('暂无合规资料')).toBeVisible();
    await page.getByRole('button', { name: '刷新', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click();
    await openTab(page, '概览与联系人');
    await expect(contact).toHaveValue('Unsaved Contact');
    await openTab(page, '业务与网站');
    await expect(products).toHaveValue('Unsaved Products');
    state.failWorkspace = true;
    await page.getByRole('button', { name: '刷新', exact: true }).click();
    const failedRefresh = page.waitForResponse((response) => response.url().endsWith('/workspace') && response.status() === 503);
    await page.getByRole('dialog').getByRole('button', { name: '确定', exact: true }).click();
    await failedRefresh;
    await expect(products).toHaveValue('Unsaved Products');
    state.failWorkspace = false;
    await saveDraft(page).click();
    await expect.poll(() => state.proposed.productsServices).toBe('Unsaved Products');
    await openTab(page, '概览与联系人');
    await expect(contact).toHaveValue('Unsaved Contact');
    await page.getByRole('button', { name: '保存', exact: true }).click();
    await expect.poll(() => state.committedContact).toBe('Unsaved Contact');
});

test('aligns every profile form in three, two and one columns and keeps secondary views readable', async ({ page }, testInfo) => {
    const mobile = testInfo.project.name.includes('mobile');
    await mockProfile(page, { english: true });
    await expect(page.locator('.profile-facts')).toContainText('USA — United States');

    const sizes = mobile ? [{ width: 390, columns: 1 }] : [{ width: 1440, columns: 3 }, { width: 1024, columns: 2 }];
    for (const { width, columns } of sizes) {
        await page.setViewportSize({ width, height: 1000 });
        for (const tab of ['Overview & Contacts', 'Company & KYB', 'Business & Web', 'Related Persons', 'Documents']) {
            await openTab(page, tab);
            const panel = page.getByRole('tabpanel', { name: tab, exact: true });
            const grids = panel.locator('.form-grid--three');
            expect(await grids.count(), tab).toBeGreaterThan(0);
            for (const grid of await grids.all()) {
                const geometry = await grid.evaluate((element) => {
                    const parent = element.getBoundingClientRect();
                    const items = Array.from(element.querySelectorAll(':scope > .el-form-item'));
                    return {
                        columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
                        gap: Number.parseFloat(getComputedStyle(element).columnGap),
                        fields: items.map((item) => {
                            const field = item.getBoundingClientRect();
                            const label = item.querySelector('.el-form-item__label')!;
                            const content = item.querySelector('.el-form-item__content')!;
                            const input = content.querySelector('.el-input__wrapper, .el-select__wrapper, .el-textarea__inner');
                            const labelBox = label.getBoundingClientRect();
                            const contentBox = content.getBoundingClientRect();
                            const control = input?.getBoundingClientRect();
                            const labelStyle = getComputedStyle(label);
                            return {
                                wide: item.classList.contains('form-grid__wide'),
                                width: field.width,
                                fullWidth: parent.width,
                                labelWidth: labelBox.width,
                                labelGap: Number.parseFloat(labelStyle.paddingRight),
                                labelAlign: labelStyle.textAlign,
                                left: field.left,
                                contentLeft: contentBox.left,
                                labelBottom: labelBox.bottom,
                                contentTop: contentBox.top,
                                controlLeft: control?.left,
                                controlRight: control?.right,
                                controlHeight: control?.height,
                                fieldRight: field.right,
                            };
                        }),
                    };
                });
                expect(geometry.columns, tab).toBe(columns);
                expect(geometry.gap, tab).toBe(16);
                for (const field of geometry.fields) {
                    if (field.wide) expect(field.width).toBeCloseTo(field.fullWidth, 0);
                    if (mobile) {
                        expect(field.labelAlign).toBe('left');
                        expect(field.contentLeft).toBeCloseTo(field.left, 0);
                        expect(field.contentTop).toBeGreaterThanOrEqual(field.labelBottom);
                    } else {
                        expect(field.labelAlign).toBe('right');
                        expect(field.labelWidth).toBeCloseTo(132, 0);
                        expect(field.labelGap).toBe(10);
                        expect(field.contentLeft - field.left).toBeCloseTo(132, 0);
                    }
                    if (field.controlRight !== undefined) {
                        expect(field.controlLeft).toBeCloseTo(field.contentLeft, 0);
                        expect(field.controlRight).toBeCloseTo(field.fieldRight, 0);
                        expect(field.controlHeight).toBeGreaterThanOrEqual(31.5);
                    }
                }
            }
            expect(await page.evaluate(() => document.documentElement.scrollWidth), tab).toBeLessThanOrEqual(width);
        }
    }
    await expect(page.getByText('No compliance documents yet')).toBeVisible();
    await openTab(page, 'Change History');
    await expect(page.locator('.history-time')).toHaveText(/2026-11-20 \d{2}:22:33/);
    await openTab(page, 'Related Persons');
    await expect(page.getByText('Passport', { exact: true }).filter({ visible: true })).toBeVisible();
    await page.getByRole('button', { name: /add person/i }).click();
    await expect(page.locator('.person-card')).toHaveCount(2);
    const newPerson = page.locator('.person-card').last();
    const label = await newPerson.locator('.el-form-item__label').first().boundingBox();
    const input = await newPerson.getByRole('textbox', { name: 'Legal Name' }).boundingBox();
    if (mobile) expect(input!.y).toBeGreaterThanOrEqual(label!.y + label!.height);
    else expect(input!.x).toBeGreaterThanOrEqual(label!.x + label!.width);
});

test('shows email validation below the control and keeps the neighboring field aligned', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'This check requires neighboring desktop columns.');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await mockProfile(page);
    const email = page.locator('.el-form-item').filter({
        has: page.locator('.el-form-item__label', { hasText: /^联系邮箱$/ }),
    }).first();
    const emailInput = email.getByRole('textbox');
    const alternate = page.getByLabel('备用邮箱', { exact: true });
    const before = await alternate.boundingBox();
    await emailInput.fill('invalid-email');
    await emailInput.press('Tab');
    const error = email.locator('.el-form-item__error');
    await expect(error).toBeVisible();
    const inputBox = await emailInput.boundingBox();
    const errorBox = await error.boundingBox();
    const after = await alternate.boundingBox();
    expect(errorBox!.y).toBeGreaterThanOrEqual(inputBox!.y + inputBox!.height);
    expect(after!.x).toBeCloseTo(before!.x, 0);
    expect(after!.y).toBeCloseTo(before!.y, 0);
    expect(after!.y).toBeCloseTo(inputBox!.y, 0);
});

test('leads to all types of missing information and keeps unknown issues understandable', async ({ page }) => {
    await mockProfile(page, {
        extraIssues: ['REGISTRATION_NUMBER', 'TARGET_MARKETS', 'LEGAL_REPRESENTATIVE', 'BUSINESS_REGISTRATION_DOCUMENT', 'FUTURE_CODE'],
    });
    const issuesButton = page.getByRole('button', { name: '查看缺项' });
    await page.getByRole('button', { name: '提交审核', exact: true }).click();
    await expect(page.getByRole('button', { name: '还有一项资料待补齐，请核对申请内容。' })).toBeDisabled();
    await expect(page.getByText('FUTURE_CODE', { exact: true })).toHaveCount(0);
    const cases = [
        { label: '注册编号', tab: '企业与 KYB', selector: '#profile-field-registrationNumber' },
        { label: '目标市场', tab: '业务与网站', selector: '#profile-field-targetMarkets' },
        { label: '法定代表人', tab: '相关人员', selector: '#profile-people' },
        { label: '营业执照或公司注册证明', tab: '合规资料', selector: '#profile-documents' },
    ];
    for (const [index, item] of cases.entries()) {
        if (index > 0) await issuesButton.click();
        await page.getByRole('button', { name: item.label, exact: true }).click();
        await expect(page.getByRole('tab', { name: item.tab })).toHaveAttribute('aria-selected', 'true');
        await expect(page.locator(item.selector).first()).toBeFocused();
    }
});
