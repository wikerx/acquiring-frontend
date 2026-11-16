<template>
    <div class="app-container">
        <el-form
            :model="query"
            :inline="true"
            size="small"
            v-show="showSearch"
            class="search-form"
            label-width="auto"
            @submit.prevent
        >
            <el-form-item :label="$t('common.keyword')">
                <el-input
                    v-model="query.keyword"
                    class="search-control"
                    clearable
                    :placeholder="$t('system.fileTemplate.keywordPlaceholder')"
                    @keyup.enter="handleSearch"
                />
            </el-form-item>
            <el-form-item :label="$t('system.fileTemplate.ownerSystem')">
                <el-select v-model="query.ownerSystem" class="search-control" clearable :placeholder="$t('common.pleaseSelect')">
                    <el-option v-for="item in ownerOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('common.status')">
                <el-select v-model="query.status" class="search-control" clearable :placeholder="$t('common.pleaseSelect')">
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
                <el-button type="primary" plain :icon="Plus" size="small" @click="openCreate" v-hasPermi="'system:file-template:add'">
                    {{ $t('system.fileTemplate.addTemplate') }}
                </el-button>
            </el-col>
            <el-col class="right-toolbar">
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" />
            </el-col>
        </el-row>

        <StandardTable
            table-key="system-file-template-center"
            v-loading="loading"
            :data="rows"
            row-key="id"
            size="small"
            class="template-table"
        >
                <el-table-column :label="$t('system.fileTemplate.templateName')" min-width="280" fixed="left">
                    <template #default="{ row }">
                        <button class="template-name" type="button" @click="openDetail(row)">
                            <FileTypeIcon :extension="row.fileExtension" />
                            <span class="template-name__content">
                                <strong :title="displayName(row)">{{ displayName(row) }}</strong>
                                <small :title="row.templateCode">{{ row.templateCode }}</small>
                            </span>
                        </button>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('system.fileTemplate.scope')" min-width="180">
                    <template #default="{ row }">
                        <el-tag size="small" effect="plain" :type="ownerTagType(row.ownerSystem)">
                            {{ ownerLabel(row.ownerSystem) }}
                        </el-tag>
                        <span class="scope-separator">/</span>
                        <span class="scope-module" :title="row.moduleCode">{{ moduleLabel(row.moduleCode) }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('system.fileTemplate.currentVersion')" width="140" align="center">
                    <template #default="{ row }">
                        <span v-if="row.currentVersionNo" class="version-pill">v{{ row.currentVersionNo }}</span>
                        <span v-else class="cell-muted">{{ $t('system.fileTemplate.notPublished') }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('system.fileTemplate.downloadFilename')" min-width="260">
                    <template #default="{ row }">
                        <div class="filename-line" :title="`${row.nameZh}.${row.fileExtension}`">{{ row.nameZh }}.{{ row.fileExtension }}</div>
                        <div class="cell-secondary filename-line" :title="`${row.nameEn}.${row.fileExtension}`">{{ row.nameEn }}.{{ row.fileExtension }}</div>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('common.status')" width="100" align="center">
                    <template #default="{ row }">
                        <el-tag size="small" round effect="light" :type="row.status === 1 ? 'success' : 'info'">
                            <span class="status-dot" />
                            {{ row.status === 1 ? $t('common.enable') : $t('common.disable') }}
                        </el-tag>
                    </template>
                </el-table-column>
            <el-table-column :label="$t('system.fileTemplate.lastOperation')" min-width="180" align="center">
                    <template #default="{ row }">
                        <div>{{ row.updateBy || '-' }}</div>
                        <div class="cell-secondary"><BaseDateTime :value="row.updateTime" /></div>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('common.operation')" width="284" fixed="right" align="center">
                    <template #default="{ row }">
                        <el-button type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'system:file-template:detail'">
                            {{ $t('common.detail') }}
                        </el-button>
                        <el-button type="primary" link :icon="Upload" @click="openUpload(row)" v-hasPermi="'system:file-template:upload'">
                            {{ $t('system.fileTemplate.uploadVersion') }}
                        </el-button>
                        <el-dropdown v-if="canShowMore" trigger="click">
                            <el-button type="primary" link class="more-button">
                                {{ $t('common.more') }}<el-icon><ArrowDown /></el-icon>
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item
                                        v-if="user.hasPermission('system:file-template:edit')"
                                        :icon="Edit"
                                        @click="openEdit(row)"
                                    >
                                        {{ $t('common.edit') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="user.hasPermission('system:file-template:download')"
                                        :icon="Download"
                                        :disabled="!row.currentVersionId"
                                        @click="downloadTemplate(row)"
                                    >
                                        {{ $t('common.download') }}
                                    </el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </template>
                </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination
                v-model:current-page="page"
                v-model:page-size="pageSize"
                :total="total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                background
                @size-change="loadData"
                @current-change="loadData"
            />
        </div>

        <el-dialog
            v-model="definitionDialogVisible"
            :title="definitionMode === 'create' ? $t('system.fileTemplate.addTemplate') : $t('system.fileTemplate.editTemplate')"
            width="min(880px, 94vw)"
            append-to-body
            destroy-on-close
            class="app-form-dialog template-center-dialog"
            :close-on-click-modal="!definitionSaving"
        >
            <el-alert type="info" :closable="false" show-icon class="dialog-alert dialog-alert--compact">
                <template #title>
                    {{ $t(definitionMode === 'create' ? 'system.fileTemplate.createRule' : 'system.fileTemplate.filenameRule') }}
                </template>
            </el-alert>
            <el-form ref="definitionFormRef" :model="definitionForm" :rules="definitionRules" label-width="132px" class="definition-form">
                <div class="definition-grid">
                    <el-form-item v-if="definitionMode === 'edit'" :label="$t('system.fileTemplate.templateCode')">
                        <div class="readonly-field" :title="definitionForm.templateCode">{{ definitionForm.templateCode }}</div>
                    </el-form-item>
                    <el-form-item v-if="definitionMode === 'edit'" :label="$t('common.status')">
                        <el-radio-group v-model="definitionForm.status">
                            <el-radio :value="1">{{ $t('common.enable') }}</el-radio>
                            <el-radio :value="0">{{ $t('common.disable') }}</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item :label="$t('system.fileTemplate.ownerSystem')" prop="ownerSystem">
                        <el-select
                            v-model="definitionForm.ownerSystem"
                            :loading="formOptionsLoading"
                            style="width: 100%"
                            @change="handleOwnerSystemChange"
                        >
                            <el-option v-for="item in ownerOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="$t('system.fileTemplate.moduleCode')" prop="moduleCode">
                        <el-select
                            v-model="definitionForm.moduleCode"
                            :loading="formOptionsLoading"
                            :placeholder="$t('system.fileTemplate.modulePlaceholder')"
                            filterable
                            style="width: 100%"
                        >
                            <el-option
                                v-for="item in availableModuleOptions"
                                :key="item.code"
                                :label="moduleOptionLabel(item)"
                                :value="item.code"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="$t('system.fileTemplate.fileExtension')" prop="fileExtension">
                        <el-select v-if="definitionMode === 'create'" v-model="definitionForm.fileExtension" style="width: 100%">
                            <el-option v-for="extension in extensions" :key="extension" :label="extension.toUpperCase()" :value="extension" />
                        </el-select>
                        <div v-else class="readonly-field">{{ definitionForm.fileExtension.toUpperCase() }}</div>
                    </el-form-item>
                    <div v-if="definitionMode === 'create'" class="definition-grid__spacer" aria-hidden="true" />
                    <el-form-item :label="$t('system.fileTemplate.nameZh')" prop="nameZh">
                        <el-input v-model="definitionForm.nameZh" maxlength="128">
                            <template #append>.{{ definitionForm.fileExtension }}</template>
                        </el-input>
                    </el-form-item>
                    <el-form-item :label="$t('system.fileTemplate.nameEn')" prop="nameEn">
                        <el-input v-model="definitionForm.nameEn" maxlength="128">
                            <template #append>.{{ definitionForm.fileExtension }}</template>
                        </el-input>
                    </el-form-item>
                    <el-form-item :label="$t('system.fileTemplate.adminPermission')" prop="adminPermissionCode">
                        <el-select
                            v-model="definitionForm.adminPermissionCode"
                            :disabled="definitionForm.ownerSystem === 'MERCHANT'"
                            :loading="formOptionsLoading"
                            :placeholder="$t('system.fileTemplate.permissionPlaceholder')"
                            clearable
                            filterable
                            style="width: 100%"
                        >
                            <el-option
                                v-for="item in adminPermissionOptions"
                                :key="item.code"
                                :label="permissionOptionLabel(item)"
                                :value="item.code"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="$t('system.fileTemplate.merchantPermission')" prop="merchantPermissionCode">
                        <el-select
                            v-model="definitionForm.merchantPermissionCode"
                            :disabled="definitionForm.ownerSystem === 'ADMIN'"
                            :loading="formOptionsLoading"
                            :placeholder="$t('system.fileTemplate.permissionPlaceholder')"
                            clearable
                            filterable
                            style="width: 100%"
                        >
                            <el-option
                                v-for="item in merchantPermissionOptions"
                                :key="item.code"
                                :label="permissionOptionLabel(item)"
                                :value="item.code"
                            />
                        </el-select>
                    </el-form-item>
                </div>
                <el-form-item :label="$t('common.remark')" prop="remark">
                    <el-input v-model="definitionForm.remark" type="textarea" :rows="3" maxlength="500" show-word-limit />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="definitionSaving" @click="saveDefinition">{{ $t('common.confirm') }}</el-button>
                    <el-button :disabled="definitionSaving" @click="definitionDialogVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog
            v-model="uploadDialogVisible"
            :title="$t('system.fileTemplate.uploadVersionTitle', { name: activeTemplate ? displayName(activeTemplate) : '' })"
            width="min(820px, 94vw)"
            append-to-body
            destroy-on-close
            class="app-form-dialog template-center-dialog template-upload-dialog"
            :close-on-click-modal="!uploadSaving"
        >
            <el-alert type="warning" :closable="false" show-icon class="dialog-alert">
                <template #title>{{ $t('system.fileTemplate.immutableVersionHint') }}</template>
            </el-alert>
            <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="128px">
                <div class="definition-grid">
                    <el-form-item :label="$t('system.fileTemplate.versionNo')" prop="versionNo">
                        <el-input-number v-model="uploadForm.versionNo" :min="1" :step="1" step-strictly controls-position="right" style="width: 100%" />
                    </el-form-item>
                    <el-form-item :label="$t('system.fileTemplate.schemaVersion')">
                        <el-input v-model="uploadForm.schemaVersion" maxlength="64" placeholder="2026.11" />
                    </el-form-item>
                </div>
                <el-form-item :label="$t('system.fileTemplate.releaseNote')">
                    <el-input v-model="uploadForm.releaseNote" type="textarea" :rows="3" maxlength="500" show-word-limit />
                </el-form-item>
                <div class="upload-grid">
                    <div class="locale-upload">
                        <div class="locale-upload__title"><span>中</span>{{ $t('system.fileTemplate.zhFile') }}</div>
                        <el-upload
                            action="#"
                            :auto-upload="false"
                            :limit="1"
                            :show-file-list="true"
                            :on-change="setZhUploadFile"
                            :on-remove="() => setUploadFile('zh-CN')"
                            drag
                        >
                            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                            <div class="el-upload__text">{{ $t('system.fileTemplate.dropFile') }}</div>
                        </el-upload>
                    </div>
                    <div class="locale-upload">
                        <div class="locale-upload__title"><span>EN</span>{{ $t('system.fileTemplate.enFile') }}</div>
                        <el-upload
                            action="#"
                            :auto-upload="false"
                            :limit="1"
                            :show-file-list="true"
                            :on-change="setEnUploadFile"
                            :on-remove="() => setUploadFile('en-US')"
                            drag
                        >
                            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                            <div class="el-upload__text">{{ $t('system.fileTemplate.dropFile') }}</div>
                        </el-upload>
                    </div>
                </div>
                <div v-if="uploadFileError" class="form-error">{{ uploadFileError }}</div>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="uploadSaving" @click="saveVersion">{{ $t('system.fileTemplate.confirmUpload') }}</el-button>
                    <el-button :disabled="uploadSaving" @click="uploadDialogVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog
            v-model="switchDialogVisible"
            :title="switchAction === 'publish' ? $t('system.fileTemplate.publishVersion') : $t('system.fileTemplate.rollbackVersion')"
            width="min(600px, 92vw)"
            append-to-body
            class="app-form-dialog template-center-dialog"
            :close-on-click-modal="!switchSaving"
        >
            <el-alert
                :type="switchAction === 'publish' ? 'success' : 'warning'"
                :title="$t('system.fileTemplate.switchVersionConfirm', { version: switchVersion?.versionNo || '-' })"
                :closable="false"
                show-icon
                class="dialog-alert"
            />
            <el-form ref="switchFormRef" :model="switchForm" :rules="switchRules" label-width="92px">
                <el-form-item :label="$t('system.fileTemplate.operationReason')" prop="reason">
                    <el-input v-model="switchForm.reason" type="textarea" :rows="4" maxlength="500" show-word-limit />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button :type="switchAction === 'publish' ? 'primary' : 'warning'" :loading="switchSaving" @click="switchVersionNow">
                        {{ switchAction === 'publish' ? $t('system.fileTemplate.confirmPublish') : $t('system.fileTemplate.confirmRollback') }}
                    </el-button>
                    <el-button :disabled="switchSaving" @click="switchDialogVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <CommonDetailDrawer
            v-model:visible="detailVisible"
            :title="$t('system.fileTemplate.detailTitle')"
            size="lg"
            :loading="detailLoading"
        >
            <template v-if="detail">
                <div class="detail-header">
                    <FileTypeIcon :extension="detail.fileExtension" size="md" />
                    <div class="detail-header__main">
                        <div class="detail-header__title">
                            {{ displayName(detail) }}
                            <el-tag size="small" effect="plain" :type="ownerTagType(detail.ownerSystem)">{{ ownerLabel(detail.ownerSystem) }}</el-tag>
                            <el-tag size="small" :type="detail.status === 1 ? 'success' : 'info'">{{ detail.status === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag>
                        </div>
                        <div class="detail-header__code">{{ detail.templateCode }} · {{ moduleLabel(detail.moduleCode) }}</div>
                    </div>
                    <el-button
                        type="primary"
                        :icon="Download"
                        :disabled="!detail.currentVersionId"
                        @click="downloadTemplate(detail)"
                        v-hasPermi="'system:file-template:download'"
                    >{{ $t('common.download') }}</el-button>
                </div>

                <section class="detail-section">
                    <h3 class="detail-section__title">{{ $t('system.fileTemplate.basicInfo') }}</h3>
                    <div class="detail-info-grid">
                        <div class="detail-info-item">
                            <span>{{ $t('system.fileTemplate.nameZh') }}</span>
                            <strong :title="`${detail.nameZh}.${detail.fileExtension}`">{{ detail.nameZh }}.{{ detail.fileExtension }}</strong>
                        </div>
                        <div class="detail-info-item">
                            <span>{{ $t('system.fileTemplate.nameEn') }}</span>
                            <strong :title="`${detail.nameEn}.${detail.fileExtension}`">{{ detail.nameEn }}.{{ detail.fileExtension }}</strong>
                        </div>
                        <div class="detail-info-item">
                            <span>{{ $t('system.fileTemplate.createdBy') }}</span>
                            <strong>{{ detail.createBy || '—' }}</strong>
                        </div>
                        <div class="detail-info-item">
                            <span>{{ $t('common.createTime') }}</span>
                            <strong><BaseDateTime v-if="detail.createTime" :value="detail.createTime" /><template v-else>—</template></strong>
                        </div>
                    </div>
                </section>

                <section class="detail-section">
                    <h3 class="detail-section__title">{{ $t('system.fileTemplate.templateAttributes') }}</h3>
                    <div class="detail-info-grid">
                        <div class="detail-info-item detail-info-item--wrap">
                            <span>{{ $t('system.fileTemplate.adminPermission') }}</span>
                            <strong :title="detail.adminPermissionCode || ''">{{ detail.adminPermissionCode || '—' }}</strong>
                        </div>
                        <div class="detail-info-item detail-info-item--wrap">
                            <span>{{ $t('system.fileTemplate.merchantPermission') }}</span>
                            <strong :title="detail.merchantPermissionCode || ''">{{ detail.merchantPermissionCode || '—' }}</strong>
                        </div>
                        <div class="detail-info-item detail-info-item--full detail-info-item--wrap">
                            <span>{{ $t('common.remark') }}</span>
                            <strong>{{ detail.remark || '—' }}</strong>
                        </div>
                    </div>
                </section>

                <div class="version-section">
                    <div class="section-heading">
                        <div>
                            <h3>{{ $t('system.fileTemplate.versionHistory') }}</h3>
                            <p>{{ $t('system.fileTemplate.versionHistoryHint') }}</p>
                        </div>
                        <el-button type="primary" plain :icon="Upload" @click="openUpload(detail)" v-hasPermi="'system:file-template:upload'">
                            {{ $t('system.fileTemplate.uploadVersion') }}
                        </el-button>
                    </div>
                    <el-table :data="detail.versions" row-key="id" border size="small" max-height="440" empty-text="—" class="version-table">
                        <el-table-column :label="$t('system.fileTemplate.versionNo')" width="100" align="center">
                            <template #default="{ row }"><strong>v{{ row.versionNo }}</strong></template>
                        </el-table-column>
                        <el-table-column :label="$t('system.fileTemplate.publishStatus')" width="128" align="center">
                            <template #default="{ row }">
                                <el-tag size="small" :type="publishStatusType(row.publishStatus)">
                                    {{ publishStatusLabel(row.publishStatus) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column :label="$t('system.fileTemplate.schemaVersion')" min-width="120">
                            <template #default="{ row }">{{ row.schemaVersion || '—' }}</template>
                        </el-table-column>
                        <el-table-column :label="$t('system.fileTemplate.assets')" min-width="300">
                            <template #default="{ row }">
                                <div v-for="asset in row.assets" :key="asset.id" class="asset-line">
                                    <el-tag class="asset-locale-tag" size="small" effect="plain">
                                        {{ assetLocaleLabel(asset.locale) }}
                                    </el-tag>
                                    <el-tooltip :content="asset.originalFilename" placement="top" :show-after="500">
                                        <span class="asset-filename">{{ asset.originalFilename }}</span>
                                    </el-tooltip>
                                    <small>{{ formatBytes(asset.fileSize) }}</small>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column :label="$t('system.fileTemplate.releaseNote')" min-width="180">
                            <template #default="{ row }"><span class="release-note">{{ row.releaseNote || '—' }}</span></template>
                        </el-table-column>
                        <el-table-column :label="$t('system.fileTemplate.operatorTime')" min-width="168" align="center">
                            <template #default="{ row }">
                                <div>{{ row.publishedBy || row.createBy || '-' }}</div>
                                <div class="cell-secondary"><BaseDateTime :value="row.publishedTime || row.createTime" /></div>
                            </template>
                        </el-table-column>
                        <el-table-column :label="$t('common.operation')" width="164" fixed="right" align="center">
                            <template #default="{ row }">
                                <el-button
                                    v-if="row.publishStatus === 'DRAFT'"
                                    type="primary"
                                    link
                                    @click="openSwitchVersion('publish', row)"
                                    v-hasPermi="'system:file-template:publish'"
                                >{{ $t('system.fileTemplate.publish') }}</el-button>
                                <el-button
                                    v-if="row.id !== detail.currentVersionId && ['PUBLISHED', 'ARCHIVED'].includes(row.publishStatus)"
                                    type="warning"
                                    link
                                    @click="openSwitchVersion('rollback', row)"
                                    v-hasPermi="'system:file-template:rollback'"
                                >{{ $t('system.fileTemplate.rollback') }}</el-button>
                                <el-tag v-if="row.id === detail.currentVersionId" size="small" type="success" effect="plain">
                                    {{ $t('system.fileTemplate.current') }}
                                </el-tag>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </template>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
    ElMessage,
    type FormInstance,
    type FormRules,
    type UploadFile,
} from 'element-plus';
import {
    ArrowDown,
    Download,
    Edit,
    Plus,
    Refresh,
    Search,
    Upload,
    UploadFilled,
    View,
} from '@element-plus/icons-vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import FileTypeIcon from './components/FileTypeIcon.vue';
import { useUserStore } from '@/store/modules/user';
import {
    createFileTemplate,
    downloadCurrentFileTemplate,
    getFileTemplate,
    getFileTemplateFormOptions,
    publishFileTemplateVersion,
    rollbackFileTemplateVersion,
    searchFileTemplates,
    updateFileTemplate,
    uploadFileTemplateVersion,
    type FileTemplateCreateRequest,
    type FileTemplateDetail,
    type FileTemplateLocale,
    type FileTemplateModuleOption,
    type FileTemplateOwnerSystem,
    type FileTemplatePermissionOption,
    type FileTemplatePublishStatus,
    type FileTemplateSummary,
    type FileTemplateVersion,
} from '@/api/system/file-template';

const { t, locale } = useI18n();
const user = useUserStore();
const canShowMore = computed(() => user.hasPermission('system:file-template:edit')
    || user.hasPermission('system:file-template:download'));
const extensions = ['xlsx', 'csv', 'pdf', 'docx', 'zip'];
const ownerOptions = computed(() => [
    { value: 'ADMIN' as const, label: t('system.fileTemplate.ownerAdmin') },
    { value: 'MERCHANT' as const, label: t('system.fileTemplate.ownerMerchant') },
    { value: 'SHARED' as const, label: t('system.fileTemplate.ownerShared') },
]);
const formOptionsLoading = ref(false);
const moduleOptions = ref<FileTemplateModuleOption[]>([]);
const adminPermissionOptions = ref<FileTemplatePermissionOption[]>([]);
const merchantPermissionOptions = ref<FileTemplatePermissionOption[]>([]);
const availableModuleOptions = computed(() => moduleOptions.value.filter(
    item => item.ownerSystems.includes(definitionForm.ownerSystem),
));

const query = reactive<{ keyword: string; ownerSystem?: FileTemplateOwnerSystem; status?: number }>({ keyword: '' });
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<FileTemplateSummary[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const definitionDialogVisible = ref(false);
const definitionSaving = ref(false);
const definitionMode = ref<'create' | 'edit'>('create');
const definitionFormRef = ref<FormInstance>();
const activeTemplate = ref<FileTemplateSummary | FileTemplateDetail>();
const definitionForm = reactive({
    templateCode: '', ownerSystem: 'ADMIN' as FileTemplateOwnerSystem, moduleCode: '',
    nameZh: '', nameEn: '', fileExtension: 'xlsx', adminPermissionCode: '', merchantPermissionCode: '',
    status: 1, expectedVersion: 0, remark: '',
});

const safeBaseName = (value: unknown) => {
    const text = String(value || '').trim();
    const hasControlCharacter = Array.from(text).some((character) => {
        const codePoint = character.codePointAt(0) ?? 0;
        return codePoint <= 0x1f || codePoint === 0x7f;
    });
    return Boolean(text) && !/[\\/]/.test(text) && !hasControlCharacter
        && !/\.(xlsx|csv|pdf|docx|zip)$/i.test(text);
};
const definitionRules: FormRules = {
    ownerSystem: [{ required: true, message: () => t('common.pleaseSelect'), trigger: 'change' }],
    moduleCode: [{ required: true, message: () => t('system.fileTemplate.moduleCodeRequired'), trigger: 'change' }],
    fileExtension: [{ required: true, message: () => t('common.pleaseSelect'), trigger: 'change' }],
    nameZh: [{ validator: (_rule, value, callback) => safeBaseName(value) ? callback() : callback(new Error(t('system.fileTemplate.filenameInvalid'))), trigger: 'blur' }],
    nameEn: [{ validator: (_rule, value, callback) => safeBaseName(value) ? callback() : callback(new Error(t('system.fileTemplate.filenameInvalid'))), trigger: 'blur' }],
    adminPermissionCode: [{ validator: (_rule, value, callback) => validatePermissionField('ADMIN', value, callback), trigger: 'change' }],
    merchantPermissionCode: [{ validator: (_rule, value, callback) => validatePermissionField('MERCHANT', value, callback), trigger: 'change' }],
};

function validatePermissionField(target: 'ADMIN' | 'MERCHANT', value: unknown, callback: (error?: Error) => void) {
    const required = definitionForm.ownerSystem === target || definitionForm.ownerSystem === 'SHARED';
    const text = String(value || '').trim();
    if (required && !text) return callback(new Error(t('system.fileTemplate.permissionRequired')));
    callback();
}

const uploadDialogVisible = ref(false);
const uploadSaving = ref(false);
const uploadFormRef = ref<FormInstance>();
const uploadForm = reactive({ versionNo: 1, schemaVersion: '', releaseNote: '', requestId: '' });
const uploadFiles = reactive<{ zh?: File; en?: File }>({});
const uploadFileError = ref('');
const uploadRules: FormRules = {
    versionNo: [{ required: true, message: () => t('system.fileTemplate.versionNoRequired'), trigger: 'change' }],
};

const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<FileTemplateDetail>();

const switchDialogVisible = ref(false);
const switchSaving = ref(false);
const switchAction = ref<'publish' | 'rollback'>('publish');
const switchVersion = ref<FileTemplateVersion>();
const switchFormRef = ref<FormInstance>();
const switchForm = reactive({ reason: '', requestId: '' });
const switchRules: FormRules = {
    reason: [{ required: true, message: () => t('system.fileTemplate.reasonRequired'), trigger: 'blur' }],
};

onMounted(() => {
    void loadFormOptions();
    void loadData();
});

async function loadFormOptions() {
    formOptionsLoading.value = true;
    try {
        const options = await getFileTemplateFormOptions();
        moduleOptions.value = options.modules || [];
        adminPermissionOptions.value = options.adminPermissions || [];
        merchantPermissionOptions.value = options.merchantPermissions || [];
    } catch (error) {
        moduleOptions.value = [];
        adminPermissionOptions.value = [];
        merchantPermissionOptions.value = [];
        showError(error, t('system.fileTemplate.optionsLoadFailed'));
    } finally {
        formOptionsLoading.value = false;
    }
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchFileTemplates({
            pageNo: page.value,
            pageSize: pageSize.value,
            keyword: query.keyword.trim() || undefined,
            ownerSystem: query.ownerSystem,
            status: query.status,
        });
        rows.value = result.records || [];
        total.value = result.total || 0;
    } catch (error) {
        rows.value = [];
        total.value = 0;
        showError(error, t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function handleSearch() { page.value = 1; loadData(); }
function resetQuery() { Object.assign(query, { keyword: '', ownerSystem: undefined, status: undefined }); handleSearch(); }
function currentLocale(): FileTemplateLocale { return locale.value.toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN'; }
function assetLocaleLabel(value: FileTemplateLocale) {
    return value === 'zh-CN' ? t('system.fileTemplate.localeChinese') : t('system.fileTemplate.localeEnglish');
}
function displayName(row: FileTemplateSummary) { return currentLocale() === 'en-US' ? row.nameEn : row.nameZh; }
function moduleOptionLabel(item: FileTemplateModuleOption) { return currentLocale() === 'en-US' ? item.nameEn : item.nameZh; }
function moduleLabel(code: string) {
    const item = moduleOptions.value.find(option => option.code === code);
    return item ? moduleOptionLabel(item) : code;
}
function permissionOptionLabel(item: FileTemplatePermissionOption) { return `${item.name} · ${item.code}`; }
function ownerLabel(value: FileTemplateOwnerSystem) { return t(`system.fileTemplate.owner${value.charAt(0)}${value.slice(1).toLowerCase()}`); }
function ownerTagType(value: FileTemplateOwnerSystem) { return value === 'ADMIN' ? 'primary' : value === 'MERCHANT' ? 'success' : 'warning'; }
function publishStatusLabel(value: FileTemplatePublishStatus) { return t(`system.fileTemplate.status${value.charAt(0)}${value.slice(1).toLowerCase()}`); }
function publishStatusType(value: FileTemplatePublishStatus) { return value === 'PUBLISHED' ? 'success' : value === 'ARCHIVED' ? 'info' : 'warning'; }

function resetDefinition() {
    Object.assign(definitionForm, {
        templateCode: '', ownerSystem: 'ADMIN', moduleCode: '', nameZh: '', nameEn: '',
        fileExtension: 'xlsx', adminPermissionCode: '', merchantPermissionCode: '', status: 1,
        expectedVersion: 0, remark: '',
    });
}

function openCreate() {
    definitionMode.value = 'create';
    activeTemplate.value = undefined;
    resetDefinition();
    definitionDialogVisible.value = true;
    nextTick(() => definitionFormRef.value?.clearValidate());
}

async function openEdit(row: FileTemplateSummary) {
    try {
        const current = await getFileTemplate(row.id);
        activeTemplate.value = current;
        definitionMode.value = 'edit';
        Object.assign(definitionForm, {
            templateCode: current.templateCode,
            ownerSystem: current.ownerSystem,
            moduleCode: current.moduleCode,
            nameZh: current.nameZh,
            nameEn: current.nameEn,
            fileExtension: current.fileExtension,
            adminPermissionCode: current.adminPermissionCode || '',
            merchantPermissionCode: current.merchantPermissionCode || '',
            status: current.status,
            expectedVersion: current.version,
            remark: current.remark || '',
        });
        definitionDialogVisible.value = true;
        nextTick(() => definitionFormRef.value?.clearValidate());
    } catch (error) { showError(error, t('common.loadFailed')); }
}

function handleOwnerSystemChange() {
    if (!availableModuleOptions.value.some(item => item.code === definitionForm.moduleCode)) {
        definitionForm.moduleCode = '';
    }
    if (definitionForm.ownerSystem === 'ADMIN') definitionForm.merchantPermissionCode = '';
    if (definitionForm.ownerSystem === 'MERCHANT') definitionForm.adminPermissionCode = '';
    nextTick(() => {
        definitionFormRef.value?.validateField(['moduleCode', 'adminPermissionCode', 'merchantPermissionCode']).catch(() => undefined);
    });
}

async function saveDefinition() {
    if (definitionSaving.value) return;
    const valid = await definitionFormRef.value?.validate().catch(() => false);
    if (!valid) return;
    definitionSaving.value = true;
    try {
        const common = {
            ownerSystem: definitionForm.ownerSystem,
            moduleCode: definitionForm.moduleCode.trim().toUpperCase(),
            nameZh: definitionForm.nameZh.trim(),
            nameEn: definitionForm.nameEn.trim(),
            adminPermissionCode: definitionForm.adminPermissionCode.trim() || undefined,
            merchantPermissionCode: definitionForm.merchantPermissionCode.trim() || undefined,
            remark: definitionForm.remark.trim() || undefined,
        };
        if (definitionMode.value === 'create') {
            await createFileTemplate({
                ...common,
                fileExtension: definitionForm.fileExtension,
            } satisfies FileTemplateCreateRequest);
        } else if (activeTemplate.value) {
            await updateFileTemplate(activeTemplate.value.id, {
                ...common,
                status: definitionForm.status,
                expectedVersion: definitionForm.expectedVersion,
            });
        }
        ElMessage.success(t('common.saveSuccess'));
        definitionDialogVisible.value = false;
        await loadData();
        if (detailVisible.value && activeTemplate.value) await refreshDetail(activeTemplate.value.id);
    } catch (error) { showError(error, t('common.saveFailed')); }
    finally { definitionSaving.value = false; }
}

async function openDetail(row: FileTemplateSummary) {
    detailVisible.value = true;
    await refreshDetail(row.id);
}

async function refreshDetail(id: number) {
    detailLoading.value = true;
    try { detail.value = await getFileTemplate(id); }
    catch (error) { showError(error, t('common.loadFailed')); }
    finally { detailLoading.value = false; }
}

async function openUpload(row: FileTemplateSummary) {
    try {
        const current = await getFileTemplate(row.id);
        activeTemplate.value = current;
        const nextVersion = Math.max(0, ...current.versions.map(item => item.versionNo)) + 1;
        Object.assign(uploadForm, { versionNo: nextVersion, schemaVersion: '', releaseNote: '', requestId: createRequestId('template-upload') });
        uploadFiles.zh = undefined;
        uploadFiles.en = undefined;
        uploadFileError.value = '';
        uploadDialogVisible.value = true;
        nextTick(() => uploadFormRef.value?.clearValidate());
    } catch (error) { showError(error, t('common.loadFailed')); }
}

function setUploadFile(fileLocale: FileTemplateLocale, uploadFile?: UploadFile) {
    const raw = uploadFile?.raw;
    if (fileLocale === 'zh-CN') uploadFiles.zh = raw;
    else uploadFiles.en = raw;
    uploadFileError.value = '';
}

function setZhUploadFile(uploadFile: UploadFile) { setUploadFile('zh-CN', uploadFile); }
function setEnUploadFile(uploadFile: UploadFile) { setUploadFile('en-US', uploadFile); }

async function saveVersion() {
    if (uploadSaving.value || !activeTemplate.value) return;
    const valid = await uploadFormRef.value?.validate().catch(() => false);
    if (!valid) return;
    if (!uploadFiles.zh || !uploadFiles.en) {
        uploadFileError.value = t('system.fileTemplate.twoFilesRequired');
        return;
    }
    const expectedExtension = `.${activeTemplate.value.fileExtension}`.toLowerCase();
    if (![uploadFiles.zh, uploadFiles.en].every(file => file.name.toLowerCase().endsWith(expectedExtension))) {
        uploadFileError.value = t('system.fileTemplate.extensionMismatch', { extension: expectedExtension });
        return;
    }
    uploadSaving.value = true;
    try {
        await uploadFileTemplateVersion(activeTemplate.value.id, {
            versionNo: uploadForm.versionNo,
            schemaVersion: uploadForm.schemaVersion.trim() || undefined,
            releaseNote: uploadForm.releaseNote.trim() || undefined,
            requestId: uploadForm.requestId,
            zhFile: uploadFiles.zh,
            enFile: uploadFiles.en,
        });
        ElMessage.success(t('system.fileTemplate.uploadSuccess'));
        uploadDialogVisible.value = false;
        await loadData();
        if (detailVisible.value) await refreshDetail(activeTemplate.value.id);
    } catch (error) { showError(error, t('system.fileTemplate.uploadFailed')); }
    finally { uploadSaving.value = false; }
}

function openSwitchVersion(action: 'publish' | 'rollback', version: FileTemplateVersion) {
    switchAction.value = action;
    switchVersion.value = version;
    Object.assign(switchForm, { reason: '', requestId: createRequestId(`template-${action}`) });
    switchDialogVisible.value = true;
    nextTick(() => switchFormRef.value?.clearValidate());
}

async function switchVersionNow() {
    if (switchSaving.value || !detail.value || !switchVersion.value) return;
    const valid = await switchFormRef.value?.validate().catch(() => false);
    if (!valid) return;
    switchSaving.value = true;
    try {
        const request = {
            expectedTemplateVersion: detail.value.version,
            requestId: switchForm.requestId,
            reason: switchForm.reason.trim(),
        };
        detail.value = switchAction.value === 'publish'
            ? await publishFileTemplateVersion(detail.value.id, switchVersion.value.id, request)
            : await rollbackFileTemplateVersion(detail.value.id, switchVersion.value.id, request);
        ElMessage.success(t(switchAction.value === 'publish' ? 'system.fileTemplate.publishSuccess' : 'system.fileTemplate.rollbackSuccess'));
        switchDialogVisible.value = false;
        await loadData();
    } catch (error) { showError(error, t('common.operationFailed')); }
    finally { switchSaving.value = false; }
}

async function downloadTemplate(row: FileTemplateSummary) {
    if (!row.currentVersionId) return;
    try { await downloadCurrentFileTemplate(row, currentLocale()); }
    catch (error) { showError(error, t('system.fileTemplate.downloadFailed')); }
}

function createRequestId(prefix: string) {
    const random = typeof globalThis.crypto?.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${random}`.slice(0, 64);
}

function formatBytes(value: number) {
    if (!Number.isFinite(value) || value < 1024) return `${value || 0} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function showError(error: unknown, fallback: string) {
    ElMessage.error(error instanceof Error ? error.message : fallback);
}
</script>

<style scoped>
.search-control { width: 260px; }
.template-table { width: 100%; }
.template-table :deep(.el-table__row > td) { height: 52px; }
.template-table :deep(.el-table__row:hover > td) { background: var(--el-fill-color-lighter) !important; }
.template-name { display: flex; width: 100%; min-width: 0; align-items: center; gap: 10px; padding: 0; border: 0; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.template-name:hover strong { color: var(--el-color-primary); }
.template-name__content { min-width: 0; }
.template-name strong, .template-name small, .filename-line {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.template-name strong { color: var(--el-text-color-primary); font-size: 14px; font-weight: 600; line-height: 1.45; transition: color .15s ease; }
.template-name small, .cell-secondary, .cell-muted { display: block; margin-top: 2px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.4; }
.scope-separator { margin: 0 6px; color: var(--el-text-color-placeholder); }
.scope-module { color: var(--el-text-color-regular); font-size: 13px; }
.version-pill { display: inline-flex; min-width: 42px; justify-content: center; padding: 3px 8px; border-radius: 999px; background: var(--el-color-success-light-9); color: var(--el-color-success-dark-2); font-weight: 600; }
.status-dot { display: inline-block; width: 6px; height: 6px; margin-right: 5px; border-radius: 50%; background: currentColor; vertical-align: 1px; }
.more-button { margin-left: 10px; }
.pagination-container { display: flex; justify-content: flex-end; padding: 14px 16px; border-top: 1px solid var(--el-border-color-lighter); }
.dialog-alert { margin-bottom: 18px; }
.dialog-alert--compact :deep(.el-alert__content) { padding: 1px 0; }
.dialog-alert--compact :deep(.el-alert__title) { font-size: 13px; font-weight: 400; line-height: 20px; }
.definition-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 24px; }
.definition-grid__spacer { min-height: 1px; }
.readonly-field { width: 100%; min-height: 32px; padding: 5px 11px; overflow: hidden; border: 1px solid var(--el-border-color); border-radius: var(--el-border-radius-base); background: var(--el-fill-color-light); color: var(--el-text-color-regular); line-height: 20px; text-overflow: ellipsis; white-space: nowrap; }
.upload-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.locale-upload { min-width: 0; padding: 14px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; background: var(--el-fill-color-lighter); }
.locale-upload__title { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: var(--el-text-color-primary); font-weight: 600; }
.locale-upload__title span { display: inline-grid; min-width: 28px; height: 24px; place-items: center; padding: 0 5px; border-radius: 5px; background: var(--el-color-primary-light-9); color: var(--el-color-primary); font-size: 11px; }
.locale-upload :deep(.el-upload), .locale-upload :deep(.el-upload-dragger) { width: 100%; }
.form-error { margin: 10px 0 0 128px; color: var(--el-color-danger); font-size: 12px; }
.detail-header { display: flex; align-items: center; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid var(--el-border-color-lighter); }
.detail-header__main { min-width: 0; flex: 1; }
.detail-header__title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; color: var(--el-text-color-primary); font-size: 17px; font-weight: 600; }
.detail-header__code { margin-top: 5px; overflow-wrap: anywhere; color: var(--el-text-color-secondary); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
.detail-section { margin-top: 20px; }
.detail-section__title { margin: 0 0 12px; color: var(--el-text-color-primary); font-size: 14px; font-weight: 600; }
.detail-info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 28px; padding: 16px 18px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; background: var(--el-fill-color-blank); }
.detail-info-item { min-width: 0; }
.detail-info-item > span { display: block; margin-bottom: 5px; color: var(--el-text-color-secondary); font-size: 12px; }
.detail-info-item > strong { display: block; overflow: hidden; color: var(--el-text-color-primary); font-size: 13px; font-weight: 400; line-height: 1.55; text-overflow: ellipsis; white-space: nowrap; }
.detail-info-item--full { grid-column: 1 / -1; }
.detail-info-item--wrap > strong { overflow-wrap: anywhere; white-space: normal; }
.version-section { margin-top: 24px; }
.section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
.section-heading h3 { margin: 0; font-size: 15px; font-weight: 600; }
.section-heading p { margin: 5px 0 0; color: var(--el-text-color-secondary); font-size: 12px; }
.version-table :deep(.el-table__cell) { padding-top: 8px; padding-bottom: 8px; }
.asset-line { display: grid; grid-template-columns: 62px minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 3px 0; }
.asset-locale-tag { width: 62px; justify-content: center; text-align: center; }
.asset-locale-tag :deep(.el-tag__content) { width: 100%; text-align: center; }
.asset-filename { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.asset-line small { color: var(--el-text-color-secondary); white-space: nowrap; }
.release-note { display: -webkit-box; overflow: hidden; line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }

:global(.template-center-dialog .el-form-item__label),
:global(.template-center-dialog .el-form-item__content),
:global(.template-center-dialog .el-input__inner),
:global(.template-center-dialog .el-select__selected-item),
:global(.template-center-dialog .el-radio__label),
:global(.template-center-dialog .el-input-group__append),
:global(.template-center-dialog .el-textarea__inner),
:global(.template-center-dialog .el-button) {
    font-size: 14px;
    font-weight: 400;
}
:global(.template-center-dialog .el-form-item__label) { font-weight: 400; }
:global(.template-center-dialog.el-dialog) {
    display: flex;
    max-height: calc(100vh - 48px);
    flex-direction: column;
}
:global(.template-center-dialog .el-dialog__body) { overflow: auto; }
:global(.template-center-dialog .el-dialog__footer) { flex: 0 0 auto; }
:global(.template-center-dialog .el-input-group__append) {
    min-width: 64px;
    justify-content: center;
    color: var(--el-text-color-secondary);
}
:global(.template-center-dialog .dialog-footer .el-button) { font-weight: 400; }

@media (max-width: 768px) {
    .definition-grid, .upload-grid { grid-template-columns: 1fr; }
    .definition-grid__spacer { display: none; }
    .form-error { margin-left: 0; }
    .detail-header { align-items: flex-start; flex-wrap: wrap; }
    .detail-header__main { width: calc(100% - 76px); flex: none; }
    .detail-info-grid { grid-template-columns: 1fr; gap: 14px; }
    .detail-info-item--full { grid-column: auto; }
    .section-heading { align-items: flex-start; flex-direction: column; }
}
</style>
