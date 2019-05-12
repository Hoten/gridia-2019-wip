const items: Array<MetaItem | null> = require('../world/content/items.json');
const itemUses: ItemUse[] = require('../world/content/itemuses.json');
const animations: Animation[] = require('../world/content/animations.json');
const monsters: Monster[] = require('../world/content/monsters.json');

for (const use of itemUses) {
  if (use.focusQuantityConsumed === undefined) {
    use.focusQuantityConsumed = 1;
  }
}

for (const animation of animations) {
  for (const frame of animation.frames) {
    if (frame.sound) frame.sound = frame.sound.toLowerCase();
  }
}

// Add name properties for readability in the console.
function getName(id) {
  if (id === -1) return 'Hand';
  return getMetaItem(id).name;
}
for (const use of itemUses) {
  // @ts-ignore
  use.toolName = getName(use.tool);
  // @ts-ignore
  use.focusName = getName(use.focus);
  // @ts-ignore
  use.productNames = use.products.map((id) => getName(id));
}

export class ItemWrapper {
  constructor(public type: number, public quantity: number) { }

  public raw() {
    if (this.type === 0) return null;
    return { type: this.type, quantity: this.quantity };
  }

  public remove(quantity: number) {
    this.quantity -= quantity;
    if (this.quantity <= 0) {
      this.quantity = 0;
      this.type = 0;
    }

    return this;
  }

  public clone() {
    return new ItemWrapper(this.type, this.quantity);
  }
}

export function getMetaItem(id: number): MetaItem {
  return items[id];
}

export function getMetaItemByName(name: string): MetaItem {
  return items.find((item) => item && item.name === name);
}

export function getItemUses(tool: number, focus: number) {
  return itemUses.filter((item) => item.tool === tool && item.focus === focus);
}

export function getItemUsesForTool(tool: number) {
  return itemUses.filter((item) => item.tool === tool);
}

export function getItemUsesForFocus(focus: number) {
  return itemUses.filter((item) => item.focus === focus);
}

export function getItemUsesForProduct(product: number) {
  return itemUses.filter((item) => item.products.includes(product) || item.successTool === product);
}

// Weighted by rarity.
export function getRandomMetaItemOfClass(itemClass: MetaItem['class']) {
  const itemsOfClass = items.filter((item) => item && item.class === itemClass);
  const maxRarity = itemsOfClass.reduce((acc, item) => acc + item.rarity, 0);
  const value = Math.random() * maxRarity;

  let sumSoFar = 0;
  for (const item of itemsOfClass) {
    sumSoFar += item.rarity;
    if (value < sumSoFar) return item;
  }

  // Shouldn't ever reach here.
  console.error('unexpected behavior in getRandomMetaItemOfClass.');
  return itemsOfClass[Math.floor(Math.random() * itemsOfClass.length)];
}

export function getAnimation(key: string) {
  return animations.find((a) => a.name === key);
}

export function getMonsterTemplate(id: number) {
  return monsters[id];
}
