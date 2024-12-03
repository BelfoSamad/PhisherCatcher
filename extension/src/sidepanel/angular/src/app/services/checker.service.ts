///<reference types="chrome"/>
import {Injectable} from '@angular/core';
import {fromEventPattern, map} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CheckerService {

  listenToAnalysis() {
    return fromEventPattern(
      (handler) => chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => handler(message)),
      (handler) => chrome.runtime.onMessage.removeListener(handler),
    );
  }

  blockUnblockWebsite() {
    chrome.runtime.sendMessage({target: "background", action: "block"});
  }

}
