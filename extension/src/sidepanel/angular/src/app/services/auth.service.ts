///<reference types="chrome"/>
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  async register(email: string, password: string) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({target: "offscreen", action: "register", email: email, password: password}, (response) => {
        resolve(response);
      });
    });
  }

  async login(email: string, password: string) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({target: "offscreen", action: "login", email: email, password: password}, (response) => {
        if (response.done) chrome.storage.local.set(response.settings, () => { });
        resolve(response);
      });
    });
  }

  async isLoggedIn() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({target: "offscreen", action: "isLoggedIn"}, (response) => {
        resolve(response.isLoggedIn);
      });
    });
  }

  async logout() {
    return await chrome.runtime.sendMessage({target: "offscreen", action: "logout"});
  }

}
