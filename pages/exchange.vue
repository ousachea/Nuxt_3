<script setup lang="ts">
import { ref, computed } from "vue";

const buyRate = ref(4050);
const sellRate = ref(4080);

const usdAmount = ref(100);
const khrAmount = ref(400000);

const boughtRate = ref(4080);
const currentBuyRate = ref(4120);
const investmentUSD = ref(100);

const usdToKhr = computed(() => usdAmount.value * buyRate.value);
const khrToUsd = computed(() => khrAmount.value / sellRate.value);

const spread = computed(() => sellRate.value - buyRate.value);

const profit = computed(() => {
  return (currentBuyRate.value - boughtRate.value) * investmentUSD.value;
});

function formatKHR(value: number) {
  return (
    new Intl.NumberFormat("en-US").format(Math.round(value)) +
    " KHR"
  );
}

function formatUSD(value: number) {
  return (
    "$" +
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  );
}
</script>

<template>
  <div class="page">
    <h1>USD ⇄ KHR Exchange Calculator</h1>

    <div class="grid">

      <section class="card">
        <h2>Exchange Rates</h2>

        <label>
          Buy Rate (Exchange buys your USD)
          <input v-model.number="buyRate" type="number">
        </label>

        <label>
          Sell Rate (Exchange sells USD)
          <input v-model.number="sellRate" type="number">
        </label>

        <div class="info">
          Spread:
          <strong>{{ spread }} KHR/USD</strong>
        </div>
      </section>

      <section class="card">
        <h2>Sell USD</h2>

        <p>You receive the Buy Rate.</p>

        <label>
          USD Amount
          <input v-model.number="usdAmount" type="number">
        </label>

        <div class="result positive">
          {{ formatKHR(usdToKhr) }}
        </div>
      </section>

      <section class="card">
        <h2>Buy USD</h2>

        <p>You pay the Sell Rate.</p>

        <label>
          KHR Amount
          <input v-model.number="khrAmount" type="number">
        </label>

        <div class="result">
          {{ formatUSD(khrToUsd) }}
        </div>
      </section>

      <section class="card">
        <h2>Profit / Loss</h2>

        <label>
          Bought USD At
          <input v-model.number="boughtRate" type="number">
        </label>

        <label>
          Current Buy Rate
          <input v-model.number="currentBuyRate" type="number">
        </label>

        <label>
          USD Amount
          <input v-model.number="investmentUSD" type="number">
        </label>

        <div
          class="result"
          :class="profit >= 0 ? 'positive' : 'negative'"
        >
          <strong>
            {{ profit >= 0 ? "Profit" : "Loss" }}
          </strong>

          <br>

          {{ formatKHR(Math.abs(profit)) }}
        </div>
      </section>

    </div>

    <section class="card explanation">
      <h2>How Exchange Rates Work</h2>

      <ul>
        <li>
          <strong>Buy Rate</strong> → The exchange buys your USD.
        </li>

        <li>
          <strong>Sell Rate</strong> → The exchange sells USD to you.
        </li>

        <li>
          If you buy USD today and later the Buy Rate increases, you make a profit.
        </li>

        <li>
          If the Buy Rate decreases, you lose money.
        </li>

        <li>
          The difference between Buy and Sell is called the <strong>spread</strong>.
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.page {
  max-width: 1100px;
  margin: 40px auto;
  padding: 20px;
  font-family: Arial, Helvetica, sans-serif;
  background: #f4f6f8;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 20px;
}

.card h2 {
  margin-top: 0;
}

label {
  display: block;
  margin: 15px 0;
  font-weight: bold;
}

input {
  width: 100%;
  margin-top: 6px;
  padding: 10px;
  font-size: 15px;
  border: 1px solid #bbb;
  border-radius: 6px;
}

.info {
  margin-top: 20px;
  background: #eef5ff;
  padding: 12px;
  border-radius: 6px;
}

.result {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  font-size: 22px;
  text-align: center;
  background: #ececec;
}

.positive {
  background: #d8f8dd;
  color: #116d2e;
}

.negative {
  background: #ffdcdc;
  color: #b00020;
}

.explanation {
  margin-top: 25px;
}

.explanation ul {
  padding-left: 20px;
}

.explanation li {
  margin: 10px 0;
}

@media (max-width: 700px) {
  .page {
    margin: 10px;
    padding: 10px;
  }

  h1 {
    font-size: 28px;
  }
}
</style>