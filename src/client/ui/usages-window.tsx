import { render, h, Component } from 'preact';
import * as Content from '../../content';
import UsageModule from '../modules/usage-module';
import { Graphic } from './ui-common';

export function makeUsagesWindow(usageModule: UsageModule) {
  let setState = (_: Partial<State>) => {
    // Do nothing.
  };

  interface State {
    usages: ItemUse[];
  }
  class UsagesWindow extends Component {
    state: State = { usages: [] };

    componentDidMount() {
      setState = this.setState.bind(this);
    }

    render(props: any, state: State) {
      return <div>
        <div>
          {'Usages'}
        </div>
        <div class="usages__usages">
          {state.usages.map((usage, i) => {
            if (usage.products.length === 0) return;

            const item = usage.products[0];
            const metaItem = Content.getMetaItem(item.type);
            // TODO this is silly.
            const graphicIndex = metaItem.animations ? (metaItem.animations[0] || 0) : 0;
            return <div class="usages__usage" data-index={i}>
              <Graphic
                type={'item'}
                index={graphicIndex}
                quantity={item.quantity}
              ></Graphic>
            </div>;
          })}
        </div>
      </div>;
    }
  }

  const el = usageModule.game.makeUIWindow({ name: 'usages', cell: 'center' });
  render(<UsagesWindow />, el);

  const getIndex = (e: PointerEvent): number | undefined => {
    const target = e.target as HTMLElement;
    const slotEl = target.closest('.usages__usage') as HTMLElement;
    if (!slotEl) return;

    const index = Number(slotEl.dataset.index);
    return index;
  };

  el.addEventListener('pointerup', (e) => {
    const index = getIndex(e);
    if (index === undefined) return;

    usageModule.selectUsage(index);
  });

  return {
    el,
    setState: (s: Partial<State>) => setState(s),
  };
}
