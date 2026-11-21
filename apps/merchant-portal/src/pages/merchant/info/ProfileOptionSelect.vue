<template>
    <el-select
        v-model="model"
        :multiple="Array.isArray(model)"
        :allow-create="allowCreate"
        :clearable="clearable"
        :value-on-clear="''"
        :disabled="unavailable || undefined"
        :loading="loading"
        :collapse-tags="Array.isArray(model)"
        :collapse-tags-tooltip="Array.isArray(model)"
        :filter-method="filter"
        filterable
        @visible-change="resetFilter"
    >
        <el-option
            v-for="option in visibleOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
        />
    </el-select>
</template>

<script setup lang="ts" generic="T extends string | string[] | undefined">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface ProfileOption {
    value: string;
    label: string;
    search?: string;
}

const model = defineModel<T>({ required: true });
const props = defineProps<{
    options: ReadonlyArray<ProfileOption>;
    allowCreate?: boolean;
    clearable?: boolean;
    unavailable?: boolean;
    loading?: boolean;
}>();

const { t } = useI18n();
const query = ref('');
const visibleOptions = computed(() => {
    const selected = Array.isArray(model.value) ? model.value : [model.value];
    const legacy = selected.flatMap((value) => {
        if (!value || props.options.some((option) => option.value === value)) return [];
        const match = props.options.find((option) => option.value === value.trim().toUpperCase());
        return [{
            value,
            label: match?.label ?? (props.allowCreate || props.unavailable ? value : t('merchantInfo.legacyOption', { value })),
            search: match?.search ?? value,
        }];
    });
    const available = Array.isArray(model.value)
        ? props.options.filter((option) => !legacy.some((item) => item.value.trim().toUpperCase() === option.value))
        : props.options;
    const options = [...available, ...legacy];
    const keyword = query.value.trim().toLowerCase();
    return keyword
        ? options.filter((option) => `${option.value} ${option.label} ${option.search ?? ''}`.toLowerCase().includes(keyword))
        : options;
});

function filter(value: string) {
    query.value = value;
}

function resetFilter(open: boolean) {
    if (!open) query.value = '';
}
</script>
