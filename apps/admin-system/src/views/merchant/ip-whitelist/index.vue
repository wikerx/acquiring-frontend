<template>
  <div class="app-container merchant-ip-whitelist-page">
    <el-form ref="queryFormRef" v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="92px">
      <el-form-item :label="$t('merchant.ipWhitelist.merchantId')" prop="merchantId">
        <el-select
          v-model="query.merchantId"
          filterable
          remote
          clearable
          reserve-keyword
          remote-show-suffix
          :remote-method="remoteSearchMerchants"
          :loading="merchantLoading"
          :placeholder="$t('merchant.ipWhitelist.merchantPlaceholder')"
          class="query-merchant-select"
          @visible-change="handleMerchantVisibleChange"
        >
          <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
        </el-select>
      </el-form-item>
      <el-form-item prop="ipValue">
        <div class="ip-query-control">
          <el-select v-model="query.ipType" class="ip-type-select" :placeholder="$t('merchant.ipWhitelist.ipType')" clearable :teleported="false" aria-label="IP type">
            <el-option label="IP v4" value="IPv4" />
            <el-option label="IP v6" value="IPv6" />
          </el-select>
          <el-input v-model.trim="query.ipValue" :placeholder="$t('merchant.ipWhitelist.ipPlaceholder')" clearable class="ip-address-input" @input="handleIpInput" @keyup.enter="handleSearch" />
        </div>
      </el-form-item>
      <el-form-item :label="$t('merchant.ipWhitelist.transactionStatus')" prop="status">
        <el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable>
          <el-option :label="$t('common.enable')" :value="1" />
          <el-option :label="$t('common.disable')" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('merchant.ipWhitelist.approvalStatus')" prop="approvalStatus">
        <el-select v-model="query.approvalStatus" :placeholder="$t('common.pleaseSelect')" clearable>
          <el-option :label="$t('merchant.ipWhitelist.approvalPending')" :value="0" />
          <el-option :label="$t('merchant.ipWhitelist.approvalApproved')" :value="1" />
          <el-option :label="$t('merchant.ipWhitelist.approvalRejected')" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('merchant.ipWhitelist.submitSource')" prop="submitSource">
        <el-select v-model="query.submitSource" :placeholder="$t('common.pleaseSelect')" clearable>
          <el-option :label="$t('merchant.ipWhitelist.sourceAdmin')" value="ADMIN" />
          <el-option :label="$t('merchant.ipWhitelist.sourceMerchant')" value="MERCHANT" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('merchant.ipWhitelist.accessControl')" prop="ipWhitelistEnabled">
        <el-select v-model="query.ipWhitelistEnabled" :placeholder="$t('common.pleaseSelect')" clearable>
          <el-option :label="$t('common.enable')" :value="1" />
          <el-option :label="$t('common.disable')" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
        <el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain :icon="Plus" size="small" @click="openForm('add')" v-hasPermi="'merchant:ip-whitelist:add'">{{ $t('common.add') }}</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain :icon="Download" size="small" :loading="exporting" @click="handleExport" v-hasPermi="'merchant:ip-whitelist:export'">{{ $t('common.export') }}</el-button>
      </el-col>
      <el-col class="right-toolbar">
        <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" />
      </el-col>
    </el-row>

    <StandardTable table-key="merchant-ip-whitelist" v-loading="loading" :data="rows" row-key="merchantId" size="small">
      <el-table-column prop="merchantId" :label="$t('merchant.info.merchantId')" min-width="132" align="center" show-overflow-tooltip>
        <template #default="{ row }">{{ row.merchantId || '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('merchant.info.merchantName')" min-width="180" align="center" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.merchantName || row.merchantShortName || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="IP" min-width="420" align="center">
        <template #default="{ row }">
          <div v-if="ipItems(row).length" class="ip-pill-list">
            <div v-for="item in ipItems(row)" :key="item.id || item.ipValue" class="ip-pill" :class="[item.ipType === 'IPv6' ? 'is-ipv6' : 'is-ipv4', item.status === 1 ? '' : 'is-disabled']">
              <span>{{ ipTypeLabel(item.ipType) }}</span>
              <code>{{ item.ipValue || '-' }}</code>
              <el-tag class="ip-pill__approval" size="small" :type="approvalTagType(item.approvalStatus)" effect="plain">{{ approvalStatusText(item.approvalStatus) }}</el-tag>
              <el-dropdown v-if="hasIpMenuActions(item)" trigger="click" @command="(command: string) => handleIpCommand(command, row, item)">
                <button class="ip-pill-action" type="button" @click.stop>
                  <el-icon><MoreFilled /></el-icon>
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="canIpAction('detail')" command="detail">{{ $t('common.detail') }}</el-dropdown-item>
                    <el-dropdown-item v-if="item.approvalStatus === 0 && canIpAction('approve')" command="approve">{{ $t('merchant.ipWhitelist.approve') }}</el-dropdown-item>
                    <el-dropdown-item v-if="canIpAction('edit')" command="edit">{{ $t('common.edit') }}</el-dropdown-item>
                    <el-dropdown-item v-if="item.approvalStatus === 1 && canIpAction('status')" command="status">{{ item.status === 1 ? $t('common.disable') : $t('common.enable') }}</el-dropdown-item>
                    <el-dropdown-item v-if="canIpAction('remove')" command="delete" divided>{{ $t('common.delete') }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('merchant.ipWhitelist.accessControl')" width="120" align="center">
        <template #default="{ row }">
          <el-switch
            :model-value="row.ipWhitelistEnabled"
            :active-value="1"
            :inactive-value="0"
            :disabled="!row.merchantId"
            @change="toggleConfig(row)"
            v-hasPermi="'merchant:ip-whitelist:config'"
          />
        </template>
      </el-table-column>
      <el-table-column :label="$t('merchant.ipWhitelist.transactionStatus')" width="112" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="hasDisabledIp(row) ? 'warning' : 'success'" effect="plain">{{ ipStatusSummary(row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('merchant.ipWhitelist.approvalStatus')" width="126" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="approvalSummaryType(row)" effect="plain">{{ approvalSummary(row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" :label="$t('common.remark')" min-width="180" align="center" show-overflow-tooltip />
      <el-table-column prop="updateBy" :label="$t('merchant.ipWhitelist.updateBy')" width="110" align="center" show-overflow-tooltip />
      <el-table-column :label="$t('common.updateTime')" min-width="170" align="center">
        <template #default="{ row }"><BaseDateTime :value="row.gmtModified" /></template>
      </el-table-column>
      <el-table-column :label="$t('common.operation')" align="center" width="210" class-name="small-padding fixed-width" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link :icon="Edit" @click="openManageDrawer(row)" v-hasPermi="'merchant:ip-whitelist:edit'">{{ $t('merchant.ipWhitelist.manage') }}</el-button>
        </template>
      </el-table-column>
    </StandardTable>

    <div class="pagination-container" v-show="total > 0">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
    </div>

    <el-drawer :title="formMode === 'add' ? $t('merchant.ipWhitelist.addTitle') : $t('merchant.ipWhitelist.editTitle')" v-model="formVisible" size="min(720px, 92vw)" append-to-body destroy-on-close class="merchant-ip-form-drawer">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="112px" size="small" class="ip-form">
        <el-form-item :label="$t('merchant.ipWhitelist.merchant')" prop="merchantId">
          <el-select
            v-model="form.merchantId"
            filterable
            remote
            clearable
            :disabled="formMode === 'edit'"
            :remote-method="remoteSearchMerchants"
            :loading="merchantLoading"
            :placeholder="$t('merchant.ipWhitelist.merchantPlaceholder')"
            style="width:100%"
          >
            <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="formMode === 'add'" :label="$t('merchant.ipWhitelist.ipValues')" prop="ipText">
          <el-input v-model="form.ipText" type="textarea" :rows="8" :placeholder="$t('merchant.ipWhitelist.ipValuesPlaceholder')" />
        </el-form-item>
        <el-form-item v-else label="IP" prop="ipValue">
          <el-input v-model.trim="form.ipValue" placeholder="203.0.113.10" />
        </el-form-item>
        <el-form-item :label="$t('merchant.ipWhitelist.transactionStatus')" prop="status">
          <el-select v-model="form.status" style="width:100%">
            <el-option :label="$t('common.enable')" :value="1" />
            <el-option :label="$t('common.disable')" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('common.remark')" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="512" show-word-limit :placeholder="$t('common.pleaseInput')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="saving" @click="submitForm">{{ $t('common.confirm') }}</el-button>
          <el-button @click="formVisible = false">{{ $t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-drawer>

    <el-drawer v-model="manageVisible" size="min(1080px, 96vw)" append-to-body destroy-on-close class="merchant-ip-manage-drawer" @closed="resetManageDrawer">
      <template #header>
        <div class="ip-manage__header">
          <el-tooltip v-if="manageView === 'approval'" :content="$t('common.back')" placement="bottom">
            <el-button class="ip-manage__back" :icon="ArrowLeft" circle @click="returnToManage" :aria-label="$t('common.back')" />
          </el-tooltip>
          <span class="ip-manage__title">
            {{ manageView === 'approval' ? $t('merchant.ipWhitelist.approvalTitle') : $t('merchant.ipWhitelist.manageTitle') }}
          </span>
          <el-tag v-if="manageView === 'approval' && approvalTarget" type="warning" effect="plain" size="small">
            {{ approvalStatusText(approvalTarget.item.approvalStatus) }}
          </el-tag>
        </div>
      </template>

      <div v-if="manageRow && manageView === 'list'" class="ip-manage">
        <div class="ip-manage__merchant">
          <div class="ip-manage__merchant-label">{{ $t('merchant.ipWhitelist.currentMerchant') }}</div>
          <div class="ip-manage__merchant-value">
            <strong>{{ manageRow.merchantId }}</strong>
            <span>{{ manageRow.merchantName || manageRow.merchantShortName || '-' }}</span>
          </div>
          <el-tag size="small" effect="plain">{{ $t('merchant.ipWhitelist.ipCount', { count: ipItems(manageRow).length }) }}</el-tag>
        </div>
        <div class="ip-manage__toolbar">
          <el-button type="primary" plain :icon="Plus" size="small" @click="openMerchantIpAddForm" v-hasPermi="'merchant:ip-whitelist:add'">{{ $t('merchant.ipWhitelist.addIp') }}</el-button>
        </div>
        <el-empty v-if="!ipItems(manageRow).length" :description="$t('merchant.ipWhitelist.emptyIp')" />
        <el-table v-else :data="ipItems(manageRow)" row-key="id" border size="small" class="ip-manage__table">
          <el-table-column :label="$t('merchant.ipWhitelist.ipAddress')" min-width="230">
            <template #default="{ row: item }">
              <div class="ip-manage__ip">
                <el-tag size="small" effect="plain">{{ ipTypeLabel(item.ipType) }}</el-tag>
                <code>{{ item.ipValue || '-' }}</code>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('merchant.ipWhitelist.submitSource')" width="112" align="center">
            <template #default="{ row: item }">{{ submitSourceText(item.submitSource) }}</template>
          </el-table-column>
          <el-table-column :label="$t('merchant.ipWhitelist.approvalStatus')" width="112" align="center">
            <template #default="{ row: item }">
              <el-tag size="small" :type="approvalTagType(item.approvalStatus)" effect="plain">{{ approvalStatusText(item.approvalStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('merchant.ipWhitelist.transactionStatus')" width="112" align="center">
            <template #default="{ row: item }">
              <el-tag size="small" :type="item.status === 1 ? 'success' : 'info'" effect="plain">{{ transactionStatusText(item.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" :label="$t('common.remark')" min-width="150" show-overflow-tooltip>
            <template #default="{ row: item }">{{ item.remark || '-' }}</template>
          </el-table-column>
          <el-table-column :label="$t('common.updateTime')" width="172" align="center">
            <template #default="{ row: item }"><BaseDateTime :value="item.gmtModified" /></template>
          </el-table-column>
          <el-table-column :label="$t('common.operation')" width="238" align="center" fixed="right">
            <template #default="{ row: item }">
              <div class="ip-manage__actions">
                <el-button v-if="item.approvalStatus === 0 && canIpAction('approve')" size="small" type="primary" link :icon="CircleCheck" @click="openApproval(manageRow, item)">{{ $t('merchant.ipWhitelist.approve') }}</el-button>
                <el-button v-if="item.approvalStatus === 1 && canIpAction('status')" size="small" type="primary" link @click="toggleStatus(manageRow, item)">{{ item.status === 1 ? $t('common.disable') : $t('common.enable') }}</el-button>
                <el-button v-if="canIpAction('detail')" size="small" type="primary" link :icon="View" @click="openDetail(manageRow, item)">{{ $t('common.detail') }}</el-button>
                <el-dropdown v-if="canIpAction('edit') || canIpAction('remove')" trigger="click" @command="(command: string) => handleManageCommand(command, item)">
                  <el-button class="ip-manage__more" size="small" link :icon="MoreFilled" :aria-label="$t('merchant.ipWhitelist.moreActions')" @click.stop />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-if="canIpAction('edit')" command="edit">{{ $t('common.edit') }}</el-dropdown-item>
                      <el-dropdown-item v-if="canIpAction('remove')" command="delete" divided>{{ $t('common.delete') }}</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else-if="approvalTarget" class="approval-workspace">
        <div class="approval-workspace__body">
          <div class="approval-workspace__content">
            <section class="approval-section" aria-labelledby="approval-request-title">
              <h3 id="approval-request-title" class="approval-section__title">{{ $t('merchant.ipWhitelist.requestInformation') }}</h3>
              <dl class="approval-facts">
                <div class="approval-fact">
                  <dt>{{ $t('merchant.ipWhitelist.merchantId') }}</dt>
                  <dd class="approval-fact__primary">{{ approvalTarget.merchantId }}</dd>
                </div>
                <div class="approval-fact">
                  <dt>{{ $t('merchant.info.merchantName') }}</dt>
                  <dd>{{ approvalTarget.merchantName || '-' }}</dd>
                </div>
                <div class="approval-fact">
                  <dt>{{ $t('merchant.ipWhitelist.ipAddress') }}</dt>
                  <dd class="approval-fact__ip">
                    <el-tag size="small" effect="plain">{{ ipTypeLabel(approvalTarget.item.ipType) }}</el-tag>
                    <code>{{ approvalTarget.item.ipValue || '-' }}</code>
                  </dd>
                </div>
                <div class="approval-fact">
                  <dt>{{ $t('merchant.ipWhitelist.submitSource') }}</dt>
                  <dd>{{ submitSourceText(approvalTarget.item.submitSource) }}</dd>
                </div>
                <div class="approval-fact approval-fact--wide">
                  <dt>{{ $t('merchant.ipWhitelist.requestRemark') }}</dt>
                  <dd class="approval-fact__remark">{{ approvalTarget.item.remark || '-' }}</dd>
                </div>
              </dl>
            </section>

            <section class="approval-section approval-section--decision" aria-labelledby="approval-decision-title">
              <h3 id="approval-decision-title" class="approval-section__title">{{ $t('merchant.ipWhitelist.reviewDecision') }}</h3>
              <el-form ref="approvalFormRef" :model="approvalForm" :rules="approvalRules" label-position="left" label-width="112px" size="small" class="approval-form">
                <el-form-item :label="$t('merchant.ipWhitelist.approvalResult')" prop="approvalStatus">
                  <el-radio-group v-model="approvalForm.approvalStatus" class="approval-choice approval-choice--result" :class="{ 'is-negative': approvalForm.approvalStatus === 2 }" @change="handleApprovalResultChange">
                    <el-radio-button :value="1">{{ $t('merchant.ipWhitelist.approvalApproved') }}</el-radio-button>
                    <el-radio-button :value="2">{{ $t('merchant.ipWhitelist.approvalRejected') }}</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <el-form-item v-if="approvalForm.approvalStatus === 1" :label="$t('merchant.ipWhitelist.transactionStatus')" prop="status">
                  <el-radio-group v-model="approvalForm.status" class="approval-choice approval-choice--status" :class="{ 'is-negative': approvalForm.status === 0 }">
                    <el-radio-button :value="1">{{ $t('merchant.ipWhitelist.transactionAllowed') }}</el-radio-button>
                    <el-radio-button :value="0">{{ $t('merchant.ipWhitelist.transactionProhibited') }}</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <el-form-item :label="$t('merchant.ipWhitelist.approvalRemark')" prop="approvalRemark" :required="approvalForm.approvalStatus === 2">
                  <el-input v-model.trim="approvalForm.approvalRemark" type="textarea" :rows="5" maxlength="500" show-word-limit :placeholder="$t('merchant.ipWhitelist.approvalRemarkPlaceholder')" />
                </el-form-item>
              </el-form>
            </section>
          </div>
        </div>
        <div class="approval-workspace__footer">
          <el-button :disabled="approvalSaving" @click="returnToManage">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="approvalSaving" @click="submitApproval">{{ $t('merchant.ipWhitelist.confirmApproval') }}</el-button>
        </div>
      </div>
    </el-drawer>

    <CommonDetailDrawer v-model:visible="detailVisible" :title="$t('merchant.ipWhitelist.detailTitle')" size="lg" :loading="detailLoading">
      <el-descriptions v-if="detail" :column="2" border size="small">
        <el-descriptions-item :label="$t('merchant.info.merchantId')">{{ detail.merchantId || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('merchant.info.merchantName')">{{ detail.merchantName || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('merchant.ipWhitelist.ipType')">{{ detail.ipType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ detail.ipValue || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('merchant.ipWhitelist.accessControl')">
          <el-tag size="small" :type="detail.ipWhitelistEnabled === 1 ? 'success' : 'info'">{{ detail.ipWhitelistEnabled === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('merchant.ipWhitelist.transactionStatus')">
          <el-tag size="small" :type="detail.status === 1 ? 'success' : 'danger'">{{ transactionStatusText(detail.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('merchant.ipWhitelist.approvalStatus')"><el-tag size="small" :type="approvalTagType(detail.approvalStatus)">{{ approvalStatusText(detail.approvalStatus) }}</el-tag></el-descriptions-item>
        <el-descriptions-item :label="$t('merchant.ipWhitelist.submitSource')">{{ submitSourceText(detail.submitSource) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('merchant.ipWhitelist.approvalRemark')" :span="2">{{ detail.approvalRemark || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('merchant.ipWhitelist.reviewBy')">{{ detail.reviewBy || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('merchant.ipWhitelist.reviewTime')"><BaseDateTime :value="detail.reviewTime" /></el-descriptions-item>
        <el-descriptions-item :label="$t('common.remark')" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('merchant.ipWhitelist.configRemark')" :span="2">{{ detail.configRemark || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('common.createTime')"><BaseDateTime :value="detail.gmtCreate" /></el-descriptions-item>
        <el-descriptions-item :label="$t('common.updateTime')"><BaseDateTime :value="detail.gmtModified" /></el-descriptions-item>
      </el-descriptions>
    </CommonDetailDrawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { ArrowLeft, CircleCheck, Download, Edit, MoreFilled, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import { searchMerchants, type MerchantInfo } from '@/api/merchant/info';
import {
  approveMerchantIpWhitelist,
  createMerchantIpWhitelists,
  deleteMerchantIpWhitelist,
  exportMerchantIpWhitelists,
  getMerchantIpWhitelist,
  searchMerchantIpWhitelists,
  updateMerchantIpWhitelist,
  updateMerchantIpWhitelistConfig,
  updateMerchantIpWhitelistStatus,
  type MerchantIpWhitelistItem,
  type MerchantIpWhitelistQuery,
  type MerchantIpWhitelistRow,
} from '@/api/merchant/ip-whitelist';

const { t } = useI18n();
const userStore = useUserStore();
const queryFormRef = ref<FormInstance>();
const formRef = ref<FormInstance>();
const approvalFormRef = ref<FormInstance>();
const showSearch = ref(true);
const loading = ref(false);
const saving = ref(false);
const exporting = ref(false);
const rows = ref<MerchantIpWhitelistRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const query = reactive<MerchantIpWhitelistQuery>({ pageNo: 1, pageSize: 10 });
const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const merchantLoading = ref(false);
const merchantOptions = ref<MerchantInfo[]>([]);
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<MerchantIpWhitelistRow>();
const manageVisible = ref(false);
const manageRow = ref<MerchantIpWhitelistRow>();
const manageView = ref<'list' | 'approval'>('list');
const approvalSaving = ref(false);
const approvalTarget = ref<{
  merchantId: string;
  merchantName?: string;
  item: MerchantIpWhitelistItem;
}>();
const approvalForm = reactive({
  approvalStatus: 1 as 1 | 2,
  approvalRemark: '',
  status: 1,
});
const form = reactive({
  id: '',
  merchantId: '',
  ipText: '',
  ipValue: '',
  status: 1,
  remark: '',
});

const formRules: FormRules = {
  merchantId: [{ required: true, message: t('merchant.ipWhitelist.requiredMerchant'), trigger: 'change' }],
  ipText: [{ required: true, message: t('merchant.ipWhitelist.requiredIp'), trigger: 'blur' }],
  ipValue: [{ required: true, message: t('merchant.ipWhitelist.requiredIp'), trigger: 'blur' }],
};

const approvalRules: FormRules = {
  approvalRemark: [{
    validator: (_rule, value, callback) => {
      if (approvalForm.approvalStatus === 2 && !String(value || '').trim()) {
        callback(new Error(t('merchant.ipWhitelist.rejectionReasonRequired')));
        return;
      }
      callback();
    },
    trigger: 'blur',
  }],
};

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    const result = await searchMerchantIpWhitelists({ ...cleanQuery(query), pageNo: page.value, pageSize: pageSize.value });
    rows.value = result.records || [];
    total.value = result.total || 0;
    syncManageRow();
  } catch (error) {
    rows.value = [];
    total.value = 0;
    ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  if (page.value === 1) {
    loadData();
    return;
  }
  page.value = 1;
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  Object.keys(query).forEach((key) => delete query[key as keyof MerchantIpWhitelistQuery]);
  handleSearch();
}

function openForm(mode: 'add' | 'edit', row?: MerchantIpWhitelistRow) {
  const editable = firstIpItem(row);
  formMode.value = mode;
  Object.assign(form, {
    id: editable?.id || '',
    merchantId: row?.merchantId || '',
    ipText: '',
    ipValue: editable?.ipValue || '',
    status: editable?.status ?? 1,
    remark: editable?.remark || '',
  });
  if (row?.merchantId) {
    merchantOptions.value = [{
      id: '0',
      merchantId: row.merchantId,
      merchantName: row.merchantName || row.merchantShortName || row.merchantId,
      merchantStatus: 1,
      defaultLocale: 'zh-CN',
      merchantCategoryCode: '',
      countryCode: '',
      settlementCurrency: '',
      timezone: '',
      riskLevel: 2,
    }];
  }
  formVisible.value = true;
  setTimeout(() => formRef.value?.clearValidate(), 0);
}

function openManageDrawer(row: MerchantIpWhitelistRow) {
  manageRow.value = row;
  manageView.value = 'list';
  approvalTarget.value = undefined;
  manageVisible.value = true;
}

function openMerchantIpAddForm() {
  if (!manageRow.value) {
    return;
  }
  openForm('add', {
    ...manageRow.value,
    id: undefined,
    ipType: undefined,
    ipValue: undefined,
    status: 1,
    remark: '',
    ipWhitelists: undefined,
  });
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    if (formMode.value === 'add') {
      await createMerchantIpWhitelists({
        merchantId: form.merchantId,
        ipValues: parseIpText(form.ipText),
        status: form.status,
        remark: form.remark || undefined,
      });
    } else {
      await updateMerchantIpWhitelist(form.id, {
        ipValue: form.ipValue,
        status: form.status,
        remark: form.remark || undefined,
      });
    }
    ElMessage.success(t('common.saveSuccess'));
    formVisible.value = false;
    await loadData();
    syncManageRow();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
  } finally {
    saving.value = false;
  }
}

async function openDetail(row: MerchantIpWhitelistRow, item?: MerchantIpWhitelistItem) {
  const target = item || firstIpItem(row);
  if (!target?.id) return;
  detailVisible.value = true;
  detailLoading.value = true;
  detail.value = undefined;
  try {
    detail.value = await getMerchantIpWhitelist(target.id);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    detailVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
}

async function handleDelete(row: MerchantIpWhitelistRow) {
  const items = ipItems(row).filter((item): item is MerchantIpWhitelistItem => Boolean(item?.id));
  if (!items.length) {
    ElMessage.warning(t('common.pleaseSelect'));
    return;
  }
  try {
    await ElMessageBox.confirm(t('merchant.ipWhitelist.deleteConfirm', { name: items.map((item) => item.ipValue).join('、') }), t('common.delete'), { type: 'warning' });
  } catch {
    return;
  }
  try {
    await Promise.all(items.map((item) => deleteMerchantIpWhitelist(item.id!)));
    ElMessage.success(t('common.deleteSuccess'));
    await loadData();
    syncManageRow();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
  }
}

async function toggleStatus(row: MerchantIpWhitelistRow, item?: MerchantIpWhitelistItem) {
  const target = item || firstIpItem(row);
  if (!target?.id) return;
  if (target.approvalStatus !== 1) {
    ElMessage.warning(t('merchant.ipWhitelist.statusRequiresApproval'));
    return;
  }
  const nextStatus = target.status === 1 ? 0 : 1;
  try {
    await ElMessageBox.confirm(t('common.statusToggleConfirm', { action: nextStatus === 1 ? t('common.enable') : t('common.disable'), name: target.ipValue || target.id }), t('common.operationConfirm'), { type: nextStatus === 1 ? 'success' : 'warning' });
  } catch {
    return;
  }
  try {
    await updateMerchantIpWhitelistStatus(target.id, nextStatus);
    ElMessage.success(t('common.success'));
    await loadData();
    syncManageRow();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
  }
}

async function toggleConfig(row: MerchantIpWhitelistRow) {
  const nextStatus = row.ipWhitelistEnabled === 1 ? 0 : 1;
  let remark: string | undefined;
  try {
    const result = await ElMessageBox.prompt(t('merchant.ipWhitelist.configRemarkPrompt'), t('merchant.ipWhitelist.configConfirm', { action: nextStatus === 1 ? t('common.enable') : t('common.disable'), name: row.merchantId }), {
      type: nextStatus === 1 ? 'warning' : 'info',
      inputType: 'textarea',
      inputValue: row.configRemark || '',
      inputPlaceholder: t('merchant.ipWhitelist.configRemarkPlaceholder'),
    });
    remark = result.value;
  } catch {
    return;
  }
  try {
    await updateMerchantIpWhitelistConfig({ merchantId: row.merchantId, ipWhitelistEnabled: nextStatus, remark: remark || undefined });
    ElMessage.success(t('common.success'));
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    await exportMerchantIpWhitelists({ ...cleanQuery(query) });
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('common.exportFailed'));
  } finally {
    exporting.value = false;
  }
}

function handleIpCommand(command: string, row: MerchantIpWhitelistRow, item: MerchantIpWhitelistItem) {
  const target = toSingleIpRow(row, item);
  if (command === 'detail') {
    openDetail(target, item);
    return;
  }
  if (command === 'edit') {
    openForm('edit', target);
    return;
  }
  if (command === 'approve') {
    openApproval(row, item);
    return;
  }
  if (command === 'status') {
    toggleStatus(target, item);
    return;
  }
  if (command === 'delete') {
    handleDelete(target);
  }
}

function canIpAction(action: 'approve' | 'detail' | 'edit' | 'remove' | 'status') {
  return userStore.hasPermission(`merchant:ip-whitelist:${action}`);
}

function hasIpMenuActions(item: MerchantIpWhitelistItem) {
  return canIpAction('detail')
    || canIpAction('edit')
    || canIpAction('remove')
    || (item.approvalStatus === 0 && canIpAction('approve'))
    || (item.approvalStatus === 1 && canIpAction('status'));
}

function handleManageCommand(command: string, item: MerchantIpWhitelistItem) {
  const row = manageRow.value;
  if (!row) {
    return;
  }
  if (command === 'edit') {
    openForm('edit', toSingleIpRow(row, item));
    return;
  }
  if (command === 'delete') {
    handleDelete(toSingleIpRow(row, item));
  }
}

function openApproval(row: MerchantIpWhitelistRow, item: MerchantIpWhitelistItem) {
  manageRow.value = row;
  approvalTarget.value = {
    merchantId: row.merchantId,
    merchantName: row.merchantName || row.merchantShortName,
    item: { ...item },
  };
  Object.assign(approvalForm, { approvalStatus: 1, approvalRemark: '', status: 1 });
  manageView.value = 'approval';
  manageVisible.value = true;
  setTimeout(() => approvalFormRef.value?.clearValidate(), 0);
}

function returnToManage() {
  if (approvalSaving.value) {
    return;
  }
  closeApprovalView();
}

function closeApprovalView() {
  manageView.value = 'list';
  approvalTarget.value = undefined;
  approvalFormRef.value?.clearValidate();
}

function resetManageDrawer() {
  manageView.value = 'list';
  manageRow.value = undefined;
  approvalTarget.value = undefined;
  Object.assign(approvalForm, { approvalStatus: 1, approvalRemark: '', status: 1 });
}

function handleApprovalResultChange(value: string | number | boolean | undefined) {
  approvalForm.status = Number(value) === 1 ? 1 : 0;
  approvalFormRef.value?.clearValidate('approvalRemark');
}

async function submitApproval() {
  if (!approvalTarget.value?.item.id) {
    return;
  }
  const valid = await approvalFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  approvalSaving.value = true;
  try {
    await approveMerchantIpWhitelist(approvalTarget.value.item.id, {
      approvalStatus: approvalForm.approvalStatus,
      approvalRemark: approvalForm.approvalRemark || undefined,
      status: approvalForm.approvalStatus === 1 ? approvalForm.status : 0,
    });
    ElMessage.success(t('merchant.ipWhitelist.approvalSuccess'));
    await loadData();
    closeApprovalView();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
  } finally {
    approvalSaving.value = false;
  }
}

async function remoteSearchMerchants(keyword: string) {
  const text = keyword.trim();
  merchantLoading.value = true;
  try {
    const result = await searchMerchants({ pageNo: 1, pageSize: 20, keyword: text || undefined });
    merchantOptions.value = result.records || [];
  } finally {
    merchantLoading.value = false;
  }
}

function handleMerchantVisibleChange(visible: boolean) {
  if (visible && merchantOptions.value.length === 0) {
    remoteSearchMerchants('');
  }
}

function handleIpInput(value: string) {
  const nextType = detectIpType(value);
  if (nextType) {
    query.ipType = nextType;
  }
}

function detectIpType(value: string): 'IPv4' | 'IPv6' | undefined {
  const text = String(value || '').trim();
  if (!text) {
    return undefined;
  }
  if (text.includes(':')) {
    return 'IPv6';
  }
  if (/^\d{1,3}(\.\d{1,3}){0,3}$/.test(text)) {
    return 'IPv4';
  }
  return undefined;
}

function parseIpText(value: string) {
  return Array.from(new Set((value || '').split(/[\n,，;\s]+/).map((item) => item.trim()).filter(Boolean)));
}

function merchantOptionLabel(item: MerchantInfo) {
  return `${item.merchantId} / ${item.merchantName || item.merchantShortName || '-'}`;
}

function ipTypeLabel(value?: string) {
  if (value === 'IPv4') {
    return 'IPv4';
  }
  if (value === 'IPv6') {
    return 'IPv6';
  }
  return value || '-';
}

function ipItems(row?: MerchantIpWhitelistRow): MerchantIpWhitelistItem[] {
  if (!row) {
    return [];
  }
  if (row.ipWhitelists?.length) {
    return row.ipWhitelists;
  }
  if (row.id || row.ipValue) {
    return [{
      id: row.id,
      ipType: row.ipType,
      ipValue: row.ipValue,
      status: row.status,
      approvalStatus: row.approvalStatus,
      approvalRemark: row.approvalRemark,
      submitSource: row.submitSource,
      reviewBy: row.reviewBy,
      reviewTime: row.reviewTime,
      remark: row.remark,
      updateBy: row.updateBy,
      gmtModified: row.gmtModified,
    }];
  }
  return [];
}

function firstIpItem(row?: MerchantIpWhitelistRow) {
  return ipItems(row)[0];
}

function syncManageRow() {
  if (!manageRow.value?.merchantId) {
    return;
  }
  const refreshed = rows.value.find((row) => row.merchantId === manageRow.value?.merchantId);
  manageRow.value = refreshed || { ...manageRow.value, ipWhitelists: [], id: undefined, ipType: undefined, ipValue: undefined, remark: undefined, status: undefined };
}

function toSingleIpRow(row: MerchantIpWhitelistRow, item: MerchantIpWhitelistItem): MerchantIpWhitelistRow {
  return {
    ...row,
    id: item.id,
    ipType: item.ipType,
    ipValue: item.ipValue,
    status: item.status,
    approvalStatus: item.approvalStatus,
    approvalRemark: item.approvalRemark,
    submitSource: item.submitSource,
    reviewBy: item.reviewBy,
    reviewTime: item.reviewTime,
    remark: item.remark,
    updateBy: item.updateBy,
    gmtModified: item.gmtModified,
    ipWhitelists: undefined,
  };
}

function hasDisabledIp(row: MerchantIpWhitelistRow) {
  return ipItems(row).some((item) => item.status !== 1);
}

function ipStatusSummary(row: MerchantIpWhitelistRow) {
  const items = ipItems(row);
  const enabled = items.filter((item) => item.status === 1).length;
  if (!items.length || enabled === items.length) {
    return t('merchant.ipWhitelist.transactionAllowed');
  }
  if (enabled === 0) {
    return t('merchant.ipWhitelist.transactionProhibited');
  }
  return `${enabled}/${items.length}`;
}

function approvalStatusText(status?: number) {
  if (status === 0) return t('merchant.ipWhitelist.approvalPending');
  if (status === 1) return t('merchant.ipWhitelist.approvalApproved');
  if (status === 2) return t('merchant.ipWhitelist.approvalRejected');
  return '-';
}

function approvalTagType(status?: number): 'warning' | 'success' | 'danger' | 'info' {
  if (status === 0) return 'warning';
  if (status === 1) return 'success';
  if (status === 2) return 'danger';
  return 'info';
}

function approvalSummary(row: MerchantIpWhitelistRow) {
  const items = ipItems(row);
  const pending = items.filter((item) => item.approvalStatus === 0).length;
  const rejected = items.filter((item) => item.approvalStatus === 2).length;
  if (pending) return t('merchant.ipWhitelist.approvalSummaryPending', { count: pending });
  if (rejected) return t('merchant.ipWhitelist.approvalSummaryRejected', { count: rejected });
  return t('merchant.ipWhitelist.approvalApproved');
}

function approvalSummaryType(row: MerchantIpWhitelistRow): 'warning' | 'success' | 'danger' | 'info' {
  const items = ipItems(row);
  if (items.some((item) => item.approvalStatus === 0)) return 'warning';
  if (items.some((item) => item.approvalStatus === 2)) return 'danger';
  return items.length ? 'success' : 'info';
}

function transactionStatusText(status?: number) {
  return status === 1 ? t('merchant.ipWhitelist.transactionAllowed') : t('merchant.ipWhitelist.transactionProhibited');
}

function submitSourceText(source?: string) {
  if (source === 'ADMIN') return t('merchant.ipWhitelist.sourceAdmin');
  if (source === 'MERCHANT') return t('merchant.ipWhitelist.sourceMerchant');
  return source || '-';
}

function cleanQuery(source: MerchantIpWhitelistQuery) {
  const result: MerchantIpWhitelistQuery = {};
  Object.entries(source).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      result[key as keyof MerchantIpWhitelistQuery] = value as never;
    }
  });
  return result;
}
</script>

<style scoped>
.query-merchant-select {
  width: 240px;
}

.ip-query-control {
  display: inline-flex;
  align-items: center;
  width: 306px;
  height: 28px;
}

.ip-type-select {
  width: 86px;
  flex: 0 0 86px;
}

.ip-address-input {
  width: 220px;
  flex: 0 0 220px;
}

.ip-type-select :deep(.el-select__wrapper) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.ip-address-input :deep(.el-input__wrapper) {
  margin-left: -1px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.ip-pill-list {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 3px 0;
}

.ip-pill {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid #cfe2ff;
  border-radius: 6px;
  background: #f8fbff;
  box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.08);
  line-height: 1;
  vertical-align: middle;
}

.ip-pill > span:not(.ip-pill__approval) {
  flex: 0 0 auto;
  padding: 5px 9px;
  border-right: 1px solid #cfe2ff;
  background: #edf5ff;
  color: #1165ff;
  font-size: 12px;
  line-height: 16px;
}

.ip-pill .ip-pill__approval {
  flex: 0 0 auto;
  margin-right: 6px;
  padding: 0 6px;
  border-right: 1px solid var(--el-border-color-light);
  background: transparent;
  font-size: 11px;
}

.ip-pill code {
  overflow: hidden;
  min-width: 0;
  padding: 5px 10px;
  color: #1f2d3d;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-pill-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  align-self: stretch;
  border: 0;
  border-left: 1px solid #cfe2ff;
  background: transparent;
  color: #6a8db8;
  cursor: pointer;
}

.ip-pill-action:hover {
  background: #edf5ff;
  color: #1165ff;
}

.ip-pill.is-disabled {
  opacity: 0.62;
}

.ip-pill.is-ipv6 {
  border-color: #dcd7ff;
  background: #fbfaff;
  box-shadow: inset 0 0 0 1px rgba(103, 69, 168, 0.08);
}

.ip-pill.is-ipv6 > span:not(.ip-pill__approval) {
  border-right-color: #dcd7ff;
  background: #f1efff;
  color: #6745d8;
}

.ip-pill.is-ipv6 code {
  color: #1f2d3d;
}

.ip-pill.is-ipv6 .ip-pill-action {
  border-left-color: #dcd7ff;
  color: #7d6cc0;
}

.ip-pill.is-ipv6 .ip-pill-action:hover {
  background: #f1efff;
  color: #6745d8;
}

.ip-form {
  padding: 0 18px 12px;
}

:global(.merchant-ip-manage-drawer .el-drawer__body) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.ip-manage__header {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
}

.ip-manage__back {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
}

.ip-manage__title {
  overflow: hidden;
  min-width: 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-manage {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 20px 20px;
}

.ip-manage__merchant {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 13px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.ip-manage__merchant-label {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.ip-manage__merchant-value {
  display: flex;
  align-items: baseline;
  min-width: 0;
  gap: 10px;
}

.ip-manage__merchant-value strong {
  flex: 0 0 auto;
  color: var(--el-color-primary);
  font-weight: 600;
}

.ip-manage__merchant-value span {
  overflow: hidden;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-manage__toolbar {
  display: flex;
  justify-content: flex-end;
  margin: 12px 0;
}

.ip-manage__table {
  width: 100%;
}

.ip-manage__ip {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.ip-manage__ip code {
  overflow: hidden;
  min-width: 0;
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-manage__actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  gap: 6px;
  white-space: nowrap;
}

.ip-manage__more {
  width: 28px;
  min-width: 28px;
  padding: 0;
}

.approval-workspace {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  background: var(--el-bg-color);
}

.approval-workspace__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 24px clamp(24px, 5vw, 56px) 32px;
}

.approval-workspace__content {
  width: min(760px, 100%);
  margin: 0 auto;
}

.approval-section + .approval-section {
  margin-top: 32px;
}

.approval-section__title {
  margin: 0 0 18px;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: 0;
}

.approval-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 40px;
  margin: 0;
}

.approval-fact {
  min-width: 0;
  padding: 0;
}

.approval-fact--wide {
  grid-column: 1 / -1;
}

.approval-fact dt {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.approval-fact dd {
  margin: 6px 0 0;
  overflow-wrap: anywhere;
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 20px;
}

.approval-fact__primary {
  color: var(--el-color-primary) !important;
  font-weight: 600;
}

.approval-fact__ip {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.approval-fact__ip code {
  overflow-wrap: anywhere;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

.approval-fact__remark {
  white-space: pre-wrap;
}

.approval-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.approval-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.approval-form :deep(.el-form-item__label) {
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.approval-choice {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(124px, 1fr));
}

.approval-choice :deep(.el-radio-button) {
  width: 100%;
}

.approval-choice :deep(.el-radio-button__inner) {
  width: 100%;
  min-width: 124px;
  padding: 7px 20px;
  letter-spacing: 0;
}

.approval-choice--result.is-negative :deep(.el-radio-button:last-child .el-radio-button__inner),
.approval-choice--status.is-negative :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-color: var(--el-color-danger);
  background: var(--el-color-danger);
  box-shadow: -1px 0 0 0 var(--el-color-danger);
  color: var(--el-color-white);
}

.approval-workspace__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 64px;
  gap: 10px;
  padding: 12px 24px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.approval-workspace__footer :deep(.el-button) {
  min-width: 96px;
}

@media (max-width: 760px) {
  .ip-manage__header {
    gap: 8px;
  }

  .ip-manage__title {
    white-space: normal;
  }

  .ip-manage {
    padding: 0 10px 16px;
  }

  .ip-manage__merchant {
    grid-template-columns: 1fr;
    align-items: flex-start;
    gap: 8px;
  }

  .ip-manage__merchant-value {
    flex-direction: column;
    gap: 4px;
  }

  .approval-workspace__body {
    padding: 18px 16px 24px;
  }

  .approval-facts {
    grid-template-columns: 1fr;
  }

  .approval-fact--wide {
    grid-column: auto;
  }

  .approval-form :deep(.el-form-item) {
    display: block;
  }

  .approval-form :deep(.el-form-item__label) {
    display: block;
    justify-content: flex-start;
    width: 100% !important;
    height: auto;
    margin-bottom: 8px;
    padding: 0;
    line-height: 20px;
  }

  .approval-form :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }

  .approval-choice {
    width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .approval-choice :deep(.el-radio-button__inner) {
    min-width: 0;
    padding-right: 10px;
    padding-left: 10px;
  }

  .approval-workspace__footer {
    padding-right: 16px;
    padding-left: 16px;
  }
}
</style>
