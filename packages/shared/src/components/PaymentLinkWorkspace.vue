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
      <div v-for="key in summaryKeys" :key="key" class="pl-metric" :class="`pl-metric--${key}`">
        <span>{{ t(`paymentLink.${key}`) }}</span
        ><strong>{{ summary ? summary[key] : '—' }}</strong>
      </div>
      <div class="pl-metric pl-collected">
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
        :empty-text="t('paymentLink.empty')"
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
      :title="t('paymentLink.create')"
      width="min(980px, 96vw)"
      :close-on-click-modal="false"
      :close-on-press-escape="!creating"
      :show-close="!creating"
      @closed="clearCreate"
    >
      <el-form
        ref="createForm"
        :model="form"
        :rules="rules"
        label-position="right"
        :label-width="String(locale).startsWith('zh') ? '112px' : '148px'"
        size="small"
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
              <el-form-item :label="t('paymentLink.description')" prop="description"
                ><el-input
                  v-model="form.description"
                  type="textarea"
                  :rows="3"
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
                    :disabled="creating"
                /></el-form-item>
              </div>
              <div class="pl-expiry-section">
                <el-form-item :label="t('paymentLink.expiryMode')" prop="expireTime">
                  <div class="pl-expiry-controls">
                    <el-radio-group v-model="expiryMode" :disabled="creating">
                      <el-radio-button value="quick">{{
                        t('paymentLink.expiryQuick')
                      }}</el-radio-button>
                      <el-radio-button value="custom">{{
                        t('paymentLink.expiryCustom')
                      }}</el-radio-button>
                    </el-radio-group>
                    <el-select
                      v-if="expiryMode === 'quick'"
                      v-model="form.expireMinutes"
                      :disabled="creating"
                      :aria-label="t('paymentLink.expiryQuick')"
                    >
                      <el-option
                        v-for="minutes in expiryDurations"
                        :key="minutes"
                        :value="minutes"
                        :label="t(`paymentLink.durations.${minutes}`)"
                      />
                    </el-select>
                    <el-date-picker
                      v-else
                      v-model="form.expireTime"
                      type="datetime"
                      format="YYYY-MM-DD HH:mm:ss"
                      value-format="YYYY-MM-DDTHH:mm:ss"
                      :placeholder="t('paymentLink.expiryCustom')"
                      :disabled="creating"
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
              <el-form-item prop="cardBrands" :label="t('paymentLink.brands')"
                ><el-checkbox-group v-model="form.cardBrands" :disabled="creating"
                  ><el-checkbox v-for="brand in currentBrands" :key="brand" :value="brand"
                    ><PaymentMethodDisplay
                      :payment-types="[{ value: 'BANK_CARD', label: t('paymentLink.bankCard') }]"
                      :payment-methods="[{ value: brand, label: brand }]" /></el-checkbox
                ></el-checkbox-group>
                <p class="pl-hint">{{ t('paymentLink.allBrands') }}</p></el-form-item
              >
              <el-alert
                v-if="options && !options.currencies.length"
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
            <span>{{ t('paymentLink.preview') }}</span>
            <h3>{{ options?.merchantDisplayName || '—' }}</h3>
            <h4 v-if="form.linkName">{{ form.linkName }}</h4>
            <CurrencyAmountDisplay :amount="form.amount || '0'" :currency="form.currency" />
            <p v-if="form.description" class="pl-description">{{ form.description }}</p>
            <p class="pl-hint">{{ t('paymentLink.previewHint') }}</p>
          </aside>
        </div>
      </el-form>
      <template #footer>
        <p class="pl-hint pl-create-notice">{{ t('paymentLink.createHint') }}</p>
        <div class="dialog-footer">
          <el-button
            type="primary"
            :loading="creating"
            :disabled="!options?.currencies.length || optionsLoading"
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
          <el-tabs v-model="tab">
            <el-tab-pane name="info" :label="t('paymentLink.tabs.info')"
              ><el-descriptions :column="1" border>
                <el-descriptions-item
                  v-for="key in detailKeys"
                  :key="key"
                  :label="t(`paymentLink.${key === 'merchantId' ? 'merchant' : key}`)"
                  >{{ detail[key] || '—' }}</el-descriptions-item
                >
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
                  ><span v-else>{{ row.transactionId || '—' }}</span></template
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
                prop="createdBy"
                :label="t('paymentLink.actor')" /><el-table-column
                :label="t('paymentLink.createTime')"
                width="190"
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
              ><el-table-column
                prop="actorAppCode"
                :label="t('paymentLink.creator')" /><el-table-column
                prop="actorId"
                :label="t('paymentLink.actor')" /><el-table-column
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
        <el-alert :title="t('paymentLink.shareHint')" type="info" :closable="false" /><el-input
          :model-value="shareUrl"
          readonly
          :aria-label="t('paymentLink.share')"
        /><img v-if="qr" :src="qr" :alt="t('paymentLink.qrCode')" width="220" height="220" />
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
  // Detail labels and values use an explicit projection; order and creator have separate backend names.
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
  let generation = 0;
  let destroyed = false;
  const detail = ref<PaymentLinkView & { orderNo: string; creator: string }>();
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
      expireMinutes: 1440,
      expireTime: '',
      locale: 'AUTO',
      cardBrands: [],
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
  const currentBrands = computed(() => options.value?.cardBrandsByCurrency[form.currency] || []);
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
    cardBrands: [
      {
        type: 'array',
        required: true,
        min: 1,
        message: t('paymentLink.chooseBrand'),
        trigger: 'change',
      },
    ],
    amount: [
      {
        validator: (_rule, value: string, callback) =>
          callback(
            /^[0-9]{1,14}(\.[0-9]{1,6})?$/.test(value) && /[1-9]/.test(value)
              ? undefined
              : new Error(t('paymentLink.invalidAmount')),
          ),
        trigger: 'blur',
      },
    ],
    expireTime: [
      {
        validator: (_rule, _value, callback) => {
          if (expiryMode.value === 'quick') return callback();
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
    form.cardBrands = [...(options.value?.cardBrandsByCurrency[form.currency] || [])];
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
    try {
      const input = normalizedQuery();
      const [page, aggregate] = await Promise.all([
        props.api.search(input),
        props.api.summary(input),
      ]);
      if (seq !== generation || destroyed) return;
      rows.value = page.records;
      total.value = page.total;
      summary.value = aggregate;
    } catch (cause) {
      if (seq === generation) {
        error.value = userFacingErrorMessage(cause, t('paymentLink.error'));
        rows.value = [];
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
      form.currency = data.currencies.includes(form.currency)
        ? form.currency
        : data.currencies[0] || '';
      form.cardBrands = [...(data.cardBrandsByCurrency[form.currency] || [])];
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
      const input = {
        ...form,
        linkName: form.linkName.trim(),
        expireMinutes: expiryMode.value === 'quick' ? form.expireMinutes : undefined,
        expireTime:
          expiryMode.value === 'custom'
            ? props.normalizeTimeRange([form.expireTime || ''], timeZone.value)[0]
            : undefined,
        merchantOrderNo: form.merchantOrderNo?.trim(),
        notifyUrl: form.notifyUrl?.trim() || undefined,
        redirectUrl: form.redirectUrl?.trim() || undefined,
      };
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
      props.notify(t('paymentLink.created'), 'success');
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
        creator: `${value.createdAppCode} / ${value.createdBy}`,
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
  .pl-expiry-controls {
    display: grid;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }
  .pl-expiry-controls :deep(.el-radio-group) {
    flex-wrap: nowrap;
  }
  .pl-expiry-controls :deep(.el-date-editor input) {
    font-variant-numeric: tabular-nums;
  }
  .pl-expiry-controls :deep(.el-date-editor) {
    width: 100%;
  }
  .pl-workspace {
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
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    background: var(--el-bg-color);
    overflow: hidden;
  }
  .pl-metric {
    display: grid;
    grid-template-columns: 140px minmax(0, 1fr);
    align-items: stretch;
    min-height: 42px;
    min-width: 0;
    border-right: 1px solid var(--el-border-color-lighter);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
  .pl-metric:nth-child(even) {
    border-right: 0;
  }
  .pl-metric:nth-last-child(-n + 2) {
    border-bottom: 0;
  }
  .pl-metric > span:first-child {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-left: 3px solid var(--el-color-primary);
    border-right: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    font-size: 12px;
    font-weight: 600;
  }
  .pl-metric strong {
    justify-self: start;
    align-self: center;
    margin: 6px 12px;
    padding: 2px 9px;
    border: 1px solid var(--el-color-primary-light-8);
    border-radius: 4px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-size: 16px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .pl-metric--completed > span:first-child {
    border-left-color: var(--el-color-success);
  }
  .pl-metric--completed strong {
    color: var(--el-color-success);
    border-color: var(--el-color-success-light-8);
    background: var(--el-color-success-light-9);
  }
  .pl-metric--failedAttempts > span:first-child {
    border-left-color: var(--el-color-danger);
  }
  .pl-metric--failedAttempts strong {
    color: var(--el-color-danger);
    border-color: var(--el-color-danger-light-8);
    background: var(--el-color-danger-light-9);
  }
  .pl-collected > div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
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
  .pl-create-form {
    max-height: calc(100vh - 260px);
    overflow: auto;
    padding: 2px 6px 0 0;
  }
  .pl-create-grid {
    display: grid;
    align-items: start;
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: 24px;
  }
  .pl-create-form :deep(.el-select),
  .pl-create-form :deep(.el-input-number) {
    width: 100%;
  }
  .pl-create-form :deep(.el-form-item__label) {
    white-space: nowrap;
    font-size: 12px;
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
    align-self: start;
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    padding: 16px;
    background: var(--el-fill-color-light);
    overflow-wrap: anywhere;
  }
  .pl-preview > span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
  .pl-preview h3 {
    margin: 16px 0 8px;
    font-size: 14px;
    line-height: 22px;
  }
  .pl-preview h4 {
    margin: 0 0 14px;
    font-size: 13px;
    font-weight: 500;
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
    .pl-summary {
      grid-template-columns: minmax(0, 1fr);
    }
    .pl-metric {
      border-right: 0;
    }
    .pl-metric:nth-last-child(2) {
      border-bottom: 1px solid var(--el-border-color-lighter);
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
