import ErrorPopup from './components/ErrorPopup';

export default class App {
  constructor() {
    this.popup = document.querySelector('.popup');
    this.popupInput = this.popup.querySelector('.popup_nameInput');

    this.chat = document.querySelector('.chat');
    this.usersList = this.chat.querySelector('.chat_usersList');
    this.chatArea = this.chat.querySelector('.chat_messageArea');
    this.chatForm = this.chat.querySelector('.chat_form');
    this.chatInput = this.chatForm.querySelector('.chat_input');

    this.users = [];
    this.messages = [];
    this.actualUser;
    this.ws = new WebSocket('ws://localhost:3000/ws');

    this.#init();
    this.#wsInit();
    this.#closeListener();
  }

  // Method for creating Date
  #getDate() {
    const currentDate = new Date();

    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Месяцы в JS начинаются с 0, поэтому добавляем 1
    const year = String(currentDate.getFullYear()).slice(2); // Получаем последние две цифры года
  
    const formattedDateTime = `${hours}:${minutes} ${day}.${month}.${year}`;
  
    return formattedDateTime;
  }


// Initialization of app
  #init() {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => this.popup.style.display = 'flex', 1000);
    });

    this.popup.addEventListener('submit', (e) => { 
      e.preventDefault();

      if (this.popupInput.value === '') {
        const error = new ErrorPopup('Введите имя');
        this.popup.append(error.element);
        setTimeout(() => error.element.remove(), 3000);
        return;
      }

      this.#addUser(this.popupInput.value);
    });

  }

// Initialization of WS and Listeners for WS events
  #wsInit() {
    this.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const message = this.chatInput.value;
      
      if (!message) return;

      const data = JSON.stringify({
        message,
        type: 'send',
        user: this.actualUser,
        date: this.#getDate(),
      });

      this.ws.send(data);
      this.chatInput.value = '';
    });

    this.ws.addEventListener('open', (e) => {
      console.log(e);

      console.log('ws open');
    });

    this.ws.addEventListener('message', (e) => {
      console.log(e);
      console.log('ws message');
      const data = JSON.parse(e.data);
      console.log(data);
      if (!data.message) {
        this.users = data;
        this.#drawUsers();
        return;
      }
      if (this.actualUser) {
        this.messages.push(data);
        this.#drawMessages();
      }
    });

    this.ws.addEventListener('error', (e) => {
      console.log(e);

      console.log('ws error');
    })

    this.ws.addEventListener('close', (e) => {
      console.log(e);

      console.log('ws close');
    })
  }

  #closeListener() {
    window.addEventListener('unload', () => {
      const data = JSON.stringify({
        type: 'exit',
        user: this.actualUser,
      });
      this.ws.send(data);
    });
  }

// Users append
  #drawUsers() {
    this.usersList.innerHTML = '';
    this.users.forEach(user => {
      const newUser = document.createElement('div');
      newUser.classList.add('user');

      const newUserIcon = document.createElement('div');
      newUserIcon.classList.add('user_icon');

      const newUserName = document.createElement('span');
      newUserName.classList.add('user_name');
      newUserName.textContent = user.name;

      newUser.append(newUserIcon, newUserName);

      this.usersList.append(newUser);
    });
  }

// Messages append
  #drawMessages() {
    this.chatArea.innerHTML = '';
    this.messages.forEach(msg => {
      const message = document.createElement('div');
      message.classList.add('message');

      if (msg.user.id === this.actualUser.id) {
        message.classList.add('actualUserMsg');
      }

      const messageInfo = document.createElement('span');
      messageInfo.classList.add('message_info');
      messageInfo.textContent = msg.user.name + ', ' + msg.date;

      const messageText = document.createElement('div');
      messageText.classList.add('message_text');
      messageText.textContent = msg.message;

      message.append(messageInfo, messageText);

      this.chatArea.append(message);
    });
  }

// AJAX for creating new user
  #addUser(value) {
    const body = JSON.stringify({ name: value });
    fetch('http://localhost:3000/new-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body,
    })
      .then(response => {
        if (response.status !== 207) {
          return response.json();
        } else {
          throw new Error('Response status is 207');
        }
      })
      .then(result => {
        if (result.status === 'ok') {
          this.actualUser = result.user;
          this.users.push(result.user);
          this.popup.style.display = 'none';
          this.chat.style.display = 'flex';
          this.usersList.style.display = 'flex';
        } else {
          const error = new ErrorPopup(result.message);
          this.popup.append(error.element);
          setTimeout(() => error.element.remove(), 4000);
          return;
        }
      })
      .then(() => {
        const data = JSON.stringify({ type: 'getUsers' });
        this.ws.send(data);
      })
      .catch(err => {
        console.log(err);
      });
  }
}
