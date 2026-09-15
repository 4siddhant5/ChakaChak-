export type NavViewType = 'tab' | 'detail' | 'modal' | 'step';

export interface NavStackEntry {
  id: string;
  name: string; // e.g. 'home', 'history', 'offers', 'profile', 'live_tracking', 'service_config', 'checkout', 'address_picker', 'notifications', 'invoice', 'rating', 'photo_lightbox', 'worker_job_detail'
  viewType: NavViewType;
  title?: string;
  params?: Record<string, any>;
  timestamp: number;
}

export const getHumanReadableTitle = (entry?: NavStackEntry | null): string => {
  if (!entry) return 'Previous Screen';
  if (entry.title) return entry.title;

  switch (entry.name) {
    case 'home':
      return 'Home Explore';
    case 'history':
      return 'Booking History';
    case 'offers':
      return 'Offers & Promos';
    case 'profile':
      return 'Account Profile';
    case 'live_tracking':
      return 'Live Service Tracking';
    case 'service_config':
      return 'Service Configuration';
    case 'checkout':
    case 'checkout_step1':
      return 'Slot & Timing';
    case 'checkout_step2':
      return 'Review & Payment';
    case 'address_picker':
      return 'Address Selection';
    case 'address_picker_add':
      return 'New Address Form';
    case 'notifications':
      return 'Notifications';
    case 'invoice':
      return 'Digital Tax Invoice';
    case 'rating':
      return 'Rating & Feedback';
    case 'photo_lightbox':
      return 'Inspection Lightbox';
    case 'worker_jobs':
      return 'Partner Job Queue';
    case 'worker_earnings':
      return 'Partner Earnings';
    case 'worker_profile':
      return 'Partner Profile';
    case 'worker_job_detail':
      return 'Job Details';
    default:
      return entry.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
};

export const createNavEntry = (
  name: string,
  viewType: NavViewType,
  title?: string,
  params?: Record<string, any>
): NavStackEntry => {
  return {
    id: `${name}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    viewType,
    title: title || getHumanReadableTitle({ name, viewType, id: '', timestamp: 0 }),
    params: params ? { ...params } : undefined,
    timestamp: Date.now(),
  };
};

export class NavigationStackManager {
  private stack: NavStackEntry[] = [];
  private listeners: Set<(stack: NavStackEntry[]) => void> = new Set();

  constructor(initialStack?: NavStackEntry[]) {
    if (initialStack && initialStack.length > 0) {
      this.stack = [...initialStack];
    } else {
      this.stack = [createNavEntry('home', 'tab', 'Home Explore')];
    }
  }

  public getStack(): NavStackEntry[] {
    return [...this.stack];
  }

  public getCurrent(): NavStackEntry | undefined {
    return this.stack[this.stack.length - 1];
  }

  public getPrevious(): NavStackEntry | undefined {
    return this.stack.length > 1 ? this.stack[this.stack.length - 2] : undefined;
  }

  public canGoBack(): boolean {
    return this.stack.length > 1;
  }

  public push(
    name: string,
    viewType: NavViewType,
    title?: string,
    params?: Record<string, any>
  ): NavStackEntry {
    const current = this.getCurrent();
    // Prevent duplicate adjacent entries with identical name and params
    if (
      current &&
      current.name === name &&
      JSON.stringify(current.params) === JSON.stringify(params)
    ) {
      return current;
    }

    const newEntry = createNavEntry(name, viewType, title, params);
    this.stack.push(newEntry);
    this.notify();
    return newEntry;
  }

  public pop(): { popped: NavStackEntry; current: NavStackEntry | undefined } | null {
    if (this.stack.length <= 1) {
      return null;
    }
    const popped = this.stack.pop()!;
    const current = this.getCurrent();
    this.notify();
    return { popped, current };
  }

  public replace(
    name: string,
    viewType: NavViewType,
    title?: string,
    params?: Record<string, any>
  ): NavStackEntry {
    if (this.stack.length > 0) {
      this.stack.pop();
    }
    const newEntry = createNavEntry(name, viewType, title, params);
    this.stack.push(newEntry);
    this.notify();
    return newEntry;
  }

  public reset(rootName: string = 'home', rootTitle?: string): void {
    this.stack = [createNavEntry(rootName, 'tab', rootTitle || getHumanReadableTitle({ name: rootName, viewType: 'tab', id: '', timestamp: 0 }))];
    this.notify();
  }

  public subscribe(listener: (stack: NavStackEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const copy = this.getStack();
    this.listeners.forEach((listener) => listener(copy));
  }
}
