<template>
    <div class="table-row-actions">
        <el-tooltip
            v-for="action in directActions"
            :key="action.key"
            :disabled="!action.disabledReason"
            :content="action.disabledReason"
            placement="top"
        >
            <span class="table-row-actions__direct">
                <el-button
                    link
                    size="small"
                    :type="action.danger ? 'danger' : (action.type || 'primary')"
                    :icon="action.icon"
                    :disabled="action.disabled"
                    :loading="action.loading"
                    @click="emit('select', action.key)"
                >
                    {{ action.label }}
                </el-button>
            </span>
        </el-tooltip>

        <el-tooltip v-if="overflowActions.length" :content="moreLabel" placement="top">
            <el-dropdown trigger="click" placement="bottom-end" @command="handleCommand">
                <el-button class="table-row-actions__more" text circle size="small" :icon="MoreFilled" :aria-label="moreLabel" />
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item
                            v-for="action in overflowActions"
                            :key="action.key"
                            :command="action.key"
                            :icon="action.icon"
                            :disabled="action.disabled || action.loading"
                            :divided="action.divided"
                            :class="{ 'is-danger': action.danger }"
                            :title="action.disabledReason"
                        >
                            {{ action.label }}
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </el-tooltip>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { MoreFilled } from '@element-plus/icons-vue';
import { directTableRowActionCount, type TableRowAction } from '../tableRowActions';

const props = defineProps<{ actions: TableRowAction[]; moreLabel: string }>();
const emit = defineEmits<{ select: [key: string] }>();

const visibleActions = computed(() => props.actions.filter((action) => action.visible !== false));
const directCount = computed(() => directTableRowActionCount(visibleActions.value.length));
const directActions = computed(() => visibleActions.value.slice(0, directCount.value));
const overflowActions = computed(() => visibleActions.value.slice(directCount.value));

function handleCommand(key: string | number | object) {
    const actionKey = String(key);
    const action = overflowActions.value.find((item) => item.key === actionKey);
    if (!action || action.disabled || action.loading) return;
    emit('select', actionKey);
}
</script>

<style scoped>
.table-row-actions {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 28px;
    white-space: nowrap;
}

.table-row-actions__direct {
    display: inline-flex;
}

.table-row-actions__more {
    width: 28px;
    height: 28px;
    color: var(--el-color-primary);
}

:global(.el-dropdown-menu__item.is-danger) {
    color: var(--el-color-danger);
}
</style>
