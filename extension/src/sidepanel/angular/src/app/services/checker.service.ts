///<reference types="chrome"/>
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CheckerService {

  checkWebsite() {
    chrome.runtime.sendMessage({target: "background", action: "check"});
  }

  blockUnblockWebsite() {
    chrome.runtime.sendMessage({target: "background", action: "block"});
  }

}
