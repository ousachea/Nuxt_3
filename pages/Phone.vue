<template>
    <div class="page">
      <div class="card">
        <h1>📱 Cambodia Carrier Tool</h1>
        <p class="sub">Detect carrier + check balance code</p>
  
        <input
          v-model="phone"
          type="text"
          placeholder="Enter phone number (e.g. 010123456)"
          class="input"
        />
  
        <!-- Carrier Result -->
        <div v-if="carrier" class="result" :class="carrierClass">
          <p class="label">Detected Carrier</p>
          <p class="value">{{ carrier }}</p>
        </div>
  
        <!-- Balance Button -->
        <button
          v-if="carrier && carrier !== 'Unknown'"
          class="btn"
          @click="checkBalance"
        >
          🔍 Check Balance
        </button>
  
        <!-- Balance Result -->
        <div v-if="balanceCode" class="balance-box">
          <p class="label">USSD Code</p>
          <p class="code">{{ balanceCode }}</p>
  
          <p class="hint">
            Dial this code on your phone to check balance
          </p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  
  const phone = ref('')
  const balanceCode = ref('')
  
  const detectCarrier = (number) => {
    const clean = number.replace(/\D/g, '')
  
    // Smart
    if (
      clean.startsWith('010') ||
      clean.startsWith('015') ||
      clean.startsWith('016') ||
      clean.startsWith('069') ||
      clean.startsWith('070') ||
      clean.startsWith('081') ||
      clean.startsWith('086') ||
      clean.startsWith('087') ||
      clean.startsWith('093') ||
      clean.startsWith('096') ||
      clean.startsWith('098')
    ) {
      return 'Smart'
    }
  
    // Cellcard
    if (
      clean.startsWith('011') ||
      clean.startsWith('014') ||
      clean.startsWith('017') ||
      clean.startsWith('061') ||
      clean.startsWith('076') ||
      clean.startsWith('077') ||
      clean.startsWith('078') ||
      clean.startsWith('079') ||
      clean.startsWith('085') ||
      clean.startsWith('089') ||
      clean.startsWith('092') ||
      clean.startsWith('095') ||
      clean.startsWith('099')
    ) {
      return 'Cellcard'
    }
  
    // Metfone
    if (
      clean.startsWith('031') ||
      clean.startsWith('060') ||
      clean.startsWith('066') ||
      clean.startsWith('067') ||
      clean.startsWith('068') ||
      clean.startsWith('071') ||
      clean.startsWith('088') ||
      clean.startsWith('090') ||
      clean.startsWith('097')
    ) {
      return 'Metfone'
    }
  
    return 'Unknown'
  }
  
  const carrier = computed(() => {
    if (!phone.value) return ''
    return detectCarrier(phone.value)
  })
  
  const carrierClass = computed(() => {
    if (carrier.value === 'Smart') return 'smart'
    if (carrier.value === 'Cellcard') return 'cellcard'
    if (carrier.value === 'Metfone') return 'metfone'
    return 'unknown'
  })
  
  const checkBalance = () => {
    if (carrier.value === 'Smart') {
      balanceCode.value = '*888#'
    } else if (carrier.value === 'Cellcard') {
      balanceCode.value = '*120#'
    } else if (carrier.value === 'Metfone') {
      balanceCode.value = '*097#'
    } else {
      balanceCode.value = ''
    }
  }
  </script>
  
  <style scoped>
  .page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0b1220;
    color: white;
    font-family: system-ui, Arial;
  }
  
  .card {
    width: 100%;
    max-width: 420px;
    padding: 28px;
    border-radius: 16px;
    background: #111a2e;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  }
  
  h1 {
    margin: 0;
    font-size: 20px;
  }
  
  .sub {
    color: #9aa4b2;
    margin-bottom: 16px;
    font-size: 13px;
  }
  
  .input {
    width: 100%;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid #2a3550;
    background: #0b1220;
    color: white;
    outline: none;
    font-size: 14px;
  }
  
  .input:focus {
    border-color: #4c8dff;
  }
  
  .result {
    margin-top: 16px;
    padding: 14px;
    border-radius: 12px;
    border: 1px solid #2a3550;
    text-align: center;
  }
  
  .label {
    font-size: 12px;
    color: #9aa4b2;
  }
  
  .value {
    font-size: 20px;
    font-weight: 700;
    margin-top: 4px;
  }
  
  /* Carrier colors */
  .smart {
    border-color: #2f6bff;
    background: rgba(47, 107, 255, 0.1);
  }
  
  .cellcard {
    border-color: #ff3b3b;
    background: rgba(255, 59, 59, 0.1);
  }
  
  .metfone {
    border-color: #00c853;
    background: rgba(0, 200, 83, 0.1);
  }
  
  .unknown {
    border-color: #6b7280;
    background: rgba(107, 114, 128, 0.1);
  }
  
  .btn {
    width: 100%;
    margin-top: 14px;
    padding: 12px;
    border: none;
    border-radius: 10px;
    background: #4c8dff;
    color: white;
    font-weight: 600;
    cursor: pointer;
  }
  
  .btn:hover {
    background: #3a78e0;
  }
  
  .balance-box {
    margin-top: 14px;
    padding: 14px;
    border-radius: 12px;
    background: #0b1220;
    border: 1px solid #2a3550;
    text-align: center;
  }
  
  .code {
    font-size: 22px;
    font-weight: bold;
    margin-top: 6px;
  }
  
  .hint {
    font-size: 12px;
    color: #9aa4b2;
    margin-top: 6px;
  }
  </style>