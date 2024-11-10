///<reference types="chrome"/>
import {Injectable} from '@angular/core';
import {fromEventPattern, map} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CheckerService {

  //Data
  analysis: any | undefined | null;

  listenToAnalysis() {
    return fromEventPattern(
      (handler) => chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => handler(message)),
      (handler) => chrome.runtime.onMessage.removeListener(handler),
    ).pipe(
      map((message: any) => {
        if (message.target == "sidepanel" && message.action == "analysis")
          this.analysis = message.analysis;
        return message;
      })
    );
  }

  getAnalysis() {
    return this.analysis;
  }

  checkWebsite() {
    chrome.runtime.sendMessage({target: "background", action: "check"});
  }

  blockUnblockWebsite() {
    chrome.runtime.sendMessage({target: "background", action: "block"});
  }

}
