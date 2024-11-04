///<reference types="chrome"/>
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  async register(email: string, password: string) {
    return await chrome.runtime.sendMessage({action: "register", email: email, password: password});
  }

  async login(email: string, password: string) {
    return await chrome.runtime.sendMessage({action: "login", email: email, password: password});
  }

  async isLoggedIn() {
    return (await chrome.runtime.sendMessage({action: "isLoggedIn"})).isLoggedIn;
  }

  async logout() {
    return await chrome.runtime.sendMessage({action: "logout"});
  }

}
