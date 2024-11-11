///<reference types="chrome"/>
import {CommonModule} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatToolbarModule} from '@angular/material/toolbar';
import {Router, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    //Material UI Components
    MatCardModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'PhisherCatcher';

  constructor(private router: Router) { }

  async ngOnInit(): Promise<void> {
    chrome.storage.local.get(["boardingCompleted"], (res) => {
      console.log(res['boardingCompleted']);
      if (res['boardingCompleted'] === true) this.router.navigate(['']);
      else this.router.navigate(['/boarding']);
    });
  }
}
