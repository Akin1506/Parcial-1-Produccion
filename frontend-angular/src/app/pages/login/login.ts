import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  modoRegistro = false;

  correo = '';
  password = '';
  mensaje = '';

  nombreRegistro = '';
  correoRegistro = '';
  passwordRegistro = '';
  rolRegistro = 'Cliente';

  rolesDisponibles = ['Cliente', 'Taller'];

  constructor(private http: HttpClient, private router: Router) {}

  cambiarModo() {
    this.modoRegistro = !this.modoRegistro;
    this.mensaje = '';
  }

  login() {
    const datos = {
      correo: this.correo,
      password: this.password
    };

    this.http.post<any>('http://127.0.0.1:8000/login', datos).subscribe({
      next: (res) => {
        localStorage.setItem('usuarioLogueado', JSON.stringify(res.usuario));
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.mensaje = 'Credenciales incorrectas';
      }
    });
  }

  registrarUsuario() {
    const datos = {
      nombre: this.nombreRegistro,
      correo: this.correoRegistro,
      password: this.passwordRegistro,
      rol: this.rolRegistro
    };

    if (!this.nombreRegistro || !this.correoRegistro || !this.passwordRegistro) {
      this.mensaje = 'Completa todos los campos';
      return;
    }

    this.http.post<any>('http://127.0.0.1:8000/registro', datos).subscribe({
      next: () => {
        this.mensaje = 'Usuario creado correctamente. Ahora inicia sesión.';
        this.modoRegistro = false;

        this.correo = this.correoRegistro;
        this.password = this.passwordRegistro;

        this.nombreRegistro = '';
        this.correoRegistro = '';
        this.passwordRegistro = '';
        this.rolRegistro = 'Cliente';
      },
      error: (err) => {
        this.mensaje = err?.error?.detail || 'Error al crear usuario';
      }
    });
  }
}