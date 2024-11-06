///<reference types="chrome"/>
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  async register(email: string, password: string) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({target: "offscreen", action: "register", email: email, password: password}, (response) => {
        resolve(response.done);
      });
    });
  }

  async login(email: string, password: string) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({target: "offscreen", action: "login", email: email, password: password}, (response) => {
        console.log(response.settings);
        chrome.storage.local.set(response.settings, () => {});
        resolve(response.done);
      });
    });
  }

  async isLoggedIn() {
    return (await chrome.runtime.sendMessage({target: "offscreen", action: "isLoggedIn"})).isLoggedIn;
  }

  async logout() {
    return await chrome.runtime.sendMessage({target: "offscreen", action: "logout"});
  }

}
