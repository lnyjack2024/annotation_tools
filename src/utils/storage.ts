export function storageGet(name: string): string {
  return localStorage.getItem(name);
}

export function storageSave(name: string, data: any) {
  if (typeof data !== 'object') {
    localStorage.setItem(name, `${data}`);
  } else {
    localStorage.setItem(name, JSON.stringify(data));
  }
}

export function purgeLocalStorage() {
  Object.keys(localStorage).forEach(key => {
    if (
      key !== 'umi_locale' &&
      !/^(LABELING)|(AUDIT)|(QA)|(REWORK)\./.exec(key)
    ) {
      localStorage.removeItem(key);
    }
  });
}
