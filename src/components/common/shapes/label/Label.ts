interface LabelOptions {
  id?: string;
  className?: string;
  text?: string;
  transPosition?: (p: { x: number; y: number }) => ({ x: number; y: number });
}

export default class Label {
  dom: HTMLDivElement;

  textContainer: HTMLSpanElement;

  onPositionChange?: () => void;

  transPosition?: (p: { x: number; y: number }) => ({ x: number; y: number });

  set visible(visible: boolean) {
    this.dom.style.display = visible ? '' : 'none';
  }

  set zIndex(zIndex: number) {
    this.dom.style.zIndex = `${zIndex}`;
  }

  set text(text: string) {
    this.textContainer.innerText = text;
  }

  constructor({ id, className, text, transPosition }: LabelOptions) {
    this.dom = document.createElement('div');
    if (id !== undefined) {
      this.dom.id = id;
    }
    if (className !== undefined) {
      this.dom.className = className;
    }

    this.textContainer = document.createElement('span');
    this.textContainer.innerText = text || '';
    this.textContainer.className = 'text';
    this.dom.appendChild(this.textContainer);

    this.transPosition = transPosition;
  }

  addToContainer(container: Element) {
    container.appendChild(this.dom);
  }

  setPosition(position: { x: number; y: number }, pivot: { x: number; y: number }, rotation: number) {
    const p = this.transPosition ? this.transPosition(position) : position;
    this.dom.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${rotation}rad) translate(0, -100%)`;
    this.dom.style.transformOrigin = `${pivot.x - position.x}px ${pivot.y - position.y}px`;
    if (this.onPositionChange) {
      this.onPositionChange();
    }
  }

  remove() {
    this.dom.remove();
  }
}
