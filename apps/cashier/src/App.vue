<template>
    <main class="min-h-screen px-4 py-6 sm:px-6">
        <section class="mx-auto grid w-full max-w-[440px] gap-5">
            <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <p class="text-sm font-semibold text-slate-500">Order Summary</p>
                        <h1 class="mt-1 text-2xl font-bold text-ink">USD 128.00</h1>
                    </div>
                    <span class="rounded-md bg-emerald-50 px-3 py-1 text-sm font-semibold text-brand">
                        Secure
                    </span>
                </div>
                <dl class="mt-5 grid gap-3 text-sm">
                    <div class="flex justify-between gap-3">
                        <dt class="text-slate-500">Merchant</dt>
                        <dd class="font-medium">Demo Merchant</dd>
                    </div>
                    <div class="flex justify-between gap-3">
                        <dt class="text-slate-500">Order No.</dt>
                        <dd class="font-medium">TODO_FROM_CHECKOUT_API</dd>
                    </div>
                    <div class="flex justify-between gap-3 border-t border-slate-100 pt-3">
                        <dt class="text-slate-500">Total</dt>
                        <dd class="font-bold">USD 128.00</dd>
                    </div>
                </dl>
            </div>

            <form class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent>
                <h2 class="text-lg font-bold">Payment Method</h2>
                <div class="mt-4 grid gap-4">
                    <label class="grid gap-2">
                        <span class="text-sm font-medium text-slate-700">Card Number</span>
                        <input
                            class="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-brand"
                            inputmode="numeric"
                            autocomplete="cc-number"
                            placeholder="541749******1485"
                        />
                    </label>
                    <div class="grid grid-cols-2 gap-3">
                        <label class="grid gap-2">
                            <span class="text-sm font-medium text-slate-700">Expiry</span>
                            <input
                                class="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-brand"
                                autocomplete="cc-exp"
                                placeholder="MM/YY"
                            />
                        </label>
                        <label class="grid gap-2">
                            <span class="text-sm font-medium text-slate-700">Security Code</span>
                            <input
                                class="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-brand"
                                inputmode="numeric"
                                autocomplete="cc-csc"
                                type="password"
                                placeholder="***"
                            />
                        </label>
                    </div>
                    <button
                        class="mt-2 h-12 rounded-md bg-brand px-4 font-bold text-white disabled:bg-slate-300"
                        disabled
                        type="submit"
                    >
                        Pay USD 128.00
                    </button>
                </div>
            </form>
        </section>
    </main>
</template>
