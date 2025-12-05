import { Component } from '@angular/core';
import { VehicleListComponent } from './components/vehicle-list/vehicle-list.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,  // Se for standalone
  imports: [VehicleListComponent]  // Adicione esta linha se for standalone
})
export class AppComponent {
  title = 'angular-frontend';
}