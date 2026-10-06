// Deliberately vulnerable canary to verify CodeQL detects issues. Never merge.
export function render(el: HTMLElement): void {
  el.innerHTML = decodeURIComponent(location.hash.slice(1));
}

export const run = (): unknown => eval(decodeURIComponent(location.search.slice(1)));
