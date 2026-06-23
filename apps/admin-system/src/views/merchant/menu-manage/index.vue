<template>
    <div class="app-container">
        <el-form ref="queryFormRef" :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="68px">
            <el-form-item :label="$t('system.menu.menuName')" prop="menuName"><el-input v-model="query.menuName" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="loadData" /></el-form-item>
            <el-form-item :label="$t('system.menu.menuType')" prop="menuType"><el-select v-model="query.menuType" :placeholder="$t('common.pleaseSelect')" clearable><el-option :label="$t('system.menu.typeCatalog')" value="CATALOG" /><el-option :label="$t('system.menu.typeMenu')" value="MENU" /><el-option :label="$t('system.menu.typeButton')" value="BUTTON" /><el-option :label="$t('system.menu.typeLink')" value="LINK" /></el-select></el-form-item>
            <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
            <el-form-item><el-button type="primary" :icon="Search" size="small" @click="loadData">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button></el-form-item>
        </el-form>
        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="handleAdd()" v-hasPermi="'merchant:menu-manage:add'">{{ $t('common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="info" plain :icon="Sort" size="small" @click="toggleExpandAll">{{ $t('system.menu.expandCollapse') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
        </el-row>
        <el-table v-if="refreshTable" v-loading="loading" :data="rows" row-key="menuId" :default-expand-all="isExpandAll" :tree-props="{ children: 'children' }" size="small">
            <el-table-column prop="menuName" :label="$t('system.menu.menuName')" min-width="200" :show-overflow-tooltip="true" />
            <el-table-column :label="$t('system.menu.menuType')" width="90" align="center">
                <template #default="{ row }"><el-tag v-if="row.menuType==='MENU'" type="success" size="small">{{ $t('system.menu.typeMenu') }}</el-tag><el-tag v-else-if="row.menuType==='CATALOG'" type="primary" size="small">{{ $t('system.menu.typeCatalog') }}</el-tag><el-tag v-else-if="row.menuType==='BUTTON'" type="warning" size="small">{{ $t('system.menu.typeButton') }}</el-tag><el-tag v-else type="danger" size="small">{{ $t('system.menu.typeLink') }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="routePath" :label="$t('system.menu.routePath')" min-width="160" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="componentPath" :label="$t('system.menu.componentPath')" min-width="150" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="permissionCode" :label="$t('system.menu.permissionCode')" min-width="170" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="visibleText" :label="$t('system.menu.visible')" width="70" align="center" />
            <el-table-column :label="$t('common.status')" width="80" align="center"><template #default="{ row }"><el-switch :model-value="row.statusValue" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'merchant:menu-manage:edit'" /></template></el-table-column>
            <el-table-column prop="sortNo" :label="$t('common.sort')" width="70" align="center" />
            <el-table-column :label="$t('common.operation')" align="center" width="250" class-name="small-padding fixed-width" fixed="right">
                <template #default="{ row }"><el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'merchant:menu-manage:list'">{{ $t('common.detail') }}</el-button><el-button size="small" type="primary" link :icon="Edit" @click="handleUpdate(row)" v-hasPermi="'merchant:menu-manage:edit'">{{ $t('common.edit') }}</el-button><el-button size="small" type="primary" link :icon="Plus" @click="handleAdd(row)" v-hasPermi="'merchant:menu-manage:add'">{{ $t('common.add') }}</el-button><el-button size="small" type="danger" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'merchant:menu-manage:remove'">{{ $t('common.delete') }}</el-button></template>
            </el-table-column>
        </el-table>
        <div class="pagination-container" style="color:#909399;font-size:13px">{{ $t('system.menu.nodeCount', { count: total }) }}</div>

        <el-dialog v-model="detailVisible" :title="$t('system.menu.menuDetail')" width="700px" append-to-body destroy-on-close>
            <el-descriptions :column="2" border size="small">
                <el-descriptions-item :label="$t('system.menu.menuId')">{{ activeRow?.menuId ?? '-' }}</el-descriptions-item><el-descriptions-item :label="$t('system.menu.parentId')">{{ activeRow?.parentId ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.menu.menuCode')">{{ activeRow?.menuCode ?? '-' }}</el-descriptions-item><el-descriptions-item :label="$t('system.menu.menuName')">{{ activeRow?.menuName ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.menu.menuType')">{{ activeRow?.menuTypeText ?? '-' }}</el-descriptions-item><el-descriptions-item :label="$t('system.menu.icon')">{{ activeRow?.icon ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.menu.routePath')">{{ activeRow?.routePath ?? '-' }}</el-descriptions-item><el-descriptions-item :label="$t('system.menu.componentPath')">{{ activeRow?.componentPath ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.menu.permissionCode')">{{ activeRow?.permissionCode ?? '-' }}</el-descriptions-item><el-descriptions-item :label="$t('system.menu.redirect')">{{ activeRow?.redirect ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.menu.visible')">{{ activeRow?.visibleText ?? '-' }}</el-descriptions-item><el-descriptions-item :label="$t('system.menu.keepAlive')">{{ activeRow?.keepAliveText ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.menu.externalLink')">{{ activeRow?.externalLinkText ?? '-' }}</el-descriptions-item><el-descriptions-item :label="$t('common.sort')">{{ activeRow?.sortNo ?? '-' }}</el-descriptions-item>
            </el-descriptions>
            <template #footer><div class="dialog-footer"><el-button @click="detailVisible = false">{{ $t('common.close') }}</el-button></div></template>
        </el-dialog>

        <el-dialog :title="dialogTitle" v-model="menuDialogVisible" width="560px" append-to-body destroy-on-close>
            <el-form ref="menuFormRef" :model="menuForm" :rules="menuFormRules" label-width="100px" style="padding:0 20px">
                <el-form-item :label="$t('system.menu.parentMenu')" prop="parentId"><el-tree-select v-model="menuForm.parentId" :data="treeSelectData" node-key="menuId" :props="{ label:'menuName', children:'children' }" check-strictly default-expand-all filterable style="width:100%" /></el-form-item>
                <el-form-item :label="$t('system.menu.menuType')" prop="menuType"><el-radio-group v-model="menuForm.menuType"><el-radio value="CATALOG">{{ $t('system.menu.typeCatalog') }}</el-radio><el-radio value="MENU">{{ $t('system.menu.typeMenu') }}</el-radio><el-radio value="BUTTON">{{ $t('system.menu.typeButton') }}</el-radio><el-radio value="LINK">{{ $t('system.menu.typeLink') }}</el-radio></el-radio-group></el-form-item>
                <el-form-item v-if="formMode==='create'" :label="$t('system.menu.menuCode')" prop="menuCode"><el-input v-model="menuForm.menuCode" maxlength="100" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('system.menu.menuName')" prop="menuName"><el-input v-model="menuForm.menuName" maxlength="100" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('common.sort')" prop="sortNo"><el-input-number v-model="menuForm.sortNo" :min="0" :max="9999" controls-position="right" /></el-form-item>
                <el-form-item :label="$t('system.menu.routePath')" prop="routePath"><el-input v-model="menuForm.routePath" maxlength="255" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('system.menu.componentPath')" prop="componentPath"><el-input v-model="menuForm.componentPath" maxlength="255" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('system.menu.permissionCode')" prop="permissionCode"><el-input v-model="menuForm.permissionCode" maxlength="150" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('system.menu.icon')" prop="icon">
                    <el-popover placement="bottom-start" :width="380" trigger="click">
                        <template #reference><el-input v-model="menuForm.icon" readonly :placeholder="$t('system.menu.selectIcon')" style="cursor:pointer"><template #prefix><el-icon v-if="menuForm.icon"><component :is="menuIconMap[menuForm.icon]" /></el-icon></template></el-input></template>
                        <div class="menu-icon-grid">
                            <el-button v-for="(v,k) in menuIconMap" :key="k" class="menu-icon-button" size="small" :type="menuForm.icon===k?'primary':''" @click="menuForm.icon=k" :title="k"><el-icon :size="15"><component :is="v" /></el-icon></el-button>
                        </div>
                    </el-popover>
                </el-form-item>
                <el-form-item :label="$t('system.menu.redirect')" prop="redirect"><el-input v-model="menuForm.redirect" maxlength="255" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="menuForm.status" style="width:100%"><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
                <el-form-item :label="$t('system.menu.visible')"><el-switch v-model="menuForm.visible" :active-value="1" :inactive-value="0" /></el-form-item>
                <el-form-item :label="$t('system.menu.keepAlive')"><el-switch v-model="menuForm.keepAlive" :active-value="1" :inactive-value="0" /></el-form-item>
                <el-form-item :label="$t('system.menu.externalLink')"><el-switch v-model="menuForm.externalLink" :active-value="1" :inactive-value="0" /></el-form-item>
            </el-form>
            <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitMenuForm">{{ $t('common.confirm') }}</el-button><el-button @click="menuDialogVisible = false">{{ $t('common.cancel') }}</el-button></div></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, type Component } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import * as Icons from '@element-plus/icons-vue';
const { Search, Refresh, Plus, Edit, View, Sort, Delete } = Icons;
const menuIconMap = Object.fromEntries(
  Object.entries(Icons)
    .filter(([k]) => k !== 'Menu' && /^[A-Z][a-z]/.test(k))
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([k,v]) => [k, v as Component])
) as Record<string, Component>;
import RightToolbar from '@/components/RightToolbar/index.vue';
import { createMerchantMenu, deleteMerchantMenu, treeMerchantMenus, updateMerchantMenu, updateMerchantMenuStatus, type SysMenu } from '@/api/merchant/menu-manage';
import { CommonStatus } from '@/enums/status';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

interface SysMenuRow extends Omit<SysMenu,'children'|'status'>{ status:CommonStatus; statusValue:number; menuTypeText:string; visibleText:string; keepAliveText:string; externalLinkText:string; children?:SysMenuRow[] }
interface MenuForm { menuId?:number; parentId:number; menuCode:string; menuName:string; menuType:string; routePath:string; componentPath:string; permissionCode:string; icon:string; redirect:string; visible:number; keepAlive:number; externalLink:number; sortNo:number; status:number }
const showSearch=ref(true); const query=reactive<Record<string,unknown>>({}); const queryFormRef=ref<FormInstance>();
const loading=ref(false); const rows=ref<SysMenuRow[]>([]); const total=ref(0);
const detailVisible=ref(false); const menuDialogVisible=ref(false); const formMode=ref<'create'|'edit'>('create');
const activeRow=ref<SysMenuRow|null>(null); const menuFormRef=ref<FormInstance>();
const isExpandAll=ref(true); const refreshTable=ref(true);
const dialogTitle=computed(()=>formMode.value==='create'?t('system.menu.addMenu'):t('system.menu.editMenu'));
const menuForm=reactive<MenuForm>({parentId:0,menuCode:'',menuName:'',menuType:'MENU',routePath:'',componentPath:'',permissionCode:'',icon:'',redirect:'',visible:1,keepAlive:0,externalLink:0,sortNo:100,status:1});
const menuFormRules=computed<FormRules>(()=>({parentId:[{required:true,message:t('system.menu.pleaseSelectParent'),trigger:'change'}],menuCode:[{required:true,message:t('common.pleaseInput'),trigger:'blur'}],menuName:[{required:true,message:t('common.pleaseInput'),trigger:'blur'}],menuType:[{required:true,message:t('system.menu.pleaseSelectType'),trigger:'change'}]}));
const menuTypeOptions=computed(()=>[{label:t('system.menu.typeCatalog'),value:'CATALOG'},{label:t('system.menu.typeMenu'),value:'MENU'},{label:t('system.menu.typeButton'),value:'BUTTON'},{label:t('system.menu.typeLink'),value:'LINK'}]);
const treeSelectData=computed(()=>[{menuId:0,menuName:t('system.menu.rootDir'),children:rows.value as any}]);

onMounted(()=>loadData());
async function loadData(){loading.value=true;try{const r=await treeMerchantMenus({menuName:tv(query.menuName),menuType:tv(query.menuType),status:nv(query.status)});rows.value=r.map(nr);total.value=cn(rows.value)}catch{rows.value=[];total.value=0}finally{loading.value=false}}
function resetQuery(){Object.keys(query).forEach(k=>query[k]='');loadData()}
function toggleExpandAll(){refreshTable.value=false;isExpandAll.value=!isExpandAll.value;nextTick(()=>{refreshTable.value=true})}
function openDetail(row:SysMenuRow){activeRow.value=row;detailVisible.value=true}
function handleAdd(row?:SysMenuRow){formMode.value='create';activeRow.value=null;Object.assign(menuForm,{menuId:undefined,parentId:row?row.menuId:0,menuCode:'',menuName:'',menuType:'MENU',routePath:'',componentPath:'',permissionCode:'',icon:'',redirect:'',visible:1,keepAlive:0,externalLink:0,sortNo:100,status:1});menuDialogVisible.value=true;nextTick(()=>menuFormRef.value?.clearValidate())}
function handleUpdate(row:SysMenuRow){formMode.value='edit';activeRow.value=row;Object.assign(menuForm,{menuId:row.menuId,parentId:row.parentId,menuCode:row.menuCode,menuName:row.menuName,menuType:row.menuType,routePath:row.routePath||'',componentPath:row.componentPath||'',permissionCode:row.permissionCode||'',icon:row.icon||'',redirect:row.redirect||'',visible:row.visible??1,keepAlive:row.keepAlive??0,externalLink:row.externalLink??0,sortNo:row.sortNo??100,status:row.statusValue});menuDialogVisible.value=true;nextTick(()=>menuFormRef.value?.clearValidate())}
async function submitMenuForm(){const v=await menuFormRef.value?.validate().catch(()=>false);if(!v)return;try{const p={parentId:menuForm.parentId,menuName:menuForm.menuName.trim(),menuType:menuForm.menuType,routePath:to(menuForm.routePath),componentPath:to(menuForm.componentPath),permissionCode:to(menuForm.permissionCode),icon:to(menuForm.icon),redirect:to(menuForm.redirect),visible:menuForm.visible,keepAlive:menuForm.keepAlive,externalLink:menuForm.externalLink,sortNo:menuForm.sortNo,status:menuForm.status};if(formMode.value==='create'){await createMerchantMenu({...p,menuCode:menuForm.menuCode.trim()});ElMessage.success(t('common.addSuccess'))}else if(menuForm.menuId){await updateMerchantMenu({...p,menuId:menuForm.menuId});ElMessage.success(t('common.editSuccess'))}menuDialogVisible.value=false;loadData()}catch(e){ElMessage.error(e instanceof Error?e.message:t('common.saveFailed'))}}
async function toggleStatus(row:SysMenuRow){const ns=row.statusValue===1?0:1;const at=ns===1?t('common.enable'):t('common.disable');try{await ElMessageBox.confirm(t('system.role.statusToggleConfirm',{action:at,name:row.menuName}),t('common.confirm'),{type:ns===1?'success':'warning'});await updateMerchantMenuStatus({menuId:row.menuId,status:ns});ElMessage.success(t('common.success'));loadData()}catch(e){if(e instanceof Error)ElMessage.error(e.message)}}
async function handleDelete(row:SysMenuRow){try{await ElMessageBox.confirm(`确认删除菜单 ${row.menuName}？`,t('common.confirm'),{type:'warning'});await deleteMerchantMenu(row.menuId);ElMessage.success(t('common.deleteSuccess'));loadData()}catch(e){if(e instanceof Error)ElMessage.error(e.message)}}
function tv(v:unknown){return String(v||'').trim()||undefined}
function nv(v:unknown){return typeof v==='number'?v:undefined}
function nr(m:SysMenu):SysMenuRow{return{...m,status:m.status===1?CommonStatus.Enabled:CommonStatus.Disabled,statusValue:m.status??0,menuTypeText:tl(m.menuType),visibleText:yn(m.visible),keepAliveText:yn(m.keepAlive),externalLinkText:yn(m.externalLink),children:m.children?.map(nr)}}
function tl(type:string){const ls:Record<string,string>={CATALOG:t('system.menu.typeCatalog'),MENU:t('system.menu.typeMenu'),BUTTON:t('system.menu.typeButton'),LINK:t('system.menu.typeLink')};return ls[type]||type||'-'}
function yn(v:number|undefined){return v===1?t('common.yes'):t('common.no')}
function cn(m:SysMenuRow[]):number{return m.reduce((c,x)=>c+1+cn(x.children||[]),0)}
function to(v:string){return v.trim()||undefined}
</script>

<style scoped>
.menu-icon-grid {
    display: grid;
    grid-template-columns: repeat(10, 32px);
    gap: 2px;
    max-height: 300px;
    overflow: auto;
    padding: 4px;
    justify-content: center;
}

.menu-icon-button {
    width: 30px;
    height: 30px;
    min-width: 30px;
    padding: 0;
    margin-left: 0;
}

.menu-icon-grid .el-button + .el-button {
    margin-left: 0;
}
</style>
