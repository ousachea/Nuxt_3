<template>
  <div class="page">
    <div class="card">
      <h1>📱 Cambodia Carrier Checker</h1>
      <p class="sub">
        Detect carrier and get balance check codes
      </p>

      <input
        v-model="phone"
        type="tel"
        placeholder="Enter phone number (e.g. 010123456)"
        class="input"
      />

      <div
        v-if="carrier"
        class="result"
        :class="carrierClass"
      >
        <p class="label">Detected Carrier</p>
        <p class="value">{{ carrier }}</p>
      </div>

      <a
        v-if="carrier && carrier !== 'Unknown'"
        :href="`tel:${encodeURIComponent(carriers[carrier].balanceCode)}`"
        class="btn"
      >
        Check Balance ({{ carriers[carrier].balanceCode }})
      </a>

      <div
        v-if="carrier && carrier !== 'Unknown'"
        class="balance-box"
      >
        <div class="balance-row">
          <span>Balance Check</span>
          <strong>{{ carriers[carrier].balanceCode }}</strong>
        </div>
      </div>

      <div class="carrier-list">
        <div class="section-header">
          <h2>Supported Carriers</h2>
          <span>{{ Object.keys(carriers).length }} Networks</span>
        </div>

        <div
          v-for="(data, carrierName) in carriers"
          :key="carrierName"
          class="carrier-item"
          :class="data.class"
        >
          <div class="carrier-header">
            <h3>{{ carrierName }}</h3>
            <span>{{ data.prefixes.length }} Prefixes</span>
          </div>

          <p class="prefixes">
            {{ data.prefixes.join(', ') }}
          </p>

          <div class="ussd">
            Balance: {{ data.balanceCode }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const phone = ref('')

const carriers = {
  Smart: {
    prefixes: [
      '010',
      '015',
      '016',
      '069',
      '070',
      '081',
      '086',
      '087',
      '093',
      '096',
      '098'
    ],
    balanceCode: '*888#',
    class: 'smart'
  },

  Cellcard: {
    prefixes: [
      '011',
      '014',
      '017',
      '061',
      '076',
      '077',
      '078',
      '079',
      '085',
      '089',
      '092',
      '095',
      '099'
    ],
    balanceCode: '#823#',
    class: 'cellcard'
  },

  Metfone: {
    prefixes: [
      '031',
      '060',
      '066',
      '067',
      '068',
      '071',
      '088',
      '090',
      '097'
    ],
    balanceCode: '*1201#',
    class: 'metfone'
  }
}

const carrier = computed(() => {
  const clean = phone.value.replace(/\D/g, '')

  if (clean.length < 3) return ''

  for (const [name, data] of Object.entries(carriers)) {
    if (
      data.prefixes.some(prefix =>
        clean.startsWith(prefix)
      )
    ) {
      return name
    }
  }

  return 'Unknown'
})

const carrierClass = computed(() => {
  if (!carrier.value || carrier.value === 'Unknown') {
    return 'unknown'
  }

  return carriers[carrier.value].class
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.page {
  min-height: 100vh;
  background: #0f172a;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  font-family:
    Inter,
    system-ui,
    sans-serif;
}

.card {
  width: 100%;
  max-width: 500px;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 20px;
  padding: 24px;
}

h1 {
  margin: 0;
  font-size: 24px;
  color: white;
}

.sub {
  margin: 8px 0 20px;
  color: #94a3b8;
  font-size: 14px;
}

.input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #374151;
  background: #0f172a;
  color: white;
  font-size: 15px;
  outline: none;
}

.input:focus {
  border-color: #3b82f6;
}

.result {
  margin-top: 16px;
  padding: 16px;
  border-radius: 14px;
  text-align: center;
  border: 1px solid;
}

.label {
  font-size: 12px;
  color: #cbd5e1;
}

.value {
  margin-top: 6px;
  font-size: 24px;
  font-weight: 700;
}

.btn {
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  text-decoration: none;
  font-weight: 600;
  color: white;
  background: #2563eb;
  transition: 0.2s;
}

.btn:hover {
  background: #1d4ed8;
}

.balance-box {
  margin-top: 16px;
  padding: 16px;
  border-radius: 12px;
  background: #0f172a;
  border: 1px solid #374151;
}

.balance-row {
  display: flex;
  justify-content: space-between;
  color: white;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 28px;
  margin-bottom: 12px;
}

.section-header h2 {
  margin: 0;
  font-size: 16px;
  color: white;
}

.section-header span {
  color: #94a3b8;
  font-size: 12px;
}

.carrier-list {
  margin-top: 8px;
}

.carrier-item {
  padding: 14px;
  border-radius: 14px;
  margin-bottom: 12px;
  border: 1px solid;
}

.carrier-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.carrier-header h3 {
  margin: 0;
  color: white;
}

.carrier-header span {
  font-size: 12px;
  color: #cbd5e1;
}

.prefixes {
  margin: 10px 0;
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.6;
}

.ussd {
  font-size: 13px;
  font-weight: 600;
  color: white;
}

/* Smart */
.smart {
  background: rgba(37, 99, 235, 0.1);
  border-color: rgba(37, 99, 235, 0.4);
}

/* Cellcard */
.cellcard {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.4);
}

/* Metfone */
.metfone {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.4);
}

/* Unknown */
.unknown {
  background: rgba(107, 114, 128, 0.1);
  border-color: rgba(107, 114, 128, 0.4);
}

@media (max-width: 640px) {
  .page {
    padding: 16px;
  }

  .card {
    padding: 20px;
  }

  h1 {
    font-size: 20px;
  }
}
</style>