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

  ngOnInit(): void {
    // set time of 3 seconds then move to home
    setTimeout(() => {
      chrome.storage.local.set({boardingCompleted: true}, () => {
        this.router.navigate(['']);
      });
    }, 5000);
  }

}
