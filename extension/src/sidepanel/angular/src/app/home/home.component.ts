///<reference types="chrome"/>
import {Component, inject, NgZone, OnInit} from '@angular/core';
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
  analysis: any | undefined | null;
  isAnalyzing: boolean = false;
  manualCheckAllowed: boolean = false;
  currentIndex = -1;

  //Constructor
  constructor(private router: Router, private zone: NgZone, private checkerService: CheckerService, private authService: AuthService) { }

  async ngOnInit(): Promise<void> {
    // listen to messages
    chrome.runtime.onMessage.addListener((message) => {
      this.zone.run(() => {
        if (message.target == "sidepanel") switch (message.action) {
          case "analysis":
            console.log(message.analysis);
            this.analysis = message.analysis;
            this.manualCheckAllowed = message.allowCheck;
            this.isAnalyzing = false;
            break;
          case "start_animation":
            this.isAnalyzing = true;
            break;
        }
      });
    });
  }

  analyzeWebsite() {
    this.checkerService.checkWebsite();
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
    this.checkerService.blockUnblockWebsite();
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
