<script setup>
import { ref, computed, nextTick } from 'vue'
import { submitReport } from '@/services/api'

const props = defineProps({
  placeId: { type: String, required: true },
})

// All text for the form, in one place for easy editing
const copy = {
  open: 'Report a problem',
  title: "What's wrong?",
  messageLabel: 'Details',
  messageOptional: '(optional)',
  messageRequired: '(required)',
  messagePlaceholder: 'Anything that helps us fix it',
  submit: 'Send report',
  sending: 'Sending…',
  cancel: 'Cancel',
  thanks: 'Thanks! We got your report.',
}

// Values must match REPORT_TYPES in netlify/functions/report.js
const types = [
  { value: 'closed', label: 'Permanently closed' },
  { value: 'wrong_info', label: 'Wrong details' },
  { value: 'wrong_location', label: 'Wrong location' },
  { value: 'other', label: 'Something else' },
]
const MAX_MESSAGE = 1000

const open = ref(false)
const reportType = ref('')
const message = ref('')
const status = ref('idle') // idle | sending | sent | error
const error = ref('')
const titleEl = ref(null)
const openBtn = ref(null)

const needsMessage = computed(() => reportType.value === 'other')
const canSubmit = computed(
  () => reportType.value && (!needsMessage.value || message.value.trim()) && status.value !== 'sending',
)

async function show() {
  open.value = true
  status.value = 'idle'
  await nextTick()
  titleEl.value?.focus()
}

async function hide() {
  open.value = false
  await nextTick()
  openBtn.value?.focus()
}

async function send() {
  if (!canSubmit.value) return
  status.value = 'sending'
  error.value = ''
  try {
    await submitReport({ placeId: props.placeId, reportType: reportType.value, message: message.value })
    status.value = 'sent'
    open.value = false
    reportType.value = ''
    message.value = ''
  } catch (err) {
    status.value = 'error'
    error.value = err.message
  }
}
</script>

<template>
  <div class="report">
    <button
      v-if="!open"
      ref="openBtn"
      type="button"
      class="btn btn-secondary btn-block open-btn"
      aria-controls="report-form"
      :aria-expanded="open"
      @click="show"
    >
      <span aria-hidden="true">⚑</span> {{ copy.open }}
    </button>

    <Transition name="drop">
      <form v-if="open" id="report-form" class="report-form" @submit.prevent="send">
        <fieldset>
          <legend ref="titleEl" tabindex="-1" class="title">{{ copy.title }}</legend>
          <div class="types">
            <label v-for="t in types" :key="t.value" class="type">
              <input v-model="reportType" type="radio" name="report-type" :value="t.value" class="visually-hidden" />
              <span class="type-chip">{{ t.label }}</span>
            </label>
          </div>
        </fieldset>

        <label for="report-message" class="message-label">
          {{ copy.messageLabel }}
          <span class="muted">{{ needsMessage ? copy.messageRequired : copy.messageOptional }}</span>
        </label>
        <textarea
          id="report-message"
          v-model="message"
          rows="3"
          :maxlength="MAX_MESSAGE"
          :required="needsMessage"
          :placeholder="copy.messagePlaceholder"
        ></textarea>

        <p v-if="status === 'error'" class="error" role="alert">{{ error }}</p>

        <div class="actions">
          <button type="button" class="btn btn-secondary" @click="hide">{{ copy.cancel }}</button>
          <button type="submit" class="btn btn-primary send-btn" :disabled="!canSubmit">
            {{ status === 'sending' ? copy.sending : copy.submit }}
          </button>
        </div>
      </form>
    </Transition>

    <!-- Announced to screen readers when a report is sent -->
    <p class="thanks" role="status">
      <Transition name="pop">
        <span v-if="status === 'sent'" class="thanks-sticker">✓ {{ copy.thanks }}</span>
      </Transition>
    </p>
  </div>
</template>

<style scoped>
.report {
  margin-top: 1rem;
}

.open-btn {
  min-height: 44px;
  font-size: 0.95rem;
  box-shadow: none;
  border-style: dashed;
}

.open-btn:hover:not(:disabled) {
  border-style: solid;
}

.report-form {
  display: grid;
  gap: 0.75rem;
  padding: var(--gutter);
  border: var(--outline);
  border-radius: var(--radius);
  background: var(--cream);
  box-shadow: var(--shadow-sm);
}

fieldset {
  margin: 0;
  padding: 0;
  border: 0;
}

.title {
  margin-bottom: 0.6rem;
  padding: 0;
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem);
  text-transform: uppercase;
  outline: none;
}

.types {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.type {
  cursor: pointer;
}

/* Radio inputs styled as sticker chips (the real input stays for keyboard + screen readers) */
.type-chip {
  display: inline-flex;
  align-items: center;
  min-height: var(--tap-min);
  padding: 0 0.9rem;
  border: 2px solid var(--ink);
  border-radius: var(--radius-pill);
  background: var(--paper);
  box-shadow: 2px 2px 0 var(--ink);
  font-weight: 700;
  transition:
    transform var(--dur-press) ease-out,
    box-shadow var(--dur-press) ease-out;
}

.type:active .type-chip {
  transform: translate(2px, 2px) scale(0.95);
  box-shadow: none;
}

.type input:checked + .type-chip {
  background: var(--ink);
  color: var(--cream);
  box-shadow: 2px 2px 0 var(--orange);
  animation: chip-pop var(--dur-pop) var(--ease-pop);
}

.type input:checked + .type-chip::before {
  content: '✓ ';
  color: var(--accent);
}

.type input:focus-visible + .type-chip {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.message-label {
  font-weight: 800;
}

.message-label .muted {
  font-weight: 500;
}

textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: var(--outline);
  border-radius: var(--radius-sm);
  background: var(--paper);
  font: inherit;
  font-size: max(16px, 1rem); /* 16px+ stops iOS zooming the page on focus */
  resize: vertical;
}

.error {
  margin: 0;
}

/* Phones: buttons share the row evenly. Tablet up: compact, right-aligned. */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.actions .btn {
  flex: 1;
}

@media (min-width: 640px) {
  .actions .btn {
    flex: none;
  }
}

.thanks {
  margin: 0.75rem 0 0;
  text-align: center;
}

.thanks-sticker {
  display: inline-block;
  padding: 0.4rem 0.9rem;
  border: 2px solid var(--ink);
  border-radius: var(--radius-pill);
  background: var(--accent);
  font-weight: 800;
  transform: rotate(-2deg);
}

@keyframes chip-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.15) rotate(-3deg); }
  100% { transform: scale(1); }
}
</style>
