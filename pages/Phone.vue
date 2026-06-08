<template>
  <div class="container">
    <h1>📱 Cambodia Carrier Checker</h1>

    <p>Enter a phone number to detect carrier (Smart / Cellcard / Metfone)</p>

    <input
      v-model="phone"
      type="text"
      placeholder="e.g. 010123456"
      class="input"
    />

    <button @click="checkCarrier">Check</button>

    <div v-if="result" class="result">
      <h2>Result:</h2>
      <p><strong>{{ result }}</strong></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const phone = ref('')
const result = ref('')

// Basic prefix rules (can be improved later with real DB/API)
const detectCarrier = (number) => {
  const clean = number.replace(/\D/g, '')

  // Smart (Smart Axiata)
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
    return 'Smart (Smart Axiata)'
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

  return 'Unknown carrier'
}

const checkCarrier = () => {
  if (!phone.value) {
    result.value = 'Please enter a phone number'
    return
  }

  result.value = detectCarrier(phone.value)
}
</script>

<style scoped>
.container {
  max-width: 500px;
  margin: 60px auto;
  font-family: Arial, sans-serif;
  text-align: center;
}

.input {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  font-size: 16px;
}

button {
  padding: 10px 20px;
  cursor: pointer;
}

.result {
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
}
</style>