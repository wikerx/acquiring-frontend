<template>
    <div class="verification-code-input" role="group" :aria-label="label">
        <input
            v-for="index in length"
            :key="index"
            :ref="(element) => setInputRef(element, index - 1)"
            class="verification-code-input__cell"
            :value="characterAt(index - 1)"
            :inputmode="mode === 'numeric' ? 'numeric' : 'text'"
            :autocomplete="index === 1 ? 'one-time-code' : 'off'"
            :aria-label="`${label} ${index}/${length}`"
            :aria-describedby="describedBy"
            :disabled="disabled"
            maxlength="1"
            autocapitalize="off"
            spellcheck="false"
            @focus="selectInput"
            @input="handleInput($event, index - 1)"
            @keydown="handleKeydown($event, index - 1)"
            @paste="handlePaste($event, index - 1)"
        />
    </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch, type ComponentPublicInstance } from 'vue';

type VerificationCodeMode = 'numeric' | 'alphanumeric';

const props = withDefaults(defineProps<{
    modelValue: string;
    mode?: VerificationCodeMode;
    length?: number;
    label: string;
    describedBy?: string;
    autofocus?: boolean;
    disabled?: boolean;
}>(), {
    mode: 'numeric',
    length: 6,
    describedBy: undefined,
    autofocus: false,
    disabled: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

const inputRefs = ref<HTMLInputElement[]>([]);

watch(
    () => [props.modelValue, props.mode, props.length] as const,
    () => {
        const normalized = sanitize(props.modelValue).slice(0, props.length);
        if (normalized !== props.modelValue) emit('update:modelValue', normalized);
    },
    { immediate: true },
);

onMounted(() => {
    if (props.autofocus) focusInput(firstEmptyIndex());
});

function sanitize(value: string): string {
    const pattern = props.mode === 'numeric' ? /[^0-9]/g : /[^A-Za-z0-9]/g;
    return String(value || '').replace(pattern, '');
}

function characterAt(index: number): string {
    return sanitize(props.modelValue).charAt(index);
}

function setInputRef(element: Element | ComponentPublicInstance | null, index: number) {
    if (element instanceof HTMLInputElement) inputRefs.value[index] = element;
}

function selectInput(event: FocusEvent) {
    (event.target as HTMLInputElement).select();
}

function focusInput(index: number) {
    const boundedIndex = Math.max(0, Math.min(index, props.length - 1));
    nextTick(() => {
        inputRefs.value[boundedIndex]?.focus();
        inputRefs.value[boundedIndex]?.select();
    });
}

function firstEmptyIndex(): number {
    return Math.min(sanitize(props.modelValue).length, props.length - 1);
}

function replaceCharacter(index: number, value: string) {
    if (!value) {
        emit('update:modelValue', sanitize(props.modelValue).slice(0, index));
        return;
    }
    const characters = Array.from({ length: props.length }, (_, itemIndex) => characterAt(itemIndex));
    characters[index] = value;
    emit('update:modelValue', characters.join(''));
}

function distribute(value: string, startIndex: number) {
    const incoming = sanitize(value);
    if (!incoming) return;
    const characters = Array.from({ length: props.length }, (_, itemIndex) => characterAt(itemIndex));
    for (let offset = 0; offset < incoming.length && startIndex + offset < props.length; offset += 1) {
        characters[startIndex + offset] = incoming.charAt(offset);
    }
    emit('update:modelValue', characters.join(''));
    focusInput(Math.min(startIndex + incoming.length, props.length - 1));
}

function handleInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = sanitize(input.value);
    if (!value) {
        replaceCharacter(index, '');
        return;
    }
    distribute(value, index);
}

function handleKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        focusInput(index - 1);
        return;
    }
    if (event.key === 'ArrowRight') {
        event.preventDefault();
        focusInput(index + 1);
        return;
    }
    if (event.key === 'Backspace') {
        event.preventDefault();
        if (characterAt(index)) replaceCharacter(index, '');
        else if (index > 0) {
            replaceCharacter(index - 1, '');
            focusInput(index - 1);
        }
        return;
    }
    if (event.key === 'Delete') {
        event.preventDefault();
        replaceCharacter(index, '');
        return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
    const value = sanitize(event.key);
    if (value) {
        event.preventDefault();
        replaceCharacter(index, value);
        focusInput(index + 1);
    }
}

function handlePaste(event: ClipboardEvent, index: number) {
    event.preventDefault();
    distribute(event.clipboardData?.getData('text') || '', index);
}
</script>

<style scoped>
.verification-code-input {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
    width: 100%;
    max-width: 386px;
    margin: 0 auto;
}

.verification-code-input__cell {
    width: 100%;
    min-width: 0;
    aspect-ratio: 1;
    padding: 0;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    outline: 0;
    background: #fff;
    color: #102a43;
    font: 700 22px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    text-align: center;
    caret-color: #0f766e;
    transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.verification-code-input__cell:hover {
    border-color: #67b6ae;
}

.verification-code-input__cell:focus {
    border-color: #0f766e;
    box-shadow: 0 0 0 3px rgb(15 118 110 / 14%);
}

.verification-code-input__cell:disabled {
    background: #f8fafc;
    color: #94a3b8;
    cursor: not-allowed;
}

@media (max-width: 520px) {
    .verification-code-input { gap: 7px; }
    .verification-code-input__cell { font-size: 19px; }
}
</style>
