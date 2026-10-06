// Deliberately vulnerable canary to verify CodeQL detects issues. Never merge.
export function render(el: HTMLElement, input: string): void {
  el.innerHTML = input;
}

export const run = (code: string): unknown => eval(code);
