///<reference types="chrome"/>
import {Component} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
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
  //Declarations
  settingsForm: FormGroup | undefined;

  constructor(private router: Router, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.settingsForm = this.fb.group({
      enableAutoBlock: false,
      enableForceBlock: false,
    });

    // get settings from storage
    chrome.storage.local.get(["enableAutoBlock", "enableForceBlock"], (res) => {
      this.settingsForm?.setValue({
        enableAutoBlock: res['enableAutoBlock'] ?? true,
        enableForceBlock: res['enableForceBlock'] ?? true,
      });
    });
  }

  onSubmit(): void {
    const settings = {
      enableAutoBlock: this.settingsForm?.value.enableAutoBlock,
      enableForceBlock: this.settingsForm?.value.enableForceBlock,
    };
    chrome.storage.local.set(settings, () => {
      // sync with firestore
      chrome.runtime.sendMessage({target: "offscreen", action: "syncSettings", settings: settings});
      this.router.navigate(['/home']);
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
