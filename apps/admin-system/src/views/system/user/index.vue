<template>
    <div class="app-container">
        <el-form ref="queryFormRef" :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="68px">
            <el-form-item :label="$t('system.user.loginAccount')" prop="loginAccount">
                <el-input v-model="query.loginAccount" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item :label="$t('system.user.dept')" prop="deptId">
                <el-tree-select v-model="query.deptId" :data="deptOptions" node-key="id" :props="{ label: 'deptName', children: 'children' }" check-strictly filterable clearable :render-after-expand="false" default-expand-all style="width: 180px" :placeholder="$t('common.pleaseSelect')" />
            </el-form-item>
            <el-form-item :label="$t('common.status')" prop="status">
                <el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleQuery">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain :icon="Plus" size="small" @click="handleAdd" v-hasPermi="'system:user:add'">{{ $t('common.add') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="success" plain :icon="Edit" size="small" :disabled="!selectedRows.length || selectedRows.length !== 1" @click="handleUpdate(selectedRows[0])" v-hasPermi="'system:user:edit'">{{ $t('common.edit') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows)" v-hasPermi="'system:user:remove'">{{ $t('common.delete') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'system:user:export'">{{ $t('common.export') }}</el-button>
            </el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleQuery" /></el-col>
        </el-row>

        <StandardTable table-key="system-user" v-loading="loading" :data="rows" row-key="accountId" size="small" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="loginAccount" :label="$t('system.user.loginAccount')" min-width="160" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="realName" :label="$t('system.user.realName')" min-width="120" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="deptName" :label="$t('system.user.dept')" min-width="130" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="$t('system.user.role')" min-width="180" align="center">
                <template #default="{ row }">
                    <div v-if="row.roleNames?.length" class="role-tags">
                        <el-tag v-for="role in row.roleNames" :key="role" size="small" effect="plain">{{ role }}</el-tag>
                    </div>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column prop="mobile" :label="$t('system.user.mobile')" min-width="130" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="email" :label="$t('system.user.email')" min-width="160" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="$t('system.user.mfaPolicy')" min-width="120" align="center">
                <template #default="{ row }">
                    <el-tag size="small" :type="mfaPolicyTag(row.mfaPolicy)" effect="plain">{{ mfaPolicyText(row.mfaPolicy) }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="$t('system.user.mfaStatus')" min-width="130" align="center">
                <template #default="{ row }">
                    <el-tag size="small" :type="mfaStatusTag(row.mfaStatus)" effect="plain">{{ mfaStatusText(row.mfaStatus) }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="$t('common.status')" width="80" align="center">
                <template #default="{ row }"><el-switch :model-value="row.status" :active-value="1" :inactive-value="0" @change="handleStatusChange(row)" v-hasPermi="'system:user:changeStatus'" /></template>
            </el-table-column>
            <el-table-column prop="lockedText" :label="$t('system.user.locked')" width="70" align="center" />
            <el-table-column :label="$t('system.user.lastLogin')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.lastLoginAt" /></template></el-table-column>
            <el-table-column :label="$t('common.createTime')" min-width="160" align="center"><template #default="{ row }"><BaseDateTime :value="row.createdAt" /></template></el-table-column>
            <el-table-column :label="$t('common.operation')" align="center" width="280" class-name="small-padding fixed-width" fixed="right">
                <template #default="{ row }">
                    <div class="operation-button-group">
                        <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'system:user:list'">{{ $t('common.detail') }}</el-button>
                        <el-button size="small" type="primary" link :icon="Edit" @click="handleUpdate(row)" v-hasPermi="'system:user:edit'">{{ $t('common.edit') }}</el-button>
                        <el-dropdown trigger="click" @command="(command: string) => handleUserCommand(command, row)">
                            <el-button size="small" type="primary" link>
                                {{ $t('system.user.moreActions') }}
                                <el-icon class="el-icon--right"><MoreFilled /></el-icon>
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item command="role" v-hasPermi="'system:user:assign-role'">{{ $t('system.user.assignRole') }}</el-dropdown-item>
                                    <el-dropdown-item command="password" v-hasPermi="'system:user:resetPwd'">{{ $t('system.user.resetPassword') }}</el-dropdown-item>
                                    <el-dropdown-item command="delete" divided v-hasPermi="'system:user:remove'">{{ $t('common.delete') }}</el-dropdown-item>
                                    <el-dropdown-item command="mfaLogs" v-hasPermi="'sys:user:mfa:log'">{{ $t('system.user.mfaLogs') }}</el-dropdown-item>
                                    <el-dropdown-item command="mfaRequire" divided v-hasPermi="'sys:user:mfa:require'">{{ $t('system.user.mfaRequire') }}</el-dropdown-item>
                                    <el-dropdown-item command="mfaReset" v-hasPermi="'sys:user:mfa:reset'">{{ $t('system.user.mfaReset') }}</el-dropdown-item>
                                    <el-dropdown-item command="mfaUnlock" v-hasPermi="'sys:user:mfa:unlock'">{{ $t('system.user.mfaUnlock') }}</el-dropdown-item>
                                    <el-dropdown-item command="mfaResend" v-hasPermi="'sys:user:mfa:resend'">{{ $t('system.user.mfaResend') }}</el-dropdown-item>
                                    <el-dropdown-item command="mfaExempt" v-hasPermi="'sys:user:mfa:exempt'">{{ $t('system.user.mfaExempt') }}</el-dropdown-item>
                                    <el-dropdown-item command="mfaDisable" v-hasPermi="'sys:user:mfa:disable'">{{ $t('system.user.mfaDisable') }}</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </div>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <el-dialog :title="dialogTitle" v-model="userDialogVisible" width="560px" append-to-body destroy-on-close>
            <el-form ref="userFormRef" :model="userForm" :rules="userFormRules" label-width="90px" style="padding:0 20px">
                <el-form-item :label="$t('system.user.loginAccount')" prop="loginAccount"><el-input v-model="userForm.loginAccount" :disabled="formMode === 'edit'" maxlength="100" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item v-if="formMode === 'create'" :label="$t('system.user.initPassword')" prop="password"><el-input v-model="userForm.password" type="password" show-password maxlength="64" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('system.user.realName')" prop="realName"><el-input v-model="userForm.realName" maxlength="100" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('system.user.dept')" prop="deptId">
                    <el-tree-select v-model="userForm.deptId" :data="deptOptions" node-key="id" :props="{ label: 'deptName', children: 'children' }" check-strictly filterable clearable :render-after-expand="false" default-expand-all style="width:100%" :placeholder="$t('common.pleaseSelect')" />
                </el-form-item>
                <el-form-item :label="$t('system.user.post')" prop="postIds">
                    <el-select v-model="userForm.postIds" multiple filterable clearable :placeholder="$t('common.pleaseSelect')" style="width:100%">
                        <el-option v-for="post in postOptions" :key="post.id" :label="post.postName + ' (' + post.postCode + ')'" :value="post.id" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('system.user.mobile')" prop="mobile"><el-input v-model="userForm.mobile" maxlength="30" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('system.user.email')" prop="email"><el-input v-model="userForm.email" maxlength="150" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="userForm.status" :placeholder="$t('common.pleaseSelect')" style="width:100%"><el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-form-item :label="$t('system.user.remark')" prop="remark"><el-input v-model="userForm.remark" type="textarea" maxlength="500" show-word-limit :autosize="{ minRows: 2, maxRows: 4 }" :placeholder="$t('common.pleaseInput')" /></el-form-item>
            </el-form>
            <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitUserForm">{{ $t('common.confirm') }}</el-button><el-button @click="userDialogVisible = false">{{ $t('common.cancel') }}</el-button></div></template>
        </el-dialog>

        <el-dialog v-model="resetDialogVisible" :title="$t('system.user.resetPassword')" width="480px" append-to-body destroy-on-close>
            <el-form ref="resetFormRef" :model="resetForm" :rules="resetFormRules" label-width="80px">
                <el-form-item :label="$t('system.user.loginAccount')"><el-input :model-value="activeRow?.loginAccount || '-'" disabled /></el-form-item>
                <el-form-item :label="$t('login.password')" prop="password"><el-input v-model="resetForm.password" type="password" show-password maxlength="64" :placeholder="$t('common.pleaseInput')" /></el-form-item>
            </el-form>
            <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitResetPassword">{{ $t('common.confirm') }}</el-button><el-button @click="resetDialogVisible = false">{{ $t('common.cancel') }}</el-button></div></template>
        </el-dialog>

        <el-dialog v-model="mfaActionDialogVisible" :title="mfaActionTitle" width="560px" append-to-body destroy-on-close>
            <el-alert class="mfa-action-alert" :title="mfaActionTip" type="warning" show-icon :closable="false" />
            <el-form ref="mfaActionFormRef" :model="mfaActionForm" :rules="mfaActionRules" label-width="96px">
                <el-form-item :label="$t('system.user.loginAccount')"><el-input :model-value="activeRow?.loginAccount || '-'" disabled /></el-form-item>
                <el-form-item v-if="mfaActionType === 'exempt'" :label="$t('system.user.mfaExemptUntil')" prop="exemptUntil">
                    <el-date-picker v-model="mfaActionForm.exemptUntil" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" :placeholder="$t('system.user.mfaLongTermExempt')" style="width:100%" />
                </el-form-item>
                <el-form-item :label="$t('common.remark')" prop="reason">
                    <el-input v-model="mfaActionForm.reason" type="textarea" maxlength="500" show-word-limit :autosize="{ minRows: 3, maxRows: 5 }" :placeholder="$t('system.user.mfaReasonPlaceholder')" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="mfaActionSaving" @click="submitMfaAction">{{ $t('common.confirm') }}</el-button>
                    <el-button @click="mfaActionDialogVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="$t('system.user.userDetail')" size="md">
            <el-descriptions :column="1" border size="small">
                <el-descriptions-item :label="$t('system.user.accountId')">{{ activeRow?.accountId ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.userId')">{{ activeRow?.userId ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.loginAccount')">{{ activeRow?.loginAccount ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.realName')">{{ activeRow?.realName ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.dept')">
                    <el-tag v-if="activeRow?.deptName" type="info" size="small" effect="plain">{{ activeRow.deptName }}</el-tag>
                    <span v-else>-</span>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.post')">
                    <div v-if="activeRow?.postNames?.length" class="detail-tags">
                        <el-tag v-for="post in activeRow.postNames" :key="post" type="success" size="small" effect="plain">{{ post }}</el-tag>
                    </div>
                    <span v-else>-</span>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.role')">
                    <div v-if="activeRow?.roleNames?.length" class="detail-tags">
                        <el-tag v-for="role in activeRow.roleNames" :key="role" type="primary" size="small" effect="plain">{{ role }}</el-tag>
                    </div>
                    <span v-else>-</span>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.mobile')">{{ activeRow?.mobile ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.email')">{{ activeRow?.email ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.status')"><el-tag :type="activeRow?.status === 1 ? 'success' : 'danger'" size="small">{{ activeRow?.status === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.locked')">
                    <el-tag v-if="activeRow" :type="activeRow.locked === 1 ? 'danger' : 'success'" size="small" effect="plain">{{ activeRow.lockedText }}</el-tag>
                    <span v-else>-</span>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.mfaPolicy')"><el-tag size="small" :type="mfaPolicyTag(activeRow?.mfaPolicy)" effect="plain">{{ mfaPolicyText(activeRow?.mfaPolicy) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.mfaStatus')"><el-tag size="small" :type="mfaStatusTag(activeRow?.mfaStatus)" effect="plain">{{ mfaStatusText(activeRow?.mfaStatus) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.mfaBindTime')"><BaseDateTime :value="activeRow?.mfaBindTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.mfaLastVerifyTime')"><BaseDateTime :value="activeRow?.mfaLastVerifyTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.mfaExemptUntil')"><BaseDateTime :value="activeRow?.mfaExemptUntil" /></el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.mfaLockedUntil')"><BaseDateTime :value="activeRow?.mfaLockedUntil" /></el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.lastLogin')"><BaseDateTime :value="activeRow?.lastLoginAt" /></el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.lastLoginIp')">{{ activeRow?.lastLoginIp ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.remark')">{{ activeRow?.remark || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.createTime')"><BaseDateTime :value="activeRow?.createdAt" /></el-descriptions-item>
            </el-descriptions>
        </CommonDetailDrawer>

        <CommonDetailDrawer v-model:visible="mfaLogVisible" :title="$t('system.user.mfaLogTitle')" size="lg">
            <el-form :model="mfaLogQuery" :inline="true" size="small" label-width="88px" class="search-form mfa-log-search">
                <el-form-item :label="$t('system.user.loginAccount')">
                    <el-input v-model.trim="mfaLogQuery.loginAccount" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleMfaLogSearch" />
                </el-form-item>
                <el-form-item :label="$t('system.user.mfaActionType')">
                    <el-select v-model="mfaLogQuery.actionType" :placeholder="$t('common.pleaseSelect')" clearable style="width: 180px">
                        <el-option v-for="item in mfaLogActionOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('system.user.mfaResult')">
                    <el-select v-model="mfaLogQuery.result" :placeholder="$t('common.pleaseSelect')" clearable style="width: 120px">
                        <el-option v-for="item in mfaLogResultOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('system.user.mfaEventTime')" class="mfa-log-time-item">
                    <TransactionTimeRangeFilter v-model="mfaLogTimeRange" :time-zone="mfaLogTimeZone" :timezone-options="timezoneOptions" default-preset="today" @update:time-zone="mfaLogQuery.queryTimeZone = $event" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" :icon="Search" size="small" @click="handleMfaLogSearch">{{ $t('common.search') }}</el-button>
                    <el-button :icon="Refresh" size="small" @click="resetMfaLogQuery">{{ $t('common.reset') }}</el-button>
                </el-form-item>
            </el-form>
            <StandardTable table-key="system-user-mfa-log" v-loading="mfaLogLoading" :data="mfaLogRows" row-key="id" size="small">
                <el-table-column :label="$t('system.user.mfaEventTime')" min-width="170" align="center">
                    <template #default="{ row }"><BaseDateTime :value="row.eventTime" source-time-zone="Asia/Shanghai" :display-time-zone="mfaLogQuery.queryTimeZone" /></template>
                </el-table-column>
                <el-table-column prop="loginAccount" :label="$t('system.user.loginAccount')" min-width="140" align="center" show-overflow-tooltip />
                <el-table-column :label="$t('system.user.mfaActionType')" min-width="150" align="center" show-overflow-tooltip>
                    <template #default="{ row }">{{ mfaActionText(row.actionType) }}</template>
                </el-table-column>
                <el-table-column :label="$t('system.user.mfaResult')" width="100" align="center">
                    <template #default="{ row }"><el-tag size="small" :type="mfaResultTag(row.result)" effect="plain">{{ mfaResultText(row.result) }}</el-tag></template>
                </el-table-column>
                <el-table-column :label="$t('system.user.mfaBeforeAfter')" min-width="220" align="center" show-overflow-tooltip>
                    <template #default="{ row }">{{ mfaBeforeAfterText(row) }}</template>
                </el-table-column>
                <el-table-column :label="$t('system.user.mfaOperator')" min-width="150" align="center" show-overflow-tooltip>
                    <template #default="{ row }">{{ mfaOperatorText(row) }}</template>
                </el-table-column>
                <el-table-column prop="clientIp" :label="$t('system.user.mfaClientIp')" min-width="130" align="center" show-overflow-tooltip />
                <el-table-column prop="reason" :label="$t('common.remark')" min-width="220" align="left" show-overflow-tooltip />
            </StandardTable>
            <div class="pagination-container" v-show="mfaLogTotal > 0">
                <el-pagination v-model:current-page="mfaLogPage" v-model:page-size="mfaLogPageSize" :total="mfaLogTotal" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadMfaLogs" @current-change="loadMfaLogs" />
            </div>
        </CommonDetailDrawer>

        <el-dialog v-model="roleAuthVisible" :title="$t('system.user.assignRole')" width="920px" class="role-auth-dialog" append-to-body destroy-on-close>
            <el-alert class="role-auth-alert" :title="$t('system.user.assignRoleLimitTip')" type="info" show-icon :closable="false" />
            <el-table ref="roleTableRef" v-loading="roleAuthLoading" :data="roleRows" row-key="roleId" max-height="420" @selection-change="handleRoleSelection">
                <el-table-column type="selection" width="50" align="center" :selectable="isRoleSelectable" />
                <el-table-column prop="roleCode" :label="$t('system.user.roleCode')" min-width="160" align="center" :show-overflow-tooltip="true" />
                <el-table-column prop="roleName" :label="$t('system.user.roleName')" min-width="140" align="center" :show-overflow-tooltip="true" />
                <el-table-column prop="roleType" :label="$t('system.user.roleType')" width="100" align="center" />
                <el-table-column prop="dataScope" :label="$t('system.user.dataScope')" width="110" align="center" />
                <el-table-column :label="$t('system.user.assignable')" width="110" align="center">
                    <template #default="{ row }"><el-tag :type="row.assignable === false ? 'warning' : 'success'" size="small">{{ row.assignable === false ? $t('system.user.notAssignable') : $t('system.user.assignable') }}</el-tag></template>
                </el-table-column>
                <el-table-column :label="$t('common.status')" width="80" align="center"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag></template></el-table-column>
            </el-table>
            <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitRoleAuth">{{ $t('common.confirm') }}</el-button><el-button @click="roleAuthVisible = false">{{ $t('common.cancel') }}</el-button></div></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type TableInstance } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Download, View, MoreFilled } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
    createUser,
    deleteUsers,
    disableUserMfa,
    exemptUserMfa,
    exportUsers,
    getUserRoles,
    grantUserRoles,
    requireUserMfa,
    resendUserMfaBindMail,
    resetUserMfa,
    resetUserPassword,
    searchUserMfaLogs,
    searchUsers,
    unlockUserMfa,
    updateUser,
    updateUserStatus,
    type SysUserAccount,
    type SysUserMfaLog,
    type SysUserMfaLogQuery,
} from '@/api/system/user';
import { getDeptTree, type SysDept } from '@/api/system/dept';
import { getAllPosts, type SysPost } from '@/api/system/post';
import type { SysRole } from '@/api/system/role';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { CommonStatus } from '@/enums/status';
import { loadDictOptions, type SelectOption } from '@/views/channel/shared';
import TransactionTimeRangeFilter from '@/views/transaction/components/TransactionTimeRangeFilter.vue';
import {
    DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    defaultTransactionTodayRange,
    ensureTransactionTimezoneOptions,
    splitDateRange,
} from '@/views/transaction/shared';

const { locale, t } = useI18n();

interface UserRow extends SysUserAccount { statusTag: CommonStatus; lockedText: string; }
interface UserForm { accountId?: number; loginAccount: string; password: string; realName: string; deptId?: number; postIds: number[]; mobile: string; email: string; status: number; remark: string; }
type PostOption = SysPost & { id: number };
type MfaActionType = 'require' | 'reset' | 'exempt' | 'disable' | 'unlock' | 'resend';

const statusOptions = [{ label: t('common.enable'), value: 1 }, { label: t('common.disable'), value: 0 }];
const showSearch = ref(true);
const query = reactive<Record<string, unknown>>({});
const queryFormRef = ref<FormInstance>();
const loading = ref(false);
const rows = ref<UserRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const selectedRows = ref<UserRow[]>([]);
const detailVisible = ref(false);
const userDialogVisible = ref(false);
const resetDialogVisible = ref(false);
const roleAuthVisible = ref(false);
const roleAuthLoading = ref(false);
const roleAuthSaving = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const activeRow = ref<UserRow | null>(null);
const userFormRef = ref<FormInstance>();
const resetFormRef = ref<FormInstance>();
const roleTableRef = ref<TableInstance>();
const roleRows = ref<SysRole[]>([]);
const selectedRoleIds = ref<number[]>([]);
const deptOptions = ref<SysDept[]>([]);
const postOptions = ref<PostOption[]>([]);
const dialogTitle = computed(() => formMode.value === 'create' ? t('system.user.addUser') : t('system.user.editUser'));
const userForm = reactive<UserForm>({ loginAccount: '', password: '', realName: '', deptId: undefined, postIds: [], mobile: '', email: '', status: 1, remark: '' });
const resetForm = reactive({ password: '' });
const mfaActionDialogVisible = ref(false);
const mfaActionSaving = ref(false);
const mfaActionType = ref<MfaActionType>('require');
const mfaActionFormRef = ref<FormInstance>();
const mfaActionForm = reactive({ reason: '', exemptUntil: '' });
const mfaLogVisible = ref(false);
const mfaLogLoading = ref(false);
const mfaLogRows = ref<SysUserMfaLog[]>([]);
const mfaLogTotal = ref(0);
const mfaLogPage = ref(1);
const mfaLogPageSize = ref(10);
const mfaLogTimeRange = ref<string[]>(defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE));
const timezoneOptions = ref<SelectOption[]>([]);
const mfaLogQuery = reactive<SysUserMfaLogQuery>({
    queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
});
const devDefaultUserPassword = import.meta.env.DEV ? 'Admin@123456' : '';
const mfaLogActionValues = ['LOGIN_CHALLENGE', 'LOGIN_LOCKED', 'BIND_CONFIRM', 'LOGIN_VERIFY', 'REQUIRE', 'RESET', 'EXEMPT', 'DISABLE', 'UNLOCK', 'RESEND_BIND_MAIL', 'SEND_NOTICE'];
const mfaLogResultValues = ['SUCCESS', 'FAILED'];
const mfaLogActionOptions = computed(() => mfaLogActionValues.map((value) => ({ value, label: mfaActionText(value) })));
const mfaLogResultOptions = computed(() => mfaLogResultValues.map((value) => ({ value, label: mfaResultText(value) })));

const userFormRules = computed<FormRules>(() => ({
    loginAccount: [{ required: true, message: t('login.accountRequired'), trigger: 'blur' }],
    password: formMode.value === 'create' ? [{ required: true, min: 8, max: 64, message: t('system.user.passwordRequired'), trigger: 'blur' }] : [],
    realName: [{ required: true, message: t('system.user.realNameRequired'), trigger: 'blur' }],
    email: [
        { required: true, message: t('system.user.emailRequired'), trigger: 'blur' },
        { type: 'email', message: t('system.user.emailFormat'), trigger: 'blur' },
    ],
    status: [{ required: true, message: t('system.user.statusRequired'), trigger: 'change' }],
}));
const resetFormRules: FormRules = { password: [{ required: true, min: 8, max: 64, message: t('common.pleaseInput'), trigger: 'blur' }] };
const mfaActionRules: FormRules = {
    reason: [{ required: true, message: t('system.user.mfaReasonRequired'), trigger: 'blur' }],
};
const mfaActionTitle = computed(() => t(`system.user.${mfaActionTitleKey(mfaActionType.value)}`));
const mfaActionTip = computed(() => t(`system.user.${mfaActionTipKey(mfaActionType.value)}`));
const mfaLogTimeZone = computed(() => mfaLogQuery.queryTimeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE);

watch([page, pageSize], () => { loadData(); });
watch([mfaLogPage, mfaLogPageSize], () => { if (mfaLogVisible.value) loadMfaLogs(); });
onMounted(() => {
    loadOrgOptions();
    loadTimezoneOptions();
    loadData();
});

async function loadData() {
    loading.value = true;
    try {
        const result = await searchUsers({ pageNo: page.value, pageSize: pageSize.value, loginAccount: keyword(), deptId: numericDeptId(), status: numericStatus() });
        rows.value = result.records.map(normalizeRow);
        total.value = result.total;
    } catch (error) {
        rows.value = [];
        total.value = 0;
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

async function loadOrgOptions() {
    try {
        const [deptTree, posts] = await Promise.all([getDeptTree(), getAllPosts()]);
        deptOptions.value = deptTree;
        postOptions.value = posts.filter((post): post is PostOption => typeof post.id === 'number');
    } catch (error) {
        deptOptions.value = [];
        postOptions.value = [];
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    }
}

async function loadTimezoneOptions() {
    const options = await loadDictOptions('sys_timezone', String(locale.value || 'zh-CN')).catch(() => []);
    timezoneOptions.value = ensureTransactionTimezoneOptions(options);
}

function handleQuery() { if (page.value === 1) { loadData(); return; } page.value = 1; }
function resetQuery() { Object.keys(query).forEach((k) => { query[k] = undefined; }); handleQuery(); }
function handleSelectionChange(selection: UserRow[]) { selectedRows.value = selection; }

async function handleAdd() {
    formMode.value = 'create';
    activeRow.value = null;
    Object.assign(userForm, { accountId: undefined, loginAccount: '', password: devDefaultUserPassword, realName: '', deptId: undefined, postIds: [], mobile: '', email: '', status: 1, remark: '' });
    selectedRoleIds.value = [];
    userDialogVisible.value = true;
    nextTick(() => userFormRef.value?.clearValidate());
}

async function handleUpdate(row: UserRow) {
    formMode.value = 'edit';
    activeRow.value = row;
    Object.assign(userForm, { accountId: row.accountId, loginAccount: row.loginAccount, password: '', realName: row.realName || '', deptId: row.deptId, postIds: row.postIds || [], mobile: row.mobile || '', email: row.email || '', status: row.status ?? 1, remark: row.remark || '' });
    userDialogVisible.value = true;
    nextTick(() => userFormRef.value?.clearValidate());
}

function openDetail(row: UserRow) { activeRow.value = row; detailVisible.value = true; }
function openResetPassword(row: UserRow) { activeRow.value = row; resetForm.password = devDefaultUserPassword; resetDialogVisible.value = true; nextTick(() => resetFormRef.value?.clearValidate()); }

async function submitUserForm() {
    const valid = await userFormRef.value?.validate().catch(() => false);
    if (!valid) return;
    try {
        if (formMode.value === 'create') {
            await createUser({ loginAccount: userForm.loginAccount.trim(), password: userForm.password, realName: userForm.realName.trim(), deptId: userForm.deptId, postIds: userForm.postIds, mobile: trimOptional(userForm.mobile), email: userForm.email.trim(), status: userForm.status, remark: trimOptional(userForm.remark) });
            ElMessage.success(t('common.addSuccess'));
        } else if (userForm.accountId) {
            await updateUser({ accountId: userForm.accountId, realName: userForm.realName.trim(), deptId: userForm.deptId, postIds: userForm.postIds, mobile: trimOptional(userForm.mobile), email: userForm.email.trim(), status: userForm.status, remark: trimOptional(userForm.remark) });
            ElMessage.success(t('common.editSuccess'));
        }
        userDialogVisible.value = false;
        loadData();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    }
}

async function submitResetPassword() {
    const valid = await resetFormRef.value?.validate().catch(() => false);
    if (!valid || !activeRow.value) return;
    try {
        await resetUserPassword({ accountId: activeRow.value.accountId, password: resetForm.password });
        resetDialogVisible.value = false;
        ElMessage.success(t('common.success'));
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    }
}

async function handleStatusChange(row: UserRow) {
    const nextStatus = row.status === 1 ? 0 : 1;
    const actionText = nextStatus === 1 ? t('common.enable') : t('common.disable');
    try {
        await ElMessageBox.confirm(t('system.user.statusToggleConfirm', { action: actionText, name: row.loginAccount }), t('common.confirm'), { type: nextStatus === 1 ? 'success' : 'warning' });
        await updateUserStatus({ accountId: row.accountId, status: nextStatus });
        ElMessage.success(t('common.success'));
        loadData();
    } catch (error) { if (error instanceof Error) ElMessage.error(error.message); }
}

async function handleDelete(rowsParam?: UserRow[]) {
    const targets = rowsParam ?? selectedRows.value;
    if (!targets.length) { ElMessage.warning(t('common.pleaseSelect')); return; }
    const names = targets.map((r) => r.loginAccount).join('、');
    try {
        await ElMessageBox.confirm(t('system.user.deleteConfirm', { name: names }), t('common.delete'), { type: 'warning' });
        await deleteUsers(targets.map((item) => item.accountId));
        ElMessage.success(t('common.deleteSuccess'));
        loadData();
    } catch (error) {
        if (error instanceof Error) ElMessage.error(error.message);
    }
}

async function handleExport() {
    try {
        await exportUsers({ pageNo: page.value, pageSize: pageSize.value, loginAccount: keyword(), deptId: numericDeptId(), status: numericStatus() });
        ElMessage.success(t('common.export'));
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    }
}

function handleUserCommand(command: string, row: UserRow) {
    if (command === 'role') {
        openRoleAuth(row);
        return;
    }
    if (command === 'password') {
        openResetPassword(row);
        return;
    }
    if (command === 'delete') {
        handleDelete([row]);
        return;
    }
    if (command === 'mfaLogs') {
        openMfaLogs(row);
        return;
    }
    const actionMap: Record<string, MfaActionType> = {
        mfaRequire: 'require',
        mfaReset: 'reset',
        mfaUnlock: 'unlock',
        mfaResend: 'resend',
        mfaExempt: 'exempt',
        mfaDisable: 'disable',
    };
    const action = actionMap[command];
    if (action) {
        openMfaAction(row, action);
    }
}

function openMfaAction(row: UserRow, action: MfaActionType) {
    activeRow.value = row;
    mfaActionType.value = action;
    mfaActionForm.reason = '';
    mfaActionForm.exemptUntil = '';
    mfaActionDialogVisible.value = true;
    nextTick(() => mfaActionFormRef.value?.clearValidate());
}

async function submitMfaAction() {
    const valid = await mfaActionFormRef.value?.validate().catch(() => false);
    if (!valid || !activeRow.value) return;
    mfaActionSaving.value = true;
    try {
        const payload = { accountId: activeRow.value.accountId, reason: mfaActionForm.reason.trim() };
        if (mfaActionType.value === 'require') await requireUserMfa(payload);
        if (mfaActionType.value === 'reset') await resetUserMfa(payload);
        if (mfaActionType.value === 'unlock') await unlockUserMfa(payload);
        if (mfaActionType.value === 'resend') await resendUserMfaBindMail(payload);
        if (mfaActionType.value === 'disable') await disableUserMfa(payload);
        if (mfaActionType.value === 'exempt') await exemptUserMfa({ ...payload, exemptUntil: mfaActionForm.exemptUntil || undefined });
        ElMessage.success(t('common.success'));
        mfaActionDialogVisible.value = false;
        loadData();
    } catch (error) {
        ElMessage.error(resolveMfaActionErrorMessage(error));
    } finally {
        mfaActionSaving.value = false;
    }
}

async function openMfaLogs(row: UserRow) {
    activeRow.value = row;
    mfaLogQuery.accountId = row.accountId;
    mfaLogQuery.loginAccount = row.loginAccount;
    mfaLogQuery.actionType = '';
    mfaLogQuery.result = '';
    mfaLogQuery.queryTimeZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
    mfaLogTimeRange.value = defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
    mfaLogPage.value = 1;
    mfaLogVisible.value = true;
    await loadMfaLogs();
}

function handleMfaLogSearch() {
    mfaLogPage.value = 1;
    loadMfaLogs();
}

function resetMfaLogQuery() {
    if (activeRow.value) {
        mfaLogQuery.accountId = activeRow.value.accountId;
        mfaLogQuery.loginAccount = activeRow.value.loginAccount;
    }
    mfaLogQuery.actionType = '';
    mfaLogQuery.result = '';
    mfaLogQuery.queryTimeZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
    mfaLogTimeRange.value = defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
    handleMfaLogSearch();
}

async function loadMfaLogs() {
    mfaLogLoading.value = true;
    try {
        const range = splitDateRange(mfaLogTimeRange.value);
        const result = await searchUserMfaLogs({
            ...mfaLogQuery,
            ...range,
            pageNo: mfaLogPage.value,
            pageSize: mfaLogPageSize.value,
        });
        mfaLogRows.value = result.records || [];
        mfaLogTotal.value = result.total || 0;
    } catch (error) {
        mfaLogRows.value = [];
        mfaLogTotal.value = 0;
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    } finally {
        mfaLogLoading.value = false;
    }
}

async function openRoleAuth(row: UserRow) {
    activeRow.value = row;
    roleAuthVisible.value = true;
    roleAuthLoading.value = true;
    try {
        const result = await getUserRoles({ accountId: row.accountId });
        roleRows.value = result.roles;
        selectedRoleIds.value = result.checkedRoleIds || [];
        await nextTick();
        applyRoleSelection();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
        roleAuthVisible.value = false;
    } finally {
        roleAuthLoading.value = false;
    }
}

function handleRoleSelection(selection: SysRole[]) { selectedRoleIds.value = selection.map((item) => item.roleId); }
function isRoleSelectable(row: SysRole) { return row.assignable !== false; }

async function submitRoleAuth() {
    if (!activeRow.value || roleAuthSaving.value) return;
    roleAuthSaving.value = true;
    try {
        await grantUserRoles({ accountId: activeRow.value.accountId, roleIds: selectedRoleIds.value });
        ElMessage.success(t('common.saveSuccess'));
        roleAuthVisible.value = false;
        loadData();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    } finally {
        roleAuthSaving.value = false;
    }
}

function keyword() { return String(query.loginAccount || '').trim() || undefined; }
function numericDeptId() { return typeof query.deptId === 'number' ? query.deptId : undefined; }
function numericStatus() { return typeof query.status === 'number' ? query.status : undefined; }
function normalizeRow(row: SysUserAccount): UserRow { return { ...row, statusTag: row.status === 1 ? CommonStatus.Enabled : CommonStatus.Disabled, lockedText: row.locked === 1 ? t('common.yes') : t('common.no') }; }
function trimOptional(value: string) { return value.trim() || undefined; }
function formatPostNames(row: SysUserAccount) { return row.postNames?.length ? row.postNames.join(locale.value === 'zh-CN' ? '、' : ', ') : '-'; }
function applyRoleSelection() { const checkedIdSet = new Set(selectedRoleIds.value); roleRows.value.forEach((row) => { roleTableRef.value?.toggleRowSelection(row, checkedIdSet.has(row.roleId)); }); }

function mfaPolicyText(value?: string) { return value ? t(`system.user.mfaPolicy_${value}`, value) : t('system.user.mfaPolicy_OPTIONAL'); }
function mfaStatusText(value?: string) { return value ? t(`system.user.mfaStatus_${value}`, value) : t('system.user.mfaStatus_NOT_ENABLED'); }
function mfaPolicyTag(value?: string) {
    if (value === 'REQUIRED') return 'warning';
    if (value === 'EXEMPT') return 'info';
    return 'primary';
}
function mfaStatusTag(value?: string) {
    if (value === 'ENABLED') return 'success';
    if (value === 'LOCKED') return 'danger';
    if (value === 'PENDING_BIND' || value === 'RESET_REQUIRED') return 'warning';
    return 'info';
}
function mfaActionText(value?: string) { return value ? t(`system.user.mfaAction_${value}`, value) : '-'; }
function mfaResultText(value?: string) { return value ? t(`system.user.mfaResult_${value}`, value) : '-'; }
function mfaResultTag(value?: string) { return value === 'SUCCESS' ? 'success' : value === 'FAILED' ? 'danger' : 'info'; }
function mfaOperatorText(row: SysUserMfaLog) {
    const operator = row.operatorLoginAccount || row.loginAccount || '-';
    return row.operatorLoginAccount && row.operatorLoginAccount !== row.loginAccount
        ? operator
        : t('system.user.mfaSelfOperator', { account: operator });
}
function mfaActionTitleKey(value: MfaActionType) {
    return ({
        require: 'mfaRequireTitle',
        reset: 'mfaResetTitle',
        exempt: 'mfaExemptTitle',
        disable: 'mfaDisableTitle',
        unlock: 'mfaUnlockTitle',
        resend: 'mfaResendTitle',
    })[value];
}
function mfaActionTipKey(value: MfaActionType) {
    return ({
        require: 'mfaRequireTip',
        reset: 'mfaResetTip',
        exempt: 'mfaExemptTip',
        disable: 'mfaDisableTip',
        unlock: 'mfaUnlockTip',
        resend: 'mfaResendTip',
    })[value];
}
function resolveMfaActionErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : '';
    const key = ({
        'can not reset own mfa': 'mfaCannotResetSelf',
        'can not exempt own mfa': 'mfaCannotExemptSelf',
        'can not disable own mfa': 'mfaCannotDisableSelf',
        'mfa bind mail can only resend for pending users': 'mfaBindMailOnlyPending',
        '不能重置当前登录账号自己的 MFA': 'mfaCannotResetSelf',
        '不能豁免当前登录账号自己的 MFA': 'mfaCannotExemptSelf',
        '不能停用当前登录账号自己的 MFA': 'mfaCannotDisableSelf',
        'MFA 绑定邮件只能对待绑定或需重绑用户重发': 'mfaBindMailOnlyPending',
    } as Record<string, string>)[message];
    return key ? t(`system.user.${key}`) : (message || t('common.saveFailed'));
}
function mfaBeforeAfterText(row: SysUserMfaLog) {
    const beforeText = mfaPolicyStatusText(row.beforePolicy, row.beforeStatus);
    const afterText = mfaPolicyStatusText(row.afterPolicy, row.afterStatus);
    return `${beforeText} -> ${afterText}`;
}
function mfaPolicyStatusText(policy?: string, status?: string) {
    const parts = [policy ? mfaPolicyText(policy) : '', status ? mfaStatusText(status) : ''].filter(Boolean);
    return parts.length ? parts.join(' / ') : '-';
}
</script>

<style scoped>
.role-tags,
.detail-tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.operation-button-group {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    white-space: nowrap;
}

.operation-button-group :deep(.el-button + .el-button) {
    margin-left: 0;
}

.role-auth-alert,
.mfa-action-alert {
    margin-bottom: 14px;
}

.mfa-log-search {
    margin-bottom: 12px;
}

.mfa-log-time-item {
    width: 100%;
}

:deep(.role-auth-dialog) {
    max-width: calc(100vw - 32px);
}
</style>
