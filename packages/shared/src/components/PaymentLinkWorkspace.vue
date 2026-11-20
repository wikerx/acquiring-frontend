<template>
  <section
    class="pl-workspace"
    :class="
      scope === 'admin'
        ? 'app-container transaction-page'
        : 'page system-page merchant-redesigned-page'
    "
  >
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon
      ><el-button link @click="reload">{{ t('paymentLink.retry') }}</el-button></el-alert
    >
    <el-alert v-if="filterError" :title="filterError" type="error" :closable="false" show-icon>
      <el-button link @click="loadFilters">{{ t('paymentLink.retry') }}</el-button>
    </el-alert>
    <el-alert
      v-if="summaryError && summaryError !== error"
      :title="summaryError"
      type="error"
      :closable="false"
      show-icon
    >
      <el-button link @click="reload">{{ t('paymentLink.retry') }}</el-button>
    </el-alert>
    <component
      :is="searchPanelComponent"
      :visible="showSearch"
      :model="query"
      :title="t('paymentLink.filterTitle')"
      :description="t('paymentLink.intro')"
      :search-text="t('paymentLink.search')"
      :reset-text="t('paymentLink.reset')"
      expand-text=""
      collapse-text=""
      inline-time
      @search="search"
      @reset="reset"
    >
      <el-form-item v-if="scope === 'admin'" :label="t('paymentLink.merchant')">
        <component :is="merchantSelect" v-model="query.merchantId" />
      </el-form-item>
      <el-form-item :label="t('paymentLink.orderNo')">
        <el-input
          v-model.trim="query.merchantOrderNo"
          :placeholder="t('paymentLink.exactOrder')"
          clearable
          maxlength="64"
          @keyup.enter="search"
        />
      </el-form-item>
      <el-form-item :label="t('paymentLink.linkId')">
        <el-input
          v-model.trim="query.linkId"
          :placeholder="t('paymentLink.exactLink')"
          clearable
          maxlength="32"
          @keyup.enter="search"
        />
      </el-form-item>
      <el-form-item :label="t('paymentLink.statusLabel')">
        <el-select v-model="query.status" clearable>
          <template #label><PaymentLinkStatusDisplay :value="query.status" /></template>
          <el-option
            v-for="status in statuses"
            :key="status"
            :value="status"
            :label="t(`paymentLink.status.${status}`)"
          >
            <PaymentLinkStatusDisplay :value="status" />
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="t('paymentLink.currency')">
        <el-select
          v-model="query.currency"
          filterable
          clearable
          :loading="filtersLoading"
          :placeholder="t('common.pleaseSelect')"
        >
          <template #label
            ><CurrencyDisplay :currency="query.currency" :locale="String(locale)" size="xs"
          /></template>
          <el-option
            v-for="currency in filterOptions?.currencies || []"
            :key="currency"
            :value="currency"
            :label="currency"
          >
            <CurrencyDisplay :currency="currency" :locale="String(locale)" show-name size="xs" />
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item v-if="scope === 'admin'" :label="t('paymentLink.channelCode')">
        <el-select
          v-model="query.channelCode"
          filterable
          clearable
          :loading="filtersLoading"
          :placeholder="t('common.pleaseSelect')"
        >
          <el-option
            v-for="channel in filterOptions?.channels || []"
            :key="channel.channelCode"
            :value="channel.channelCode"
            :label="
              channel.channelName
                ? `${channel.channelCode} / ${channel.channelName}`
                : channel.channelCode
            "
          />
        </el-select>
      </el-form-item>
      <template #time>
        <el-form-item class="transaction-time-form-item" :label="t('paymentLink.createdRange')">
          <component
            :is="timeRangeComponent"
            v-model="dateRange"
            v-model:time-zone="timeZone"
            v-model:preset="quickPreset"
            :timezone-options="timezoneOptions"
            default-preset="today"
          />
        </el-form-item>
      </template>
    </component>
    <section class="pl-summary" aria-live="polite">
      <div class="pl-counts">
        <div v-for="key in summaryKeys" :key="key" class="pl-metric" :class="`pl-metric--${key}`">
          <span>{{ t(`paymentLink.${key}`) }}</span>
          <strong>{{ summary ? summary[key] : '—' }}</strong>
        </div>
      </div>
      <div class="pl-collected">
        <span>{{ t('paymentLink.successfulAmounts') }}</span>
        <div v-if="summary">
          <CurrencyAmountDisplay
            v-for="(amount, currency) in summary.successfulAmounts"
            :key="currency"
            :currency="String(currency)"
            :amount="amount"
          />
          <span v-if="!Object.keys(summary.successfulAmounts).length">—</span>
        </div>
        <span v-else>—</span>
      </div>
    </section>
    <section class="pl-list">
      <div class="pl-table-tools">
        <div class="pl-buttons">
          <el-button
            v-if="can('add')"
            type="primary"
            plain
            size="small"
            :icon="Plus"
            @click="openCreate"
            >{{ t('paymentLink.create') }}</el-button
          >
          <el-button
            v-if="can('export')"
            type="warning"
            plain
            size="small"
            :icon="Download"
            :loading="exporting"
            @click="exportRows"
            >{{ t('paymentLink.export') }}</el-button
          >
          <el-button
            v-if="can('export')"
            size="small"
            :icon="FolderOpened"
            @click="emit('downloadCenter')"
            >{{ t('paymentLink.downloadCenter') }}</el-button
          >
        </div>
        <component
          :is="toolbarComponent"
          :show-search="showSearch"
          @toggle-search="showSearch = !showSearch"
          @refresh="reload"
        />
      </div>
      <component
        :is="tableComponent"
        v-loading="loading"
        :data="rows"
        size="small"
        :table-key="`${scope}-payment-links-v1`"
        border
        :empty-text="error || t('paymentLink.empty')"
      >
        <el-table-column
          prop="linkId"
          :label="t('paymentLink.linkId')"
          width="280"
          fixed
          show-overflow-tooltip
        />
        <el-table-column
          v-if="scope === 'admin'"
          prop="merchantId"
          :label="t('paymentLink.merchant')"
          min-width="140"
          align="center"
        />
        <el-table-column
          prop="linkName"
          :label="t('paymentLink.linkName')"
          min-width="180"
          show-overflow-tooltip
          align="center"
          ><template #default="{ row }">{{
            row.linkName || row.merchantOrderNo
          }}</template></el-table-column
        >
        <el-table-column
          prop="merchantOrderNo"
          :label="t('paymentLink.orderNo')"
          min-width="210"
          show-overflow-tooltip
          align="center"
        />
        <el-table-column
          prop="amount"
          :label="t('paymentLink.amount')"
          min-width="170"
          align="center"
          ><template #default="{ row }"
            ><CurrencyAmountDisplay
              :currency="row.currency"
              :amount="row.amount"
              :exponent="row.currencyExponent" /></template
        ></el-table-column>
        <el-table-column
          prop="status"
          :label="t('paymentLink.statusLabel')"
          width="150"
          align="center"
          ><template #default="{ row }"><PaymentLinkStatusDisplay :value="row.status" /></template
        ></el-table-column>
        <el-table-column
          prop="paymentStatus"
          :label="t('paymentLink.paymentStatus')"
          width="175"
          align="center"
          ><template #default="{ row }"
            ><TransactionStatusDisplay
              :value="row.paymentStatus"
              :label="paymentText(row.paymentStatus)" /></template
        ></el-table-column>
        <el-table-column
          prop="attemptCount"
          :label="t('paymentLink.attemptCount')"
          width="110"
          align="center"
        />
        <el-table-column
          prop="expireTime"
          :label="t('paymentLink.expireTime')"
          width="190"
          align="center"
          ><template #default="{ row }"
            ><component
              :is="dateTimeComponent"
              source-time-zone="Asia/Shanghai"
              :display-time-zone="timeZone"
              :value="row.expireTime" /></template
        ></el-table-column>
        <el-table-column
          prop="createTime"
          :label="t('paymentLink.createTime')"
          width="190"
          align="center"
          ><template #default="{ row }"
            ><component
              :is="dateTimeComponent"
              source-time-zone="Asia/Shanghai"
              :display-time-zone="timeZone"
              :value="row.createTime" /></template
        ></el-table-column>
        <el-table-column :label="t('paymentLink.actions')" width="155" fixed="right" align="center">
          <template #default="{ row }"
            ><div class="pl-row-actions">
              <el-button v-if="can('detail')" link type="primary" @click="openDetail(row)">{{
                t('paymentLink.detail')
              }}</el-button
              ><el-dropdown
                v-if="availableActions(row).length"
                trigger="click"
                @command="(action: string) => rowAction(action, row)"
                ><el-button link type="primary" :aria-label="t('paymentLink.more')">•••</el-button
                ><template #dropdown
                  ><el-dropdown-menu
                    ><el-dropdown-item
                      v-for="action in availableActions(row)"
                      :key="action"
                      :command="action"
                      >{{ t(`paymentLink.${action}`) }}</el-dropdown-item
                    ></el-dropdown-menu
                  ></template
                ></el-dropdown
              >
            </div></template
          >
        </el-table-column>
      </component>
      <el-pagination
        v-if="!error"
        v-model:current-page="query.pageNo"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @current-change="reload"
        @size-change="search"
      />
    </section>
    <el-dialog
      v-model="createOpen"
      class="dialog-layout-preserve"
      destroy-on-close
      :title="t('paymentLink.create')"
      width="min(1160px, 96vw)"
      :close-on-click-modal="false"
      :close-on-press-escape="!creating"
      :show-close="!creating"
      @closed="clearCreate"
    >
      <el-form
        ref="createForm"
        :model="form"
        :rules="rules"
        :validate-on-rule-change="false"
        label-position="top"
        size="default"
        class="pl-create-form"
        @submit.prevent="createLink"
      >
        <div class="pl-create-grid">
          <div>
            <el-form-item v-if="scope === 'admin'" :label="t('paymentLink.merchant')" required
              ><component
                :is="merchantSelect"
                v-model="createMerchant"
                :disabled="creating"
                @change="loadOptions"
            /></el-form-item>
            <el-alert v-if="optionError" :title="optionError" type="error" :closable="false"
              ><el-button link @click="loadOptions">{{
                t('paymentLink.retry')
              }}</el-button></el-alert
            >
            <div v-loading="optionsLoading">
              <div class="pl-two">
                <el-form-item :label="t('paymentLink.linkName')" prop="linkName"
                  ><el-input
                    v-model="form.linkName"
                    :placeholder="t('paymentLink.optionalName')"
                    maxlength="120"
                    show-word-limit
                    :disabled="creating"
                /></el-form-item>
                <el-form-item :label="t('paymentLink.orderNo')" prop="merchantOrderNo"
                  ><el-input
                    v-model="form.merchantOrderNo"
                    maxlength="64"
                    :placeholder="t('paymentLink.autoOrder')"
                    :disabled="creating"
                /></el-form-item>
              </div>
              <el-form-item :label="t('paymentLink.description')" prop="description"
                ><el-input
                  v-model="form.description"
                  type="textarea"
                  :rows="2"
                  maxlength="500"
                  show-word-limit
                  :placeholder="t('paymentLink.descriptionHint')"
                  :disabled="creating"
              /></el-form-item>
              <div class="pl-two">
                <el-form-item :label="t('paymentLink.currency')" prop="currency"
                  ><el-select
                    v-model="form.currency"
                    filterable
                    :disabled="creating"
                    @change="selectCurrencyBrands"
                    ><template #label
                      ><CurrencyDisplay
                        :currency="form.currency"
                        :locale="String(locale)"
                        size="xs" /></template
                    ><el-option
                      v-for="currency in options?.currencies || []"
                      :key="currency"
                      :value="currency"
                      :label="currency"
                      ><CurrencyDisplay
                        :currency="currency" /></el-option></el-select></el-form-item
                ><el-form-item :label="t('paymentLink.amount')" prop="amount"
                  ><el-input
                    v-model="form.amount"
                    inputmode="decimal"
                    maxlength="25"
                    :placeholder="
                      t(
                        amountExponent === 0
                          ? 'paymentLink.integerAmountHint'
                          : 'paymentLink.amountHint',
                      )
                    "
                    :disabled="creating"
                /></el-form-item>
              </div>
              <div class="pl-expiry-section">
                <el-form-item :label="t('paymentLink.expiryMode')" prop="expireTime">
                  <div class="pl-expiry-controls">
                    <el-radio-group
                      :model-value="expiryMode === 'quick' ? form.expireMinutes : undefined"
                      :disabled="creating"
                      @change="chooseExpiry"
                    >
                      <el-radio-button
                        v-for="minutes in expiryDurations"
                        :key="minutes"
                        :value="minutes"
                        >{{ t(`paymentLink.durations.${minutes}`) }}</el-radio-button
                      >
                    </el-radio-group>
                    <el-date-picker
                      v-model="form.expireTime"
                      type="datetime"
                      format="YYYY-MM-DD HH:mm:ss"
                      value-format="YYYY-MM-DDTHH:mm:ss"
                      :aria-label="t('paymentLink.expiryCustom')"
                      :disabled="creating"
                      @change="expiryMode = 'custom'"
                    />
                  </div>
                </el-form-item>
                <el-form-item :label="t('paymentLink.locale')"
                  ><el-select v-model="form.locale" :disabled="creating"
                    ><el-option
                      v-for="lang in options?.locales || ['en-US', 'zh-CN', 'AUTO']"
                      :key="lang"
                      :value="lang"
                      :label="t(`paymentLink.locales.${lang}`)" /></el-select
                ></el-form-item>
              </div>
              <p class="pl-hint">{{ t('paymentLink.expireHint') }} · {{ timeZone }}</p>
              <el-form-item
                v-if="usesMethodKeys"
                prop="paymentMethodKeys"
                :label="t('paymentLink.brands')"
              >
                <el-checkbox-group v-model="form.paymentMethodKeys" :disabled="creating">
                  <el-checkbox v-for="key in currentMethodKeys" :key="key" :value="key">
                    <PaymentLogoGroup aria-hidden="true" :keys="methodKeyLogos(key)" size="sm" />
                    <span>{{ methodKeyName(key) }}</span>
                  </el-checkbox>
                </el-checkbox-group>
                <p class="pl-hint">{{ t('paymentLink.scopeHint') }}</p>
              </el-form-item>
              <el-form-item v-else prop="cardBrands" :label="t('paymentLink.brands')"
                ><el-checkbox-group v-model="form.cardBrands" :disabled="creating"
                  ><el-checkbox v-for="brand in currentBrands" :key="brand" :value="brand"
                    ><PaymentLogoGroup
                      aria-hidden="true"
                      :keys="resolvePaymentLogoKeys('BANK_CARD', brand)"
                      size="sm"
                    /><span>{{ brandName(brand) }}</span></el-checkbox
                  ></el-checkbox-group
                >
                <p class="pl-hint">{{ t('paymentLink.allBrands') }}</p></el-form-item
              >
              <el-form-item
                v-if="!usesMethodKeys && otherPaymentMethods.length"
                :label="t('paymentLink.otherMethods')"
              >
                <div class="pl-other-methods">
                  <div
                    v-for="method in otherPaymentMethods"
                    :key="method"
                    class="pl-other-method"
                    aria-disabled="true"
                  >
                    <PaymentLogoGroup :keys="resolvePaymentLogoKeys(method)" size="sm" />
                    <span>{{ methodName(method) }}</span>
                    <small>{{ t('paymentLink.methodUnavailable') }}</small>
                  </div>
                </div>
              </el-form-item>
              <el-alert
                v-if="
                  options &&
                  form.currency &&
                  !(usesMethodKeys ? currentMethodKeys.length : currentBrands.length)
                "
                :title="t('paymentLink.noMethods')"
                type="warning"
                :closable="false"
              />
              <el-form-item :label="t('paymentLink.notifyUrl')" prop="notifyUrl"
                ><el-input v-model="form.notifyUrl" maxlength="512" :disabled="creating"
              /></el-form-item>
              <el-form-item :label="t('paymentLink.redirectUrl')" prop="redirectUrl"
                ><el-input v-model="form.redirectUrl" maxlength="512" :disabled="creating"
              /></el-form-item>
              <p class="pl-hint">{{ t('paymentLink.urlHint') }}</p>
            </div>
          </div>
          <aside class="pl-preview">
            <div class="pl-preview-heading">
              <strong>{{ t('paymentLink.preview') }}</strong
              ><span>{{ t('paymentLink.previewHint') }}</span>
            </div>
            <CheckoutOrderSummary
              :merchant-name="options?.merchantDisplayName"
              :order-reference="form.merchantOrderNo"
              :formatted-amount="previewAmount"
              :items="previewItems"
              :labels="receiptLabels"
            />
            <div class="pl-preview-methods" v-if="previewLogoKeys.length">
              <span>{{ t('paymentLink.brands') }}</span
              ><PaymentLogoGroup :keys="previewLogoKeys" size="sm" wrap />
            </div>
            <div class="pl-preview-pay" aria-hidden="true">{{ t('paymentLink.payNow') }}</div>
          </aside>
        </div>
      </el-form>
      <template #footer>
        <p class="pl-hint pl-create-notice">{{ t('paymentLink.createHint') }}</p>
        <div class="dialog-footer">
          <el-button
            type="primary"
            :loading="creating"
            :disabled="!currentBrands.length || optionsLoading"
            @click="createLink"
            >{{ t('paymentLink.create') }}</el-button
          >
          <el-button :disabled="creating" @click="createOpen = false">{{
            t('paymentLink.cancel')
          }}</el-button>
        </div>
      </template>
    </el-dialog>
    <el-drawer
      v-model="detailOpen"
      :title="t('paymentLink.detail')"
      size="min(1000px, 96vw)"
      @closed="detail = undefined"
    >
      <div v-loading="detailLoading">
        <template v-if="detail">
          <div class="pl-heading">
            <h3>{{ detail.linkName || detail.merchantOrderNo }}</h3>
            <PaymentLinkStatusDisplay :value="detail.status" />
          </div>
          <div class="pl-buttons pl-detail-buttons">
            <el-button
              v-for="action in availableActions(detail)"
              :key="action"
              :type="action === 'share' ? 'primary' : 'default'"
              @click="rowAction(action, detail)"
              >{{ t(`paymentLink.${action}`) }}</el-button
            ><el-button @click="openDetail(detail)">{{ t('paymentLink.reload') }}</el-button>
          </div>
          <el-alert
            v-if="detail.paymentAvailable === false"
            :title="t('paymentLink.currentlyUnavailable')"
            type="warning"
            :closable="false"
            show-icon
          />
          <el-tabs v-model="tab">
            <el-tab-pane name="info" :label="t('paymentLink.tabs.info')"
              ><el-descriptions :column="1" border>
                <el-descriptions-item
                  v-for="key in detailKeys"
                  :key="key"
                  :label="t(`paymentLink.${key === 'merchantId' ? 'merchant' : key}`)"
                  >{{
                    key === 'creator' ? creatorLabel(detail) : detail[key] || '—'
                  }}</el-descriptions-item
                >
                <el-descriptions-item
                  v-if="linkScopeLogos(detail).length"
                  :label="t('paymentLink.brands')"
                  ><PaymentLogoGroup :keys="linkScopeLogos(detail)" size="sm" wrap
                /></el-descriptions-item>
                <el-descriptions-item :label="t('paymentLink.amount')"
                  ><CurrencyAmountDisplay
                    :currency="detail.currency"
                    :amount="detail.amount"
                    :exponent="detail.currencyExponent"
                /></el-descriptions-item>
                <el-descriptions-item
                  v-if="detail.description"
                  :label="t('paymentLink.description')"
                  ><p class="pl-description">{{ detail.description }}</p></el-descriptions-item
                >
                <el-descriptions-item
                  v-for="key in dateKeys"
                  :key="key"
                  :label="t(`paymentLink.${key}`)"
                  ><component
                    :is="dateTimeComponent"
                    source-time-zone="Asia/Shanghai"
                    :display-time-zone="timeZone"
                    :value="detail[key]"
                /></el-descriptions-item>
                <el-descriptions-item :label="t('paymentLink.paymentStatus')"
                  ><TransactionStatusDisplay
                    :value="detail.paymentStatus"
                    :label="paymentText(detail.paymentStatus)"
                /></el-descriptions-item> </el-descriptions
            ></el-tab-pane>
            <el-tab-pane
              name="collections"
              :label="t('paymentLink.tabs.collections')"
            /><el-tab-pane name="attempts" :label="t('paymentLink.tabs.attempts')" /><el-tab-pane
              v-if="can('delivery')"
              name="deliveries"
              :label="t('paymentLink.tabs.deliveries')"
            /><el-tab-pane name="events" :label="t('paymentLink.tabs.events')" />
          </el-tabs>
          <template v-if="tab !== 'info'"
            ><el-button :loading="tabLoading" @click="loadTab">{{
              t('paymentLink.reload')
            }}</el-button
            ><el-table
              v-if="tab === 'collections'"
              v-loading="tabLoading"
              :data="collections"
              border
              ><el-table-column
                prop="collectionId"
                :label="t('paymentLink.collectionId')"
                min-width="210" /><el-table-column
                prop="merchantOrderNo"
                :label="t('paymentLink.orderNo')"
                min-width="200" /><el-table-column
                :label="t('paymentLink.paymentStatus')"
                min-width="155"
                ><template #default="{ row }"
                  ><TransactionStatusDisplay
                    :value="row.paymentStatus"
                    :label="paymentText(row.paymentStatus)" /></template></el-table-column
              ><el-table-column :label="t('paymentLink.expireTime')" width="190"
                ><template #default="{ row }"
                  ><component
                    :is="dateTimeComponent"
                    source-time-zone="Asia/Shanghai"
                    :display-time-zone="timeZone"
                    :value="row.submissionDeadline" /></template></el-table-column></el-table
            ><el-table
              v-else-if="tab === 'attempts'"
              v-loading="tabLoading"
              :data="attempts"
              border
            >
              <el-table-column
                prop="attemptNo"
                :label="t('paymentLink.attemptNo')"
                width="85"
              /><el-table-column
                prop="transactionId"
                :label="t('paymentLink.transaction')"
                min-width="230"
                ><template #default="{ row }"
                  ><el-button
                    v-if="row.transactionId && can('transaction')"
                    link
                    type="primary"
                    @click="emit('openTransaction', row)"
                    >{{ row.transactionId }}</el-button
                  ><span v-else>{{
                    row.transactionId || t('paymentLink.noSystemOrder')
                  }}</span></template
                ></el-table-column
              >
              <el-table-column :label="t('paymentLink.amount')" min-width="155"
                ><template #default="{ row }"
                  ><CurrencyAmountDisplay
                    :currency="row.currency"
                    :amount="row.amount"
                    :exponent="row.currencyExponent" /></template></el-table-column
              ><el-table-column :label="t('paymentLink.paymentStatus')" min-width="150"
                ><template #default="{ row }"
                  ><TransactionStatusDisplay
                    :value="row.status"
                    :label="paymentText(row.status)" /></template
              ></el-table-column>
              <el-table-column :label="t('paymentLink.paymentMethod')" min-width="130"
                ><template #default="{ row }"
                  ><PaymentMethodDisplay
                    :payment-types="[
                      {
                        value: row.paymentMethod,
                        label:
                          row.paymentMethod === 'BANK_CARD'
                            ? t('paymentLink.bankCard')
                            : row.paymentMethod,
                      },
                    ]"
                    :payment-methods="
                      row.cardBrand ? [{ value: row.cardBrand, label: row.cardBrand }] : []
                    " /></template></el-table-column
              ><el-table-column :label="t('paymentLink.createTime')" width="190"
                ><template #default="{ row }"
                  ><component
                    :is="dateTimeComponent"
                    source-time-zone="Asia/Shanghai"
                    :display-time-zone="timeZone"
                    :value="row.createTime" /></template
              ></el-table-column> </el-table
            ><el-table
              v-else-if="tab === 'deliveries'"
              v-loading="tabLoading"
              :data="deliveries"
              border
              ><el-table-column
                prop="recipientMasked"
                :label="t('paymentLink.recipient')"
                min-width="190" /><el-table-column
                :label="t('paymentLink.deliveryStatus')"
                min-width="130"
                ><template #default="{ row }">{{
                  mailStatus(row.sendStatus)
                }}</template></el-table-column
              ><el-table-column
                prop="locale"
                :label="t('paymentLink.mailLocale')" /><el-table-column
                :label="t('paymentLink.actor')"
                min-width="220"
                ><template #default="{ row }"
                  ><span
                    class="pl-operator-name"
                    :title="row.createdBy ? `ID: ${row.createdBy}` : undefined"
                    >{{ operatorName(row.createdAppCode, row.createdBy, row.createdByName) }}</span
                  ></template
                ></el-table-column
              ><el-table-column :label="t('paymentLink.createTime')" width="190"
                ><template #default="{ row }"
                  ><component
                    :is="dateTimeComponent"
                    source-time-zone="Asia/Shanghai"
                    :display-time-zone="timeZone"
                    :value="row.createTime" /></template></el-table-column
            ></el-table>
            <el-table v-else v-loading="tabLoading" :data="events" border
              ><el-table-column :label="t('paymentLink.event')" min-width="180"
                ><template #default="{ row }">{{
                  te(`paymentLink.events.${row.eventType}`)
                    ? t(`paymentLink.events.${row.eventType}`)
                    : row.eventType
                }}</template></el-table-column
              ><el-table-column :label="t('paymentLink.actorSource')" min-width="110"
                ><template #default="{ row }">{{
                  actorSource(row.actorAppCode)
                }}</template></el-table-column
              ><el-table-column :label="t('paymentLink.actor')" min-width="220"
                ><template #default="{ row }"
                  ><span
                    class="pl-operator-name"
                    :title="row.actorId ? `ID: ${row.actorId}` : undefined"
                    >{{ operatorName(row.actorAppCode, row.actorId, row.actorName) }}</span
                  ></template
                ></el-table-column
              ><el-table-column
                prop="reason"
                :label="t('paymentLink.reason')"
                min-width="180" /><el-table-column :label="t('paymentLink.createTime')" width="190"
                ><template #default="{ row }"
                  ><component
                    :is="dateTimeComponent"
                    source-time-zone="Asia/Shanghai"
                    :display-time-zone="timeZone"
                    :value="row.createTime" /></template></el-table-column
            ></el-table>
            <el-pagination
              v-model:current-page="tabPage"
              :page-size="10"
              :total="tabTotal"
              layout="total, prev, pager, next"
              @current-change="loadTab"
          /></template>
        </template>
      </div>
    </el-drawer>
    <el-dialog
      v-model="shareOpen"
      :title="t('paymentLink.share')"
      width="min(520px, 94vw)"
      @closed="clearShare"
      ><div v-loading="shareLoading" class="pl-share">
        <div v-if="selected" class="pl-share-heading">
          <span>{{ t('paymentLink.sharePayment') }}</span>
          <h3>{{ selected.linkName || selected.merchantOrderNo }}</h3>
          <CurrencyAmountDisplay
            :currency="selected.currency"
            :amount="selected.amount"
            :exponent="selected.currencyExponent"
            size="lg"
          />
        </div>
        <div class="pl-qr-frame">
          <img v-if="qr" :src="qr" :alt="t('paymentLink.qrCode')" width="200" height="200" /><span
            v-else
            >—</span
          >
        </div>
        <el-alert
          v-if="selected?.paymentAvailable === false"
          :title="t('paymentLink.currentlyUnavailable')"
          type="warning"
          :closable="false"
          show-icon
        />
        <p class="pl-share-caption">{{ t('paymentLink.scanToPay') }}</p>
        <el-input :model-value="shareUrl" readonly :aria-label="t('paymentLink.share')" />
        <p class="pl-hint">{{ t('paymentLink.shareHint') }}</p>
        <div class="pl-buttons">
          <el-button type="primary" :disabled="!shareUrl" @click="copyLink">{{
            t('paymentLink.copy')
          }}</el-button
          ><el-button :disabled="!shareUrl" @click="nativeShare">{{
            t('paymentLink.nativeShare')
          }}</el-button
          ><el-button :disabled="!qr" @click="downloadQr">{{
            t('paymentLink.qrDownload')
          }}</el-button>
        </div>
      </div>
      <template #footer
        ><div class="dialog-footer">
          <el-button @click="shareOpen = false">{{ t('paymentLink.close') }}</el-button>
        </div></template
      ></el-dialog
    >
    <el-dialog
      v-model="disableOpen"
      :title="t('paymentLink.disable')"
      width="min(560px, 94vw)"
      :close-on-click-modal="false"
      :show-close="!disabling"
      ><el-alert :title="t('paymentLink.disableHint')" type="warning" :closable="false" /><el-form
        @submit.prevent="disableLink"
        ><el-form-item :label="t('paymentLink.reason')" required
          ><el-input v-model="disableReason" type="textarea" maxlength="300" :disabled="disabling"
        /></el-form-item>
        <div class="dialog-footer">
          <el-button
            type="danger"
            native-type="submit"
            :loading="disabling"
            :disabled="!disableReason.trim()"
            >{{ t('paymentLink.confirm') }}</el-button
          ><el-button :disabled="disabling" @click="disableOpen = false">{{
            t('paymentLink.cancel')
          }}</el-button>
        </div></el-form
      ></el-dialog
    >
    <el-dialog
      v-model="emailOpen"
      :title="t('paymentLink.send')"
      width="min(560px, 94vw)"
      :close-on-click-modal="false"
      :show-close="!sending"
      ><el-alert :title="t('paymentLink.sendHint')" type="info" :closable="false" /><el-form
        ref="emailForm"
        :model="emailInput"
        label-position="top"
        @submit.prevent="sendMail"
        ><el-form-item
          :label="t('paymentLink.email')"
          prop="email"
          :rules="[
            {
              required: true,
              type: 'email',
              message: t('paymentLink.invalidEmail'),
              trigger: 'blur',
            },
          ]"
          ><el-input
            v-model="emailInput.email"
            type="email"
            autocomplete="email"
            maxlength="254"
            :disabled="sending" /></el-form-item
        ><el-form-item :label="t('paymentLink.mailLocale')"
          ><el-select v-model="emailInput.locale" :disabled="sending"
            ><el-option
              v-for="lang in ['zh-CN', 'en-US']"
              :key="lang"
              :value="lang"
              :label="t(`paymentLink.locales.${lang}`)" /></el-select
        ></el-form-item>
        <div class="dialog-footer">
          <el-button type="primary" :loading="sending" @click="sendMail">{{
            t('paymentLink.send')
          }}</el-button
          ><el-button :disabled="sending" @click="emailOpen = false">{{
            t('paymentLink.cancel')
          }}</el-button>
        </div></el-form
      ></el-dialog
    >
  </section>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, type Component } from 'vue';
  import { useI18n } from 'vue-i18n';
  import type { FormInstance, FormRules } from 'element-plus';
  import { Plus, Download, FolderOpened } from '@element-plus/icons-vue';
  import { userFacingErrorMessage } from '../index';
  import {
    newPaymentLinkRequestId,
    paymentLinkUsesMethodKeys,
    paymentLinkCurrentMethodKeys,
    paymentLinkCreateWithScope,
    type PaymentLinkApi,
    type PaymentLinkAttempt,
    type PaymentLinkCollection,
    type PaymentLinkCreate,
    type PaymentLinkDelivery,
    type PaymentLinkEvent,
    type PaymentLinkFilterOptions,
    type PaymentLinkOptions,
    type PaymentLinkQuery,
    type PaymentLinkStatus,
    type PaymentLinkSummary,
    type PaymentLinkView,
  } from '../paymentLink';
  import CurrencyAmountDisplay from './CurrencyAmountDisplay.vue';
  import CurrencyDisplay from './CurrencyDisplay.vue';
  import PaymentMethodDisplay from './PaymentMethodDisplay.vue';
  import CheckoutOrderSummary from './CheckoutOrderSummary.vue';
  import PaymentLogoGroup from './PaymentLogoGroup.vue';
  import { getPaymentLogo, resolvePaymentLogoKeys } from '../paymentBrand';
  import { formatMoneyAmount } from '../amount';
  import {
    isPaymentLinkAmountValid,
    paymentLinkDefaultCurrency,
    paymentLinkActorSource,
    paymentLinkOperatorName,
  } from '../paymentLinkPresentation';
  import TransactionStatusDisplay from './TransactionStatusDisplay.vue';
  import PaymentLinkStatusDisplay from './PaymentLinkStatusDisplay.vue';

  const props = defineProps<{
    api: PaymentLinkApi;
    scope: 'admin' | 'merchant';
    can: (action: string) => boolean;
    tableComponent: Component;
    toolbarComponent: Component;
    dateTimeComponent: Component;
    searchPanelComponent: Component;
    timeRangeComponent: Component;
    timezoneOptions: Array<{ value: string; label: string }>;
    normalizeTimeRange: (range: string[], timeZone: string) => string[];
    formatInstant: (value: number, timeZone: string) => string;
    resolveQueryRange: (range: string[], preset: string, timeZone: string) => string[];
    merchantSelect?: Component;
    makeQr: (url: string) => Promise<string>;
    notify: (message: string, type?: 'success' | 'error' | 'warning') => void;
  }>();
  const emit = defineEmits<{
    openTransaction: [attempt: PaymentLinkAttempt];
    downloadCenter: [];
  }>();
  const { t, te, locale } = useI18n();
  const actorSource = (appCode?: string) => paymentLinkActorSource(appCode, t);
  const operatorName = (appCode?: string, id?: string, name?: string) =>
    paymentLinkOperatorName(appCode, id, name, t);
  function creatorLabel(value: PaymentLinkView) {
    return `${actorSource(value.createdAppCode)} · ${operatorName(value.createdAppCode, value.createdBy, value.createdByName)}`;
  }
  const statuses: PaymentLinkStatus[] = ['ACTIVE', 'COMPLETED', 'DISABLED', 'EXPIRED'];
  const summaryKeys = ['total', 'active', 'completed', 'processing', 'failedAttempts'] as const;
  const detailKeys = [
    'linkId',
    'merchantId',
    'orderNo',
    'notifyUrl',
    'redirectUrl',
    'creator',
  ] as const;
  // 详情使用明确的接口投影；操作人名称在展示时随语言变化，ID 保留用于追溯。
  const dateKeys = ['expireTime', 'createTime', 'paidTime'] as const;
  const query = reactive<PaymentLinkQuery>({ pageNo: 1, pageSize: 10 });
  const timeZone = ref('Asia/Shanghai');
  const quickPreset = ref('today');
  const dateRange = ref(props.resolveQueryRange([], quickPreset.value, timeZone.value));
  const showSearch = ref(true);
  const filterOptions = ref<PaymentLinkFilterOptions>();
  const filtersLoading = ref(false);
  const filterError = ref('');
  let filterGeneration = 0;
  async function loadFilters() {
    const seq = ++filterGeneration;
    filtersLoading.value = true;
    filterError.value = '';
    try {
      const result = await props.api.filterOptions();
      if (!destroyed && seq === filterGeneration) filterOptions.value = result;
    } catch (cause) {
      if (!destroyed && seq === filterGeneration)
        filterError.value = userFacingErrorMessage(cause, t('paymentLink.error'));
    } finally {
      if (seq === filterGeneration) filtersLoading.value = false;
    }
  }
  const rows = ref<PaymentLinkView[]>([]);
  const total = ref(0);
  const summary = ref<PaymentLinkSummary>();
  const loading = ref(false);
  const exporting = ref(false);
  const error = ref('');
  const summaryError = ref('');
  let generation = 0;
  let destroyed = false;
  const detail = ref<PaymentLinkView & { orderNo: string }>();
  const detailOpen = ref(false);
  const detailLoading = ref(false);
  const tab = ref('info');
  const tabPage = ref(1);
  const tabTotal = ref(0);
  const tabLoading = ref(false);
  const collections = ref<PaymentLinkCollection[]>([]);
  const attempts = ref<PaymentLinkAttempt[]>([]);
  const deliveries = ref<PaymentLinkDelivery[]>([]);
  const events = ref<PaymentLinkEvent[]>([]);
  const createOpen = ref(false);
  const creating = ref(false);
  const createForm = ref<FormInstance>();
  const createMerchant = ref('');
  const options = ref<PaymentLinkOptions>();
  const optionsLoading = ref(false);
  const optionError = ref('');
  let optionsGeneration = 0;
  function blankForm(): PaymentLinkCreate {
    return {
      requestId: newPaymentLinkRequestId(),
      linkName: '',
      merchantOrderNo: '',
      description: '',
      currency: '',
      amount: '',
      expireMinutes: 60,
      expireTime: props.formatInstant(Date.now() + 60 * 60000, timeZone.value).replace(' ', 'T'),
      locale: 'AUTO',
      cardBrands: [],
      paymentMethodKeys: [],
      notifyUrl: '',
      redirectUrl: '',
    };
  }
  const form = reactive(blankForm());
  const expiryMode = ref<'quick' | 'custom'>('quick');
  const expiryDurations = computed(() =>
    [60, 120, 1440, 4320, 10080, 43200].filter(
      (minutes) => minutes <= (options.value?.maxExpireMinutes ?? 43200),
    ),
  );
  const otherPaymentMethods = computed(() =>
    (options.value?.paymentMethodsByCurrency?.[form.currency] || []).filter(
      (method) => method !== 'BANK_CARD',
    ),
  );
  function methodName(method: string) {
    const key = resolvePaymentLogoKeys(method)[0];
    return key ? getPaymentLogo(key).label : method;
  }
  const usesMethodKeys = computed(() => paymentLinkUsesMethodKeys(options.value));
  const currentMethodKeys = computed(() =>
    paymentLinkCurrentMethodKeys(options.value, form.currency),
  );
  function methodKeyLogos(key: string) {
    const [kind, value] = key.split(':');
    return kind === 'CARD_BRAND'
      ? resolvePaymentLogoKeys('BANK_CARD', value)
      : kind === 'METHOD'
        ? resolvePaymentLogoKeys(value)
        : [];
  }
  function methodKeyName(key: string) {
    const [kind, value] = key.split(':');
    return kind === 'CARD_BRAND' ? brandName(value) : kind === 'METHOD' ? methodName(value) : key;
  }
  function linkScopeLogos(link: PaymentLinkView) {
    return [
      ...new Set(
        link.paymentMethodKeys !== undefined
          ? link.paymentMethodKeys.flatMap(methodKeyLogos)
          : (link.cardBrands || []).flatMap((brand) => resolvePaymentLogoKeys('BANK_CARD', brand)),
      ),
    ];
  }
  const currentBrands = computed(() => options.value?.cardBrandsByCurrency[form.currency] || []);
  const amountExponent = computed(() => options.value?.currencyExponents?.[form.currency] ?? 2);
  const receiptLabels = computed(() => ({
    merchant: t('paymentLink.receiptMerchant'),
    summary: t('paymentLink.receiptSummary'),
    secure: t('paymentLink.receiptSecure'),
    total: t('paymentLink.receiptTotal'),
  }));
  const previewAmount = computed(() =>
    form.currency && isPaymentLinkAmountValid(form.amount, amountExponent.value)
      ? `${form.currency} ${formatMoneyAmount(form.amount, String(locale.value), amountExponent.value)}`
      : '—',
  );
  const previewItems = computed(() =>
    form.linkName || form.description
      ? [{ name: form.linkName || t('paymentLink.description'), meta: form.description }]
      : [],
  );
  const previewLogoKeys = computed(() => [
    ...new Set(
      usesMethodKeys.value
        ? (form.paymentMethodKeys || []).flatMap(methodKeyLogos)
        : (form.cardBrands || []).flatMap((brand) => resolvePaymentLogoKeys('BANK_CARD', brand)),
    ),
  ]);
  function brandName(brand: string) {
    const key = resolvePaymentLogoKeys('BANK_CARD', brand)[0];
    return key ? getPaymentLogo(key).label : brand;
  }
  function chooseExpiry(value: string | number | boolean | undefined) {
    const minutes = Number(value);
    if (!expiryDurations.value.includes(minutes)) return;
    expiryMode.value = 'quick';
    form.expireMinutes = minutes;
    form.expireTime = props
      .formatInstant(Date.now() + minutes * 60000, timeZone.value)
      .replace(' ', 'T');
    createForm.value?.clearValidate('expireTime');
  }
  let optionMerchant = '';
  let createSnapshot = '';
  const emailOpen = ref(false);
  const sending = ref(false);
  const emailForm = ref<FormInstance>();
  const emailInput = reactive({ email: '', locale: 'en-US', requestId: '' });
  let emailSnapshot = '';
  const selected = ref<PaymentLinkView>();
  const disableOpen = ref(false);
  const disabling = ref(false);
  const disableReason = ref('');
  let disableRequest = '';
  const shareOpen = ref(false);
  const shareLoading = ref(false);
  const shareUrl = ref('');
  const qr = ref('');
  let shareGeneration = 0;
  const rules = computed<FormRules>(() => ({
    currency: [{ required: true, message: t('paymentLink.required'), trigger: 'change' }],
    [usesMethodKeys.value ? 'paymentMethodKeys' : 'cardBrands']: [
      {
        type: 'array',
        required: true,
        min: 1,
        message: t(usesMethodKeys.value ? 'paymentLink.chooseMethod' : 'paymentLink.chooseBrand'),
        trigger: 'change',
      },
    ],
    amount: [
      {
        required: true,
        validator: (_rule, value: string, callback) =>
          callback(
            isPaymentLinkAmountValid(value, amountExponent.value)
              ? undefined
              : new Error(
                  t(
                    amountExponent.value === 0
                      ? 'paymentLink.invalidIntegerAmount'
                      : 'paymentLink.invalidAmount',
                  ),
                ),
          ),
        trigger: 'blur',
      },
    ],
    expireTime: [
      {
        validator: (_rule, _value, callback) => {
          const normalized = props.normalizeTimeRange([form.expireTime || ''], timeZone.value)[0];
          const remaining = Date.parse(normalized + '+08:00') - Date.now();
          callback(
            Number.isFinite(remaining) && remaining >= 15 * 60000 && remaining <= 30 * 86400000
              ? undefined
              : new Error(t('paymentLink.expireHint')),
          );
        },
        trigger: 'change',
      },
    ],
    notifyUrl: [{ validator: validateUrl, trigger: 'blur' }],
    redirectUrl: [{ validator: validateUrl, trigger: 'blur' }],
  }));
  function selectCurrencyBrands() {
    if (form.amount) void createForm.value?.validateField('amount').catch(() => false);
    else createForm.value?.clearValidate('amount');
    form.cardBrands = usesMethodKeys.value
      ? []
      : [...(options.value?.cardBrandsByCurrency[form.currency] || [])];
    form.paymentMethodKeys = usesMethodKeys.value ? [...currentMethodKeys.value] : [];
    createForm.value?.clearValidate(['cardBrands', 'paymentMethodKeys']);
  }

  function validateUrl(_rule: unknown, value: string, callback: (error?: Error) => void) {
    if (!value) return callback();
    try {
      const url = new URL(value);
      if (
        (url.protocol === 'https:' ||
          (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) &&
        !url.username &&
        !url.password
      )
        return callback();
    } catch {
      /* Show a local validation message. */
    }
    callback(new Error(t('paymentLink.invalidUrl')));
  }
  function fail(cause: unknown) {
    props.notify(userFacingErrorMessage(cause, t('paymentLink.error')), 'error');
  }
  function normalizedQuery(): PaymentLinkQuery {
    dateRange.value = props.resolveQueryRange(dateRange.value, quickPreset.value, timeZone.value);
    const range = props.normalizeTimeRange(dateRange.value, timeZone.value);
    return Object.fromEntries(
      Object.entries({
        ...query,
        createTimeFrom: range[0],
        createTimeTo: range[1],
      }).filter(([, value]) => value !== '' && value !== undefined),
    );
  }
  async function reload() {
    const seq = ++generation;
    loading.value = true;
    error.value = '';
    summaryError.value = '';
    try {
      const input = normalizedQuery();
      await Promise.all([
        props.api
          .search(input)
          .then((page) => {
            if (seq !== generation || destroyed) return;
            rows.value = page.records;
            total.value = page.total;
          })
          .catch((cause) => {
            if (seq !== generation || destroyed) return;
            error.value = userFacingErrorMessage(cause, t('paymentLink.error'));
            rows.value = [];
            total.value = 0;
          })
          .finally(() => {
            if (seq === generation) loading.value = false;
          }),
        props.api
          .summary(input)
          .then((aggregate) => {
            if (seq !== generation || destroyed) return;
            summary.value = aggregate;
          })
          .catch((cause) => {
            if (seq !== generation || destroyed) return;
            summaryError.value = userFacingErrorMessage(cause, t('paymentLink.error'));
            summary.value = undefined;
          }),
      ]);
    } catch (cause) {
      if (seq === generation && !destroyed) {
        error.value = userFacingErrorMessage(cause, t('paymentLink.error'));
        rows.value = [];
        total.value = 0;
        summary.value = undefined;
      }
    } finally {
      if (seq === generation) loading.value = false;
    }
  }
  function search() {
    query.pageNo = 1;
    void reload();
  }
  function reset() {
    Object.keys(query).forEach((key) => delete query[key as keyof PaymentLinkQuery]);
    Object.assign(query, { pageNo: 1, pageSize: 10 });
    timeZone.value = 'Asia/Shanghai';
    quickPreset.value = 'today';
    dateRange.value = props.resolveQueryRange([], quickPreset.value, timeZone.value);
    void reload();
  }
  function paymentText(value: string) {
    return te(`paymentLink.paymentStatuses.${value}`)
      ? t(`paymentLink.paymentStatuses.${value}`)
      : value || '—';
  }
  function mailStatus(value: number | null) {
    return value != null && te(`paymentLink.mailStatuses.${value}`)
      ? t(`paymentLink.mailStatuses.${value}`)
      : '—';
  }
  function availableActions(row: PaymentLinkView) {
    return row.status === 'ACTIVE'
      ? ['share', 'send', 'disable'].filter((action) => props.can(action))
      : [];
  }
  function rowAction(action: string, row: PaymentLinkView) {
    selected.value = row;
    if (action === 'share') void openShare(row);
    if (action === 'disable') {
      disableReason.value = '';
      disableRequest = newPaymentLinkRequestId();
      disableOpen.value = true;
    }
    if (action === 'send') {
      Object.assign(emailInput, {
        email: '',
        locale: locale.value.startsWith('zh') ? 'zh-CN' : 'en-US',
        requestId: newPaymentLinkRequestId(),
      });
      emailSnapshot = '';
      emailOpen.value = true;
    }
  }
  async function openCreate() {
    Object.assign(form, blankForm());
    expiryMode.value = 'quick';
    options.value = undefined;
    optionError.value = '';
    createMerchant.value = query.merchantId || '';
    createSnapshot = '';
    createOpen.value = true;
    await loadOptions();
  }
  function clearCreate() {
    Object.assign(form, blankForm());
    expiryMode.value = 'quick';
    createForm.value?.clearValidate();
    options.value = undefined;
    ++optionsGeneration;
    ++filterGeneration;
  }
  async function loadOptions() {
    const seq = ++optionsGeneration;
    options.value = undefined;
    if (props.scope === 'admin' && !createMerchant.value) return;
    optionsLoading.value = true;
    optionError.value = '';
    try {
      const data = await props.api.options(createMerchant.value);
      if (seq !== optionsGeneration) return;
      options.value = data;
      form.currency =
        optionMerchant === data.merchantId && data.currencies.includes(form.currency)
          ? form.currency
          : paymentLinkDefaultCurrency(data.currencies, data.defaultCurrency);
      optionMerchant = data.merchantId;
      selectCurrencyBrands();
    } catch (cause) {
      if (seq === optionsGeneration)
        optionError.value = userFacingErrorMessage(cause, t('paymentLink.error'));
    } finally {
      if (seq === optionsGeneration) optionsLoading.value = false;
    }
  }
  async function createLink() {
    if (creating.value) return;
    creating.value = true;
    try {
      if (!(await createForm.value?.validate().catch(() => false))) return;
      if (props.scope === 'admin' && !createMerchant.value)
        throw new Error(t('paymentLink.selectMerchant'));
      const input = paymentLinkCreateWithScope(
        {
          ...form,
          linkName: form.linkName.trim(),
          // 固定用户看到的截止时间，重试时不重新计算，保持创建请求幂等。
          expireMinutes: undefined,
          expireTime: props.normalizeTimeRange([form.expireTime || ''], timeZone.value)[0],
          merchantOrderNo: form.merchantOrderNo?.trim(),
          notifyUrl: form.notifyUrl?.trim() || undefined,
          redirectUrl: form.redirectUrl?.trim() || undefined,
        },
        usesMethodKeys.value,
      );
      const snapshot = JSON.stringify({
        ...input,
        requestId: undefined,
        merchant: createMerchant.value,
      });
      if (createSnapshot && createSnapshot !== snapshot)
        input.requestId = form.requestId = newPaymentLinkRequestId();
      createSnapshot = snapshot;
      const row = await props.api.create(input, createMerchant.value);
      createOpen.value = false;
      props.notify(
        t(
          row.paymentAvailable === false ? 'paymentLink.createdUnavailable' : 'paymentLink.created',
        ),
        row.paymentAvailable === false ? 'warning' : 'success',
      );
      await reload();
      if (props.can('detail')) await openDetail(row);
      else if (props.can('share')) await openShare(row);
    } catch (cause) {
      fail(cause);
    } finally {
      creating.value = false;
    }
  }
  async function openDetail(row: PaymentLinkView) {
    detailOpen.value = true;
    detailLoading.value = true;
    detail.value = undefined;
    tab.value = 'info';
    try {
      const value = await props.api.detail(row.linkId);
      detail.value = {
        ...value,
        orderNo: value.merchantOrderNo,
      };
    } catch (cause) {
      detail.value = undefined;
      fail(cause);
    } finally {
      detailLoading.value = false;
    }
  }
  async function loadTab() {
    if (!detail.value || tab.value === 'info') return;
    const id = detail.value.linkId;
    const name = tab.value;
    const pageNo = tabPage.value;
    tabLoading.value = true;
    try {
      const page =
        name === 'collections'
          ? await props.api.collections(id, { pageNo })
          : name === 'attempts'
            ? await props.api.attempts(id, { pageNo })
            : name === 'deliveries' && props.can('delivery')
              ? await props.api.deliveries(id, { pageNo })
              : await props.api.events(id, { pageNo });
      if (detail.value?.linkId !== id || tab.value !== name || pageNo !== tabPage.value) return;
      tabTotal.value = page.total;
      if (name === 'collections') collections.value = page.records as PaymentLinkCollection[];
      else if (name === 'attempts') attempts.value = page.records as PaymentLinkAttempt[];
      else if (name === 'deliveries') deliveries.value = page.records as PaymentLinkDelivery[];
      else events.value = page.records as PaymentLinkEvent[];
    } catch (cause) {
      fail(cause);
    } finally {
      tabLoading.value = false;
    }
  }
  watch(tab, () => {
    tabPage.value = 1;
    tabTotal.value = 0;
    collections.value = [];
    attempts.value = [];
    deliveries.value = [];
    events.value = [];
    void loadTab();
  });
  async function openShare(row: PaymentLinkView) {
    selected.value = row;
    const seq = ++shareGeneration;
    shareOpen.value = true;
    shareLoading.value = true;
    shareUrl.value = '';
    qr.value = '';
    try {
      const data = await props.api.share(row.linkId);
      const image = await props.makeQr(data.url);
      if (seq !== shareGeneration || !shareOpen.value) return;
      shareUrl.value = data.url;
      qr.value = image;
    } catch (cause) {
      fail(cause);
    } finally {
      if (seq === shareGeneration) shareLoading.value = false;
    }
  }
  function clearShare() {
    ++shareGeneration;
    shareUrl.value = '';
    qr.value = '';
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl.value);
      props.notify(t('paymentLink.copied'), 'success');
    } catch {
      props.notify(t('paymentLink.copyUnavailable'), 'warning');
    }
  }
  async function nativeShare() {
    if (!navigator.share) return props.notify(t('paymentLink.shareUnavailable'), 'warning');
    try {
      await navigator.share({ url: shareUrl.value });
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) fail(cause);
    }
  }
  function downloadQr() {
    const anchor = document.createElement('a');
    anchor.href = qr.value;
    anchor.download = 'payment-link-qr.png';
    anchor.click();
  }
  async function disableLink() {
    if (disabling.value || !selected.value || !disableReason.value.trim()) return;
    disabling.value = true;
    try {
      await props.api.disable(selected.value.linkId, {
        version: selected.value.version,
        reason: disableReason.value.trim(),
        requestId: disableRequest,
      });
      disableOpen.value = false;
      props.notify(t('paymentLink.disabled'), 'success');
      await reload();
      if (detailOpen.value && detail.value?.linkId === selected.value.linkId)
        await openDetail(selected.value);
    } catch (cause) {
      fail(cause);
    } finally {
      disabling.value = false;
    }
  }
  async function sendMail() {
    if (sending.value || !selected.value) return;
    sending.value = true;
    try {
      if (!(await emailForm.value?.validate().catch(() => false))) return;
      const snapshot = JSON.stringify([
        emailInput.email.trim(),
        emailInput.locale,
        selected.value.linkId,
      ]);
      if (emailSnapshot && snapshot !== emailSnapshot)
        emailInput.requestId = newPaymentLinkRequestId();
      emailSnapshot = snapshot;
      const result = await props.api.sendEmail(selected.value.linkId, {
        ...emailInput,
        email: emailInput.email.trim(),
      });
      emailOpen.value = false;
      const failed = result.sendStatus === 3 || result.sendStatus === 5;
      props.notify(
        t(`paymentLink.${failed ? 'mailFailed' : result.sendStatus === 2 ? 'sent' : 'mailQueued'}`),
        failed ? 'error' : 'success',
      );
      if (detailOpen.value && tab.value === 'deliveries') await loadTab();
    } catch (cause) {
      fail(cause);
    } finally {
      sending.value = false;
    }
  }
  async function exportRows() {
    if (exporting.value) return;
    exporting.value = true;
    try {
      await props.api.export(normalizedQuery(), newPaymentLinkRequestId(), timeZone.value);
      props.notify(t('paymentLink.exported'), 'success');
    } catch (cause) {
      fail(cause);
    } finally {
      exporting.value = false;
    }
  }
  watch(locale, () => {
    void reload();
    void loadFilters();
  });
  onMounted(() => {
    void reload();
    void loadFilters();
  });
  onBeforeUnmount(() => {
    destroyed = true;
    ++generation;
    ++optionsGeneration;
    clearShare();
  });
