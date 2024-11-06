///<reference types="chrome"/>
import {ChangeDetectorRef, Component, inject} from '@angular/core';
import {FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatSlideToggleModule,
    FormsModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatIconModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private _snackBar = inject(MatSnackBar);

  //Declarations
  settingsForm: FormGroup | undefined;

  constructor(private router: Router, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.settingsForm = this.fb.group({
      enableAutoScan: false,
      enableAutoBlock: false,
      enableUnblocking: false,
    });

    // get settings from storage
    chrome.storage.session.get(["enableAutoScan", "enableAutoBlock", "enableUnblocking"], (res) => {
      this.settingsForm?.setValue({
        enableAutoScan: res['enableAutoScan'] ?? true,
        enableAutoBlock: res['enableAutoBlock'] ?? true,
        enableUnblocking: res['enableUnblocking'] ?? true,
      });
    });
  }

  onSubmit(): void {
    chrome.storage.session.set({
      enableAutoScan: this.settingsForm?.value.enableAutoScan,
      enableAutoBlock: this.settingsForm?.value.enableAutoBlock,
      enableUnblocking: this.settingsForm?.value.enableUnblocking
    }, () => {
      //TODO: show snackbar
      this.router.navigate(['']);
    });
  }

  goBack() {
    this.router.navigate(['']);
  }
}
