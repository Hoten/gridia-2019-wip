import { render, h, Component } from 'preact';
import * as Utils from '../../utils';
import * as Content from '../../content';
import Game from '../game';
import Container from '../../container';
import { Graphic } from './ui-common';

export function makeContainerWindow(game: Game, container: Container, name?: string) {
  let setState = (_: Partial<State>) => {
    // Do nothing.
  };

  let setSelectedIndex = (_: number) => {
    // Do nothing.
  };

  interface State {
    name?: string;
    container: Container;
    selectedIndex: number | null;
  }
  class ContainerWindow extends Component {
    state: State = { container, name, selectedIndex: null };

    componentDidMount() {
      setState = this.setState.bind(this);
      setSelectedIndex = this.setSelectedIndex.bind(this);
    }

    componentDidUpdate() {
      // lol
      container = this.state.container;
    }

    setSelectedIndex(index: number | null) {
      if (index === this.state.selectedIndex) {
        index = null;
      }
      this.setState({
        selectedIndex: index,
      });

      // lol
      game.state.containers[this.state.container.id] = game.state.containers[this.state.container.id] || {};
      game.state.containers[this.state.container.id].selectedIndex = index;

      // Selected item actions are based off currently selected tool. Fire
      // an event so the appropriate system can respond to changes.
      game.client.eventEmitter.emit('containerWindowSelectedIndexChanged');
    }

    render(props: any, state: State) {
      return <div>
        <div>
          {state.name || 'Container'}
        </div>
        <div class="container__slots">
          {state.container.items.map((item, i) => {
            let gfx;
            if (item) {
              const metaItem = Content.getMetaItem(item.type);
              const graphicIndex = metaItem.animations ? (metaItem.animations[0] || 0) : 0;
              gfx = <Graphic
                type={'items'}
                index={graphicIndex}
                quantity={item.quantity}
              ></Graphic>;
            }

            const classes = ['container__slot'];
            if (state.selectedIndex === i) classes.push('container__slot--selected');

            return <div class={classes.join(' ')} data-index={i}>{gfx}</div>;
          })}
        </div>
      </div>;
    }
  }

  const el = game.makeUIWindow({ name: 'container', cell: 'right', noscroll: true });
  render(<ContainerWindow />, el);

  if (container.id === game.client.player.equipmentContainerId) {
    el.classList.add('window--equipment');
  }

  let mouseDownIndex: number;
  let mouseOverIndex: number;

  const getIndex = (e: PointerEvent): number | undefined => {
    const target = e.target as HTMLElement;
    const slotEl = target.closest('.container__slot') as HTMLElement;
    if (!slotEl) return;

    const index = Number(slotEl.dataset.index);
    return index;
  };

  el.addEventListener('pointerdown', (e) => {
    const index = getIndex(e);
    if (index === undefined || !container.items[index]) return;

    mouseDownIndex = index;

    game.client.eventEmitter.emit('itemMoveBegin', {
      location: Utils.ItemLocation.Container(container.id, index),
      item: container.items[index] || undefined,
    });
  });

  el.addEventListener('pointermove', (e) => {
    const index = getIndex(e);
    if (index === undefined) return;

    mouseOverIndex = index;
    // TODO: show selected view temporarily when hovering.
    // game.modules.selectedView.selectView(Utils.ItemLocation.Container(container.id, index));
  });

  // el.addEventListener('pointerout', () => {
  //   if (game.state.selectedView.location?.source === 'container') {
  //     game.modules.selectedView.clearSelectedView();
  //   }
  // });

  el.addEventListener('pointerup', () => {
    if (mouseOverIndex !== undefined) {
      game.client.eventEmitter.emit('itemMoveEnd', {
        location: Utils.ItemLocation.Container(container.id, mouseOverIndex),
      });
    }
    if (mouseDownIndex === mouseOverIndex) {
      setSelectedIndex(mouseDownIndex);
      game.modules.selectedView.selectView(Utils.ItemLocation.Container(container.id, mouseDownIndex));
    }
  });

  // TODO: ughhh state management here is crappppp.
  return {
    el,
    setState: (s: Partial<State>) => setState(s),
    setSelectedIndex: (s: number) => setSelectedIndex(s),
  };
}
