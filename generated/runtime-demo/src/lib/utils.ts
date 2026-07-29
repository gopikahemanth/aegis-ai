const utils = {
  addClass: (element: HTMLElement, className: string) => {
    element.classList.add(className);
  },
  removeClass: (element: HTMLElement, className: string) => {
    element.classList.remove(className);
  },
};

export default utils;