import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:7777';

  constructor(private http: HttpClient) { }

  // Método para fazer login e obter o token JWT
  login(): Observable<{ access_token: string }> {
    const credentials = {
      email: environment.user,
      password: environment.password
    };
    
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          // Salva o token no localStorage
          localStorage.setItem('jwt_token', response.access_token);
          console.log('Token salvo:', response.access_token);
        })
      );
  }

  // Método para obter o token atual
  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  // Método para limpar o token (logout)
  logout(): void {
    localStorage.removeItem('jwt_token');
  }
}