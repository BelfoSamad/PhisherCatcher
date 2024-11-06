import {Routes} from '@angular/router';
import {RegisterComponent} from './auth/register/register.component';
import {LoginComponent} from './auth/login/login.component';
import {HomeComponent} from './home/home.component';
import {AuthGuard} from './services/auth.guard';
import {SettingsComponent} from './settings/settings.component';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent,
        title: 'Login'
    },
    {
        path: 'register',
        component: RegisterComponent,
        title: 'Register'
    },
    {
        path: '',
        component: HomeComponent,
        title: 'Home',
        canActivate: [AuthGuard],
    },
    {
        path: 'settings',
        component: SettingsComponent,
        title: 'Settings',
        canActivate: [AuthGuard],
    },
];
