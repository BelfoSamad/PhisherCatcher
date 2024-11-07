///<reference types="chrome"/>
import {Component, inject, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {CheckerService} from '../services/checker.service';
import {AuthService} from '../services/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private _snackBar = inject(MatSnackBar);

  //Data
  url: string | undefined;
  analysis: any | undefined | null;
  isAnalyzing: boolean = false;
  currentIndex = -1;

  //Constructor
  constructor(private router: Router, private checkerService: CheckerService, private authService: AuthService) { }

  ngOnInit(): void {
    //TODO: get url from background!
    chrome.runtime.onMessage.addListener((message) => {
      if (message.target == "sidepanel") switch (message.action) {
        case "analysis":
          /* TODO: analysis can be null, undefined, object
            - if undefined, add a message "checking tab, if takes too long refresh page"
            - if undefined w/ allowCheck=true, show button to execute check manually
            - if null, tab is either new tab or chrome related tab
            - if analysis then show analysis
          */
          this.analysis = message.analysis;
          this.isAnalyzing = false;
          break;
        case "start_animation":
          this.isAnalyzing = true;
          break;
      }
    });
  }

  analyzeWebsite() {
    this.isAnalyzing = true;
    //TODO: Analyze when clicked!
  }

  getIntValue(percentage: string) {
    return parseInt(percentage);
  }

  goToPrevious() {
    this.currentIndex--;
  }

  goToNext() {
    this.currentIndex++;
  }

  handleBlock() {
    //TODO: Handle Blocking Website
  }

  async logout(): Promise<void> {
    this.authService.logout().then(_ => {
      this.router.navigate(['login']);
    });
  }

  goSettings() {
    this.router.navigate(['settings']);
  }
}
