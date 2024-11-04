///<reference types="chrome"/>
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CheckerService {

  async checkWebsite() {
    return await chrome.runtime.sendMessage({action: "check"});
  }

}
