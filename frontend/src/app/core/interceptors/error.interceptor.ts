import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        notify.error('Network error. Please check your connection.');
      } else if (error.status >= 500) {
        notify.error('Server error. Please try again later.');
      }
      // Let components handle 4xx errors
      return throwError(() => error);
    })
  );
};