</script>

<style scoped>
  .pl-operator-name {
    display: block;
    white-space: normal;
    overflow-wrap: anywhere;
    line-height: 1.6;
  }
  .pl-workspace {
    container: pl-workspace / inline-size;
    display: grid;
    align-content: start;
    grid-auto-rows: max-content;
    gap: 12px;
    color: var(--el-text-color-primary);
    min-width: 0;
  }
  .pl-workspace > :deep(.transaction-search-panel) {
    margin-bottom: 0;
  }
  .pl-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .pl-heading h3 {
    margin: 0;
    font-size: 16px;
    line-height: 24px;
  }
  .pl-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .pl-buttons :deep(.el-button + .el-button) {
    margin-left: 0;
  }
  .pl-summary {
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background: var(--el-bg-color);
    overflow: hidden;
  }
  .pl-counts {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .pl-metric {
    position: relative;
    display: grid;
    align-content: start;
    justify-items: start;
    gap: 6px;
    min-width: 0;
    padding: 14px 20px;
  }
  .pl-metric + .pl-metric::before {
    content: '';
    position: absolute;
    left: 0;
    top: 18px;
    bottom: 18px;
    border-left: 1px solid var(--el-border-color-lighter);
  }
  .pl-metric > span,
  .pl-collected > span:first-child {
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 20px;
    overflow-wrap: anywhere;
  }
  .pl-metric > strong {
    color: var(--el-text-color-primary);
    font-size: 22px;
    line-height: 28px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .pl-metric--active > strong,
  .pl-metric--processing > strong {
    color: var(--el-color-primary);
  }
  .pl-metric--completed > strong {
    color: var(--el-color-success);
  }
  .pl-metric--failedAttempts > strong {
    color: var(--el-color-danger);
  }
  .pl-collected {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 20px;
    min-width: 0;
    padding: 10px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);
  }
  .pl-collected > div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 20px;
    min-width: 0;
  }
  @container pl-workspace (max-width: 740px) {
    .pl-counts {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .pl-metric:nth-child(4)::before {
      display: none;
    }
    .pl-metric {
      padding: 12px 16px;
    }
    .pl-collected {
      padding: 10px 16px;
    }
  }
  @container pl-workspace (max-width: 460px) {
    .pl-counts {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .pl-metric:nth-child(4)::before {
      display: block;
    }
    .pl-metric:nth-child(odd)::before {
      display: none;
    }
  }
  .pl-list {
    padding: 12px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    min-width: 0;
  }
  .pl-table-tools {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 10px;
  }
  .pl-table-tools > :last-child {
    margin-left: auto;
  }
  .pl-row-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .pl-list :deep(.el-pagination) {
    justify-content: flex-end;
    flex-wrap: wrap;
    margin-top: 14px;
    gap: 6px;
  }
  .pl-create-form.el-form {
    max-width: none;
    width: 100%;
    margin: 0;
    max-height: none;
    overflow: visible;
    padding: 2px 6px 0 0;
  }
  .pl-create-grid {
    display: grid;
    align-items: start;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 24px;
  }
  .pl-create-form :deep(.el-select),
  .pl-create-form :deep(.el-input-number) {
    width: 100%;
  }
  .pl-create-form :deep(.el-form-item__label) {
    white-space: normal;
    font-size: 13px;
  }
  .pl-create-form :deep(.el-form-item) {
    margin-bottom: 18px;
  }
  .pl-create-form :deep(.el-checkbox-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
  }
  .pl-create-form :deep(.el-checkbox) {
    margin-right: 0;
  }
  .pl-two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .pl-preview {
    position: sticky;
    top: 0;
    min-width: 0;
    padding: 18px;
    border-radius: 16px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-light);
  }
  .pl-preview-heading {
    display: grid;
    gap: 6px;
    margin-bottom: 16px;
  }
  .pl-preview-heading strong {
    font-size: 14px;
  }
  .pl-preview-heading span {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
  }
  .pl-other-methods {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pl-other-method {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-light);
  }
  .pl-other-method small {
    color: var(--el-text-color-secondary);
    font-size: 11px;
  }
  .pl-preview-methods {
    display: grid;
    gap: 12px;
    padding: 18px 0;
    font-size: 12px;
  }
  .pl-preview-pay {
    padding: 14px;
    border-radius: 12px;
    text-align: center;
    background: linear-gradient(110deg, #7c3aed, #1e3aff);
    color: #fff;
    font-weight: 600;
  }
  .pl-expiry-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    width: 100%;
  }
  .pl-expiry-controls :deep(.el-radio-group) {
    display: flex;
    flex-wrap: wrap;
  }
  .pl-expiry-controls :deep(.el-date-editor) {
    flex: 1 1 220px;
    width: auto;
  }
  .pl-create-form :deep(.el-form-item__content) {
    min-width: 0;
  }
  .pl-create-form :deep(.el-form-item__error) {
    position: static;
    line-height: 1.5;
  }
  .pl-create-form :deep(.el-checkbox) {
    height: auto;
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
  }
  .pl-create-form :deep(.el-checkbox.is-checked) {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }
  .pl-create-form :deep(.el-checkbox__label) {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    white-space: normal;
  }
  .pl-hint {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.6;
    margin: 6px 0 12px;
  }
  .pl-create-notice {
    margin: 0 0 10px;
    text-align: center;
  }
  .pl-description {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-size: 13px;
    line-height: 1.7;
  }
  .pl-share-heading {
    display: grid;
    justify-items: center;
    gap: 10px;
    text-align: center;
    width: 100%;
  }
  .pl-share-heading > span,
  .pl-share-caption {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    margin: 0;
  }
  .pl-share-heading h3 {
    margin: 0;
    font-size: 17px;
    overflow-wrap: anywhere;
  }
  .pl-qr-frame {
    display: grid;
    place-items: center;
    min-height: 232px;
    width: 232px;
    padding: 16px;
    box-sizing: border-box;
    background: #fff;
    border: 1px solid var(--el-border-color-light);
    border-radius: 16px;
    box-shadow: 0 6px 20px rgb(15 23 42 / 5%);
  }
  .pl-share > .pl-hint {
    margin: 0;
    text-align: center;
  }
  .pl-share > .pl-buttons {
    justify-content: center;
  }
  .pl-share {
    display: grid;
    justify-items: center;
    gap: 18px;
  }
  .pl-share :deep(.el-input) {
    width: 100%;
  }
  .pl-detail-buttons {
    margin: 16px 0;
  }
  .dialog-footer {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  @media (max-width: 900px) {
    .pl-create-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    .pl-preview {
      position: static;
    }
  }
  @media (max-width: 650px) {
    .pl-two {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
    }
    .pl-create-form :deep(.el-form-item) {
      display: block;
    }
    .pl-create-form :deep(.el-form-item__label) {
      float: none;
      display: block;
      text-align: left;
      width: 100% !important;
    }
    .pl-create-form :deep(.el-form-item__content) {
      margin-left: 0 !important;
    }
  }
</style>
