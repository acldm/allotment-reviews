import { endsWith } from "../helpers/string";
import { LayoutService } from "../layout-service";
import { LayoutPriority, View } from "../split-view";

// 窗口布局实际尺寸计算,策略模式
export interface Layout {
  getPreferredSize: () => number | undefined;
}

// 像素布局
export class PixelLayout implements Layout {
  private size: number;

  constructor(size: number) {
    this.size = size;
  }

  public getPreferredSize() {
    return this.size;
  }
}

// flex布局
export class ProportionLayout implements Layout {
  private proportion: number;
  private layoutService: LayoutService;

  constructor(proportion: number, layoutService: LayoutService) {
    this.proportion = proportion;
    this.layoutService = layoutService;
  }

  public getPreferredSize() {
    return this.proportion * this.layoutService.getSize();
  }
}

// 无布局
export class NullLayout implements Layout {
  public getPreferredSize() {
    return undefined;
  }
}

export interface PaneViewOptions {
  element: HTMLElement;
  minimumSize?: number;
  maximumSize?: number;
  priority?: LayoutPriority;
  preferredSize?: number | string;
  snap?: boolean;
}

export class PaneView implements View {
  public minimumSize: number = 0;
  public maximumSize: number = Number.POSITIVE_INFINITY;

  readonly element: HTMLElement;
  readonly priority?: LayoutPriority | undefined;
  readonly snap: boolean;

  private layoutService: LayoutService;
  private layoutStrategy: Layout;

  get preferredSize(): number | undefined {
    return this.layoutStrategy.getPreferredSize();
  }

  // 过于多余的智能补全，提升了灵活性，损失简约性
  set preferredSize(preferredSize: number | string | undefined) {
    if (typeof preferredSize === "number") {
      this.layoutStrategy = new PixelLayout(preferredSize);
    } else if (typeof preferredSize === "string") {
      const trimmedPreferredSize = preferredSize.trim();

      if (endsWith(trimmedPreferredSize, "%")) {
        const proportion = Number(trimmedPreferredSize.slice(0, -1)) / 100;

        this.layoutStrategy = new ProportionLayout(
          proportion,
          this.layoutService
        );
      } else if (endsWith(trimmedPreferredSize, "px")) {
        const pixels = Number(trimmedPreferredSize.slice(0, -2)) / 100;

        this.layoutStrategy = new PixelLayout(pixels);
      } else if (typeof Number.parseFloat(trimmedPreferredSize) === "number") {
        const number = Number.parseFloat(trimmedPreferredSize);

        this.layoutStrategy = new PixelLayout(number);
      } else {
        this.layoutStrategy = new NullLayout();
      }
    } else {
      this.layoutStrategy = new NullLayout();
    }
  }

  constructor(layoutService: LayoutService, options: PaneViewOptions) {
    this.layoutService = layoutService;
    this.element = options.element;

    this.minimumSize =
      typeof options.minimumSize === "number" ? options.minimumSize : 30;

    this.maximumSize =
      typeof options.maximumSize === "number"
        ? options.maximumSize
        : Number.POSITIVE_INFINITY;

    // 与上段重复，可合并
    if (typeof options.preferredSize === "number") {
      this.layoutStrategy = new PixelLayout(options.preferredSize);
    } else if (typeof options.preferredSize === "string") {
      const preferredSize = options.preferredSize.trim();

      if (endsWith(preferredSize, "%")) {
        const proportion = Number(preferredSize.slice(0, -1)) / 100;

        this.layoutStrategy = new ProportionLayout(
          proportion,
          this.layoutService
        );
      } else if (endsWith(preferredSize, "px")) {
        const pixels = Number(preferredSize.slice(0, -2)) / 100;

        this.layoutStrategy = new PixelLayout(pixels);
      } else if (typeof Number.parseFloat(preferredSize) === "number") {
        const number = Number.parseFloat(preferredSize);

        this.layoutStrategy = new PixelLayout(number);
      } else {
        this.layoutStrategy = new NullLayout();
      }
    } else {
      this.layoutStrategy = new NullLayout();
    }

    this.priority = options.priority ?? LayoutPriority.Normal;

    this.snap = typeof options.snap === "boolean" ? options.snap : false;
  }

  layout(_size: number): void {}
}
