<<<<<<< HEAD
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
=======
export function cleanExpiredStorage(namespace: string, expire = 7 * 24 * 60 * 60 * 1000) {
  const current = Date.now();
  const last = current - expire;

  const data = localStorage.getItem(namespace);
  if (data) {
    // if namespace exists
    let store: any;
    try {
      store = JSON.parse(data);
    } catch (e) {
      store = {};
    }

    Object.keys(store).forEach((key) => {
      // check lastUpdate
      const { lastUpdate } = store[key];
      if (lastUpdate < last) {
        delete store[key];
      }
    });

    try {
      // set new store
      localStorage.setItem(namespace, JSON.stringify(store));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('clean expired storage error: ', e);
    }
  }
}

export function setStorage(namespace: string, key: string, value: any) {
  const current = Date.now();

  let store;
  try {
    store = JSON.parse(localStorage.getItem(namespace) || '{}');
  } catch (e) {
    store = {};
  }

  store[key] = {
    value,
    lastUpdate: current, // set last update time
  };

  try {
    localStorage.setItem(namespace, JSON.stringify(store));
  } catch (e: any) {
    if (e.name === 'QUOTA_EXCEEDED_ERR' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      // clean expired storage and try again
      cleanExpiredStorage(namespace);
      try {
        localStorage.setItem(namespace, JSON.stringify(store));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('set storage error: ', error);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('set storage error: ', e);
    }
  }
}

export function getStorage(namespace: string, key: string) {
  try {
    const store = JSON.parse(localStorage.getItem(namespace) || '{}');
    return store[key]?.value;
  } catch (e) {
    return undefined;
  }
}

export function removeStorage(namespace: string, key: string) {
  let store;
  try {
    store = JSON.parse(localStorage.getItem(namespace) || '{}');
  } catch (e) {
    store = {};
  }

  delete store[key];

  try {
    localStorage.setItem(namespace, JSON.stringify(store));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('remove storage error: ', e);
  }
}

export function clear(namespace: string) {
  localStorage.removeItem(namespace);
}

export function isEnabled() {
  return !!window?.localStorage;
>>>>>>> origin/master
}
