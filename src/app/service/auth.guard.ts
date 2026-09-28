import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { StorageService } from './storage';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const storage = inject(StorageService);
  return auth.isLoggedIn() && storage.hasFile ? true : inject(Router).createUrlTree(['/login']);
};
