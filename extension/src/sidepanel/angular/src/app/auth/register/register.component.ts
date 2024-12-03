import {Component, inject, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {Router, RouterLink} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinner,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  private _snackBar = inject(MatSnackBar);

  //Declarations
  registerForm: FormGroup | undefined;
  registerLoading = false;

  constructor(private router: Router, private fb: FormBuilder, private authService: AuthService) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [this.confirmPasswordValidator]]
    });
  }

  onSubmit(): void {
    if (this.registerForm!!.valid) {
      this.registerLoading = true
      this.authService.register(
        this.registerForm!!.value.email,
        this.registerForm!!.value.password
      ).then((response: any) => {
        this.registerLoading = false
        if (response.done) this.router.navigate(['/home']) //go home
        else this._snackBar.open(response.error);
      });
    } else {
      this.registerForm!!.markAllAsTouched();
    }
  }

  confirmPasswordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (control.parent?.get('password')?.value === control.parent?.get('confirmPassword')?.value && control.parent?.get('password')?.value != undefined)
      return null;
    else return {passwordNoMatch: true};
  };

}
