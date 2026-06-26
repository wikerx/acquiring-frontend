import type { AuthMenu, CommonResult, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from './http';

export interface IdsRequest {
    ids: number[];
}

export interface MerchantSystemPageQuery {
    pageNo?: number;
    pageSize?: number;
}

export interface DeptQuery extends MerchantSystemPageQuery {
    keyword?: string;
    status?: number;
}

export interface DeptItem {
    deptId: number;
    parentId: number;
    deptCode: string;
    deptName: string;
    sortNo: number;
    status: number;
    remark?: string;
    createdAt?: string;
    updatedAt?: string;
    children?: DeptItem[];
}

export interface PostQuery extends MerchantSystemPageQuery {
    keyword?: string;
    status?: number;
}

export interface PostItem {
    postId: number;
    postCode: string;
    postName: string;
    sortNo: number;
    status: number;
    remark?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface RoleQuery extends MerchantSystemPageQuery {
    roleName?: string;
    roleCode?: string;
    status?: number;
    createdStartTime?: string;
    createdEndTime?: string;
}

export interface RoleItem {
    roleId: number;
    roleCode: string;
    roleName: string;
    roleType: string;
    dataScope?: string;
    description?: string;
    status: number;
    sortNo: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface RoleSavePayload {
    roleCode: string;
    roleName: string;
    dataScope?: string;
    description?: string;
    status?: number;
    sortNo?: number;
    menuIds?: number[];
    permissionIds?: number[];
}

export interface AccountQuery extends MerchantSystemPageQuery {
    keyword?: string;
    roleId?: number;
    status?: number;
}

export interface AccountItem {
    accountId: number;
    userId: number;
    loginAccount: string;
    realName: string;
    mobile?: string;
    email?: string;
    status: number;
    locked?: number;
    roleIds: number[];
    roleNames: string[];
    deptIds: number[];
    postIds: number[];
    createdAt?: string;
}

export interface PermissionItem {
    permissionId: number;
    menuId?: number;
    permissionCode: string;
    permissionName: string;
    permissionType: string;
    resourceMethod?: string;
    resourcePath?: string;
}

export interface RoleMenuAuth {
    roleId: number;
    checkedMenuIds: number[];
    menus: AuthMenu[];
}

export interface RolePermissionAuth {
    roleId: number;
    checkedPermissionIds: number[];
    permissions: PermissionItem[];
}

export interface RoleGrantNode {
    id: string;
    nodeId: number;
    menuId?: number;
    permissionId?: number;
    nodeType: 'DIR' | 'MENU' | 'BTN';
    name: string;
    code?: string;
    children?: RoleGrantNode[];
}

export interface RoleGrantTree {
    roleId: number;
    role: RoleItem;
    checkedMenuIds: number[];
    checkedPermissionIds: number[];
    tree: RoleGrantNode[];
}

export const systemApi = {
    async depts() {
        const result = await http.get<CommonResult<DeptItem[]>>('/merchant/system/depts');
        return unwrapResult(result.data);
    },
    async pageDepts(params: DeptQuery) {
        const result = await http.get<CommonResult<PageResult<DeptItem>>>('/merchant/system/depts/page', { params });
        return unwrapResult(result.data);
    },
    async deptTree() {
        const result = await http.get<CommonResult<DeptItem[]>>('/merchant/system/depts/tree');
        return unwrapResult(result.data);
    },
    async saveDept(payload: Partial<DeptItem>, id?: number) {
        const result = id
            ? await http.put<CommonResult<DeptItem>>(`/merchant/system/depts/${id}`, payload)
            : await http.post<CommonResult<DeptItem>>('/merchant/system/depts', payload);
        return unwrapResult(result.data);
    },
    async deleteDept(id: number) {
        const result = await http.delete<CommonResult<void>>(`/merchant/system/depts/${id}`);
        return unwrapResult(result.data);
    },
    async posts() {
        const result = await http.get<CommonResult<PostItem[]>>('/merchant/system/posts');
        return unwrapResult(result.data);
    },
    async pagePosts(params: PostQuery) {
        const result = await http.get<CommonResult<PageResult<PostItem>>>('/merchant/system/posts/page', { params });
        return unwrapResult(result.data);
    },
    async savePost(payload: Partial<PostItem>, id?: number) {
        const result = id
            ? await http.put<CommonResult<PostItem>>(`/merchant/system/posts/${id}`, payload)
            : await http.post<CommonResult<PostItem>>('/merchant/system/posts', payload);
        return unwrapResult(result.data);
    },
    async deletePost(id: number) {
        const result = await http.delete<CommonResult<void>>(`/merchant/system/posts/${id}`);
        return unwrapResult(result.data);
    },
    async roles() {
        const result = await http.get<CommonResult<RoleItem[]>>('/merchant/system/roles');
        return unwrapResult(result.data);
    },
    async pageRoles(params: RoleQuery) {
        const result = await http.get<CommonResult<PageResult<RoleItem>>>('/merchant/system/roles/page', { params });
        return unwrapResult(result.data);
    },
    async roleDetail(id: number) {
        const result = await http.get<CommonResult<RoleItem>>(`/merchant/system/roles/${id}`);
        return unwrapResult(result.data);
    },
    async saveRole(payload: RoleSavePayload, id?: number) {
        const result = id
            ? await http.put<CommonResult<RoleItem>>(`/merchant/system/roles/${id}`, payload)
            : await http.post<CommonResult<RoleItem>>('/merchant/system/roles', payload);
        return unwrapResult(result.data);
    },
    async deleteRole(id: number) {
        const result = await http.delete<CommonResult<void>>(`/merchant/system/roles/${id}`);
        return unwrapResult(result.data);
    },
    async changeRoleStatus(id: number, status: number) {
        const result = await http.put<CommonResult<void>>(`/merchant/system/roles/${id}/status`, { status });
        return unwrapResult(result.data);
    },
    async roleGrantTree(id: number) {
        const result = await http.get<CommonResult<RoleGrantTree>>(`/merchant/system/roles/${id}/grant-tree`);
        return unwrapResult(result.data);
    },
    async roleGrantTreeTemplate() {
        const result = await http.get<CommonResult<RoleGrantTree>>('/merchant/system/roles/grant-tree-template');
        return unwrapResult(result.data);
    },
    async saveRoleGrantTree(id: number, menuIds: number[], permissionIds: number[]) {
        const result = await http.post<CommonResult<void>>(`/merchant/system/roles/${id}/grant-tree`, { menuIds, permissionIds });
        return unwrapResult(result.data);
    },
    async roleMenus(id: number) {
        const result = await http.get<CommonResult<RoleMenuAuth>>(`/merchant/system/roles/${id}/menus`);
        return unwrapResult(result.data);
    },
    async saveRoleMenus(id: number, ids: number[]) {
        const result = await http.post<CommonResult<void>>(`/merchant/system/roles/${id}/menus`, { ids });
        return unwrapResult(result.data);
    },
    async rolePermissions(id: number) {
        const result = await http.get<CommonResult<RolePermissionAuth>>(`/merchant/system/roles/${id}/permissions`);
        return unwrapResult(result.data);
    },
    async saveRolePermissions(id: number, ids: number[]) {
        const result = await http.post<CommonResult<void>>(`/merchant/system/roles/${id}/permissions`, { ids });
        return unwrapResult(result.data);
    },
    async accounts() {
        const result = await http.get<CommonResult<AccountItem[]>>('/merchant/system/accounts');
        return unwrapResult(result.data);
    },
    async pageAccounts(params: AccountQuery) {
        const result = await http.get<CommonResult<PageResult<AccountItem>>>('/merchant/system/accounts/page', { params });
        return unwrapResult(result.data);
    },
    async saveAccount(payload: Partial<AccountItem> & { password?: string }, id?: number) {
        const result = id
            ? await http.put<CommonResult<AccountItem>>(`/merchant/system/accounts/${id}`, payload)
            : await http.post<CommonResult<AccountItem>>('/merchant/system/accounts', payload);
        return unwrapResult(result.data);
    },
    async deleteAccount(id: number) {
        const result = await http.delete<CommonResult<void>>(`/merchant/system/accounts/${id}`);
        return unwrapResult(result.data);
    },
    async changeAccountStatus(id: number, status: number) {
        const result = await http.put<CommonResult<void>>(`/merchant/system/accounts/${id}/status`, { status });
        return unwrapResult(result.data);
    },
    async assignAccountRoles(id: number, ids: number[]) {
        const result = await http.post<CommonResult<void>>(`/merchant/system/accounts/${id}/roles`, { ids });
        return unwrapResult(result.data);
    },
    async assignAccountDepts(id: number, ids: number[]) {
        const result = await http.post<CommonResult<void>>(`/merchant/system/accounts/${id}/depts`, { ids });
        return unwrapResult(result.data);
    },
    async assignAccountPosts(id: number, ids: number[]) {
        const result = await http.post<CommonResult<void>>(`/merchant/system/accounts/${id}/posts`, { ids });
        return unwrapResult(result.data);
    },
};
