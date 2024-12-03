///<reference types="chrome"/>
import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-boarding',
  standalone: true,
  imports: [],
  templateUrl: './boarding.component.html',
  styleUrl: './boarding.component.scss'
})
export class BoardingComponent implements OnInit {

  constructor(private router: Router) { }

  async ngOnInit(): Promise<void> {
    const saved = await chrome.storage.local.get(["boardingCompleted"]);
    if (saved["boardingCompleted"] === true) this.router.navigate(['/home']);
    else setTimeout(() => {
      chrome.storage.local.set({boardingCompleted: true}, () => {
        this.router.navigate(['/home']);
      });
    }, 2000);
  }

}
