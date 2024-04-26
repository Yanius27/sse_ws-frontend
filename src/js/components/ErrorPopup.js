export default class ErrorPopup {
  constructor(message) {
    this.message = message;
    this._element;
    this.#createElement();
  }

  #createElement() {
    const error = document.createElement('div');
    error.classList.add('error');

    const errorMessage = document.createElement('span');
    errorMessage.classList.add('error_msg');
    errorMessage.textContent = this.message;

    error.append(errorMessage);

    this._element = error;
  }

  get element() {
    return this._element;
  }
}