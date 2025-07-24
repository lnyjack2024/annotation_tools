// eslint-disable-next-line import/prefer-default-export
export function fetchResultByUrl(url: string) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
      })
      .then((data) => resolve(data))
      .catch((e) => reject(e));
  });
}
