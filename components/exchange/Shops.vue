<script setup lang="ts">
/**
 * Saved money changers and their latest buy / sell quotes. Picks out the
 * best shop for each direction and what choosing it is worth on $100, since
 * shopping around is the most reliable way to come out ahead.
 */
const ex = useExchangeStore()
const sfx = useSfx()

const draft = reactive({ name: '', buy: null as number | null, sell: null as number | null })
const adding = ref(false)

function startAdd() {
  draft.name = ''
  draft.buy = ex.inputs.buyRate
  draft.sell = ex.inputs.sellRate
  adding.value = true
}
function saveDraft() {
  if (!draft.buy || !draft.sell) return
  const s = ex.addShop(draft.name, draft.buy, draft.sell)
  ex.useShop(s.id)
  adding.value = false
  sfx.play('success')
}
function pick(id: string) {
  ex.useShop(id)
  sfx.play('select')
}
function remove(id: string) {
  ex.removeShop(id)
  sfx.play('collapse')
}

/** What picking the best shop over the worst is worth on $100, per direction. */
const edge = computed(() => {
  if (ex.shops.length < 2) return null
  const buys = ex.shops.map(s => s.buy)
  const sells = ex.shops.map(s => s.sell)
  return {
    sellUsd: (Math.max(...buys) - Math.min(...buys)) * 100,
    buyUsd: (Math.max(...sells) - Math.min(...sells)) * 100,
  }
})
</script>

<template>
  <section class="card shops">
    <div class="card-head">
      <h2>My shops</h2>
      <button v-if="!adding" type="button" class="btn small" @click="startAdd">+ Add shop</button>
    </div>

    <Transition name="fade">
      <form v-if="adding" class="add" @submit.prevent="saveDraft">
        <input v-model="draft.name" class="plain" placeholder="Shop name (e.g. Central Market stall 12)" aria-label="Shop name">
        <div class="add-rates">
          <label><span>Buy</span><input v-model.number="draft.buy" class="plain" type="number" inputmode="decimal" required></label>
          <label><span>Sell</span><input v-model.number="draft.sell" class="plain" type="number" inputmode="decimal" required></label>
        </div>
        <div class="add-actions">
          <button type="button" class="btn small" @click="adding = false">Cancel</button>
          <button type="submit" class="btn small primary">Save shop</button>
        </div>
      </form>
    </Transition>

    <p v-if="!ex.shops.length && !adding" class="empty">
      Save the rates from each money changer you visit. The page then tells you which one is best for what you're doing.
    </p>

    <TransitionGroup v-else tag="ul" name="list" class="list">
      <li v-for="s in ex.shops" :key="s.id" :class="{ active: ex.inputs.activeShopId === s.id }">
        <div class="row-top">
          <input :value="s.name" class="name plain" aria-label="Shop name" @change="ex.updateShop(s.id, { name: ($event.target as HTMLInputElement).value })">
          <button type="button" class="icon" aria-label="Delete shop" @click="remove(s.id)">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" /></svg>
          </button>
        </div>
        <div class="row-rates">
          <label>
            <span>Buy</span>
            <input :value="s.buy" class="plain" type="number" inputmode="decimal" @change="ex.updateShop(s.id, { buy: +($event.target as HTMLInputElement).value })">
          </label>
          <label>
            <span>Sell</span>
            <input :value="s.sell" class="plain" type="number" inputmode="decimal" @change="ex.updateShop(s.id, { sell: +($event.target as HTMLInputElement).value })">
          </label>
          <button type="button" class="btn small" :class="{ primary: ex.inputs.activeShopId === s.id }" @click="pick(s.id)">
            {{ ex.inputs.activeShopId === s.id ? 'Using' : 'Use' }}
          </button>
        </div>
        <div class="row-meta">
          <span v-if="ex.shops.length > 1 && ex.bestToSellUsd?.id === s.id" class="badge up">Best to sell USD</span>
          <span v-if="ex.shops.length > 1 && ex.bestToBuyUsd?.id === s.id" class="badge up">Best to buy USD</span>
          <span class="ago">updated {{ formatAgo(s.updatedAt) }}</span>
        </div>
      </li>
    </TransitionGroup>

    <p v-if="edge && (edge.sellUsd > 0 || edge.buyUsd > 0)" class="edge">
      On $100, the best shop gets you <strong>{{ formatKHR(edge.sellUsd) }}</strong> more when selling USD
      and saves <strong>{{ formatKHR(edge.buyUsd) }}</strong> when buying USD, compared with the worst.
    </p>
  </section>
</template>

<style scoped>
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.card-head h2 { margin: 0; }

.plain {
  width: 100%;
  min-width: 0;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--white);
  font: 400 0.9rem var(--font-sans);
  color: var(--black);
  outline: none;
  transition: border-color 0.18s;
}
.plain:focus { border-color: var(--black); }

.add { display: grid; gap: 0.6rem; margin-bottom: 1rem; padding: 0.85rem; border: 1px dashed var(--border); border-radius: 10px; }
.add-rates, .row-rates { display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.5rem; align-items: end; }
.add-rates { grid-template-columns: 1fr 1fr; }
.add-rates label span, .row-rates label span { display: block; font-size: 0.6875rem; color: var(--gray); margin-bottom: 0.2rem; }
.add-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }

.list { list-style: none; display: grid; gap: 0.6rem; position: relative; }
.list li {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  transition: border-color 0.25s, box-shadow 0.25s;
}
.list li.active { border-color: var(--black); box-shadow: 0 0 0 1px var(--black); }
.row-top { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
.name { border-color: transparent; background: transparent; font-weight: 500; padding-left: 0.2rem; }
.name:hover { border-color: var(--border); }
.icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--gray);
  cursor: pointer;
}
.icon:hover { background: var(--light); color: var(--black); }
.row-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; margin-top: 0.5rem; }
.badge { padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.6875rem; }
.badge.up { background: var(--ex-pos-bg); color: var(--ex-pos); }
.ago { margin-left: auto; font-size: 0.6875rem; color: var(--gray); }

.empty { font-size: 0.875rem; color: var(--gray); line-height: 1.55; }
.edge { margin-top: 0.9rem; font-size: 0.8125rem; line-height: 1.5; }
.edge strong { font-weight: 500; color: var(--ex-pos); }

.list-enter-active, .list-leave-active { transition: opacity 0.25s, transform 0.3s cubic-bezier(.2, .8, .2, 1); }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(-6px); }
.list-leave-active { position: absolute; width: 100%; }
.list-move { transition: transform 0.3s cubic-bezier(.2, .8, .2, 1); }
</style>
